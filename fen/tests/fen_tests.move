/// FEN Integration Tests
///
/// Tests for config, corridor registry, treasury, and toll gate modules.
/// Gate and storage unit tests require world-contract test helpers for
/// anchoring assemblies, so we focus on the FEN-owned logic.
#[test_only]
module fen::fen_tests;

use sui::test_scenario::{Self as ts, Scenario};
use sui::coin;
use sui::sui::SUI;

use fen::config::{Self, FenConfig, AdminCap};
use fen::corridor::{Self, CorridorRegistry, Corridor};
use fen::treasury::{Self, Treasury};

// Test addresses (valid hex)
const ADMIN: address = @0xA1;
const OPERATOR: address = @0xB1;
const FEE_ADDR: address = @0xF1;
const NEW_FEE: address = @0xF2;
const ATTACKER: address = @0xE1;

// Test object IDs
const GATE1_ADDR: address = @0x1001;
const GATE2_ADDR: address = @0x1002;
const DEPOT_A_ADDR: address = @0x2001;
const DEPOT_B_ADDR: address = @0x2002;
const SSU1_ADDR: address = @0x3001;
const CORRIDOR1_ADDR: address = @0x4001;

// === Config Tests ===

#[test]
fun test_config_init_creates_shared_config_and_admin_cap() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let admin_cap = scenario.take_from_sender<AdminCap>();
        scenario.return_to_sender(admin_cap);
    };
    scenario.next_tx(ADMIN);
    {
        let config = scenario.take_shared<FenConfig>();
        ts::return_shared(config);
    };
    scenario.end();
}

/// Dynamic field key for testing
public struct TestKey has copy, drop, store { val: u64 }
/// Dynamic field value for testing
public struct TestVal has copy, drop, store { data: u64 }

#[test]
fun test_config_add_and_borrow_rule() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 1 };
        let value = TestVal { data: 42 };

        assert!(!config.has_rule<TestKey, TestVal>(key));
        config.add_rule(&admin_cap, key, value);
        assert!(config.has_rule<TestKey, TestVal>(key));

        let borrowed = config.borrow_rule<TestKey, TestVal>(key);
        assert!(borrowed.data == 42);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

#[test]
fun test_config_set_rule_overwrites() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 1 };
        config.set_rule(&admin_cap, key, TestVal { data: 10 });
        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 10);

        config.set_rule(&admin_cap, key, TestVal { data: 99 });
        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 99);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

#[test]
fun test_config_remove_rule() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 1 };
        config.add_rule(&admin_cap, key, TestVal { data: 42 });
        assert!(config.has_rule<TestKey, TestVal>(key));

        let removed = config.remove_rule<TestKey, TestVal>(&admin_cap, key);
        assert!(removed.data == 42);
        assert!(!config.has_rule<TestKey, TestVal>(key));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_config_add_duplicate_aborts() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 1 };
        config.add_rule(&admin_cap, key, TestVal { data: 1 });
        config.add_rule(&admin_cap, key, TestVal { data: 2 });

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

// === Corridor Tests ===

fun setup_corridor_scenario(scenario: &mut Scenario) {
    corridor::init_for_testing(scenario.ctx());
}

