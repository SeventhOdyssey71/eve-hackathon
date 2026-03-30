/// Frontier Exchange Network — Corridor Registry
///
/// A Corridor is a player-owned trade route linking two gates and two depots (storage units).
/// The corridor owner configures tolls on gates and exchange rates on depots, earning revenue
/// from both jump fees and depot trade spreads.
///
/// Corridors are registered in a shared `CorridorRegistry` and each corridor is itself a
/// shared object so that any player can interact with it.
#[allow(lint(self_transfer))]
module fen::corridor;

use sui::clock::Clock;
use sui::dynamic_field as df;
use sui::event;
use sui::table::{Self, Table};

// === Errors ===
#[error(code = 0)]
const ENotOwner: vector<u8> = b"Caller is not the corridor owner";
#[error(code = 1)]
const ECorridorNameEmpty: vector<u8> = b"Corridor name cannot be empty";
#[error(code = 2)]
const ECorridorAlreadyActive: vector<u8> = b"Corridor is already active";
#[error(code = 3)]
const ECorridorNotActive: vector<u8> = b"Corridor is not active";
#[error(code = 4)]
const ECorridorEmergencyLocked: vector<u8> = b"Corridor is under emergency lockdown";

// === Status Constants ===
const STATUS_INACTIVE: u8 = 0;
const STATUS_ACTIVE: u8 = 1;
const STATUS_EMERGENCY: u8 = 2;

// === Structs ===

/// Shared singleton created at package publish.
public struct CorridorRegistry has key {
    id: UID,
    corridors: Table<ID, CorridorInfo>,
    corridor_count: u64,
}

/// Lightweight lookup record stored in the registry table.
public struct CorridorInfo has drop, store {
    name: vector<u8>,
    owner: address,
    status: u8,
}

/// The main corridor object — shared so any player can read it and interact.
public struct Corridor has key {
    id: UID,
    name: vector<u8>,
    owner: address,
    fee_recipient: address,
    source_gate_id: ID,
    dest_gate_id: ID,
    depot_a_id: ID,
    depot_b_id: ID,
    status: u8,
    total_jumps: u64,
    total_trades: u64,
    total_toll_revenue: u64,
    total_trade_revenue: u64,
    created_at: u64,
    last_activity_at: u64,
}

/// Capability proving ownership of a specific corridor.
public struct CorridorOwnerCap has key, store {
    id: UID,
    corridor_id: ID,
}

// === Events ===
public struct CorridorCreatedEvent has copy, drop {
    corridor_id: ID,
    corridor_name: vector<u8>,
    owner: address,
    source_gate_id: ID,
    dest_gate_id: ID,
    depot_a_id: ID,
    depot_b_id: ID,
}

public struct CorridorStatusChangedEvent has copy, drop {
    corridor_id: ID,
    old_status: u8,
    new_status: u8,
    actor: address,
}

// === Init ===
fun init(ctx: &mut TxContext) {
    transfer::share_object(CorridorRegistry {
        id: object::new(ctx),
        corridors: table::new(ctx),
        corridor_count: 0,
    });
}

// === Public Entry Functions ===

/// Register a new trade corridor.
/// Returns a `CorridorOwnerCap` to the caller and shares the `Corridor` object.
public fun register_corridor(
    registry: &mut CorridorRegistry,
    source_gate_id: ID,
    dest_gate_id: ID,
    depot_a_id: ID,
    depot_b_id: ID,
    fee_recipient: address,
    name: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(!name.is_empty(), ECorridorNameEmpty);

    let now_ms = clock.timestamp_ms();
    let corridor_uid = object::new(ctx);
    let corridor_id = object::uid_to_inner(&corridor_uid);
    let sender = ctx.sender();

    let corridor = Corridor {
        id: corridor_uid,
        name: copy name,
        owner: sender,
        fee_recipient,
        source_gate_id,
        dest_gate_id,
        depot_a_id,
        depot_b_id,
        status: STATUS_INACTIVE,
        total_jumps: 0,
        total_trades: 0,
        total_toll_revenue: 0,
        total_trade_revenue: 0,
        created_at: now_ms,
        last_activity_at: now_ms,
    };

    // Record in registry
    registry
        .corridors
        .add(
            corridor_id,
            CorridorInfo {
                name: copy name,
                owner: sender,
                status: STATUS_INACTIVE,
            },
        );
    registry.corridor_count = registry.corridor_count + 1;

    // Mint owner cap
    let owner_cap = CorridorOwnerCap {
        id: object::new(ctx),
        corridor_id,
    };

    event::emit(CorridorCreatedEvent {
        corridor_id,
        corridor_name: name,
        owner: sender,
        source_gate_id,
        dest_gate_id,
        depot_a_id,
        depot_b_id,
    });

    transfer::share_object(corridor);
    transfer::transfer(owner_cap, sender);
}

/// Activate a corridor (owner only).
public fun activate_corridor(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.corridor_id == object::id(corridor), ENotOwner);
    assert!(corridor.status == STATUS_INACTIVE, ECorridorAlreadyActive);

    let old = corridor.status;
    corridor.status = STATUS_ACTIVE;

    event::emit(CorridorStatusChangedEvent {
        corridor_id: object::id(corridor),
        old_status: old,
        new_status: STATUS_ACTIVE,
        actor: ctx.sender(),
    });
}

