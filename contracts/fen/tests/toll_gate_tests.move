#[test_only]
module fen::toll_gate_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use fen::corridor::{Self, CorridorRegistry, Corridor, CorridorOwnerCap};
use fen::toll_gate;

const OWNER: address = @0xA;

// Reusable IDs for gates/depots
const SOURCE_GATE: address = @0x1;
const DEST_GATE: address = @0x2;
const DEPOT_A: address = @0x3;
const DEPOT_B: address = @0x4;

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
            object::id_from_address(SOURCE_GATE),
            object::id_from_address(DEST_GATE),
            object::id_from_address(DEPOT_A),
            object::id_from_address(DEPOT_B),
            OWNER,
            b"Toll Gate Test Corridor",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };
}

#[test]
fun test_set_toll_config() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 1000);

        // Verify toll config exists and has correct amount
        assert!(toll_gate::toll_config_exists(&corridor, gate_id));
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 1000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_get_effective_toll_no_surge() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 5000);

        // Without surge, effective toll should equal base toll amount
        let effective = toll_gate::get_effective_toll(&corridor, gate_id);
        assert!(effective == 5000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_activate_surge() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // First set toll config
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 1000);

        // Activate surge with 2x multiplier (20000 / 10000 = 2x)
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 20000);

        // Effective toll should be doubled: 1000 * 20000 / 10000 = 2000
        let effective = toll_gate::get_effective_toll(&corridor, gate_id);
        assert!(effective == 2000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_get_effective_toll_with_surge() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(DEST_GATE);

        // Set base toll of 10000
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 10000);

        // Activate 1.5x surge (15000 / 10000 = 1.5x)
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 15000);

        // Effective toll: 10000 * 15000 / 10000 = 15000
        let effective = toll_gate::get_effective_toll(&corridor, gate_id);
        assert!(effective == 15000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_deactivate_surge() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Set toll and activate surge
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 2000);
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 30000);

        // Verify surge is active: 2000 * 30000 / 10000 = 6000
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 6000);

        // Deactivate surge
        toll_gate::deactivate_surge(&mut corridor, &owner_cap, gate_id);

        // Effective toll should revert to base amount
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 2000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_set_toll_config_updates_existing() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Set initial toll
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 1000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 1000);

        // Update toll to a new amount
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 5000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 5000);

        // Update again
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 250);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 250);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_zero_toll_amount() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Setting toll to 0 should work (free passage)
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 0);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 0);
        assert!(toll_gate::toll_config_exists(&corridor, gate_id));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_surge_with_various_multipliers() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Set base toll
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 10000);

        // Test 1x multiplier (no effective change): 10000 * 10000 / 10000 = 10000
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 10000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 10000);

        // Test 3x multiplier: 10000 * 30000 / 10000 = 30000
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 30000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 30000);

        // Test 0.5x multiplier: 10000 * 5000 / 10000 = 5000
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 5000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 5000);

        // Test 1.25x multiplier: 10000 * 12500 / 10000 = 12500
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 12500);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 12500);

        // Test 10x multiplier: 10000 * 100000 / 10000 = 100000
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 100000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 100000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_toll_config_on_both_gates() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let source_gate_id = object::id_from_address(SOURCE_GATE);
        let dest_gate_id = object::id_from_address(DEST_GATE);

        // Set different tolls on each gate
        toll_gate::set_toll_config(&mut corridor, &owner_cap, source_gate_id, 1000);
        toll_gate::set_toll_config(&mut corridor, &owner_cap, dest_gate_id, 2000);

        // Verify independent configurations
        assert!(toll_gate::get_effective_toll(&corridor, source_gate_id) == 1000);
        assert!(toll_gate::get_effective_toll(&corridor, dest_gate_id) == 2000);

        // Activate surge on source gate only
        toll_gate::activate_surge(&mut corridor, &owner_cap, source_gate_id, 20000);

        // Source gate should have surge, dest should not
        assert!(toll_gate::get_effective_toll(&corridor, source_gate_id) == 2000); // 1000 * 2
        assert!(toll_gate::get_effective_toll(&corridor, dest_gate_id) == 2000); // unchanged

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_get_effective_toll_no_config() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Without setting any config, effective toll should be 0
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 0);
        assert!(!toll_gate::toll_config_exists(&corridor, gate_id));

        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test]
fun test_surge_preserves_toll_amount_after_deactivation() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Set toll, activate surge, deactivate, check original toll preserved
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 7777);
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 20000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 15554); // 7777 * 2
        toll_gate::deactivate_surge(&mut corridor, &owner_cap, gate_id);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 7777); // back to base

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_update_toll_while_surge_active() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Set toll and activate surge
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 1000);
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 20000);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 2000);

        // Update toll amount while surge is active
        // set_toll_config only updates toll_amount, not surge fields
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 3000);

        // Surge should still be active on the updated toll: 3000 * 20000 / 10000 = 6000
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 6000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = toll_gate::EGateMismatch)]
fun test_set_toll_config_wrong_gate_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        // Use an ID that is not part of this corridor
        let bad_gate_id = object::id_from_address(@0xDEAD);

        toll_gate::set_toll_config(&mut corridor, &owner_cap, bad_gate_id, 1000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure]
fun test_set_toll_config_wrong_owner_fails() {
    let other: address = @0xB;

    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    // Register a second corridor from a different owner
    scenario.next_tx(other);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clk = clock::create_for_testing(scenario.ctx());

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(@0x10),
            object::id_from_address(@0x20),
            object::id_from_address(@0x30),
            object::id_from_address(@0x40),
            other,
            b"Other Corridor",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    // Use OWNER's cap (from first corridor) on the second corridor
    // OWNER's cap corridor_id != second corridor's id => ENotOwner
    scenario.next_tx(OWNER);
    {
        // Take the second corridor (created by other) and OWNER's cap (from first corridor)
        let mut corridor_1 = scenario.take_shared<Corridor>();
        let mut corridor_2 = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        // Determine which corridor is not owned by OWNER's cap
        // owner_cap.corridor_id matches the first corridor
        let cap_corridor_id = corridor::corridor_id(&owner_cap);

        // Use the corridor that doesn't match the cap
        if (cap_corridor_id == object::id(&corridor_1)) {
            // corridor_2 is the other one — use a gate_id from corridor_2
            let gate_id = corridor::source_gate_id(&corridor_2);
            toll_gate::set_toll_config(&mut corridor_2, &owner_cap, gate_id, 1000);
        } else {
            // corridor_1 is the other one — use a gate_id from corridor_1
            let gate_id = corridor::source_gate_id(&corridor_1);
            toll_gate::set_toll_config(&mut corridor_1, &owner_cap, gate_id, 1000);
        };

        ts::return_shared(corridor_1);
        ts::return_shared(corridor_2);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_zero_surge_multiplier() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let gate_id = object::id_from_address(SOURCE_GATE);

        // Set toll
        toll_gate::set_toll_config(&mut corridor, &owner_cap, gate_id, 1000);

        // Surge with 0 numerator = zero toll
        toll_gate::activate_surge(&mut corridor, &owner_cap, gate_id, 0);
        assert!(toll_gate::get_effective_toll(&corridor, gate_id) == 0);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}
