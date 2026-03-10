/// Frontier Exchange Network — Toll Gate Extension
///
/// This module extends `world::gate` to add toll collection on gate jumps.
/// Corridor operators configure a toll amount per gate. When a player jumps,
/// they pay the toll in SUI which flows to the corridor's fee recipient.
///
/// Uses the typed-witness pattern: `FenAuth` is authorized on gates so that
/// jump permits are only issued after toll payment.
#[allow(lint(self_transfer))]
module fen::toll_gate;

use sui::{
    clock::Clock,
    coin::{Self, Coin},
    event,
    sui::SUI,
};
use world::{
    character::Character,
    gate::{Self, Gate},
};
use fen::corridor::{Self, Corridor, CorridorOwnerCap};

// === Errors ===
#[error(code = 0)]
const EInsufficientToll: vector<u8> = b"Payment insufficient for toll";
#[error(code = 1)]
const ECorridorNotActive: vector<u8> = b"Corridor is not active";
#[error(code = 2)]
const EGateMismatch: vector<u8> = b"Gate does not belong to this corridor";
#[error(code = 3)]
const ENotOwner: vector<u8> = b"Not the corridor owner";

// === Auth Witness ===
/// Typed witness for FEN gate extensions.
public struct FenAuth has drop {}

// === Dynamic Field Keys ===
/// Per-gate toll configuration, stored as a dynamic field on the Corridor.
public struct TollConfigKey has copy, drop, store {
    gate_id: ID,
}

public struct TollConfig has store, drop {
    toll_amount: u64,
    surge_active: bool,
    surge_numerator: u64,  // basis = 10000 (100%)
}

// === Events ===
public struct TollPaidEvent has copy, drop {
    corridor_id: ID,
    gate_id: ID,
    character_id: ID,
    amount_paid: u64,
    payer: address,
}

public struct TollConfigUpdatedEvent has copy, drop {
    corridor_id: ID,
    gate_id: ID,
    toll_amount: u64,
}

public struct SurgeActivatedEvent has copy, drop {
    corridor_id: ID,
    gate_id: ID,
    surge_numerator: u64,
}

public struct SurgeDeactivatedEvent has copy, drop {
    corridor_id: ID,
    gate_id: ID,
}

// === Admin Functions ===

/// Set the toll amount for a gate within a corridor.
public fun set_toll_config(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    gate_id: ID,
    toll_amount: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    assert!(
        gate_id == corridor::source_gate_id(corridor) || gate_id == corridor::dest_gate_id(corridor),
        EGateMismatch,
    );

    let key = TollConfigKey { gate_id };

    if (corridor::has_df<TollConfigKey>(corridor, key)) {
        let existing: &mut TollConfig = corridor::borrow_df_mut(corridor, key);
        existing.toll_amount = toll_amount;
    } else {
        let config = TollConfig {
            toll_amount,
            surge_active: false,
            surge_numerator: 10000,
        };
        corridor::add_df(corridor, key, config);
    };

    event::emit(TollConfigUpdatedEvent {
        corridor_id: object::id(corridor),
        gate_id,
        toll_amount,
    });
}

/// Activate surge pricing on a gate.
public fun activate_surge(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    gate_id: ID,
    surge_numerator: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);

    let key = TollConfigKey { gate_id };
    let config: &mut TollConfig = corridor::borrow_df_mut(corridor, key);
    config.surge_active = true;
    config.surge_numerator = surge_numerator;

    event::emit(SurgeActivatedEvent {
        corridor_id: object::id(corridor),
        gate_id,
        surge_numerator,
    });
}

/// Deactivate surge pricing.
public fun deactivate_surge(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    gate_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);

    let key = TollConfigKey { gate_id };
    let config: &mut TollConfig = corridor::borrow_df_mut(corridor, key);
    config.surge_active = false;
    config.surge_numerator = 10000;

    event::emit(SurgeDeactivatedEvent {
        corridor_id: object::id(corridor),
        gate_id,
    });
}

// === Player Functions ===

/// Pay the toll and receive a jump permit for the gate pair.
/// The toll payment (in SUI) is transferred to the corridor's fee recipient.
public fun pay_toll_and_jump(
    corridor: &mut Corridor,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(corridor::is_active(corridor), ECorridorNotActive);

    let source_gate_id = object::id(source_gate);
    assert!(
        source_gate_id == corridor::source_gate_id(corridor) ||
        source_gate_id == corridor::dest_gate_id(corridor),
        EGateMismatch,
    );

    // Calculate effective toll
    let effective_toll = get_effective_toll(corridor, source_gate_id);

    // Verify payment
    assert!(coin::value(&payment) >= effective_toll, EInsufficientToll);

    // Split exact toll amount if overpaid
    let toll_coin = if (coin::value(&payment) == effective_toll) {
        payment
    } else {
        let toll = coin::split(&mut payment, effective_toll, ctx);
        transfer::public_transfer(payment, ctx.sender());
        toll
    };

    // Send toll to fee recipient
    transfer::public_transfer(toll_coin, corridor::fee_recipient(corridor));

    // Record stats on corridor
    corridor::record_jump(corridor, effective_toll, clock);

    // Issue jump permit via the FEN extension witness
    let expires_at = clock.timestamp_ms() + 5 * 24 * 60 * 60 * 1000; // 5 days
    gate::issue_jump_permit<FenAuth>(
        source_gate,
        destination_gate,
        character,
        FenAuth {},
        expires_at,
        ctx,
    );

    event::emit(TollPaidEvent {
        corridor_id: object::id(corridor),
        gate_id: source_gate_id,
        character_id: object::id(character),
        amount_paid: effective_toll,
        payer: ctx.sender(),
    });
}

// === View Functions ===

/// Get the effective toll for a gate (accounting for surge pricing).
public fun get_effective_toll(corridor: &Corridor, gate_id: ID): u64 {
    let key = TollConfigKey { gate_id };
    if (!corridor::has_df<TollConfigKey>(corridor, key)) {
        return 0
    };
    let config: &TollConfig = corridor::borrow_df(corridor, key);
    if (config.surge_active) {
        (config.toll_amount * config.surge_numerator) / 10000
    } else {
        config.toll_amount
    }
}

public fun toll_config_exists(corridor: &Corridor, gate_id: ID): bool {
    corridor::has_df<TollConfigKey>(corridor, TollConfigKey { gate_id })
}

/// Helper to get the FenAuth witness for authorizing gates.
public fun fen_auth(): FenAuth {
    FenAuth {}
}
