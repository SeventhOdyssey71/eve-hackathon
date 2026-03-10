/// Frontier Exchange Network — DeepBook v3 Adapter
///
/// Enables corridor operators to provide DeFi liquidity through DeepBook v3 CLOB.
/// Operators create balance managers, deposit/withdraw funds, and place orders on
/// DeepBook pools — all managed through their corridor ownership.
///
/// This module acts as a thin wrapper that ties DeepBook operations to the FEN
/// corridor ownership model. It does NOT directly import DeepBook packages;
/// instead it manages local state (BalanceManagerRegistry) and emits events
/// so the frontend can construct the actual DeepBook PTBs client-side.
///
/// In production, this would call DeepBook move functions directly once the
/// DeepBook v3 package is available as a dependency.
module fen::deepbook_adapter;

use sui::{
    event,
    table::{Self, Table},
};
use fen::corridor::{Self, CorridorOwnerCap};

// === Errors ===
#[error(code = 0)]
const ENotOwner: vector<u8> = b"Not the corridor owner";
#[error(code = 1)]
const EManagerAlreadyLinked: vector<u8> = b"Balance manager already linked to corridor";
#[error(code = 2)]
const EManagerNotLinked: vector<u8> = b"No balance manager linked to corridor";

// === Structs ===

/// Registry tracking which balance managers are linked to which corridors.
public struct BalanceManagerRegistry has key {
    id: UID,
    /// corridor_id -> BalanceManagerInfo
    managers: Table<ID, BalanceManagerInfo>,
}

/// Tracks a DeepBook balance manager linked to a corridor.
public struct BalanceManagerInfo has store, drop {
    balance_manager_id: ID,
    operator: address,
    linked_at: u64,
}

// === Events ===
public struct BalanceManagerLinkedEvent has copy, drop {
    corridor_id: ID,
    balance_manager_id: ID,
    operator: address,
}

public struct BalanceManagerUnlinkedEvent has copy, drop {
    corridor_id: ID,
    balance_manager_id: ID,
}

public struct OrderPlacedEvent has copy, drop {
    corridor_id: ID,
    pool_id: ID,
    is_bid: bool,
    price: u64,
    quantity: u64,
    client_order_id: u64,
}

public struct OrderCancelledEvent has copy, drop {
    corridor_id: ID,
    pool_id: ID,
}

// === Init ===
fun init(ctx: &mut TxContext) {
    transfer::share_object(BalanceManagerRegistry {
        id: object::new(ctx),
        managers: table::new(ctx),
    });
}

// === Admin Functions ===

/// Link a DeepBook balance manager to a corridor.
/// The actual balance manager object is created client-side via DeepBook PTBs;
/// this just records the association.
public fun link_balance_manager(
    registry: &mut BalanceManagerRegistry,
    owner_cap: &CorridorOwnerCap,
    corridor_id: ID,
    balance_manager_id: ID,
    operator: address,
    _ctx: &mut TxContext,
) {
    assert!(corridor::corridor_id(owner_cap) == corridor_id, ENotOwner);
    assert!(!registry.managers.contains(corridor_id), EManagerAlreadyLinked);

    registry.managers.add(corridor_id, BalanceManagerInfo {
        balance_manager_id,
        operator,
        linked_at: 0, // would use clock in production
    });

    event::emit(BalanceManagerLinkedEvent {
        corridor_id,
        balance_manager_id,
        operator,
    });
}

/// Unlink a balance manager from a corridor.
public fun unlink_balance_manager(
    registry: &mut BalanceManagerRegistry,
    owner_cap: &CorridorOwnerCap,
    corridor_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == corridor_id, ENotOwner);
    assert!(registry.managers.contains(corridor_id), EManagerNotLinked);

    let info = registry.managers.remove(corridor_id);

    event::emit(BalanceManagerUnlinkedEvent {
        corridor_id,
        balance_manager_id: info.balance_manager_id,
    });
}

/// Record that an order was placed (for indexing/dashboard display).
/// In production this would wrap the actual DeepBook place_limit_order call.
public fun record_order_placed(
    registry: &BalanceManagerRegistry,
    owner_cap: &CorridorOwnerCap,
    corridor_id: ID,
    pool_id: ID,
    is_bid: bool,
    price: u64,
    quantity: u64,
    client_order_id: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == corridor_id, ENotOwner);
    assert!(registry.managers.contains(corridor_id), EManagerNotLinked);

    event::emit(OrderPlacedEvent {
        corridor_id,
        pool_id,
        is_bid,
        price,
        quantity,
        client_order_id,
    });
}

/// Record order cancellation.
public fun record_orders_cancelled(
    registry: &BalanceManagerRegistry,
    owner_cap: &CorridorOwnerCap,
    corridor_id: ID,
    pool_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == corridor_id, ENotOwner);
    assert!(registry.managers.contains(corridor_id), EManagerNotLinked);

    event::emit(OrderCancelledEvent {
        corridor_id,
        pool_id,
    });
}

// === View Functions ===
public fun has_balance_manager(registry: &BalanceManagerRegistry, corridor_id: ID): bool {
    registry.managers.contains(corridor_id)
}

public fun balance_manager_id(registry: &BalanceManagerRegistry, corridor_id: ID): ID {
    let info = registry.managers.borrow(corridor_id);
    info.balance_manager_id
}

public fun balance_manager_operator(registry: &BalanceManagerRegistry, corridor_id: ID): address {
    let info = registry.managers.borrow(corridor_id);
    info.operator
}

// === Test Helpers ===
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
