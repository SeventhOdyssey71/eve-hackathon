/// Frontier Exchange Network — AMM Liquidity Pool
///
/// The first on-chain DEX for EVE Frontier items. Each pool trades a single
/// item type against SUI using constant-product pricing (x * y = k).
///
/// Pool reserves: actual SUI held in a `Balance<SUI>` + virtual item count
/// tracking items stocked in the linked StorageUnit.
///
/// Selling items (Items → SUI) works cleanly: items go into SSU, exact SUI
/// is split from the pool balance and transferred to the trader.
///
/// Buying items (SUI → Items) requires the SSU to hold sufficient stock.
/// The operator is responsible for keeping the SSU stocked.
///
/// Uses the same dynamic field pattern as TollConfig and DepotConfig:
/// PoolConfig is stored as a DF on the Corridor, keyed by storage_unit_id.
#[allow(lint(self_transfer))]
module fen::liquidity_pool;

use sui::{
    balance::{Self, Balance},
    clock::Clock,
    coin::{Self, Coin},
    event,
    sui::SUI,
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
const EPoolNotActive: vector<u8> = b"Pool is not active";
#[error(code = 3)]
const EDepotMismatch: vector<u8> = b"Storage unit is not a depot in this corridor";
#[error(code = 4)]
const EPoolAlreadyExists: vector<u8> = b"Pool already exists for this storage unit";
#[error(code = 5)]
const EPoolNotConfigured: vector<u8> = b"Pool not configured for this storage unit";
#[error(code = 6)]
const EItemTypeMismatch: vector<u8> = b"Item type does not match pool";
#[error(code = 7)]
const ESlippageExceeded: vector<u8> = b"Output below minimum (slippage protection)";
#[error(code = 8)]
const EZeroAmount: vector<u8> = b"Amount must be greater than zero";
#[error(code = 9)]
const EInsufficientReserves: vector<u8> = b"Insufficient reserves for this trade";
#[error(code = 10)]
const EInsufficientPoolBalance: vector<u8> = b"Insufficient SUI in pool for withdrawal";
#[error(code = 11)]
const EFeeTooHigh: vector<u8> = b"Fee cannot exceed 100%";

// === Constants ===
const FEE_DENOMINATOR: u64 = 10000;
const MAX_FEE_BPS: u64 = 5000; // 50% max fee

// === Swap Direction ===
const DIRECTION_BUY: u8 = 0;  // SUI → Items
const DIRECTION_SELL: u8 = 1; // Items → SUI

// === Dynamic Field Key ===
public struct PoolConfigKey has copy, drop, store {
    storage_unit_id: ID,
}

// === Pool State ===
public struct PoolConfig has store {
    item_type_id: u64,
    reserve_sui: Balance<SUI>,
    reserve_items: u64,
    fee_bps: u64,
    is_active: bool,
    total_swaps: u64,
    total_sui_volume: u64,
    total_item_volume: u64,
    total_fees_collected: u64,
}

// === Events ===
public struct PoolCreatedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
    item_type_id: u64,
    initial_sui: u64,
    initial_items: u64,
    fee_bps: u64,
}

public struct PoolActivatedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
}

public struct PoolDeactivatedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
}

public struct SwapEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
    direction: u8,
    sui_amount: u64,
    item_quantity: u64,
    fee_collected: u64,
    new_reserve_sui: u64,
    new_reserve_items: u64,
    trader: address,
}

public struct LiquidityChangedEvent has copy, drop {
    corridor_id: ID,
    storage_unit_id: ID,
    sui_delta: u64,
    items_delta: u64,
    is_add: bool,
    new_reserve_sui: u64,
    new_reserve_items: u64,
}

// === Admin Functions ===

/// Create a new AMM pool for a storage unit in this corridor.
/// The operator deposits initial SUI liquidity and declares the initial item reserve
/// (they must stock the SSU with matching items separately).
public fun create_pool(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
    item_type_id: u64,
    fee_bps: u64,
    initial_sui: Coin<SUI>,
    initial_items: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    assert!(
        storage_unit_id == corridor::depot_a_id(corridor) ||
        storage_unit_id == corridor::depot_b_id(corridor),
        EDepotMismatch,
    );
    assert!(fee_bps <= MAX_FEE_BPS, EFeeTooHigh);

    let key = PoolConfigKey { storage_unit_id };
    assert!(!corridor::has_df<PoolConfigKey>(corridor, key), EPoolAlreadyExists);

    let sui_amount = coin::value(&initial_sui);
    assert!(sui_amount > 0 && initial_items > 0, EZeroAmount);

    let config = PoolConfig {
        item_type_id,
        reserve_sui: coin::into_balance(initial_sui),
        reserve_items: initial_items,
        fee_bps,
        is_active: false,
        total_swaps: 0,
        total_sui_volume: 0,
        total_item_volume: 0,
        total_fees_collected: 0,
    };

    corridor::add_df(corridor, key, config);

    event::emit(PoolCreatedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id,
        item_type_id,
        initial_sui: sui_amount,
        initial_items,
        fee_bps,
    });
}

