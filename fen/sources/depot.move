/// FEN Depot Extension
///
/// A storage unit extension that turns an SSU into a trading depot.
/// Depots have a configured trading pair (input item <-> output item)
/// with an exchange ratio and fee. Traders deposit input items and
/// receive output items at the configured rate.
///
/// Flow:
///   1. SSU owner calls `authorize_extension<DepotAuth>` on their storage unit
///   2. SSU owner calls `set_depot_config` to define the trading pair and ratio
///   3. SSU owner stocks the depot with output items
///   4. Trader calls `execute_trade` to swap items at the depot rate
///
/// Addresses issue #44: extension-managed inventory for trustless trading.
#[allow(unused_const)]
module fen::depot;

use sui::event;

use world::storage_unit::{Self, StorageUnit};
use world::character::Character;
use world::inventory::{Self, Item};

use fen::config::{FenConfig, AdminCap};

// === Errors ===
const EDepotNotConfigured: u64 = 1;
const EDepotInactive: u64 = 2;
const EInvalidQuantity: u64 = 3;
const EInsufficientOutput: u64 = 4;
const EItemTypeMismatch: u64 = 5;

// === Structs ===

/// Typed witness for FEN depot extension.
public struct DepotAuth has drop {}

/// Depot trading pair configuration.
/// Stored as dynamic field on FenConfig, keyed by storage unit ID.
public struct DepotRule has copy, drop, store {
    /// Item type accepted as input
    input_type_id: u64,
    /// Item type dispensed as output
    output_type_id: u64,
    /// Exchange ratio: ratio_in units of input = ratio_out units of output
    ratio_in: u64,
    ratio_out: u64,
    /// Fee in basis points (100 = 1%)
    fee_bps: u64,
    /// Whether this depot is accepting trades
    is_active: bool,
}

/// Dynamic field key for depot config.
public struct DepotConfigKey has copy, drop, store {
    storage_unit_id: ID,
}

// === Events ===

/// Emitted when a trade completes at a depot.
public struct DepotTradeEvent has copy, drop {
    storage_unit_id: ID,
    trader: address,
    input_type_id: u64,
    input_quantity: u32,
    output_type_id: u64,
    output_quantity: u32,
    fee_bps: u64,
}

/// Emitted when a depot's configuration changes.
public struct DepotConfigEvent has copy, drop {
    storage_unit_id: ID,
    input_type_id: u64,
    output_type_id: u64,
    ratio_in: u64,
    ratio_out: u64,
    fee_bps: u64,
}

// === Constants ===
const FEE_DENOMINATOR: u64 = 10000;

// === Public Functions ===

/// Execute a trade at a depot.
/// Trader deposits `input_item` and receives output item(s) from the depot.
///
/// Note: `withdraw_item` returns the full Item for a type_id (entire stock).
/// The depot validates that the stock quantity satisfies the trade amount
/// after applying the ratio and fee.
public fun execute_trade(
    config: &FenConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,
    input_item: Item,
    ctx: &mut TxContext,
): Item {
    let su_id = object::id(storage_unit);
    let key = DepotConfigKey { storage_unit_id: su_id };

    // Read depot config
    let depot = config.borrow_rule<DepotConfigKey, DepotRule>(key);
    assert!(depot.is_active, EDepotInactive);

    // Validate input item type matches config
    assert!(inventory::type_id(&input_item) == depot.input_type_id, EItemTypeMismatch);

    // Calculate output quantity from ratio
    let input_qty = (input_item.quantity() as u64);
    assert!(input_qty > 0, EInvalidQuantity);

    let gross_output = (input_qty * depot.ratio_out) / depot.ratio_in;
    let fee = (gross_output * depot.fee_bps) / FEE_DENOMINATOR;
    let net_output = gross_output - fee;
    assert!(net_output > 0, EInsufficientOutput);

    let input_quantity = input_item.quantity();

    // Deposit trader's input item into depot inventory
    storage_unit::deposit_item<DepotAuth>(
        storage_unit,
        character,
        input_item,
        DepotAuth {},
        ctx,
    );

    // Withdraw output item from depot inventory for trader
    let output_item = storage_unit::withdraw_item<DepotAuth>(
        storage_unit,
        character,
        DepotAuth {},
        depot.output_type_id,
        ctx,
    );

    // Validate depot has enough stock to honor the trade
    assert!((output_item.quantity() as u64) >= net_output, EInsufficientOutput);

    // Emit trade event for indexer
    event::emit(DepotTradeEvent {
        storage_unit_id: su_id,
        trader: ctx.sender(),
        input_type_id: depot.input_type_id,
        input_quantity,
        output_type_id: depot.output_type_id,
        output_quantity: output_item.quantity(),
        fee_bps: depot.fee_bps,
    });

    output_item
}

// === Admin Functions ===

/// Configure a depot's trading pair and ratio.
public fun set_depot_config(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    input_type_id: u64,
    output_type_id: u64,
    ratio_in: u64,
    ratio_out: u64,
    fee_bps: u64,
) {
    let key = DepotConfigKey { storage_unit_id };
    let rule = DepotRule {
        input_type_id,
        output_type_id,
        ratio_in,
        ratio_out,
        fee_bps,
        is_active: true,
    };
    config.set_rule(admin, key, rule);

    event::emit(DepotConfigEvent {
        storage_unit_id,
        input_type_id,
        output_type_id,
        ratio_in,
        ratio_out,
        fee_bps,
    });
}

/// Pause a depot (stop accepting trades).
public fun deactivate_depot(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.is_active = false;
}

/// Resume a depot.
public fun activate_depot(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.is_active = true;
}

/// Update the exchange ratio.
public fun update_ratio(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    ratio_in: u64,
    ratio_out: u64,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.ratio_in = ratio_in;
    depot.ratio_out = ratio_out;
}

/// Update the fee.
public fun update_fee(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    fee_bps: u64,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.fee_bps = fee_bps;
}

// === View Functions ===

/// Get the depot config for a storage unit.
public fun get_depot_rule(config: &FenConfig, storage_unit_id: ID): &DepotRule {
    let key = DepotConfigKey { storage_unit_id };
    config.borrow_rule<DepotConfigKey, DepotRule>(key)
}

/// Get the input type for a depot.
public fun input_type_id(rule: &DepotRule): u64 { rule.input_type_id }

/// Get the output type for a depot.
public fun output_type_id(rule: &DepotRule): u64 { rule.output_type_id }

/// Get the exchange ratio (in:out).
public fun ratio(rule: &DepotRule): (u64, u64) { (rule.ratio_in, rule.ratio_out) }

/// Get the fee in basis points.
public fun fee_bps(rule: &DepotRule): u64 { rule.fee_bps }

/// Check if the depot is active.
public fun is_active(rule: &DepotRule): bool { rule.is_active }