#[test]
fun test_corridor_register() {
    let mut scenario = ts::begin(OPERATOR);
    {
        setup_corridor_scenario(&mut scenario);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clock = sui::clock::create_for_testing(scenario.ctx());

        assert!(corridor::total_corridors(&registry) == 0);

        let _corridor_id = corridor::register_corridor(
            &mut registry,
            object::id_from_address(GATE1_ADDR),
            object::id_from_address(GATE2_ADDR),
            object::id_from_address(DEPOT_A_ADDR),
            object::id_from_address(DEPOT_B_ADDR),
            FEE_ADDR,
            b"Helios Express",
            &clock,
            scenario.ctx(),
        );

        assert!(corridor::total_corridors(&registry) == 1);

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.next_tx(OPERATOR);
    {
        let corridor = scenario.take_shared<Corridor>();

        assert!(corridor::owner(&corridor) == OPERATOR);
        assert!(corridor::fee_recipient(&corridor) == FEE_ADDR);
        assert!(corridor::is_active(&corridor));
        assert!(corridor::name(&corridor) == b"Helios Express");
        assert!(corridor::total_jumps(&corridor) == 0);
        assert!(corridor::total_trades(&corridor) == 0);
        assert!(corridor::total_toll_revenue(&corridor) == 0);
        assert!(corridor::total_trade_revenue(&corridor) == 0);

        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
fun test_corridor_deactivate_and_activate() {
    let mut scenario = ts::begin(OPERATOR);
    {
        setup_corridor_scenario(&mut scenario);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clock = sui::clock::create_for_testing(scenario.ctx());

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(GATE1_ADDR),
            object::id_from_address(GATE2_ADDR),
            object::id_from_address(DEPOT_A_ADDR),
            object::id_from_address(DEPOT_B_ADDR),
            FEE_ADDR,
            b"Test Route",
            &clock,
            scenario.ctx(),
        );

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        assert!(corridor::is_active(&corridor));
        corridor::deactivate_corridor(&mut corridor, scenario.ctx());
        assert!(!corridor::is_active(&corridor));
        ts::return_shared(corridor);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        assert!(!corridor::is_active(&corridor));
        corridor::activate_corridor(&mut corridor, scenario.ctx());
        assert!(corridor::is_active(&corridor));
        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_corridor_deactivate_not_owner_aborts() {
    let mut scenario = ts::begin(OPERATOR);
    {
        setup_corridor_scenario(&mut scenario);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clock = sui::clock::create_for_testing(scenario.ctx());

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(GATE1_ADDR),
            object::id_from_address(GATE2_ADDR),
            object::id_from_address(DEPOT_A_ADDR),
            object::id_from_address(DEPOT_B_ADDR),
            FEE_ADDR,
            b"Test",
            &clock,
            scenario.ctx(),
        );

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.next_tx(ATTACKER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        corridor::deactivate_corridor(&mut corridor, scenario.ctx());
        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
fun test_corridor_record_stats() {
    let mut scenario = ts::begin(OPERATOR);
    {
        setup_corridor_scenario(&mut scenario);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clock = sui::clock::create_for_testing(scenario.ctx());

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(GATE1_ADDR),
            object::id_from_address(GATE2_ADDR),
            object::id_from_address(DEPOT_A_ADDR),
            object::id_from_address(DEPOT_B_ADDR),
            FEE_ADDR,
            b"Stats Test",
            &clock,
            scenario.ctx(),
        );

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut corridor = scenario.take_shared<Corridor>();

        corridor::record_jump(&mut corridor, 1_000_000_000);
        corridor::record_jump(&mut corridor, 500_000_000);

        assert!(corridor::total_jumps(&corridor) == 2);
        assert!(corridor::total_toll_revenue(&corridor) == 1_500_000_000);

        corridor::record_trade(&mut corridor, 100_000_000);
        assert!(corridor::total_trades(&corridor) == 1);
        assert!(corridor::total_trade_revenue(&corridor) == 100_000_000);

        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
fun test_corridor_update_fee_recipient() {
    let mut scenario = ts::begin(OPERATOR);
    {
        setup_corridor_scenario(&mut scenario);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clock = sui::clock::create_for_testing(scenario.ctx());

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(GATE1_ADDR),
            object::id_from_address(GATE2_ADDR),
            object::id_from_address(DEPOT_A_ADDR),
            object::id_from_address(DEPOT_B_ADDR),
            FEE_ADDR,
            b"Fee Test",
            &clock,
            scenario.ctx(),
        );

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        assert!(corridor::fee_recipient(&corridor) == FEE_ADDR);

        corridor::update_fee_recipient(&mut corridor, NEW_FEE, scenario.ctx());
        assert!(corridor::fee_recipient(&corridor) == NEW_FEE);

        ts::return_shared(corridor);
    };
    scenario.end();
}

// === Treasury Tests ===

#[test]
fun test_treasury_create() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(OPERATOR);
    {
        let treasury = scenario.take_shared<Treasury>();
        assert!(treasury::fee_recipient(&treasury) == FEE_ADDR);
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 0);
        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
fun test_treasury_deposit_and_withdraw() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    // Deposit 5 SUI
    scenario.next_tx(OPERATOR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let payment = coin::mint_for_testing<SUI>(5_000_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, payment);
        assert!(treasury::balance_value(&treasury) == 5_000_000_000);
        ts::return_shared(treasury);
    };
    // Withdraw 2 SUI as fee recipient
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw(&mut treasury, 2_000_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 3_000_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 2_000_000_000);
        ts::return_shared(treasury);
    };
    // Withdraw all remaining
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw_all(&mut treasury, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 5_000_000_000);
        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_treasury_withdraw_not_recipient_aborts() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(OPERATOR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let payment = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, payment);
        ts::return_shared(treasury);
    };
    scenario.next_tx(ATTACKER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw(&mut treasury, 1_000_000_000, scenario.ctx());
        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_treasury_withdraw_insufficient_balance_aborts() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw(&mut treasury, 1_000_000_000, scenario.ctx());
        ts::return_shared(treasury);
    };
    scenario.end();
}

// === Toll Gate Config Tests ===

#[test]
fun test_toll_config_set_and_read() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let gate_id = object::id_from_address(GATE1_ADDR);

        fen::toll_gate::set_toll_config(
            &mut fen_config, &admin_cap, gate_id, 1_000_000_000, FEE_ADDR,
        );

        let toll = fen::toll_gate::effective_toll(&fen_config, gate_id);
        assert!(toll == 1_000_000_000);
        assert!(!fen::toll_gate::is_locked(&fen_config, gate_id));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_toll_surge_pricing() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let gate_id = object::id_from_address(GATE1_ADDR);

        fen::toll_gate::set_toll_config(
            &mut fen_config, &admin_cap, gate_id, 1_000_000_000, FEE_ADDR,
        );

        // Activate 2x surge
        fen::toll_gate::activate_surge(&mut fen_config, &admin_cap, gate_id, 20000);
        let toll = fen::toll_gate::effective_toll(&fen_config, gate_id);
        assert!(toll == 2_000_000_000);

        // Deactivate surge
        fen::toll_gate::deactivate_surge(&mut fen_config, &admin_cap, gate_id);
        let toll = fen::toll_gate::effective_toll(&fen_config, gate_id);
        assert!(toll == 1_000_000_000);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_toll_emergency_lock() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let gate_id = object::id_from_address(GATE1_ADDR);

        fen::toll_gate::set_toll_config(
            &mut fen_config, &admin_cap, gate_id, 1_000_000_000, FEE_ADDR,
        );

        assert!(!fen::toll_gate::is_locked(&fen_config, gate_id));

        fen::toll_gate::emergency_lock(&mut fen_config, &admin_cap, gate_id);
        assert!(fen::toll_gate::is_locked(&fen_config, gate_id));

        fen::toll_gate::emergency_unlock(&mut fen_config, &admin_cap, gate_id);
        assert!(!fen::toll_gate::is_locked(&fen_config, gate_id));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

// === Depot Config Tests ===

#[test]
fun test_depot_config_set_and_read() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let su_id = object::id_from_address(SSU1_ADDR);

        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su_id,
            100, 200, 2, 1, 100,
        );

        let rule = fen::depot::get_depot_rule(&fen_config, su_id);
        assert!(fen::depot::input_type_id(rule) == 100);
        assert!(fen::depot::output_type_id(rule) == 200);
        let (ri, ro) = fen::depot::ratio(rule);
        assert!(ri == 2 && ro == 1);
        assert!(fen::depot::fee_bps(rule) == 100);
        assert!(fen::depot::is_active(rule));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_depot_activate_deactivate() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let su_id = object::id_from_address(SSU1_ADDR);

        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su_id, 100, 200, 1, 1, 0,
        );

        assert!(fen::depot::is_active(fen::depot::get_depot_rule(&fen_config, su_id)));

        fen::depot::deactivate_depot(&mut fen_config, &admin_cap, su_id);
        assert!(!fen::depot::is_active(fen::depot::get_depot_rule(&fen_config, su_id)));

        fen::depot::activate_depot(&mut fen_config, &admin_cap, su_id);
        assert!(fen::depot::is_active(fen::depot::get_depot_rule(&fen_config, su_id)));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_depot_update_ratio_and_fee() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let su_id = object::id_from_address(SSU1_ADDR);

        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su_id, 100, 200, 1, 1, 100,
        );

        fen::depot::update_ratio(&mut fen_config, &admin_cap, su_id, 3, 2);
        let (ri, ro) = fen::depot::ratio(fen::depot::get_depot_rule(&fen_config, su_id));
        assert!(ri == 3 && ro == 2);

        fen::depot::update_fee(&mut fen_config, &admin_cap, su_id, 500);
        assert!(fen::depot::fee_bps(fen::depot::get_depot_rule(&fen_config, su_id)) == 500);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}