/// Deactivate a corridor (owner only).
public fun deactivate_corridor(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.corridor_id == object::id(corridor), ENotOwner);
    assert!(corridor.status == STATUS_ACTIVE, ECorridorNotActive);

    let old = corridor.status;
    corridor.status = STATUS_INACTIVE;

    event::emit(CorridorStatusChangedEvent {
        corridor_id: object::id(corridor),
        old_status: old,
        new_status: STATUS_INACTIVE,
        actor: ctx.sender(),
    });
}

/// Emergency lockdown — only the owner can trigger.
public fun emergency_lock(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.corridor_id == object::id(corridor), ENotOwner);

    let old = corridor.status;
    corridor.status = STATUS_EMERGENCY;

    event::emit(CorridorStatusChangedEvent {
        corridor_id: object::id(corridor),
        old_status: old,
        new_status: STATUS_EMERGENCY,
        actor: ctx.sender(),
    });
}

/// Lift emergency lockdown — corridor returns to inactive.
public fun emergency_unlock(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    ctx: &mut TxContext,
) {
    assert!(owner_cap.corridor_id == object::id(corridor), ENotOwner);
    assert!(corridor.status == STATUS_EMERGENCY, ECorridorEmergencyLocked);

    corridor.status = STATUS_INACTIVE;

    event::emit(CorridorStatusChangedEvent {
        corridor_id: object::id(corridor),
        old_status: STATUS_EMERGENCY,
        new_status: STATUS_INACTIVE,
        actor: ctx.sender(),
    });
}

/// Update the fee recipient address.
public fun update_fee_recipient(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    new_recipient: address,
) {
    assert!(owner_cap.corridor_id == object::id(corridor), ENotOwner);
    corridor.fee_recipient = new_recipient;
}

// === Package-Friend Mutators (called by toll_gate / depot / treasury) ===

public(package) fun record_jump(corridor: &mut Corridor, toll_amount: u64, clock: &Clock) {
    corridor.total_jumps = corridor.total_jumps + 1;
    corridor.total_toll_revenue = corridor.total_toll_revenue + toll_amount;
    corridor.last_activity_at = clock.timestamp_ms();
}

public(package) fun record_trade(corridor: &mut Corridor, fee_amount: u64, clock: &Clock) {
    corridor.total_trades = corridor.total_trades + 1;
    corridor.total_trade_revenue = corridor.total_trade_revenue + fee_amount;
    corridor.last_activity_at = clock.timestamp_ms();
}

// === View Functions ===
public fun name(corridor: &Corridor): vector<u8> { corridor.name }

public fun owner(corridor: &Corridor): address { corridor.owner }

public fun fee_recipient(corridor: &Corridor): address { corridor.fee_recipient }

public fun status(corridor: &Corridor): u8 { corridor.status }

public fun is_active(corridor: &Corridor): bool { corridor.status == STATUS_ACTIVE }

public fun is_emergency(corridor: &Corridor): bool { corridor.status == STATUS_EMERGENCY }

public fun total_jumps(corridor: &Corridor): u64 { corridor.total_jumps }

public fun total_trades(corridor: &Corridor): u64 { corridor.total_trades }

public fun total_toll_revenue(corridor: &Corridor): u64 { corridor.total_toll_revenue }

public fun total_trade_revenue(corridor: &Corridor): u64 { corridor.total_trade_revenue }

public fun source_gate_id(corridor: &Corridor): ID { corridor.source_gate_id }

public fun dest_gate_id(corridor: &Corridor): ID { corridor.dest_gate_id }

public fun depot_a_id(corridor: &Corridor): ID { corridor.depot_a_id }

public fun depot_b_id(corridor: &Corridor): ID { corridor.depot_b_id }

public fun corridor_count(registry: &CorridorRegistry): u64 { registry.corridor_count }

public fun corridor_id(cap: &CorridorOwnerCap): ID { cap.corridor_id }

// === Dynamic Field Helpers (for toll_gate / depot to store config on Corridor) ===

public(package) fun has_df<K: copy + drop + store>(corridor: &Corridor, key: K): bool {
    df::exists_(&corridor.id, key)
}

public(package) fun borrow_df<K: copy + drop + store, V: store>(corridor: &Corridor, key: K): &V {
    df::borrow(&corridor.id, key)
}

public(package) fun borrow_df_mut<K: copy + drop + store, V: store>(
    corridor: &mut Corridor,
    key: K,
): &mut V {
    df::borrow_mut(&mut corridor.id, key)
}

public(package) fun add_df<K: copy + drop + store, V: store>(
    corridor: &mut Corridor,
    key: K,
    value: V,
) {
    df::add(&mut corridor.id, key, value);
}

public(package) fun remove_df<K: copy + drop + store, V: store>(
    corridor: &mut Corridor,
    key: K,
): V {
    df::remove(&mut corridor.id, key)
}

// === Test Helpers ===
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
