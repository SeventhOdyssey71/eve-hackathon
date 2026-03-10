#[test_only]
module fen::liquidity_pool_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use sui::coin;
use sui::balance;
use sui::sui::SUI;
use fen::corridor::{Self, CorridorRegistry, Corridor, CorridorOwnerCap};
use fen::liquidity_pool;

const OWNER: address = @0xA;
const TRADER: address = @0xB;

// Depot IDs used in all tests (must match corridor registration)
const DEPOT_A_ADDR: address = @0x3;
const DEPOT_B_ADDR: address = @0x4;
const ITEM_TYPE: u64 = 1001;

fun setup_corridor(scenario: &mut ts::Scenario) {
    scenario.next_tx(OWNER);
    {
        corridor::init_for_testing(scenario.ctx());
    };

    scenario.next_tx(OWNER);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clk = clock::create_for_testing(scenario.ctx());

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(@0x1),
            object::id_from_address(@0x2),
            object::id_from_address(DEPOT_A_ADDR),
            object::id_from_address(DEPOT_B_ADDR),
            OWNER,
            b"AMM Test Corridor",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    // Activate the corridor
    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };
}

// ===== Pool Creation Tests =====

#[test]
fun test_create_pool() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx()); // 1 SUI

        liquidity_pool::create_pool(
            &mut corridor,
            &owner_cap,
            su_id,
            ITEM_TYPE,
            30, // 0.3% fee
            initial_sui,
            100, // 100 items
        );

        // Verify pool exists and state
        assert!(liquidity_pool::pool_exists(&corridor, su_id));
        assert!(!liquidity_pool::is_pool_active(&corridor, su_id)); // starts inactive
        assert!(liquidity_pool::get_pool_fee(&corridor, su_id) == 30);
        assert!(liquidity_pool::get_pool_item_type(&corridor, su_id) == ITEM_TYPE);

        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_sui == 1_000_000_000);
        assert!(r_items == 100);

        let (swaps, vol_sui, vol_items, fees) = liquidity_pool::get_pool_stats(&corridor, su_id);
        assert!(swaps == 0);
        assert!(vol_sui == 0);
        assert!(vol_items == 0);
        assert!(fees == 0);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_create_pool_on_depot_b() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_B_ADDR);

        let initial_sui = coin::mint_for_testing<SUI>(500_000_000, scenario.ctx());

        liquidity_pool::create_pool(
            &mut corridor,
            &owner_cap,
            su_id,
            2002,
            100, // 1% fee
            initial_sui,
            50,
        );

        assert!(liquidity_pool::pool_exists(&corridor, su_id));
        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_sui == 500_000_000);
        assert!(r_items == 50);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::EDepotMismatch)]
fun test_create_pool_wrong_depot_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let wrong_id = object::id_from_address(@0xDEAD);

        let initial_sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());

        liquidity_pool::create_pool(
            &mut corridor,
            &owner_cap,
            wrong_id,
            ITEM_TYPE,
            30,
            initial_sui,
            100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::EFeeTooHigh)]
fun test_create_pool_fee_too_high_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());

        liquidity_pool::create_pool(
            &mut corridor,
            &owner_cap,
            su_id,
            ITEM_TYPE,
            5001, // > 50% max
            initial_sui,
            100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::EPoolAlreadyExists)]
fun test_create_pool_duplicate_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui1 = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui1, 100);

        // Try creating again — should fail
        let sui2 = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui2, 100);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== Pool Activation Tests =====

#[test]
fun test_activate_deactivate_pool() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui, 100);

        assert!(!liquidity_pool::is_pool_active(&corridor, su_id));

        liquidity_pool::activate_pool(&mut corridor, &owner_cap, su_id);
        assert!(liquidity_pool::is_pool_active(&corridor, su_id));

        liquidity_pool::deactivate_pool(&mut corridor, &owner_cap, su_id);
        assert!(!liquidity_pool::is_pool_active(&corridor, su_id));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== AMM Math Tests (using compute_output directly) =====

#[test]
fun test_compute_output_basic() {
    // Pool: 1000 SUI reserve, 100 items
    // Sell 10 items (items → SUI): reserve_in=100, reserve_out=1000, amount=10, fee=0
    let (output, fee) = liquidity_pool::compute_output(100, 1000, 10, 0);
    // output = (10 * 1000) / (100 + 10) = 10000 / 110 = 90
    assert!(output == 90);
    assert!(fee == 0);
}

#[test]
fun test_compute_output_with_fee() {
    // Pool: 1000 SUI, 100 items
    // Sell 10 items, 3% fee (300 bps)
    let (output, fee) = liquidity_pool::compute_output(100, 1000, 10, 300);
    // amount_after_fee = 10 * 9700 / 10000 = 9 (integer division)
    // output = (9 * 1000) / (100 + 9) = 9000 / 109 = 82
    // fee = 10 * 300 / 10000 = 0
    assert!(output == 82);
    assert!(fee == 0);
}

