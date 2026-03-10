/// Frontier Exchange Network — Depot (SSU Exchange Extension)
///
/// A Depot wraps a `world::storage_unit::StorageUnit` to enable item-for-item exchange.
/// Corridor operators configure an input/output item type pair and an exchange ratio.
/// Players deposit input items and receive output items at the configured rate, minus a fee.
///
/// Uses the typed-witness pattern: `FenAuth` from `toll_gate` is authorized on storage units
/// so that deposits and withdrawals go through the FEN extension logic.
#[allow(lint(self_transfer))]
module fen::depot;

use sui::{
    clock::Clock,
    event,
};
use world::{
    character::Character,
    storage_unit::StorageUnit,
    inventory::Item,
};
use fen::corridor::{Self, Corridor, CorridorOwnerCap};
use fen::toll_gate;

// === Errors ===
#[error(code = 0)]
const ENotOwner: vector<u8> = b"Not the corridor owner";
#[error(code = 1)]
const ECorridorNotActive: vector<u8> = b"Corridor is not active";
#[error(code = 2)]
const EDepotMismatch: vector<u8> = b"Storage unit is not a depot in this corridor";
#[error(code = 3)]
const EDepotNotConfigured: vector<u8> = b"Depot exchange config not set";
#[error(code = 4)]
const EItemTypeMismatch: vector<u8> = b"Item type does not match depot input";
#[error(code = 5)]
const ERatioZero: vector<u8> = b"Exchange ratio cannot be zero";
#[error(code = 6)]
const EDepotInactive: vector<u8> = b"Depot is not active";

// === Dynamic Field Keys ===
/// Per-depot exchange configuration, stored as a dynamic field on the Corridor.
public struct DepotConfigKey has copy, drop, store {
    storage_unit_id: ID,
}

public struct DepotConfig has store, drop {
    input_type_id: u64,
    output_type_id: u64,
    ratio_in: u64,
    ratio_out: u64,
    fee_bps: u64,
    is_active: bool,
    total_trades: u64,
    total_volume_in: u64,
    total_fees_collected: u64,
}

// === Events ===
public struct DepotConfigUpdatedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
    input_type_id: u64,
    output_type_id: u64,
    ratio_in: u64,
    ratio_out: u64,
    fee_bps: u64,
}

public struct TradeExecutedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
    character_id: ID,
    input_type_id: u64,
    output_type_id: u64,
    input_quantity: u32,
    output_quantity: u32,
    fee_collected: u64,
    trader: address,
}

public struct DepotActivatedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
}

public struct DepotDeactivatedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
}

// === Admin Functions ===

/// Configure the exchange parameters for a depot (storage unit) in this corridor.
public fun set_depot_config(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
    input_type_id: u64,
    output_type_id: u64,
    ratio_in: u64,
    ratio_out: u64,
    fee_bps: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    assert!(
        storage_unit_id == corridor::depot_a_id(corridor) ||
        storage_unit_id == corridor::depot_b_id(corridor),
        EDepotMismatch,
    );
    assert!(ratio_in > 0 && ratio_out > 0, ERatioZero);

    let key = DepotConfigKey { storage_unit_id };

    if (corridor::has_df<DepotConfigKey>(corridor, key)) {
        let existing: &mut DepotConfig = corridor::borrow_df_mut(corridor, key);
        existing.input_type_id = input_type_id;
        existing.output_type_id = output_type_id;
        existing.ratio_in = ratio_in;
        existing.ratio_out = ratio_out;
        existing.fee_bps = fee_bps;
    } else {
        let config = DepotConfig {
            input_type_id,
            output_type_id,
            ratio_in,
            ratio_out,
            fee_bps,
            is_active: false,
            total_trades: 0,
            total_volume_in: 0,
            total_fees_collected: 0,
        };
        corridor::add_df(corridor, key, config);
    };

    event::emit(DepotConfigUpdatedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id,
        input_type_id,
        output_type_id,
        ratio_in,
        ratio_out,
        fee_bps,
    });
}

/// Activate a depot for trading.
public fun activate_depot(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);

    let key = DepotConfigKey { storage_unit_id };
    assert!(corridor::has_df<DepotConfigKey>(corridor, key), EDepotNotConfigured);
    let config: &mut DepotConfig = corridor::borrow_df_mut(corridor, key);
    config.is_active = true;

    event::emit(DepotActivatedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id,
    });
}