/// Activate the pool for trading.
public fun activate_pool(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    let key = PoolConfigKey { storage_unit_id };
    assert!(corridor::has_df<PoolConfigKey>(corridor, key), EPoolNotConfigured);
    let config: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    config.is_active = true;

    event::emit(PoolActivatedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id,
    });
}

/// Deactivate the pool.
public fun deactivate_pool(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    let key = PoolConfigKey { storage_unit_id };
    assert!(corridor::has_df<PoolConfigKey>(corridor, key), EPoolNotConfigured);
    let config: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    config.is_active = false;

    event::emit(PoolDeactivatedEvent {
        corridor_id: object::id(corridor),
        storage_unit_id,
    });
}

/// Add SUI and/or item liquidity to the pool.
public fun add_liquidity(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
    sui: Coin<SUI>,
    additional_items: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    let key = PoolConfigKey { storage_unit_id };
    assert!(corridor::has_df<PoolConfigKey>(corridor, key), EPoolNotConfigured);

    let corridor_id = object::id(corridor);
    let sui_amount = coin::value(&sui);
    let config: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);

    if (sui_amount > 0) {
        balance::join(&mut config.reserve_sui, coin::into_balance(sui));
    } else {
        coin::destroy_zero(sui);
    };

    config.reserve_items = config.reserve_items + additional_items;
    let new_reserve_sui = balance::value(&config.reserve_sui);
    let new_reserve_items = config.reserve_items;

    event::emit(LiquidityChangedEvent {
        corridor_id,
        storage_unit_id,
        sui_delta: sui_amount,
        items_delta: additional_items,
        is_add: true,
        new_reserve_sui,
        new_reserve_items,
    });
}

/// Remove SUI liquidity from the pool. Returns SUI to the owner.
/// Item reserves are decreased virtually (operator withdraws items from SSU separately).
public fun remove_liquidity(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
    sui_amount: u64,
    items_to_remove: u64,
    ctx: &mut TxContext,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);
    let key = PoolConfigKey { storage_unit_id };
    assert!(corridor::has_df<PoolConfigKey>(corridor, key), EPoolNotConfigured);

    let corridor_id = object::id(corridor);
    let config: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    assert!(balance::value(&config.reserve_sui) >= sui_amount, EInsufficientPoolBalance);
    assert!(config.reserve_items >= items_to_remove, EInsufficientReserves);

    config.reserve_items = config.reserve_items - items_to_remove;

    if (sui_amount > 0) {
        let sui_out = coin::from_balance(balance::split(&mut config.reserve_sui, sui_amount), ctx);
        transfer::public_transfer(sui_out, ctx.sender());
    };

    let new_reserve_sui = balance::value(&config.reserve_sui);
    let new_reserve_items = config.reserve_items;

    event::emit(LiquidityChangedEvent {
        corridor_id,
        storage_unit_id,
        sui_delta: sui_amount,
        items_delta: items_to_remove,
        is_add: false,
        new_reserve_sui,
        new_reserve_items,
    });
}

// === Trader Functions ===

