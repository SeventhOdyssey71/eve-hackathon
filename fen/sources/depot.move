/// FEN Depot Extension
///
/// A storage unit extension that turns an SSU into a trading depot.
/// Depots have a configured trading pair (input item <-> output item)
/// with an exchange ratio and fee. Traders deposit input items and
/// receive output items at the configured rate.
///
/// Flow:
///   1. SSU owner calls `authorize_extension<DepotAuth>` on their storage unit
///   2. SSU owner calls `set_depot_config` to define the trading pair and ratio
///   3. SSU owner stocks the depot with output items
///   4. Trader calls `execute_trade` to swap items at the depot rate
///
/// Addresses issue #44: extension-managed inventory for trustless trading.
#[allow(unused_const)]
module fen::depot;

use world::storage_unit::{Self, StorageUnit};
use world::character::Character;
use world::inventory::Item;

use fen::config::{FenConfig, AdminCap};

// === Errors ===
const EDepotNotConfigured: u64 = 1;
const EDepotInactive: u64 = 2;
const EInvalidQuantity: u64 = 3;
const EInsufficientOutput: u64 = 4;
const EItemTypeMismatch: u64 = 5;

// === Structs ===

/// Typed witness for FEN depot extension.
public struct DepotAuth has drop {}

/// Depot trading pair configuration.
/// Stored as dynamic field on FenConfig, keyed by storage unit ID.
public struct DepotRule has copy, drop, store {
    /// Item type accepted as input
    input_type_id: u64,
    /// Item type dispensed as output
    output_type_id: u64,
    /// Exchange ratio: ratioIn units of input = ratioOut units of output
    ratio_in: u64,
    ratio_out: u64,
    /// Fee in basis points (100 = 1%)
    fee_bps: u64,
    /// Whether this depot is accepting trades
    is_active: bool,
}

/// Dynamic field key for depot config.
public struct DepotConfigKey has copy, drop, store {
    storage_unit_id: ID,
}

// === Constants ===
const FEE_DENOMINATOR: u64 = 10000;

// === Public Functions ===

/// Execute a trade at a depot.
/// Trader deposits `input_item` and receives output item(s) from the depot.
///
/// TODO: This is a scaffold. Full implementation requires:
///   - Calling storage_unit::deposit_item<DepotAuth> for the input
///   - Calling storage_unit::withdraw_item<DepotAuth> for the output
///   - Applying ratio math and fee deductions
///   - Emitting trade events for the indexer
public fun execute_trade(
    config: &FenConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,
    input_item: Item,
    ctx: &mut TxContext,
): Item {
    let su_id = object::id(storage_unit);
    let key = DepotConfigKey { storage_unit_id: su_id };

    // Read depot config
    let depot = config.borrow_rule<DepotConfigKey, DepotRule>(key);
    assert!(depot.is_active, EDepotInactive);

    // Validate input item type matches config
    // TODO: verify input_item.type_id() == depot.input_type_id

    // Calculate output quantity from ratio
    let input_qty = (input_item.quantity() as u64);
    assert!(input_qty > 0, EInvalidQuantity);

    let gross_output = (input_qty * depot.ratio_out) / depot.ratio_in;
    let fee = (gross_output * depot.fee_bps) / FEE_DENOMINATOR;
    let net_output = gross_output - fee;
    assert!(net_output > 0, EInsufficientOutput);

    // Deposit trader's input item into depot inventory
    storage_unit::deposit_item<DepotAuth>(
        storage_unit,
        character,
        input_item,
        DepotAuth {},
        ctx,
    );

    // Withdraw output item from depot inventory for trader
    let output_item = storage_unit::withdraw_item<DepotAuth>(
        storage_unit,
        character,
        DepotAuth {},
        depot.output_type_id,
        ctx,
    );

    // TODO: split output_item to net_output quantity
    // TODO: emit DepotTradeEvent for indexer

    output_item
}

// === Admin Functions ===

/// Configure a depot's trading pair and ratio.
public fun set_depot_config(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    input_type_id: u64,
    output_type_id: u64,
    ratio_in: u64,
    ratio_out: u64,
    fee_bps: u64,
) {
    let key = DepotConfigKey { storage_unit_id };
    let rule = DepotRule {
        input_type_id,
        output_type_id,
        ratio_in,
        ratio_out,
        fee_bps,
        is_active: true,
    };
    config.set_rule(admin, key, rule);
}

/// Pause a depot (stop accepting trades).
public fun deactivate_depot(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.is_active = false;
}

/// Resume a depot.
public fun activate_depot(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.is_active = true;
}

/// Update the exchange ratio.
public fun update_ratio(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    ratio_in: u64,
    ratio_out: u64,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.ratio_in = ratio_in;
    depot.ratio_out = ratio_out;
}

/// Update the fee.
public fun update_fee(
    config: &mut FenConfig,
    admin: &AdminCap,
    storage_unit_id: ID,
    fee_bps: u64,
) {
    let key = DepotConfigKey { storage_unit_id };
    let depot = config.borrow_rule_mut<DepotConfigKey, DepotRule>(admin, key);
    depot.fee_bps = fee_bps;
}

// === View Functions ===

/// Get the depot config for a storage unit.
public fun get_depot_rule(config: &FenConfig, storage_unit_id: ID): &DepotRule {
    let key = DepotConfigKey { storage_unit_id };
    config.borrow_rule<DepotConfigKey, DepotRule>(key)
}
