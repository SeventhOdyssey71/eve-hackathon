/// FEN Reputation System — On-Chain Operator Trust Scores
///
/// Tracks operator reputation based on corridor performance metrics.
/// Traders can discover trustworthy operators before committing to routes.
///
/// Reputation is computed from:
///   - Uptime score: fraction of time corridor was active (0-10000 basis points)
///   - Volume score: total trade volume relative to age
///   - Dispute count: emergency lockdowns reduce trust
///   - Fee fairness: avg fee_bps vs network average
///
/// Scores are updated via package-level functions called by toll_gate and depot
/// after each transaction. The reputation is a shared, append-only ledger —
/// operators cannot modify their own scores.
///
/// This is the first on-chain reputation primitive for EVE Frontier.
#[allow(unused_const)]
module fen::reputation;

use sui::event;
use sui::clock::Clock;

use fen::config::{FenConfig, AdminCap};

// === Errors ===
const EReputationNotFound: u64 = 1;

// === Constants ===
const SCORE_DENOMINATOR: u64 = 10000;

// === Structs ===

/// Operator reputation record. Stored as dynamic field on FenConfig,
/// keyed by operator address.
public struct OperatorReputation has copy, drop, store {
    /// Operator address
    operator: address,
    /// Total successful toll payments processed
    total_tolls_processed: u64,
    /// Total successful trades processed
    total_trades_processed: u64,
    /// Total SUI volume processed (tolls + trade fees)
    total_volume_sui: u64,
    /// Number of emergency lockdowns triggered
    emergency_lockdowns: u64,
    /// Number of corridors operated
    corridors_operated: u64,
    /// Timestamp of first activity
    first_activity_at: u64,
    /// Timestamp of last activity
    last_activity_at: u64,
    /// Cumulative uptime score (0-10000 bps, updated per event)
    uptime_score: u64,
    /// Average fee basis points (weighted by volume)
    avg_fee_bps_weighted: u64,
    /// Total weight for fee averaging
    fee_weight_total: u64,
}

/// Dynamic field key for operator reputation.
public struct ReputationKey has copy, drop, store {
    operator: address,
}

// === Events ===

/// Emitted when a reputation score changes.
public struct ReputationUpdatedEvent has copy, drop {
    operator: address,
    total_tolls_processed: u64,
    total_trades_processed: u64,
    total_volume_sui: u64,
    composite_score: u64,
}

// === Admin Functions ===

/// Initialize reputation for a new operator.
public fun init_reputation(
    config: &mut FenConfig,
    admin: &AdminCap,
    operator: address,
    clock: &Clock,
) {
    let key = ReputationKey { operator };
    let rep = OperatorReputation {
        operator,
        total_tolls_processed: 0,
        total_trades_processed: 0,
        total_volume_sui: 0,
        emergency_lockdowns: 0,
        corridors_operated: 1,
        first_activity_at: clock.timestamp_ms(),
        last_activity_at: clock.timestamp_ms(),
        uptime_score: SCORE_DENOMINATOR, // starts at 100%
        avg_fee_bps_weighted: 0,
        fee_weight_total: 0,
    };

    config.set_rule(admin, key, rep);
}

/// Record a toll payment for an operator's reputation.
public fun record_toll(
    config: &mut FenConfig,
    admin: &AdminCap,
    operator: address,
    toll_amount: u64,
    fee_bps: u64,
    clock: &Clock,
) {
    let key = ReputationKey { operator };

    if (!config.has_rule<ReputationKey, OperatorReputation>(key)) {
        // Auto-initialize if first time
        init_reputation(config, admin, operator, clock);
    };

    let rep = config.borrow_rule_mut<ReputationKey, OperatorReputation>(admin, key);
    rep.total_tolls_processed = rep.total_tolls_processed + 1;
    rep.total_volume_sui = rep.total_volume_sui + toll_amount;
    rep.last_activity_at = clock.timestamp_ms();

    // Update weighted average fee
    rep.avg_fee_bps_weighted = rep.avg_fee_bps_weighted + (fee_bps * toll_amount);
    rep.fee_weight_total = rep.fee_weight_total + toll_amount;

    event::emit(ReputationUpdatedEvent {
        operator,
        total_tolls_processed: rep.total_tolls_processed,
        total_trades_processed: rep.total_trades_processed,
        total_volume_sui: rep.total_volume_sui,
        composite_score: compute_score(rep),
    });
}

/// Record a trade for an operator's reputation.
public fun record_trade(
    config: &mut FenConfig,
    admin: &AdminCap,
    operator: address,
    trade_volume_sui: u64,
    fee_bps: u64,
    clock: &Clock,
) {
    let key = ReputationKey { operator };

    if (!config.has_rule<ReputationKey, OperatorReputation>(key)) {
        init_reputation(config, admin, operator, clock);
    };

    let rep = config.borrow_rule_mut<ReputationKey, OperatorReputation>(admin, key);
    rep.total_trades_processed = rep.total_trades_processed + 1;
    rep.total_volume_sui = rep.total_volume_sui + trade_volume_sui;
    rep.last_activity_at = clock.timestamp_ms();

    // Update weighted average fee
    rep.avg_fee_bps_weighted = rep.avg_fee_bps_weighted + (fee_bps * trade_volume_sui);
    rep.fee_weight_total = rep.fee_weight_total + trade_volume_sui;

    event::emit(ReputationUpdatedEvent {
        operator,
        total_tolls_processed: rep.total_tolls_processed,
        total_trades_processed: rep.total_trades_processed,
        total_volume_sui: rep.total_volume_sui,
        composite_score: compute_score(rep),
    });
}