/// Deactivate a depot.
public fun deactivate_depot(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);

    let key = DepotConfigKey { storage_unit_id };
    assert!(corridor::has_df<DepotConfigKey>(corridor, key), EDepotNotConfigured);
    let config: &mut DepotConfig = corridor::borrow_df_mut(corridor, key);
    config.is_active = false;

    event::emit(DepotDeactivatedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id,
    });
}

// === Player Functions ===

/// Execute a trade at a depot: deposit an input item and withdraw the output item.
/// The depot's storage unit must have the FenAuth extension authorized and be online.
public fun execute_trade(
    corridor: &mut Corridor,
    storage_unit: &mut StorageUnit,
    character: &Character,
    input_item: Item,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(corridor::is_active(corridor), ECorridorNotActive);

    let su_id = object::id(storage_unit);
    assert!(
        su_id == corridor::depot_a_id(corridor) || su_id == corridor::depot_b_id(corridor),
        EDepotMismatch,
    );

    let key = DepotConfigKey { storage_unit_id: su_id };
    assert!(corridor::has_df<DepotConfigKey>(corridor, key), EDepotNotConfigured);

    // Read config values
    let config: &DepotConfig = corridor::borrow_df(corridor, key);
    assert!(config.is_active, EDepotInactive);

    let input_type = config.input_type_id;
    let output_type = config.output_type_id;
    let ratio_in = config.ratio_in;
    let ratio_out = config.ratio_out;
    let fee_bps = config.fee_bps;

    // Validate input item type
    assert!(input_item.type_id() == input_type, EItemTypeMismatch);

    let input_qty = input_item.quantity();
    let raw_output = ((input_qty as u64) * ratio_out) / ratio_in;
    let fee = (raw_output * fee_bps) / 10000;
    let net_output = raw_output - fee;

    // Deposit the input item into the storage unit via FenAuth extension
    storage_unit.deposit_item<toll_gate::FenAuth>(
        character,
        input_item,
        toll_gate::fen_auth(),
        ctx,
    );

    // Withdraw the output item from the storage unit
    let output_item = storage_unit.withdraw_item<toll_gate::FenAuth>(
        character,
        toll_gate::fen_auth(),
        output_type,
        ctx,
    );

    // Transfer output to the trader
    transfer::public_transfer(output_item, ctx.sender());

    // Update depot stats
    let config_mut: &mut DepotConfig = corridor::borrow_df_mut(corridor, key);
    config_mut.total_trades = config_mut.total_trades + 1;
    config_mut.total_volume_in = config_mut.total_volume_in + (input_qty as u64);
    config_mut.total_fees_collected = config_mut.total_fees_collected + fee;

    // Record trade on corridor
    corridor::record_trade(corridor, fee, clock);

    event::emit(TradeExecutedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id: su_id,
        character_id: object::id(character),
        input_type_id: input_type,
        output_type_id: output_type,
        input_quantity: input_qty,
        output_quantity: (net_output as u32),
        fee_collected: fee,
        trader: ctx.sender(),
    });
}

// === View Functions ===

public fun depot_config_exists(corridor: &Corridor, storage_unit_id: ID): bool {
    corridor::has_df<DepotConfigKey>(corridor, DepotConfigKey { storage_unit_id })
}

public fun is_depot_active(corridor: &Corridor, storage_unit_id: ID): bool {
    let key = DepotConfigKey { storage_unit_id };
    if (!corridor::has_df<DepotConfigKey>(corridor, key)) return false;
    let config: &DepotConfig = corridor::borrow_df(corridor, key);
    config.is_active
}

public fun depot_fee_bps(corridor: &Corridor, storage_unit_id: ID): u64 {
    let config: &DepotConfig = corridor::borrow_df(corridor, DepotConfigKey { storage_unit_id });
    config.fee_bps
}

public fun depot_ratio(corridor: &Corridor, storage_unit_id: ID): (u64, u64) {
    let config: &DepotConfig = corridor::borrow_df(corridor, DepotConfigKey { storage_unit_id });
    (config.ratio_in, config.ratio_out)
}
