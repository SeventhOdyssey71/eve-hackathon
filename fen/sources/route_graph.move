/// FEN Route Graph — Multi-Hop Trade Route Discovery
///
/// Extends the corridor registry with a network graph that enables
/// multi-hop route planning. Corridors form edges in a directed graph
/// where nodes are solar systems (identified by gate endpoints).
///
/// Features:
///   - Register corridor edges in the route graph
///   - Query adjacent corridors from any node (solar system)
///   - Track route costs (tolls + fees) for optimal pathfinding
///   - Support multi-hop journeys through chained corridors
///
/// The dashboard uses this data for "Google Maps for interstellar trade" —
/// finding the cheapest or most profitable multi-hop routes.
///
/// Architecture:
///   RouteGraph (shared object) stores adjacency lists as dynamic fields
///   keyed by source node ID. Each entry contains a vector of RouteEdge
///   structs describing the corridor, destination, and cost.
#[allow(unused_const, unused_field, unused_variable)]
module fen::route_graph;

use sui::event;

// === Errors ===
const ENodeNotFound: u64 = 1;
const EEdgeAlreadyExists: u64 = 2;
const EEdgeNotFound: u64 = 3;

// === Structs ===

/// The route graph. A shared object tracking the corridor network topology.
public struct RouteGraph has key {
    id: UID,
    /// Total edges (corridor connections) in the graph
    total_edges: u64,
    /// Total distinct nodes (solar systems) in the graph
    total_nodes: u64,
}

/// A single edge in the route graph: a corridor connecting two nodes.
public struct RouteEdge has copy, drop, store {
    /// Corridor ID this edge represents
    corridor_id: ID,
    /// Destination node (gate ID at the other end)
    dest_node: ID,
    /// Corridor name for display
    name: vector<u8>,
    /// Current toll cost in MIST (for pathfinding)
    toll_cost: u64,
    /// Current trade fee in basis points
    trade_fee_bps: u64,
    /// Whether the corridor is currently active
    is_active: bool,
}

/// Adjacency list for a node. Stored as dynamic field on RouteGraph.
public struct AdjacencyList has copy, drop, store {
    /// Source node ID (gate)
    node_id: ID,
    /// Edges departing from this node
    edges: vector<RouteEdge>,
}

/// Dynamic field key for adjacency lists.
public struct NodeKey has copy, drop, store {
    node_id: ID,
}

// === Events ===

public struct EdgeAddedEvent has copy, drop {
    source_node: ID,
    dest_node: ID,
    corridor_id: ID,
    name: vector<u8>,
}

public struct EdgeRemovedEvent has copy, drop {
    source_node: ID,
    dest_node: ID,
    corridor_id: ID,
}

public struct EdgeCostUpdatedEvent has copy, drop {
    corridor_id: ID,
    toll_cost: u64,
    trade_fee_bps: u64,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    let graph = RouteGraph {
        id: object::new(ctx),
        total_edges: 0,
        total_nodes: 0,
    };
    transfer::share_object(graph);
}

// === Public Functions ===

/// Add a corridor as a bidirectional edge in the route graph.
/// Called when a corridor is registered. Creates entries in both directions.
public fun add_edge(
    graph: &mut RouteGraph,
    source_node: ID,
    dest_node: ID,
    corridor_id: ID,
    name: vector<u8>,
    toll_cost: u64,
    trade_fee_bps: u64,
    ctx: &mut TxContext,
) {
    let edge_forward = RouteEdge {
        corridor_id,
        dest_node,
        name,
        toll_cost,
        trade_fee_bps,
        is_active: true,
    };

    let edge_reverse = RouteEdge {
        corridor_id,
        dest_node: source_node,
        name,
        toll_cost,
        trade_fee_bps,
        is_active: true,
    };

    // Add forward edge
    ensure_node_exists(graph, source_node);
    let source_key = NodeKey { node_id: source_node };
    let source_adj = sui::dynamic_field::borrow_mut<NodeKey, AdjacencyList>(
        &mut graph.id, source_key,
    );
    source_adj.edges.push_back(edge_forward);

    // Add reverse edge
    ensure_node_exists(graph, dest_node);
    let dest_key = NodeKey { node_id: dest_node };
    let dest_adj = sui::dynamic_field::borrow_mut<NodeKey, AdjacencyList>(
        &mut graph.id, dest_key,
    );
    dest_adj.edges.push_back(edge_reverse);

    graph.total_edges = graph.total_edges + 2;

    event::emit(EdgeAddedEvent {
        source_node,
        dest_node,
        corridor_id,
        name,
    });
}