#[test]
fun test_compute_output_with_larger_fee() {
    // Pool: 10_000_000 SUI, 1000 items
    // Sell 100 items, 3% fee (300 bps)
    let (output, fee) = liquidity_pool::compute_output(1000, 10_000_000, 100, 300);
    // amount_after_fee = 100 * 9700 / 10000 = 97
    // output = (97 * 10_000_000) / (1000 + 97) = 970_000_000 / 1097 = 884_229
    // fee = 100 * 300 / 10000 = 3
    assert!(output == 884_229);
    assert!(fee == 3);
}

#[test]
fun test_compute_output_symmetry() {
    // After a round trip, you should get less than you started with (fees + slippage)
    // Start: sell 10 items for SUI
    let (sui_out, _) = liquidity_pool::compute_output(100, 1000, 10, 0);
    // Now buy items with that SUI: reserve_in=1000-90=910, reserve_out=100+10=110
    let (items_back, _) = liquidity_pool::compute_output(910, 110, sui_out, 0);
    // Should get fewer items back due to price impact
    assert!(items_back < 10);
}

#[test]
fun test_compute_output_large_trade_high_impact() {
    // Selling half the item reserve should have massive impact
    let (output, _) = liquidity_pool::compute_output(100, 1000, 50, 0);
    // output = (50 * 1000) / (100 + 50) = 50000 / 150 = 333
    assert!(output == 333);
    // Spot price would give 500 SUI, but we only get 333 — 33% impact
}

#[test]
fun test_compute_output_small_trade_low_impact() {
    // Selling 1 item from large pool should have minimal impact
    let (output, _) = liquidity_pool::compute_output(10000, 10_000_000_000, 1, 0);
    // output = (1 * 10B) / (10000 + 1) = 10B / 10001 = 999_900
    // Spot price: 10B / 10000 = 1_000_000
    assert!(output == 999_900);
}

#[test, expected_failure(abort_code = liquidity_pool::EInsufficientReserves)]
fun test_compute_output_zero_reserves_fails() {
    liquidity_pool::compute_output(0, 1000, 10, 0);
}

#[test, expected_failure(abort_code = liquidity_pool::EZeroAmount)]
fun test_compute_output_zero_amount_fails() {
    liquidity_pool::compute_output(100, 1000, 0, 0);
}

#[test]
fun test_compute_output_max_fee() {
    // 50% fee (max allowed)
    let (output, fee) = liquidity_pool::compute_output(1000, 10_000_000, 100, 5000);
    // amount_after_fee = 100 * 5000 / 10000 = 50
    // output = (50 * 10_000_000) / (1000 + 50) = 500_000_000 / 1050 = 476_190
    // fee = 100 * 5000 / 10000 = 50
    assert!(output == 476_190);
    assert!(fee == 50);
}

// ===== Spot Price Tests =====

#[test]
fun test_spot_price_basic() {
    // 1 SUI per item (1_000_000_000 MIST / item)
    let price = liquidity_pool::spot_price_sui_per_item(1_000_000_000, 1);
    assert!(price == 1_000_000_000_000_000_000); // 1e18 (1 SUI * 1e9 scaling)
}

#[test]
fun test_spot_price_fractional() {
    // 10 SUI for 100 items = 0.1 SUI per item
    let price = liquidity_pool::spot_price_sui_per_item(10_000_000_000, 100);
    // (10e9 * 1e9) / 100 = 1e17
    assert!(price == 100_000_000_000_000_000);
}

#[test]
fun test_spot_price_zero_items() {
    let price = liquidity_pool::spot_price_sui_per_item(1_000_000_000, 0);
    assert!(price == 0);
}

// ===== Price Impact Tests =====

#[test]
fun test_price_impact_small_trade() {
    // Small trade should have low impact
    let impact = liquidity_pool::price_impact_bps(10000, 10_000_000, 1, 0);
    // With integer math: spot=1e12, exec=999e9, impact = 10 bps
    assert!(impact == 10);
}

#[test]
fun test_price_impact_large_trade() {
    // Large trade: 50% of reserve
    let impact = liquidity_pool::price_impact_bps(100, 1000, 50, 0);
    // Spot: 10 per unit, Exec: 333/50 = 6.66 per unit
    // Impact = (10 - 6.66) / 10 = 33.4% ≈ 3340 bps
    assert!(impact > 3000);
    assert!(impact < 3500);
}

#[test]
fun test_price_impact_zero_amount() {
    let impact = liquidity_pool::price_impact_bps(100, 1000, 0, 0);
    assert!(impact == 0);
}