/// Sell items for SUI. Deposits items into the SSU and receives SUI from the pool.
/// This is the cleanest swap direction: exact SUI is split from pool balance.
public fun sell_items(
    corridor: &mut Corridor,
    storage_unit: &mut StorageUnit,
    character: &Character,
    input_item: Item,
    min_sui_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(corridor::is_active(corridor), ECorridorNotActive);

    let su_id = object::id(storage_unit);
    assert!(
        su_id == corridor::depot_a_id(corridor) || su_id == corridor::depot_b_id(corridor),
        EDepotMismatch,
    );

    let key = PoolConfigKey { storage_unit_id: su_id };
    assert!(corridor::has_df<PoolConfigKey>(corridor, key), EPoolNotConfigured);

    // Read pool config
    let config: &PoolConfig = corridor::borrow_df(corridor, key);
    assert!(config.is_active, EPoolNotActive);
    assert!(input_item.type_id() == config.item_type_id, EItemTypeMismatch);

    let item_qty = (input_item.quantity() as u64);
    assert!(item_qty > 0, EZeroAmount);

    let r_sui = balance::value(&config.reserve_sui);
    let r_items = config.reserve_items;
    let fee_bps = config.fee_bps;

    // Calculate output
    let (sui_out, fee) = compute_output(r_items, r_sui, item_qty, fee_bps);
    assert!(sui_out >= min_sui_out, ESlippageExceeded);
    assert!(sui_out <= r_sui, EInsufficientReserves);

    // Deposit items into SSU
    storage_unit.deposit_item<toll_gate::FenAuth>(
        character,
        input_item,
        toll_gate::fen_auth(),
        ctx,
    );

    // Update pool state
    let config_mut: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    config_mut.reserve_items = config_mut.reserve_items + item_qty;
    let sui_coin = coin::from_balance(
        balance::split(&mut config_mut.reserve_sui, sui_out),
        ctx,
    );
    config_mut.total_swaps = config_mut.total_swaps + 1;
    config_mut.total_sui_volume = config_mut.total_sui_volume + sui_out;
    config_mut.total_item_volume = config_mut.total_item_volume + item_qty;
    config_mut.total_fees_collected = config_mut.total_fees_collected + fee;

    // Send SUI to trader
    transfer::public_transfer(sui_coin, ctx.sender());

    // Record on corridor
    corridor::record_trade(corridor, fee, clock);

    event::emit(SwapEvent {
        corridor_id: object::id(corridor),
        storage_unit_id: su_id,
        direction: DIRECTION_SELL,
        sui_amount: sui_out,
        item_quantity: item_qty,
        fee_collected: fee,
        new_reserve_sui: balance::value(
            &corridor::borrow_df<PoolConfigKey, PoolConfig>(corridor, key).reserve_sui
        ),
        new_reserve_items: corridor::borrow_df<PoolConfigKey, PoolConfig>(corridor, key).reserve_items,
        trader: ctx.sender(),
    });
}

/// Buy items with SUI. Pays SUI into the pool and receives items from the SSU.
/// Note: withdraws the entire item stack from the SSU (world-contracts constraint).
/// Operator should stock SSU with appropriate item quantities.
public fun buy_items(
    corridor: &mut Corridor,
    storage_unit: &mut StorageUnit,
    character: &Character,
    payment: Coin<SUI>,
    min_items_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(corridor::is_active(corridor), ECorridorNotActive);

    let su_id = object::id(storage_unit);
    assert!(
        su_id == corridor::depot_a_id(corridor) || su_id == corridor::depot_b_id(corridor),
        EDepotMismatch,
    );

    let key = PoolConfigKey { storage_unit_id: su_id };
    assert!(corridor::has_df<PoolConfigKey>(corridor, key), EPoolNotConfigured);

    let config: &PoolConfig = corridor::borrow_df(corridor, key);
    assert!(config.is_active, EPoolNotActive);

    let sui_in = coin::value(&payment);
    assert!(sui_in > 0, EZeroAmount);

    let r_sui = balance::value(&config.reserve_sui);
    let r_items = config.reserve_items;
    let fee_bps = config.fee_bps;
    let item_type = config.item_type_id;

    // Calculate output
    let (items_out, fee) = compute_output(r_sui, r_items, sui_in, fee_bps);
    assert!(items_out >= min_items_out, ESlippageExceeded);
    assert!(items_out < r_items, EInsufficientReserves);

    // Take SUI payment into pool
    let config_mut: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    balance::join(&mut config_mut.reserve_sui, coin::into_balance(payment));
    config_mut.reserve_items = config_mut.reserve_items - items_out;
    config_mut.total_swaps = config_mut.total_swaps + 1;
    config_mut.total_sui_volume = config_mut.total_sui_volume + sui_in;
    config_mut.total_item_volume = config_mut.total_item_volume + items_out;
    config_mut.total_fees_collected = config_mut.total_fees_collected + fee;

    // Withdraw items from SSU and send to trader (quantity matches AMM output)
    let output_item = storage_unit.withdraw_item<toll_gate::FenAuth>(
        character,
        toll_gate::fen_auth(),
        item_type,
        (items_out as u32),
        ctx,
    );
    transfer::public_transfer(output_item, ctx.sender());

    // Record on corridor
    corridor::record_trade(corridor, fee, clock);

    event::emit(SwapEvent {
        corridor_id: object::id(corridor),
        storage_unit_id: su_id,
        direction: DIRECTION_BUY,
        sui_amount: sui_in,
        item_quantity: items_out,
        fee_collected: fee,
        new_reserve_sui: balance::value(
            &corridor::borrow_df<PoolConfigKey, PoolConfig>(corridor, key).reserve_sui
        ),
        new_reserve_items: corridor::borrow_df<PoolConfigKey, PoolConfig>(corridor, key).reserve_items,
        trader: ctx.sender(),
    });
}

