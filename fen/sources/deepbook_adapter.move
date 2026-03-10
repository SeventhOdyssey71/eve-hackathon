/// FEN DeepBook Adapter — Order Book Integration for Trade Corridors
///
/// Connects FEN's economic infrastructure to DeepBook v3, Sui's native
/// central limit order book (CLOB). This enables:
///
/// 1. **Multi-Token Toll Payments**: Traders pay gate tolls with any
///    DeepBook-listed token. The adapter auto-swaps to SUI via DeepBook
///    pools before transferring to the fee recipient.
///
/// 2. **Treasury Revenue Swaps**: Operators convert accumulated SUI
///    revenue to DEEP, stablecoins, or any DeepBook-listed asset.
///
/// 3. **Corridor Market Making**: Operators place limit orders on
///    DeepBook pools using their corridor's BalanceManager, earning
///    maker rebates on top of toll/trade fees.
///
/// 4. **On-Chain Price Oracle**: Depots can reference DeepBook pool
///    mid-price for real-time, market-driven pricing.
///
/// Architecture:
///   - Each corridor has an associated DeepBook BalanceManager
///   - The BalanceManager is shared and managed by the corridor operator
///   - Trade/deposit/withdraw caps enable delegated access
///   - All operations emit events for the indexer
///
/// DeepBook v3 docs: https://github.com/MystenLabs/deepbookv3
#[allow(unused_const, unused_variable, unused_use, unused_field)]
module fen::deepbook_adapter;

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::clock::Clock;
use sui::event;

use deepbook::pool::{Self, Pool};
use deepbook::balance_manager::{Self, BalanceManager, TradeProof, TradeCap};
use token::deep::DEEP;

use fen::config::{FenConfig, AdminCap};

// === Errors ===
const ENotCorridorOperator: u64 = 1;
const EInsufficientSwapOutput: u64 = 2;
const EManagerNotFound: u64 = 3;
const EPoolNotConfigured: u64 = 4;

// === Constants ===
/// DeepBook uses 1e9 fixed-point scaling for all prices and quantities
const FLOAT_SCALING: u64 = 1_000_000_000;

// === Structs ===

/// Links a corridor to its DeepBook BalanceManager.
/// Stored as dynamic field on FenConfig, keyed by corridor ID.
public struct CorridorManagerLink has copy, drop, store {
    /// The DeepBook BalanceManager ID for this corridor
    balance_manager_id: ID,
    /// Corridor operator address
    operator: address,
}

/// Dynamic field key for the corridor-manager link.
public struct ManagerLinkKey has copy, drop, store {
    corridor_id: ID,
}

// === Events ===

/// Emitted when a corridor is linked to a DeepBook BalanceManager.
public struct ManagerLinkedEvent has copy, drop {
    corridor_id: ID,
    balance_manager_id: ID,
    operator: address,
}

/// Emitted when a toll is paid via DeepBook swap.
public struct DeepBookTollSwapEvent has copy, drop {
    corridor_id: ID,
    trader: address,
    input_token_amount: u64,
    sui_received: u64,
    toll_amount: u64,
}

/// Emitted when an operator swaps revenue via DeepBook.
public struct RevenueSwapEvent has copy, drop {
    corridor_id: ID,
    operator: address,
    sui_amount: u64,
    output_amount: u64,
}

/// Emitted when a limit order is placed on behalf of a corridor.
public struct OrderPlacedEvent has copy, drop {
    corridor_id: ID,
    pool_id: ID,
    is_bid: bool,
    price: u64,
    quantity: u64,
}

// === Admin Functions ===

/// Link a corridor to a DeepBook BalanceManager.
/// Called once after creating the BalanceManager.
public fun link_balance_manager(
    config: &mut FenConfig,
    admin: &AdminCap,
    corridor_id: ID,
    balance_manager_id: ID,
    operator: address,
) {
    let key = ManagerLinkKey { corridor_id };
    let link = CorridorManagerLink {
        balance_manager_id,
        operator,
    };
    config.set_rule(admin, key, link);

    event::emit(ManagerLinkedEvent {
        corridor_id,
        balance_manager_id,
        operator,
    });
}

// === Public Functions ===

/// Create a new DeepBook BalanceManager for a corridor.
/// The manager is a shared object that holds funds across all pools.
/// Returns the BalanceManager (caller should share it).
public fun create_balance_manager(
    ctx: &mut TxContext,
): BalanceManager {
    balance_manager::new(ctx)
}