// ===== Test Sell (simulated, no SSU) =====

#[test]
fun test_sell_items_via_test_helper() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        // Create pool: 10 SUI, 100 items, 1% fee
        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor,
            &owner_cap,
            su_id,
            ITEM_TYPE,
            100, // 1% fee
            initial_sui,
            100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // Trader sells 10 items
    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui_received = liquidity_pool::test_sell(
            &mut corridor,
            su_id,
            10, // sell 10 items
            0,  // no min (for testing)
            scenario.ctx(),
        );

        // With 1% fee on 10 items: amount_after_fee = 10 * 9900 / 10000 = 9
        // output = (9 * 10_000_000_000) / (100 + 9) = 90B / 109 = 825_688_073
        let received = coin::value(&sui_received);
        assert!(received > 800_000_000); // ~0.8 SUI
        assert!(received < 900_000_000); // < 0.9 SUI (fees + impact)

        // Verify reserves updated
        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_items == 110); // 100 + 10 sold
        assert!(r_sui == 10_000_000_000 - received);

        // Verify stats
        let (swaps, _, _, _) = liquidity_pool::get_pool_stats(&corridor, su_id);
        assert!(swaps == 1);

        coin::burn_for_testing(sui_received);
        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test]
fun test_sell_items_slippage_protection() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        // Sell 10 items with reasonable min_sui_out
        let sui_received = liquidity_pool::test_sell(
            &mut corridor, su_id, 10,
            900_000_000, // min 0.9 SUI
            scenario.ctx(),
        );

        // output = (10 * 10B) / (100 + 10) = 909_090_909
        assert!(coin::value(&sui_received) == 909_090_909);

        coin::burn_for_testing(sui_received);
        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::ESlippageExceeded)]
fun test_sell_items_slippage_exceeded_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        // Demand more SUI than possible
        let sui_received = liquidity_pool::test_sell(
            &mut corridor, su_id, 10,
            5_000_000_000, // min 5 SUI — way too high
            scenario.ctx(),
        );

        coin::burn_for_testing(sui_received);
        ts::return_shared(corridor);
    };

    scenario.end();
}

// ===== Test Buy (simulated, no SSU) =====

#[test]
fun test_buy_items_via_test_helper() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 100, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // Trader buys items with 1 SUI
    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let payment = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        let items_received = liquidity_pool::test_buy(
            &mut corridor, su_id, payment, 0,
        );

        // With 1% fee on 1 SUI: amount_after_fee = 1B * 9900 / 10000 = 990_000_000
        // output = (990M * 100) / (10B + 990M) = 99B / 10.99B = 9
        assert!(items_received == 9);

        // Verify reserves
        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_items == 91); // 100 - 9
        assert!(r_sui == 11_000_000_000); // 10 + 1 SUI

        let (swaps, _, _, _) = liquidity_pool::get_pool_stats(&corridor, su_id);
        assert!(swaps == 1);

        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::ESlippageExceeded)]
fun test_buy_items_slippage_exceeded_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let payment = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        let _items = liquidity_pool::test_buy(
            &mut corridor, su_id, payment,
            50, // demand 50 items — impossible with 1 SUI on a 10 SUI pool
        );

        ts::return_shared(corridor);
    };

    scenario.end();
}

// ===== Liquidity Management Tests =====

#[test]
fun test_add_liquidity() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui, 100);

        // Add more liquidity
        let more_sui = coin::mint_for_testing<SUI>(2_000_000_000, scenario.ctx());
        liquidity_pool::add_liquidity(&mut corridor, &owner_cap, su_id, more_sui, 200);

        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_sui == 3_000_000_000);
        assert!(r_items == 300);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_add_liquidity_zero_sui() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui, 100);

        // Add only items, no SUI
        let zero_sui = coin::mint_for_testing<SUI>(0, scenario.ctx());
        liquidity_pool::add_liquidity(&mut corridor, &owner_cap, su_id, zero_sui, 50);

        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_sui == 1_000_000_000);
        assert!(r_items == 150);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_remove_liquidity() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui = coin::mint_for_testing<SUI>(5_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui, 500);

        // Remove half liquidity
        liquidity_pool::remove_liquidity(
            &mut corridor, &owner_cap, su_id,
            2_500_000_000, // half SUI
            250,           // half items
            scenario.ctx(),
        );

        let (r_sui, r_items) = liquidity_pool::get_reserves(&corridor, su_id);
        assert!(r_sui == 2_500_000_000);
        assert!(r_items == 250);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::EInsufficientPoolBalance)]