// === Pure Math (public for testing and view functions) ===

/// Constant-product AMM output calculation.
/// Given reserves (reserve_in, reserve_out) and an input amount,
/// returns (output_amount, fee_amount).
///
/// Formula: output = (amount_in_after_fee * reserve_out) / (reserve_in + amount_in_after_fee)
/// Where:  amount_in_after_fee = amount_in * (FEE_DENOMINATOR - fee_bps) / FEE_DENOMINATOR
///
/// Uses u128 intermediates to prevent overflow.
public fun compute_output(
    reserve_in: u64,
    reserve_out: u64,
    amount_in: u64,
    fee_bps: u64,
): (u64, u64) {
    assert!(reserve_in > 0 && reserve_out > 0, EInsufficientReserves);
    assert!(amount_in > 0, EZeroAmount);

    let amount_in_128 = (amount_in as u128);
    let reserve_in_128 = (reserve_in as u128);
    let reserve_out_128 = (reserve_out as u128);
    let fee_factor = ((FEE_DENOMINATOR - fee_bps) as u128);
    let denom = (FEE_DENOMINATOR as u128);

    // Amount after fee deduction
    let amount_in_after_fee = (amount_in_128 * fee_factor) / denom;

    // Constant product formula
    let numerator = amount_in_after_fee * reserve_out_128;
    let denominator = reserve_in_128 + amount_in_after_fee;

    let output = (numerator / denominator as u64);
    let fee = ((amount_in_128 * (fee_bps as u128) / denom) as u64);

    (output, fee)
}

/// Calculate the spot price: how much SUI one item is worth at current reserves.
/// Returns price in MIST (1 SUI = 1_000_000_000 MIST).
public fun spot_price_sui_per_item(reserve_sui: u64, reserve_items: u64): u64 {
    if (reserve_items == 0) return 0;
    ((reserve_sui as u128) * 1_000_000_000 / (reserve_items as u128) as u64)
}

/// Calculate price impact for a given trade size (in basis points).
/// Returns the percentage difference between spot price and execution price.
public fun price_impact_bps(
    reserve_in: u64,
    reserve_out: u64,
    amount_in: u64,
    fee_bps: u64,
): u64 {
    if (reserve_in == 0 || reserve_out == 0 || amount_in == 0) return 0;

    // Spot price: reserve_out / reserve_in (scaled by 1e9)
    let spot = (reserve_out as u128) * 1_000_000_000 / (reserve_in as u128);

    // Execution price: output / input (scaled by 1e9)
    let (output, _) = compute_output(reserve_in, reserve_out, amount_in, fee_bps);
    if (output == 0) return 10000; // 100% impact

    let exec = (output as u128) * 1_000_000_000 / (amount_in as u128);

    // Impact = (spot - exec) / spot * 10000
    if (exec >= spot) return 0;
    let diff = spot - exec;
    ((diff * 10000 / spot) as u64)
}

// === View Functions ===

public fun pool_exists(corridor: &Corridor, storage_unit_id: ID): bool {
    corridor::has_df<PoolConfigKey>(corridor, PoolConfigKey { storage_unit_id })
}

public fun is_pool_active(corridor: &Corridor, storage_unit_id: ID): bool {
    let key = PoolConfigKey { storage_unit_id };
    if (!corridor::has_df<PoolConfigKey>(corridor, key)) return false;
    let config: &PoolConfig = corridor::borrow_df(corridor, key);
    config.is_active
}

public fun get_reserves(corridor: &Corridor, storage_unit_id: ID): (u64, u64) {
    let config: &PoolConfig = corridor::borrow_df(
        corridor,
        PoolConfigKey { storage_unit_id },
    );
    (balance::value(&config.reserve_sui), config.reserve_items)
}

