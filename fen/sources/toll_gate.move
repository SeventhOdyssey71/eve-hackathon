/// FEN Toll Gate Extension
///
/// A gate extension that charges a toll (in SUI or items) before issuing
/// a JumpPermit. Supports surge pricing and emergency lockdown.
///
/// Flow:
///   1. Gate owner calls `authorize_extension<TollAuth>` on their gate
///   2. Gate owner calls `set_toll_config` to define toll amount
///   3. Player calls `pay_toll_and_jump` to pay toll and receive JumpPermit
///   4. Player uses JumpPermit with `gate::jump_with_permit`
///
/// Addresses issue #44 in world-contracts: enables trustless gate economics.
#[allow(unused_const)]
module fen::toll_gate;

use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;

use world::gate::{Self, Gate};
use world::character::Character;

use fen::config::{FenConfig, AdminCap};

// === Errors ===
const ETollNotConfigured: u64 = 1;
const EInsufficientPayment: u64 = 2;
const EGateEmergencyLocked: u64 = 3;
const ENotGateOwner: u64 = 4;

// === Structs ===

/// Typed witness for FEN toll gate extension.
/// Only this module can instantiate it.
public struct TollAuth has drop {}

/// Toll configuration for a specific gate.
/// Stored as a dynamic field on FenConfig, keyed by gate ID.
public struct TollRule has copy, drop, store {
    /// Toll amount in MIST (1 SUI = 1_000_000_000 MIST)
    toll_amount: u64,
    /// Surge pricing numerator (10000 = 1x, 15000 = 1.5x)
    surge_numerator: u64,
    /// Whether surge pricing is active
    surge_active: bool,
    /// Emergency lockdown - blocks all jumps
    emergency_locked: bool,
    /// Fee recipient address
    fee_recipient: address,
}

/// Dynamic field key: toll config for a gate.
public struct TollConfigKey has copy, drop, store {
    gate_id: ID,
}

// === Constants ===
const SURGE_DENOMINATOR: u64 = 10000;
const DEFAULT_PERMIT_DURATION_MS: u64 = 3_600_000; // 1 hour

// === Public Functions ===

/// Pay toll and receive a JumpPermit for the route.
/// The player pays in SUI. Excess is returned.
public fun pay_toll_and_jump(
    config: &FenConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    payment: &mut Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let gate_id = object::id(source_gate);
    let key = TollConfigKey { gate_id };

    // Read toll config
    let toll = config.borrow_rule<TollConfigKey, TollRule>(key);

    // Check emergency lock
    assert!(!toll.emergency_locked, EGateEmergencyLocked);

    // Calculate effective toll (with surge if active)
    let effective_toll = if (toll.surge_active) {
        (toll.toll_amount * toll.surge_numerator) / SURGE_DENOMINATOR
    } else {
        toll.toll_amount
    };

    // Verify payment
    assert!(coin::value(payment) >= effective_toll, EInsufficientPayment);

    // Split toll from payment and send to fee recipient
    let toll_coin = coin::split(payment, effective_toll, ctx);
    transfer::public_transfer(toll_coin, toll.fee_recipient);

    // Issue jump permit (expires in 1 hour)
    let expires_at = clock.timestamp_ms() + DEFAULT_PERMIT_DURATION_MS;
    gate::issue_jump_permit<TollAuth>(
        source_gate,
        destination_gate,
        character,
        TollAuth {},
        expires_at,
        ctx,
    );
}

// === Admin Functions ===

/// Configure toll for a gate. Only FEN admin can call.
public fun set_toll_config(
    config: &mut FenConfig,
    admin: &AdminCap,
    gate_id: ID,
    toll_amount: u64,
    fee_recipient: address,
) {
    let key = TollConfigKey { gate_id };
    let rule = TollRule {
        toll_amount,
        surge_numerator: SURGE_DENOMINATOR, // 1x by default
        surge_active: false,
        emergency_locked: false,
        fee_recipient,
    };
    config.set_rule(admin, key, rule);
}

/// Enable surge pricing with a multiplier.
/// numerator = 15000 means 1.5x toll.
public fun activate_surge(
    config: &mut FenConfig,
    admin: &AdminCap,
    gate_id: ID,
    surge_numerator: u64,
) {
    let key = TollConfigKey { gate_id };
    let toll = config.borrow_rule_mut<TollConfigKey, TollRule>(admin, key);
    toll.surge_numerator = surge_numerator;
    toll.surge_active = true;
}

/// Disable surge pricing.
public fun deactivate_surge(
    config: &mut FenConfig,
    admin: &AdminCap,
    gate_id: ID,
) {
    let key = TollConfigKey { gate_id };
    let toll = config.borrow_rule_mut<TollConfigKey, TollRule>(admin, key);
    toll.surge_active = false;
    toll.surge_numerator = SURGE_DENOMINATOR;
}

/// Emergency lockdown - block all jumps through this gate.
public fun emergency_lock(
    config: &mut FenConfig,
    admin: &AdminCap,
    gate_id: ID,
) {
    let key = TollConfigKey { gate_id };
    let toll = config.borrow_rule_mut<TollConfigKey, TollRule>(admin, key);
    toll.emergency_locked = true;
}

/// Lift emergency lockdown.
public fun emergency_unlock(
    config: &mut FenConfig,
    admin: &AdminCap,
    gate_id: ID,
) {
    let key = TollConfigKey { gate_id };
    let toll = config.borrow_rule_mut<TollConfigKey, TollRule>(admin, key);
    toll.emergency_locked = false;
}

// === View Functions ===

/// Get the effective toll amount for a gate (including surge).
public fun effective_toll(config: &FenConfig, gate_id: ID): u64 {
    let key = TollConfigKey { gate_id };
    let toll = config.borrow_rule<TollConfigKey, TollRule>(key);
    if (toll.surge_active) {
        (toll.toll_amount * toll.surge_numerator) / SURGE_DENOMINATOR
    } else {
        toll.toll_amount
    }
}

/// Check if a gate is emergency locked.
public fun is_locked(config: &FenConfig, gate_id: ID): bool {
    let key = TollConfigKey { gate_id };
    let toll = config.borrow_rule<TollConfigKey, TollRule>(key);
    toll.emergency_locked
}