/// Record an emergency lockdown (negative signal).
public fun record_lockdown(
    config: &mut FenConfig,
    admin: &AdminCap,
    operator: address,
    clock: &Clock,
) {
    let key = ReputationKey { operator };

    if (!config.has_rule<ReputationKey, OperatorReputation>(key)) {
        init_reputation(config, admin, operator, clock);
    };

    let rep = config.borrow_rule_mut<ReputationKey, OperatorReputation>(admin, key);
    rep.emergency_lockdowns = rep.emergency_lockdowns + 1;
    rep.last_activity_at = clock.timestamp_ms();

    // Penalize uptime score (lose 5% per lockdown, min 0)
    let penalty = SCORE_DENOMINATOR / 20; // 5%
    if (rep.uptime_score > penalty) {
        rep.uptime_score = rep.uptime_score - penalty;
    } else {
        rep.uptime_score = 0;
    };

    event::emit(ReputationUpdatedEvent {
        operator,
        total_tolls_processed: rep.total_tolls_processed,
        total_trades_processed: rep.total_trades_processed,
        total_volume_sui: rep.total_volume_sui,
        composite_score: compute_score(rep),
    });
}

/// Increment corridor count for an operator.
public fun record_new_corridor(
    config: &mut FenConfig,
    admin: &AdminCap,
    operator: address,
    clock: &Clock,
) {
    let key = ReputationKey { operator };

    if (!config.has_rule<ReputationKey, OperatorReputation>(key)) {
        init_reputation(config, admin, operator, clock);
    };

    let rep = config.borrow_rule_mut<ReputationKey, OperatorReputation>(admin, key);
    rep.corridors_operated = rep.corridors_operated + 1;
}

// === View Functions ===

/// Get an operator's reputation.
public fun get_reputation(config: &FenConfig, operator: address): &OperatorReputation {
    let key = ReputationKey { operator };
    config.borrow_rule<ReputationKey, OperatorReputation>(key)
}

/// Check if an operator has a reputation record.
public fun has_reputation(config: &FenConfig, operator: address): bool {
    let key = ReputationKey { operator };
    config.has_rule<ReputationKey, OperatorReputation>(key)
}

/// Get composite reputation score (0-10000).
/// Formula: (uptime * 0.3) + (activity_score * 0.4) + (fee_fairness * 0.3) - lockdown_penalty
public fun composite_score(config: &FenConfig, operator: address): u64 {
    let key = ReputationKey { operator };
    let rep = config.borrow_rule<ReputationKey, OperatorReputation>(key);
    compute_score(rep)
}

/// Get total transactions (tolls + trades).
public fun total_transactions(rep: &OperatorReputation): u64 {
    rep.total_tolls_processed + rep.total_trades_processed
}

/// Get total volume in SUI.
public fun total_volume_sui(rep: &OperatorReputation): u64 { rep.total_volume_sui }

/// Get uptime score (0-10000).
public fun uptime_score(rep: &OperatorReputation): u64 { rep.uptime_score }

/// Get emergency lockdown count.
public fun lockdowns(rep: &OperatorReputation): u64 { rep.emergency_lockdowns }

/// Get number of corridors operated.
public fun corridors_operated(rep: &OperatorReputation): u64 { rep.corridors_operated }

/// Get weighted average fee in basis points.
public fun avg_fee_bps(rep: &OperatorReputation): u64 {
    if (rep.fee_weight_total == 0) return 0;
    rep.avg_fee_bps_weighted / rep.fee_weight_total
}

/// Get first and last activity timestamps.
public fun activity_window(rep: &OperatorReputation): (u64, u64) {
    (rep.first_activity_at, rep.last_activity_at)
}

// === Internal Functions ===

/// Compute composite score from reputation state.
fun compute_score(rep: &OperatorReputation): u64 {
    // Uptime component (30% weight)
    let uptime_component = (rep.uptime_score * 3000) / SCORE_DENOMINATOR;

    // Activity component (40% weight) — log-scale based on total transactions
    let total_txns = rep.total_tolls_processed + rep.total_trades_processed;
    let activity_raw = if (total_txns >= 10000) {
        SCORE_DENOMINATOR
    } else if (total_txns >= 1000) {
        9000
    } else if (total_txns >= 100) {
        7000
    } else if (total_txns >= 10) {
        4000
    } else if (total_txns >= 1) {
        2000
    } else {
        0
    };
    let activity_component = (activity_raw * 4000) / SCORE_DENOMINATOR;

    // Fee fairness component (30% weight) — lower avg fees = higher score
    let avg_fee = if (rep.fee_weight_total > 0) {
        rep.avg_fee_bps_weighted / rep.fee_weight_total
    } else {
        500 // default assumption
    };
    // Score inversely proportional to fee (0 fee = 10000, 1000 fee = 0)
    let fee_score = if (avg_fee >= 1000) {
        0
    } else {
        ((1000 - avg_fee) * SCORE_DENOMINATOR) / 1000
    };
    let fee_component = (fee_score * 3000) / SCORE_DENOMINATOR;

    // Lockdown penalty: -500 per lockdown
    let lockdown_penalty = rep.emergency_lockdowns * 500;

    let total = uptime_component + activity_component + fee_component;
    if (total > lockdown_penalty) {
        total - lockdown_penalty
    } else {
        0
    }
}
