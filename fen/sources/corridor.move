/// FEN Corridor Registry
///
/// A corridor is the core FEN concept: two linked gates + two depots
/// forming a trade route. The registry is a shared object that tracks
/// all active corridors and their metadata.
///
/// Corridor = Gate A + Gate B + Depot A (SSU) + Depot B (SSU) + Owner
///
/// The corridor registry enables:
///   - Route discovery (what corridors exist, where, what they trade)
///   - Revenue tracking per corridor
///   - Operator management (activate/deactivate, update fees)
#[allow(unused_const, unused_field)]
module fen::corridor;

use sui::event;
use sui::clock::Clock;


// === Errors ===
const ECorridorAlreadyExists: u64 = 1;
const ECorridorNotFound: u64 = 2;
const ENotCorridorOwner: u64 = 3;
const ECorridorInactive: u64 = 4;

// === Structs ===

/// The corridor registry. A shared object tracking all FEN corridors.
public struct CorridorRegistry has key {
    id: UID,
    /// Total number of corridors ever created
    total_corridors: u64,
}

/// A single trade corridor linking two gates and two depots.
public struct Corridor has key, store {
    id: UID,
    /// Source gate ID (Gate A)
    source_gate_id: ID,
    /// Destination gate ID (Gate B)
    dest_gate_id: ID,
    /// Depot at source endpoint (SSU A)
    depot_a_id: ID,
    /// Depot at destination endpoint (SSU B)
    depot_b_id: ID,
    /// Corridor operator (owner)
    owner: address,
    /// Where toll + trade fees are sent
    fee_recipient: address,
    /// Whether this corridor is active
    is_active: bool,
    /// Creation timestamp
    created_at: u64,
    /// Corridor name for discovery
    name: vector<u8>,
    /// Traffic counters
    total_jumps: u64,
    total_trades: u64,
    /// Revenue counters (in MIST)
    total_toll_revenue: u64,
    total_trade_revenue: u64,
}

// === Events ===

public struct CorridorCreatedEvent has copy, drop {
    corridor_id: ID,
    source_gate_id: ID,
    dest_gate_id: ID,
    depot_a_id: ID,
    depot_b_id: ID,
    owner: address,
    name: vector<u8>,
}

public struct CorridorStatusChangedEvent has copy, drop {
    corridor_id: ID,
    is_active: bool,
}

public struct CorridorStatsUpdatedEvent has copy, drop {
    corridor_id: ID,
    total_jumps: u64,
    total_trades: u64,
    total_toll_revenue: u64,
    total_trade_revenue: u64,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    let registry = CorridorRegistry {
        id: object::new(ctx),
        total_corridors: 0,
    };
    transfer::share_object(registry);
}

// === Public Functions ===

/// Register a new trade corridor.
/// Caller must own both gates and both SSUs.
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
): ID {
    // TODO: verify caller owns the gates and SSUs via OwnerCap
    // TODO: verify gates are linked to each other

    let corridor = Corridor {
        id: object::new(ctx),
        source_gate_id,
        dest_gate_id,
        depot_a_id,
        depot_b_id,
        owner: ctx.sender(),
        fee_recipient,
        is_active: true,
        created_at: clock.timestamp_ms(),
        name,
        total_jumps: 0,
        total_trades: 0,
        total_toll_revenue: 0,
        total_trade_revenue: 0,
    };

    let corridor_id = object::id(&corridor);

    event::emit(CorridorCreatedEvent {
        corridor_id,
        source_gate_id,
        dest_gate_id,
        depot_a_id,
        depot_b_id,
        owner: ctx.sender(),
        name,
    });

    registry.total_corridors = registry.total_corridors + 1;

    transfer::share_object(corridor);
    corridor_id
}

/// Deactivate a corridor (pause all operations).
public fun deactivate_corridor(
    corridor: &mut Corridor,
    ctx: &TxContext,
) {
    assert!(corridor.owner == ctx.sender(), ENotCorridorOwner);
    corridor.is_active = false;
    event::emit(CorridorStatusChangedEvent {
        corridor_id: object::id(corridor),
        is_active: false,
    });
}

/// Reactivate a corridor.
public fun activate_corridor(
    corridor: &mut Corridor,
    ctx: &TxContext,
) {
    assert!(corridor.owner == ctx.sender(), ENotCorridorOwner);
    corridor.is_active = true;
    event::emit(CorridorStatusChangedEvent {
        corridor_id: object::id(corridor),
        is_active: true,
    });
}

/// Update fee recipient address.
public fun update_fee_recipient(
    corridor: &mut Corridor,
    new_recipient: address,
    ctx: &TxContext,
) {
    assert!(corridor.owner == ctx.sender(), ENotCorridorOwner);
    corridor.fee_recipient = new_recipient;
}

// === Package Functions (called by toll_gate and depot modules) ===

/// Record a jump through this corridor. Called by toll_gate after payment.
public(package) fun record_jump(
    corridor: &mut Corridor,
    toll_amount: u64,
) {
    corridor.total_jumps = corridor.total_jumps + 1;
    corridor.total_toll_revenue = corridor.total_toll_revenue + toll_amount;
}

/// Record a trade at a corridor depot. Called by depot after trade.
public(package) fun record_trade(
    corridor: &mut Corridor,
    fee_amount: u64,
) {
    corridor.total_trades = corridor.total_trades + 1;
    corridor.total_trade_revenue = corridor.total_trade_revenue + fee_amount;
}

// === View Functions ===

public fun source_gate_id(corridor: &Corridor): ID { corridor.source_gate_id }
public fun dest_gate_id(corridor: &Corridor): ID { corridor.dest_gate_id }
public fun depot_a_id(corridor: &Corridor): ID { corridor.depot_a_id }
public fun depot_b_id(corridor: &Corridor): ID { corridor.depot_b_id }
public fun owner(corridor: &Corridor): address { corridor.owner }
public fun fee_recipient(corridor: &Corridor): address { corridor.fee_recipient }
public fun is_active(corridor: &Corridor): bool { corridor.is_active }
public fun name(corridor: &Corridor): vector<u8> { corridor.name }
public fun total_jumps(corridor: &Corridor): u64 { corridor.total_jumps }
public fun total_trades(corridor: &Corridor): u64 { corridor.total_trades }
public fun total_toll_revenue(corridor: &Corridor): u64 { corridor.total_toll_revenue }
public fun total_trade_revenue(corridor: &Corridor): u64 { corridor.total_trade_revenue }
public fun total_corridors(registry: &CorridorRegistry): u64 { registry.total_corridors }

// === Test Functions ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