public fun get_pool_fee(corridor: &Corridor, storage_unit_id: ID): u64 {
    let config: &PoolConfig = corridor::borrow_df(
        corridor,
        PoolConfigKey { storage_unit_id },
    );
    config.fee_bps
}

public fun get_pool_stats(corridor: &Corridor, storage_unit_id: ID): (u64, u64, u64, u64) {
    let config: &PoolConfig = corridor::borrow_df(
        corridor,
        PoolConfigKey { storage_unit_id },
    );
    (config.total_swaps, config.total_sui_volume, config.total_item_volume, config.total_fees_collected)
}

public fun get_pool_item_type(corridor: &Corridor, storage_unit_id: ID): u64 {
    let config: &PoolConfig = corridor::borrow_df(
        corridor,
        PoolConfigKey { storage_unit_id },
    );
    config.item_type_id
}

// === Test Helpers ===

#[test_only]
/// Create a PoolConfig directly for testing the AMM math without needing
/// StorageUnit or Character objects.
public fun create_test_pool(
    corridor: &mut Corridor,
    owner_cap: &CorridorOwnerCap,
    storage_unit_id: ID,
    item_type_id: u64,
    fee_bps: u64,
    initial_sui: Balance<SUI>,
    initial_items: u64,
) {
    assert!(corridor::corridor_id(owner_cap) == object::id(corridor), ENotOwner);

    let key = PoolConfigKey { storage_unit_id };
    let config = PoolConfig {
        item_type_id,
        reserve_sui: initial_sui,
        reserve_items: initial_items,
        fee_bps,
        is_active: true,
        total_swaps: 0,
        total_sui_volume: 0,
        total_item_volume: 0,
        total_fees_collected: 0,
    };
    corridor::add_df(corridor, key, config);
}

#[test_only]
/// Simulate a sell (items → SUI) without actual SSU interaction.
/// Returns the SUI output as a Balance for test verification.
public fun test_sell(
    corridor: &mut Corridor,
    storage_unit_id: ID,
    item_quantity: u64,
    min_sui_out: u64,
    ctx: &mut TxContext,
): Coin<SUI> {
    let key = PoolConfigKey { storage_unit_id };
    let config: &PoolConfig = corridor::borrow_df(corridor, key);

    let r_sui = balance::value(&config.reserve_sui);
    let r_items = config.reserve_items;
    let fee_bps = config.fee_bps;

    let (sui_out, fee) = compute_output(r_items, r_sui, item_quantity, fee_bps);
    assert!(sui_out >= min_sui_out, ESlippageExceeded);
    assert!(sui_out <= r_sui, EInsufficientReserves);

    let config_mut: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    config_mut.reserve_items = config_mut.reserve_items + item_quantity;
    let sui_balance = balance::split(&mut config_mut.reserve_sui, sui_out);
    config_mut.total_swaps = config_mut.total_swaps + 1;
    config_mut.total_fees_collected = config_mut.total_fees_collected + fee;

    coin::from_balance(sui_balance, ctx)
}

#[test_only]
/// Simulate a buy (SUI → items) without actual SSU interaction.
/// Consumes the SUI coin and returns the number of items bought.
public fun test_buy(
    corridor: &mut Corridor,
    storage_unit_id: ID,
    payment: Coin<SUI>,
    min_items_out: u64,
): u64 {
    let key = PoolConfigKey { storage_unit_id };
    let config: &PoolConfig = corridor::borrow_df(corridor, key);

    let sui_in = coin::value(&payment);
    let r_sui = balance::value(&config.reserve_sui);
    let r_items = config.reserve_items;
    let fee_bps = config.fee_bps;

    let (items_out, fee) = compute_output(r_sui, r_items, sui_in, fee_bps);
    assert!(items_out >= min_items_out, ESlippageExceeded);
    assert!(items_out < r_items, EInsufficientReserves);

    let config_mut: &mut PoolConfig = corridor::borrow_df_mut(corridor, key);
    balance::join(&mut config_mut.reserve_sui, coin::into_balance(payment));
    config_mut.reserve_items = config_mut.reserve_items - items_out;
    config_mut.total_swaps = config_mut.total_swaps + 1;
    config_mut.total_fees_collected = config_mut.total_fees_collected + fee;

    items_out
}