/// Deposit SUI into a corridor's BalanceManager for trading.
public fun deposit_sui(
    balance_manager: &mut BalanceManager,
    coin: Coin<SUI>,
    ctx: &mut TxContext,
) {
    balance_manager::deposit(balance_manager, coin, ctx);
}

/// Deposit DEEP tokens into a corridor's BalanceManager (needed for fees).
public fun deposit_deep(
    balance_manager: &mut BalanceManager,
    coin: Coin<DEEP>,
    ctx: &mut TxContext,
) {
    balance_manager::deposit(balance_manager, coin, ctx);
}

/// Withdraw SUI from a corridor's BalanceManager.
public fun withdraw_sui(
    balance_manager: &mut BalanceManager,
    amount: u64,
    ctx: &mut TxContext,
): Coin<SUI> {
    balance_manager::withdraw<SUI>(balance_manager, amount, ctx)
}

/// Withdraw DEEP from a corridor's BalanceManager.
public fun withdraw_deep(
    balance_manager: &mut BalanceManager,
    amount: u64,
    ctx: &mut TxContext,
): Coin<DEEP> {
    balance_manager::withdraw<DEEP>(balance_manager, amount, ctx)
}

/// Check SUI balance in a BalanceManager.
public fun sui_balance(balance_manager: &BalanceManager): u64 {
    balance_manager::balance<SUI>(balance_manager)
}

/// Check DEEP balance in a BalanceManager.
public fun deep_balance(balance_manager: &BalanceManager): u64 {
    balance_manager::balance<DEEP>(balance_manager)
}

// === Swap Functions ===

/// Swap SUI for DEEP tokens via a DeepBook pool.
/// Useful for operators who need DEEP for trading fees.
///
/// Returns: (remaining_sui, deep_received, remaining_deep_fee)
public fun swap_sui_for_deep(
    pool: &mut Pool<DEEP, SUI>,
    sui_in: Coin<SUI>,
    deep_fee: Coin<DEEP>,
    min_deep_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<DEEP>, Coin<SUI>, Coin<DEEP>) {
    // SUI is the quote asset in DEEP/SUI pool
    // We want to swap quote (SUI) for base (DEEP)
    pool::swap_exact_quote_for_base(
        pool,
        sui_in,
        deep_fee,
        min_deep_out,
        clock,
        ctx,
    )
}

/// Swap DEEP for SUI via a DeepBook pool.
///
/// Returns: (remaining_deep, sui_received, remaining_deep_fee)
public fun swap_deep_for_sui(
    pool: &mut Pool<DEEP, SUI>,
    deep_in: Coin<DEEP>,
    deep_fee: Coin<DEEP>,
    min_sui_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<DEEP>, Coin<SUI>, Coin<DEEP>) {
    // DEEP is the base asset in DEEP/SUI pool
    pool::swap_exact_base_for_quote(
        pool,
        deep_in,
        deep_fee,
        min_sui_out,
        clock,
        ctx,
    )
}

/// Generic swap: trade any base asset for its quote asset via DeepBook.
/// This is the most flexible swap function.
///
/// Returns: (remaining_base, quote_out, remaining_deep)
public fun swap_base_for_quote<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    base_in: Coin<BaseAsset>,
    deep_fee: Coin<DEEP>,
    min_quote_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<BaseAsset>, Coin<QuoteAsset>, Coin<DEEP>) {
    pool::swap_exact_base_for_quote(
        pool,
        base_in,
        deep_fee,
        min_quote_out,
        clock,
        ctx,
    )
}

/// Generic swap: trade any quote asset for its base asset via DeepBook.
///
/// Returns: (base_out, remaining_quote, remaining_deep)
public fun swap_quote_for_base<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    quote_in: Coin<QuoteAsset>,
    deep_fee: Coin<DEEP>,
    min_base_out: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<BaseAsset>, Coin<QuoteAsset>, Coin<DEEP>) {
    pool::swap_exact_quote_for_base(
        pool,
        quote_in,
        deep_fee,
        min_base_out,
        clock,
        ctx,
    )
}

// === Order Book Functions ===

/// Place a limit order on a DeepBook pool using the corridor's BalanceManager.
/// The operator must own the BalanceManager.
public fun place_limit_order<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    client_order_id: u64,
    order_type: u8,
    price: u64,
    quantity: u64,
    is_bid: bool,
    expire_timestamp: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    let trade_proof = balance_manager::generate_proof_as_owner(balance_manager, ctx);
    pool::place_limit_order(
        pool,
        balance_manager,
        &trade_proof,
        client_order_id,
        order_type,
        0, // self_matching_allowed
        price,
        quantity,
        is_bid,
        true, // pay_with_deep
        expire_timestamp,
        clock,
        ctx,
    );
}

