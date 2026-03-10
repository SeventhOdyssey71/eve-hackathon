/// FEN Liquidity Pool — AMM-Style Dynamic Pricing for Depots
///
/// Transforms static-ratio depots into fully automated market makers (AMMs)
/// using a constant-product formula (x * y = k). Prices adjust dynamically
/// based on supply and demand — the first on-chain DEX for EVE Frontier items.
///
/// How it works:
///   - Operator initializes a pool with reserve_x and reserve_y quantities
///   - Traders swap x→y or y→x; price determined by k = reserve_x * reserve_y
///   - After each trade, reserves shift and price adjusts automatically
///   - Fee collected on each swap goes to the corridor treasury
///
/// Formula:
///   output = (input_amount * reserve_out) / (reserve_in + input_amount)
///   (minus fee in basis points)
///
/// This module stores pool state as dynamic fields on FenConfig, keyed by
/// storage unit ID. It works alongside the depot module — operators can choose
/// fixed-ratio (depot.move) or AMM pricing (liquidity_pool.move).
///
/// Addresses world-contracts issue #44: extension-managed inventory for
/// trustless, ownerless trading protocols.
#[allow(unused_const)]
module fen::liquidity_pool;

use sui::event;

use fen::config::{FenConfig, AdminCap};

// === Errors ===
const EPoolNotInitialized: u64 = 1;
const EPoolInactive: u64 = 2;
const EInsufficientInput: u64 = 3;
const EInsufficientLiquidity: u64 = 4;
const EZeroReserve: u64 = 5;
const ESlippageExceeded: u64 = 6;
const EInvalidFee: u64 = 7;

// === Constants ===
const FEE_DENOMINATOR: u64 = 10000;
const MAX_FEE_BPS: u64 = 1000; // 10% max fee

// === Structs ===

/// AMM pool state for a depot. Stored as dynamic field on FenConfig.
public struct PoolState has copy, drop, store {
    /// Reserve of input token (type X)
    reserve_x: u64,
    /// Reserve of output token (type Y)
    reserve_y: u64,
    /// Item type ID for X
    type_x: u64,
    /// Item type ID for Y
    type_y: u64,
    /// Fee in basis points (e.g., 30 = 0.3%)
    fee_bps: u64,
    /// Cumulative volume traded (in X units)
    total_volume_x: u64,
    /// Cumulative volume traded (in Y units)
    total_volume_y: u64,
    /// Total fees collected (in output units)
    total_fees_collected: u64,
    /// Total number of swaps
    total_swaps: u64,
    /// Whether the pool is active
    is_active: bool,
}

/// Dynamic field key for pool state.
public struct PoolKey has copy, drop, store {
    storage_unit_id: ID,
}

// === Events ===

/// Emitted when a swap occurs.
public struct SwapEvent has copy, drop {
    storage_unit_id: ID,
    trader: address,
    input_type: u64,
    input_amount: u64,
    output_type: u64,
    output_amount: u64,
    fee_amount: u64,
    new_reserve_x: u64,
    new_reserve_y: u64,
    /// Effective price: output per 1000 input units (for precision)
    effective_price_x1000: u64,
}

/// Emitted when a pool is initialized or reserves are updated.
public struct PoolUpdatedEvent has copy, drop {
    storage_unit_id: ID,
    reserve_x: u64,
    reserve_y: u64,
    type_x: u64,
    type_y: u64,
    fee_bps: u64,
}

/// Emitted when liquidity is added.
public struct LiquidityAddedEvent has copy, drop {
    storage_unit_id: ID,
    added_x: u64,
    added_y: u64,
    new_reserve_x: u64,
    new_reserve_y: u64,
}

// === Admin Functions ===

/// Initialize an AMM pool for a depot.
/// Sets the initial reserves which determine the starting price (price = reserve_y / reserve_x).
public fun initialize_pool(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    type_x: u64,
    type_y: u64,
    initial_reserve_x: u64,
    initial_reserve_y: u64,
    fee_bps: u64,
) {
    assert!(initial_reserve_x > 0 && initial_reserve_y > 0, EZeroReserve);
    assert!(fee_bps <= MAX_FEE_BPS, EInvalidFee);

    let key = PoolKey { storage_unit_id };
    let state = PoolState {
        reserve_x: initial_reserve_x,
        reserve_y: initial_reserve_y,
        type_x,
        type_y,
        fee_bps,
        total_volume_x: 0,
        total_volume_y: 0,
        total_fees_collected: 0,
        total_swaps: 0,
        is_active: true,
    };

    config.set_rule(admin, key, state);

    event::emit(PoolUpdatedEvent {
        storage_unit_id,
        reserve_x: initial_reserve_x,
        reserve_y: initial_reserve_y,
        type_x,
        type_y,
        fee_bps,
    });
}

/// Add liquidity to an existing pool.
public fun add_liquidity(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    add_x: u64,
    add_y: u64,
) {
    let key = PoolKey { storage_unit_id };
    let pool = config.borrow_rule_mut<PoolKey, PoolState>(admin, key);

    pool.reserve_x = pool.reserve_x + add_x;
    pool.reserve_y = pool.reserve_y + add_y;

    event::emit(LiquidityAddedEvent {
        storage_unit_id,
        added_x: add_x,
        added_y: add_y,
        new_reserve_x: pool.reserve_x,
        new_reserve_y: pool.reserve_y,
    });
}

/// Pause the pool.
public fun deactivate_pool(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
) {
    let key = PoolKey { storage_unit_id };
    let pool = config.borrow_rule_mut<PoolKey, PoolState>(admin, key);
    pool.is_active = false;
}

