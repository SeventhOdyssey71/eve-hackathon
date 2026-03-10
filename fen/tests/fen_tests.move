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

// === Additional Config Tests ===

#[test]
fun test_config_borrow_rule_mut() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 10 };
        config.add_rule(&admin_cap, key, TestVal { data: 100 });

        let val_ref = config.borrow_rule_mut<TestKey, TestVal>(&admin_cap, key);
        val_ref.data = 999;

        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 999);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

#[test]
fun test_config_rule_lifecycle() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 42 };

        // Add
        assert!(!config.has_rule<TestKey, TestVal>(key));
        config.add_rule(&admin_cap, key, TestVal { data: 1 });
        assert!(config.has_rule<TestKey, TestVal>(key));

        // Read
        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 1);

        // Update via set_rule
        config.set_rule(&admin_cap, key, TestVal { data: 2 });
        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 2);

        // Update via borrow_rule_mut
        let val_ref = config.borrow_rule_mut<TestKey, TestVal>(&admin_cap, key);
        val_ref.data = 3;
        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 3);

        // Remove
        let removed = config.remove_rule<TestKey, TestVal>(&admin_cap, key);
        assert!(removed.data == 3);
        assert!(!config.has_rule<TestKey, TestVal>(key));

        // Re-add after remove
        config.add_rule(&admin_cap, key, TestVal { data: 4 });
        assert!(config.borrow_rule<TestKey, TestVal>(key).data == 4);

        // Clean up
        let _ = config.remove_rule<TestKey, TestVal>(&admin_cap, key);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_config_remove_nonexistent_aborts() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();

        let key = TestKey { val: 999 };
        let _removed = config.remove_rule<TestKey, TestVal>(&admin_cap, key);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(config);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_config_borrow_nonexistent_aborts() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let config = scenario.take_shared<FenConfig>();
        let key = TestKey { val: 888 };
        let _val = config.borrow_rule<TestKey, TestVal>(key);
        ts::return_shared(config);
    };
    scenario.end();
}

// === Additional Corridor Tests ===

#[test]
#[expected_failure]
fun test_corridor_activate_not_owner_aborts() {
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
    // Deactivate as owner first
    scenario.next_tx(OPERATOR);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        corridor::deactivate_corridor(&mut corridor, scenario.ctx());
        ts::return_shared(corridor);
    };
    // Attacker tries to activate
    scenario.next_tx(ATTACKER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        corridor::activate_corridor(&mut corridor, scenario.ctx());
        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_corridor_update_fee_not_owner_aborts() {
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
        corridor::update_fee_recipient(&mut corridor, ATTACKER, scenario.ctx());
        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
fun test_corridor_multiple_registrations() {
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
            b"Route Alpha",
            &clock,
            scenario.ctx(),
        );

        assert!(corridor::total_corridors(&registry) == 1);

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(@0x5001),
            object::id_from_address(@0x5002),
            object::id_from_address(@0x6001),
            object::id_from_address(@0x6002),
            NEW_FEE,
            b"Route Beta",
            &clock,
            scenario.ctx(),
        );

        assert!(corridor::total_corridors(&registry) == 2);

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.end();
}

#[test]
fun test_corridor_view_functions() {
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
            b"View Test",
            &clock,
            scenario.ctx(),
        );

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    scenario.next_tx(OPERATOR);
    {
        let corridor = scenario.take_shared<Corridor>();

        assert!(corridor::source_gate_id(&corridor) == object::id_from_address(GATE1_ADDR));
        assert!(corridor::dest_gate_id(&corridor) == object::id_from_address(GATE2_ADDR));
        assert!(corridor::depot_a_id(&corridor) == object::id_from_address(DEPOT_A_ADDR));
        assert!(corridor::depot_b_id(&corridor) == object::id_from_address(DEPOT_B_ADDR));
        assert!(corridor::owner(&corridor) == OPERATOR);
        assert!(corridor::fee_recipient(&corridor) == FEE_ADDR);
        assert!(corridor::is_active(&corridor));
        assert!(corridor::name(&corridor) == b"View Test");
        assert!(corridor::total_jumps(&corridor) == 0);
        assert!(corridor::total_trades(&corridor) == 0);
        assert!(corridor::total_toll_revenue(&corridor) == 0);
        assert!(corridor::total_trade_revenue(&corridor) == 0);

        ts::return_shared(corridor);
    };
    scenario.end();
}