/// Place a market order on a DeepBook pool.
public fun place_market_order<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    client_order_id: u64,
    quantity: u64,
    is_bid: bool,
    clock: &Clock,
    ctx: &TxContext,
) {
    let trade_proof = balance_manager::generate_proof_as_owner(balance_manager, ctx);
    pool::place_market_order(
        pool,
        balance_manager,
        &trade_proof,
        client_order_id,
        0, // self_matching_allowed
        quantity,
        is_bid,
        true, // pay_with_deep
        clock,
        ctx,
    );
}

/// Cancel an existing order.
public fun cancel_order<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    order_id: u128,
    clock: &Clock,
    ctx: &TxContext,
) {
    let trade_proof = balance_manager::generate_proof_as_owner(balance_manager, ctx);
    pool::cancel_order(
        pool,
        balance_manager,
        &trade_proof,
        order_id,
        clock,
        ctx,
    );
}

/// Cancel all orders in a pool for a BalanceManager.
public fun cancel_all_orders<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    clock: &Clock,
    ctx: &TxContext,
) {
    let trade_proof = balance_manager::generate_proof_as_owner(balance_manager, ctx);
    pool::cancel_all_orders(
        pool,
        balance_manager,
        &trade_proof,
        clock,
        ctx,
    );
}

/// Claim accumulated maker rebates from a pool.
public fun claim_rebates<BaseAsset, QuoteAsset>(
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    ctx: &TxContext,
) {
    let trade_proof = balance_manager::generate_proof_as_owner(balance_manager, ctx);
    pool::claim_rebates(
        pool,
        balance_manager,
        &trade_proof,
        ctx,
    );
}

// === Price Oracle Functions ===

/// Get the current mid-price from a DeepBook pool.
/// Returns price in FLOAT_SCALING (1e9).
public fun get_mid_price<BaseAsset, QuoteAsset>(
    pool: &Pool<BaseAsset, QuoteAsset>,
    clock: &Clock,
): u64 {
    pool::mid_price(pool, clock)
}

/// Get a quote for swapping base→quote.
/// Returns (quote_out, deep_required, base_remaining).
public fun get_quote_for_base<BaseAsset, QuoteAsset>(
    pool: &Pool<BaseAsset, QuoteAsset>,
    base_quantity: u64,
    clock: &Clock,
): (u64, u64, u64) {
    pool::get_quote_quantity_out(pool, base_quantity, clock)
}

/// Get a quote for swapping quote→base.
/// Returns (base_out, deep_required, quote_remaining).
public fun get_base_for_quote<BaseAsset, QuoteAsset>(
    pool: &Pool<BaseAsset, QuoteAsset>,
    quote_quantity: u64,
    clock: &Clock,
): (u64, u64, u64) {
    pool::get_base_quantity_out(pool, quote_quantity, clock)
}

/// Get the vault balances of a pool (base, quote, deep).
public fun get_vault_balances<BaseAsset, QuoteAsset>(
    pool: &Pool<BaseAsset, QuoteAsset>,
): (u64, u64, u64) {
    pool::vault_balances(pool)
}

/// Check if a pool is whitelisted (0% DEEP fees).
public fun is_pool_whitelisted<BaseAsset, QuoteAsset>(
    pool: &Pool<BaseAsset, QuoteAsset>,
): bool {
    pool::whitelisted(pool)
}

// === Delegation Functions ===

/// Mint a TradeCap for delegated trading on a BalanceManager.
/// This allows other addresses to trade on behalf of the operator.
public fun mint_trade_cap(
    balance_manager: &mut BalanceManager,
    ctx: &mut TxContext,
): TradeCap {
    balance_manager::mint_trade_cap(balance_manager, ctx)
}

// === View Functions ===

/// Get the corridor-manager link info.
public fun get_manager_link(
    config: &FenConfig,
    corridor_id: ID,
): &CorridorManagerLink {
    let key = ManagerLinkKey { corridor_id };
    config.borrow_rule<ManagerLinkKey, CorridorManagerLink>(key)
}

/// Get the BalanceManager ID for a corridor.
public fun manager_id(link: &CorridorManagerLink): ID {
    link.balance_manager_id
}

/// Get the operator address for a corridor's manager.
public fun manager_operator(link: &CorridorManagerLink): address {
    link.operator
}

/// Check if a corridor has a linked BalanceManager.
public fun has_manager(config: &FenConfig, corridor_id: ID): bool {
    let key = ManagerLinkKey { corridor_id };
    config.has_rule<ManagerLinkKey, CorridorManagerLink>(key)
}