fun test_remove_liquidity_too_much_sui_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui, 100);

        liquidity_pool::remove_liquidity(
            &mut corridor, &owner_cap, su_id,
            2_000_000_000, // more than exists
            0,
            scenario.ctx(),
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = liquidity_pool::EInsufficientReserves)]
fun test_remove_liquidity_too_many_items_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_id, ITEM_TYPE, 30, sui, 100);

        liquidity_pool::remove_liquidity(
            &mut corridor, &owner_cap, su_id,
            0,
            101, // more items than exist
            scenario.ctx(),
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== Multi-Swap Tests =====

#[test]
fun test_multiple_sells_increase_price() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // First sell: 10 items
    scenario.next_tx(TRADER);
    let first_sui;
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);
        let sui1 = liquidity_pool::test_sell(&mut corridor, su_id, 10, 0, scenario.ctx());
        first_sui = coin::value(&sui1);
        coin::burn_for_testing(sui1);
        ts::return_shared(corridor);
    };

    // Second sell: 10 items (price should be worse — less SUI received)
    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);
        let sui2 = liquidity_pool::test_sell(&mut corridor, su_id, 10, 0, scenario.ctx());
        let second_sui = coin::value(&sui2);

        // Second sell gives less SUI (selling into a less favorable ratio)
        assert!(second_sui < first_sui);

        // Verify total swaps
        let (swaps, _, _, _) = liquidity_pool::get_pool_stats(&corridor, su_id);
        assert!(swaps == 2);

        coin::burn_for_testing(sui2);
        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test]
fun test_multiple_buys_increase_cost() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // First buy with 1 SUI
    scenario.next_tx(TRADER);
    let first_items;
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);
        let payment = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        first_items = liquidity_pool::test_buy(&mut corridor, su_id, payment, 0);
        ts::return_shared(corridor);
    };

    // Second buy with 1 SUI (should get fewer items)
    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);
        let payment = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        let second_items = liquidity_pool::test_buy(&mut corridor, su_id, payment, 0);

        // Fewer items on second buy (items are more expensive now)
        assert!(second_items < first_items);

        ts::return_shared(corridor);
    };

    scenario.end();
}

// ===== Constant Product Invariant Test =====

#[test]
fun test_constant_product_invariant_holds() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 1000,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // k = 10B * 1000 = 10_000_000_000_000
    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let (r_sui_before, r_items_before) = liquidity_pool::get_reserves(&corridor, su_id);
        let k_before = (r_sui_before as u128) * (r_items_before as u128);

        // Sell 100 items
        let sui_out = liquidity_pool::test_sell(&mut corridor, su_id, 100, 0, scenario.ctx());
        coin::burn_for_testing(sui_out);

        let (r_sui_after, r_items_after) = liquidity_pool::get_reserves(&corridor, su_id);
        let k_after = (r_sui_after as u128) * (r_items_after as u128);

        // k should stay the same or increase (due to rounding in our favor)
        assert!(k_after >= k_before);

        ts::return_shared(corridor);
    };

    scenario.end();
}

// ===== Edge Cases =====

#[test]
fun test_sell_single_item() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let initial_sui = balance::create_for_testing<SUI>(10_000_000_000);
        liquidity_pool::create_test_pool(
            &mut corridor, &owner_cap, su_id, ITEM_TYPE, 0, initial_sui, 100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(TRADER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let su_id = object::id_from_address(DEPOT_A_ADDR);

        let sui_out = liquidity_pool::test_sell(&mut corridor, su_id, 1, 0, scenario.ctx());
        // output = (1 * 10B) / (100 + 1) = 10B / 101 = 99_009_900
        assert!(coin::value(&sui_out) == 99_009_900);

        coin::burn_for_testing(sui_out);
        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test]
fun test_two_pools_on_same_corridor() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        let su_a = object::id_from_address(DEPOT_A_ADDR);
        let su_b = object::id_from_address(DEPOT_B_ADDR);

        // Pool on depot A
        let sui_a = coin::mint_for_testing<SUI>(5_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_a, 1001, 50, sui_a, 100);

        // Pool on depot B
        let sui_b = coin::mint_for_testing<SUI>(2_000_000_000, scenario.ctx());
        liquidity_pool::create_pool(&mut corridor, &owner_cap, su_b, 2002, 100, sui_b, 200);

        assert!(liquidity_pool::pool_exists(&corridor, su_a));
        assert!(liquidity_pool::pool_exists(&corridor, su_b));

        let (a_sui, a_items) = liquidity_pool::get_reserves(&corridor, su_a);
        assert!(a_sui == 5_000_000_000 && a_items == 100);

        let (b_sui, b_items) = liquidity_pool::get_reserves(&corridor, su_b);
        assert!(b_sui == 2_000_000_000 && b_items == 200);

        assert!(liquidity_pool::get_pool_item_type(&corridor, su_a) == 1001);
        assert!(liquidity_pool::get_pool_item_type(&corridor, su_b) == 2002);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}