#[test]
fun test_corridor_deactivate_activate_cycle() {
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
            b"Cycle Test",
            &clock,
            scenario.ctx(),
        );

        clock.destroy_for_testing();
        ts::return_shared(registry);
    };
    // Cycle through states multiple times
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
        corridor::activate_corridor(&mut corridor, scenario.ctx());
        assert!(corridor::is_active(&corridor));
        corridor::deactivate_corridor(&mut corridor, scenario.ctx());
        assert!(!corridor::is_active(&corridor));
        ts::return_shared(corridor);
    };
    scenario.next_tx(OPERATOR);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        corridor::activate_corridor(&mut corridor, scenario.ctx());
        assert!(corridor::is_active(&corridor));
        ts::return_shared(corridor);
    };
    scenario.end();
}

// === Additional Toll Gate Tests ===

#[test]
fun test_toll_view_functions() {
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
            &mut fen_config, &admin_cap, gate_id, 2_000_000_000, FEE_ADDR,
        );

        let rule = fen::toll_gate::get_toll_rule(&fen_config, gate_id);
        assert!(fen::toll_gate::toll_amount(rule) == 2_000_000_000);
        assert!(fen::toll_gate::surge_numerator(rule) == 10000);
        assert!(!fen::toll_gate::is_surge_active(rule));
        assert!(fen::toll_gate::fee_recipient(rule) == FEE_ADDR);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_toll_config_overwrite() {
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
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 1_000_000_000);

        // Overwrite with new toll
        fen::toll_gate::set_toll_config(
            &mut fen_config, &admin_cap, gate_id, 5_000_000_000, NEW_FEE,
        );
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 5_000_000_000);
        assert!(fen::toll_gate::fee_recipient(fen::toll_gate::get_toll_rule(&fen_config, gate_id)) == NEW_FEE);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_toll_lock_with_surge() {
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

        // Activate surge and lock simultaneously
        fen::toll_gate::activate_surge(&mut fen_config, &admin_cap, gate_id, 30000);
        fen::toll_gate::emergency_lock(&mut fen_config, &admin_cap, gate_id);

        // Verify both states
        assert!(fen::toll_gate::is_locked(&fen_config, gate_id));
        let rule = fen::toll_gate::get_toll_rule(&fen_config, gate_id);
        assert!(fen::toll_gate::is_surge_active(rule));
        // Effective toll still calculates with surge even when locked
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 3_000_000_000);

        // Unlock but keep surge
        fen::toll_gate::emergency_unlock(&mut fen_config, &admin_cap, gate_id);
        assert!(!fen::toll_gate::is_locked(&fen_config, gate_id));
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 3_000_000_000);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_toll_multiple_gates_independent() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let gate1 = object::id_from_address(GATE1_ADDR);
        let gate2 = object::id_from_address(GATE2_ADDR);

        // Configure two gates with different tolls
        fen::toll_gate::set_toll_config(
            &mut fen_config, &admin_cap, gate1, 1_000_000_000, FEE_ADDR,
        );
        fen::toll_gate::set_toll_config(
            &mut fen_config, &admin_cap, gate2, 3_000_000_000, NEW_FEE,
        );

        assert!(fen::toll_gate::effective_toll(&fen_config, gate1) == 1_000_000_000);
        assert!(fen::toll_gate::effective_toll(&fen_config, gate2) == 3_000_000_000);

        // Surge on gate1 only
        fen::toll_gate::activate_surge(&mut fen_config, &admin_cap, gate1, 20000);
        assert!(fen::toll_gate::effective_toll(&fen_config, gate1) == 2_000_000_000);
        assert!(fen::toll_gate::effective_toll(&fen_config, gate2) == 3_000_000_000);

        // Lock gate2 only
        fen::toll_gate::emergency_lock(&mut fen_config, &admin_cap, gate2);
        assert!(!fen::toll_gate::is_locked(&fen_config, gate1));
        assert!(fen::toll_gate::is_locked(&fen_config, gate2));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_toll_surge_boundary_values() {
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

        // 1x surge (no change)
        fen::toll_gate::activate_surge(&mut fen_config, &admin_cap, gate_id, 10000);
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 1_000_000_000);

        // 10x surge
        fen::toll_gate::activate_surge(&mut fen_config, &admin_cap, gate_id, 100000);
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 10_000_000_000);

        // 0.5x surge (discount)
        fen::toll_gate::activate_surge(&mut fen_config, &admin_cap, gate_id, 5000);
        assert!(fen::toll_gate::effective_toll(&fen_config, gate_id) == 500_000_000);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

// === Additional Depot Tests ===