/// Update the cost of a corridor edge (called when tolls or fees change).
public fun update_edge_cost(
    graph: &mut RouteGraph,
    source_node: ID,
    corridor_id: ID,
    new_toll_cost: u64,
    new_trade_fee_bps: u64,
) {
    let source_key = NodeKey { node_id: source_node };
    if (sui::dynamic_field::exists_(&graph.id, source_key)) {
        let adj = sui::dynamic_field::borrow_mut<NodeKey, AdjacencyList>(
            &mut graph.id, source_key,
        );
        let mut i = 0;
        while (i < adj.edges.length()) {
            if (adj.edges[i].corridor_id == corridor_id) {
                adj.edges[i].toll_cost = new_toll_cost;
                adj.edges[i].trade_fee_bps = new_trade_fee_bps;
            };
            i = i + 1;
        };
    };

    event::emit(EdgeCostUpdatedEvent {
        corridor_id,
        toll_cost: new_toll_cost,
        trade_fee_bps: new_trade_fee_bps,
    });
}

/// Mark a corridor edge as inactive/active.
public fun set_edge_active(
    graph: &mut RouteGraph,
    source_node: ID,
    corridor_id: ID,
    is_active: bool,
) {
    let source_key = NodeKey { node_id: source_node };
    if (sui::dynamic_field::exists_(&graph.id, source_key)) {
        let adj = sui::dynamic_field::borrow_mut<NodeKey, AdjacencyList>(
            &mut graph.id, source_key,
        );
        let mut i = 0;
        while (i < adj.edges.length()) {
            if (adj.edges[i].corridor_id == corridor_id) {
                adj.edges[i].is_active = is_active;
            };
            i = i + 1;
        };
    };
}

// === View Functions ===

/// Get the adjacency list for a node.
public fun get_adjacency(graph: &RouteGraph, node_id: ID): &AdjacencyList {
    let key = NodeKey { node_id };
    assert!(sui::dynamic_field::exists_(&graph.id, key), ENodeNotFound);
    sui::dynamic_field::borrow<NodeKey, AdjacencyList>(&graph.id, key)
}

/// Check if a node exists in the graph.
public fun has_node(graph: &RouteGraph, node_id: ID): bool {
    let key = NodeKey { node_id };
    sui::dynamic_field::exists_(&graph.id, key)
}

/// Get the edges from a node.
public fun edges(adj: &AdjacencyList): &vector<RouteEdge> {
    &adj.edges
}

/// Get the number of edges from a node.
public fun edge_count(adj: &AdjacencyList): u64 {
    adj.edges.length()
}

/// Edge accessors.
public fun edge_corridor_id(edge: &RouteEdge): ID { edge.corridor_id }
public fun edge_dest_node(edge: &RouteEdge): ID { edge.dest_node }
public fun edge_name(edge: &RouteEdge): vector<u8> { edge.name }
public fun edge_toll_cost(edge: &RouteEdge): u64 { edge.toll_cost }
public fun edge_trade_fee_bps(edge: &RouteEdge): u64 { edge.trade_fee_bps }
public fun edge_is_active(edge: &RouteEdge): bool { edge.is_active }

/// Graph stats.
public fun total_edges(graph: &RouteGraph): u64 { graph.total_edges }
public fun total_nodes(graph: &RouteGraph): u64 { graph.total_nodes }

// === Internal Functions ===

/// Ensure a node exists in the graph. Creates it if not present.
fun ensure_node_exists(graph: &mut RouteGraph, node_id: ID) {
    let key = NodeKey { node_id };
    if (!sui::dynamic_field::exists_(&graph.id, key)) {
        let adj = AdjacencyList {
            node_id,
            edges: vector[],
        };
        sui::dynamic_field::add(&mut graph.id, key, adj);
        graph.total_nodes = graph.total_nodes + 1;
    };
}

// === Test Functions ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