/// Resume the pool.
public fun activate_pool(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
) {
    let key = PoolKey { storage_unit_id };
    let pool = config.borrow_rule_mut<PoolKey, PoolState>(admin, key);
    pool.is_active = true;
}

/// Update the swap fee.
public fun update_fee(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    new_fee_bps: u64,
) {
    assert!(new_fee_bps <= MAX_FEE_BPS, EInvalidFee);
    let key = PoolKey { storage_unit_id };
    let pool = config.borrow_rule_mut<PoolKey, PoolState>(admin, key);
    pool.fee_bps = new_fee_bps;
}

// === Public Functions ===

/// Calculate the output amount for a given input (read-only quote).
/// Returns (output_amount, fee_amount).
public fun quote_swap(
    config: &FenConfig,
    storage_unit_id: ID,
    input_type: u64,
    input_amount: u64,
): (u64, u64) {
    let key = PoolKey { storage_unit_id };
    let pool = config.borrow_rule<PoolKey, PoolState>(key);

    let (reserve_in, reserve_out) = if (input_type == pool.type_x) {
        (pool.reserve_x, pool.reserve_y)
    } else {
        (pool.reserve_y, pool.reserve_x)
    };

    calculate_output(input_amount, reserve_in, reserve_out, pool.fee_bps)
}

/// Execute a swap. Called by the depot extension or directly.
/// Records the trade and updates reserves. Does NOT move items —
/// the calling module handles actual item deposit/withdraw via StorageUnit.
///
/// Returns (output_amount, fee_amount) for the caller to verify.
public fun record_swap(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    trader: address,
    input_type: u64,
    input_amount: u64,
    min_output: u64,
): (u64, u64) {
    let key = PoolKey { storage_unit_id };
    let pool = config.borrow_rule_mut<PoolKey, PoolState>(admin, key);
    assert!(pool.is_active, EPoolInactive);
    assert!(input_amount > 0, EInsufficientInput);

    let (reserve_in, reserve_out, is_x_to_y) = if (input_type == pool.type_x) {
        (pool.reserve_x, pool.reserve_y, true)
    } else {
        (pool.reserve_y, pool.reserve_x, false)
    };

    let (output_amount, fee_amount) = calculate_output(
        input_amount, reserve_in, reserve_out, pool.fee_bps,
    );

    assert!(output_amount >= min_output, ESlippageExceeded);
    assert!(output_amount <= reserve_out, EInsufficientLiquidity);

    // Update reserves
    if (is_x_to_y) {
        pool.reserve_x = pool.reserve_x + input_amount;
        pool.reserve_y = pool.reserve_y - output_amount;
        pool.total_volume_x = pool.total_volume_x + input_amount;
        pool.total_volume_y = pool.total_volume_y + output_amount;
    } else {
        pool.reserve_y = pool.reserve_y + input_amount;
        pool.reserve_x = pool.reserve_x - output_amount;
        pool.total_volume_x = pool.total_volume_x + output_amount;
        pool.total_volume_y = pool.total_volume_y + input_amount;
    };

    pool.total_fees_collected = pool.total_fees_collected + fee_amount;
    pool.total_swaps = pool.total_swaps + 1;

    // Calculate effective price (output per 1000 input units)
    let effective_price_x1000 = if (input_amount > 0) {
        (output_amount * 1000) / input_amount
    } else {
        0
    };

    let output_type = if (is_x_to_y) { pool.type_y } else { pool.type_x };

    event::emit(SwapEvent {
        storage_unit_id,
        trader,
        input_type,
        input_amount,
        output_type,
        output_amount,
        fee_amount,
        new_reserve_x: pool.reserve_x,
        new_reserve_y: pool.reserve_y,
        effective_price_x1000,
    });

    (output_amount, fee_amount)
}

// === View Functions ===

/// Get the pool state.
public fun get_pool(config: &FenConfig, storage_unit_id: ID): &PoolState {
    let key = PoolKey { storage_unit_id };
    config.borrow_rule<PoolKey, PoolState>(key)
}

/// Get current reserves.
public fun reserves(pool: &PoolState): (u64, u64) {
    (pool.reserve_x, pool.reserve_y)
}

/// Get token types.
public fun types(pool: &PoolState): (u64, u64) {
    (pool.type_x, pool.type_y)
}

/// Get the current spot price (Y per X, scaled by 1000 for precision).
public fun spot_price_x1000(pool: &PoolState): u64 {
    if (pool.reserve_x == 0) return 0;
    (pool.reserve_y * 1000) / pool.reserve_x
}

/// Get cumulative stats.
public fun total_volume(pool: &PoolState): (u64, u64) {
    (pool.total_volume_x, pool.total_volume_y)
}

public fun total_swaps(pool: &PoolState): u64 { pool.total_swaps }
public fun total_fees(pool: &PoolState): u64 { pool.total_fees_collected }
public fun pool_fee_bps(pool: &PoolState): u64 { pool.fee_bps }
public fun pool_is_active(pool: &PoolState): bool { pool.is_active }

// === Internal Functions ===

/// Constant-product AMM formula: output = (input * reserve_out) / (reserve_in + input) - fee
fun calculate_output(
    input_amount: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u64,
): (u64, u64) {
    assert!(reserve_in > 0 && reserve_out > 0, EZeroReserve);

    // Apply fee to input first (Uniswap v2 style)
    let input_after_fee = (input_amount * (FEE_DENOMINATOR - fee_bps)) / FEE_DENOMINATOR;

    // Constant product: output = (input_after_fee * reserve_out) / (reserve_in + input_after_fee)
    let numerator = input_after_fee * reserve_out;
    let denominator = reserve_in + input_after_fee;
    let output_amount = numerator / denominator;

    let fee_amount = input_amount - input_after_fee;

    (output_amount, fee_amount)
}