#[test]
fun test_depot_overwrite_config() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let su_id = object::id_from_address(SSU1_ADDR);

        // Initial config
        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su_id, 100, 200, 2, 1, 100,
        );
        assert!(fen::depot::input_type_id(fen::depot::get_depot_rule(&fen_config, su_id)) == 100);

        // Overwrite with new trading pair
        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su_id, 300, 400, 5, 3, 250,
        );
        let rule = fen::depot::get_depot_rule(&fen_config, su_id);
        assert!(fen::depot::input_type_id(rule) == 300);
        assert!(fen::depot::output_type_id(rule) == 400);
        let (ri, ro) = fen::depot::ratio(rule);
        assert!(ri == 5 && ro == 3);
        assert!(fen::depot::fee_bps(rule) == 250);
        assert!(fen::depot::is_active(rule));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_depot_zero_fee() {
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

        let rule = fen::depot::get_depot_rule(&fen_config, su_id);
        assert!(fen::depot::fee_bps(rule) == 0);

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

#[test]
fun test_depot_multiple_depots_independent() {
    let mut scenario = ts::begin(ADMIN);
    {
        config::init_for_testing(scenario.ctx());
    };
    scenario.next_tx(ADMIN);
    {
        let mut fen_config = scenario.take_shared<FenConfig>();
        let admin_cap = scenario.take_from_sender<AdminCap>();
        let su1 = object::id_from_address(SSU1_ADDR);
        let su2 = object::id_from_address(@0x3002);

        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su1, 100, 200, 2, 1, 100,
        );
        fen::depot::set_depot_config(
            &mut fen_config, &admin_cap, su2, 300, 400, 1, 5, 500,
        );

        // Verify independent configs
        let rule1 = fen::depot::get_depot_rule(&fen_config, su1);
        let rule2 = fen::depot::get_depot_rule(&fen_config, su2);
        assert!(fen::depot::input_type_id(rule1) == 100);
        assert!(fen::depot::input_type_id(rule2) == 300);
        assert!(fen::depot::fee_bps(rule1) == 100);
        assert!(fen::depot::fee_bps(rule2) == 500);

        // Deactivate one, other stays active
        fen::depot::deactivate_depot(&mut fen_config, &admin_cap, su1);
        assert!(!fen::depot::is_active(fen::depot::get_depot_rule(&fen_config, su1)));
        assert!(fen::depot::is_active(fen::depot::get_depot_rule(&fen_config, su2)));

        scenario.return_to_sender(admin_cap);
        ts::return_shared(fen_config);
    };
    scenario.end();
}

// === Additional Treasury Tests ===

#[test]
fun test_treasury_multiple_deposits() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(OPERATOR);
    {
        let mut treasury = scenario.take_shared<Treasury>();

        // Multiple deposits
        let p1 = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, p1);
        assert!(treasury::balance_value(&treasury) == 1_000_000_000);

        let p2 = coin::mint_for_testing<SUI>(2_000_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, p2);
        assert!(treasury::balance_value(&treasury) == 3_000_000_000);

        let p3 = coin::mint_for_testing<SUI>(500_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, p3);
        assert!(treasury::balance_value(&treasury) == 3_500_000_000);

        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
fun test_treasury_withdraw_all_empty() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        // withdraw_all on empty treasury should succeed (no-op)
        treasury::withdraw_all(&mut treasury, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 0);
        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
fun test_treasury_sequential_withdrawals() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(OPERATOR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let payment = coin::mint_for_testing<SUI>(10_000_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, payment);
        ts::return_shared(treasury);
    };
    // Withdraw in stages
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw(&mut treasury, 3_000_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 7_000_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 3_000_000_000);
        ts::return_shared(treasury);
    };
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw(&mut treasury, 4_000_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 3_000_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 7_000_000_000);
        ts::return_shared(treasury);
    };
    scenario.next_tx(FEE_ADDR);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        treasury::withdraw_all(&mut treasury, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 10_000_000_000);
        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
fun test_treasury_corridor_id_view() {
    let mut scenario = ts::begin(OPERATOR);
    {
        let corridor_id = object::id_from_address(CORRIDOR1_ADDR);
        treasury::create_treasury(corridor_id, FEE_ADDR, scenario.ctx());
    };
    scenario.next_tx(OPERATOR);
    {
        let treasury = scenario.take_shared<Treasury>();
        assert!(treasury::corridor_id(&treasury) == object::id_from_address(CORRIDOR1_ADDR));
        assert!(treasury::fee_recipient(&treasury) == FEE_ADDR);
        ts::return_shared(treasury);
    };
    scenario.end();
}

#[test]
#[expected_failure]
fun test_treasury_withdraw_all_not_recipient_aborts() {
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
        treasury::withdraw_all(&mut treasury, scenario.ctx());
        ts::return_shared(treasury);
    };
    scenario.end();
}
