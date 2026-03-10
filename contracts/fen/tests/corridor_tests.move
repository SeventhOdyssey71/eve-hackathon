#[test_only]
module fen::corridor_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use fen::corridor::{Self, CorridorRegistry, Corridor, CorridorOwnerCap};

const OWNER: address = @0xA;

#[test]
fun test_register_corridor() {
    let mut scenario = ts::begin(OWNER);
    {
        corridor::init_for_testing(scenario.ctx());
    };

    // Register a corridor
    scenario.next_tx(OWNER);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clk = clock::create_for_testing(scenario.ctx());

        let source_gate = object::id_from_address(@0x1);
        let dest_gate = object::id_from_address(@0x2);
        let depot_a = object::id_from_address(@0x3);
        let depot_b = object::id_from_address(@0x4);

        corridor::register_corridor(
            &mut registry,
            source_gate,
            dest_gate,
            depot_a,
            depot_b,
            OWNER,
            b"Test Corridor",
            &clk,
            scenario.ctx(),
        );

        assert!(corridor::corridor_count(&registry) == 1);

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    // Verify the corridor and owner cap exist
    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        assert!(corridor::name(&corridor) == b"Test Corridor");
        assert!(corridor::owner(&corridor) == OWNER);
        assert!(corridor::status(&corridor) == 0); // INACTIVE
        assert!(corridor::is_active(&corridor) == false);
        assert!(corridor::total_jumps(&corridor) == 0);
        assert!(corridor::corridor_id(&owner_cap) == object::id(&corridor));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_activate_deactivate_corridor() {
    let mut scenario = ts::begin(OWNER);
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
            object::id_from_address(@0x3),
            object::id_from_address(@0x4),
            OWNER,
            b"Activate Test",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    // Activate
    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::is_active(&corridor));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // Deactivate
    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        corridor::deactivate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        assert!(!corridor::is_active(&corridor));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_emergency_lock_unlock() {
    let mut scenario = ts::begin(OWNER);
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
            object::id_from_address(@0x3),
            object::id_from_address(@0x4),
            OWNER,
            b"Emergency Test",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    // Emergency lock
    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        corridor::emergency_lock(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::is_emergency(&corridor));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // Emergency unlock
    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        corridor::emergency_unlock(&mut corridor, &owner_cap, scenario.ctx());
        assert!(!corridor::is_emergency(&corridor));
        assert!(corridor::status(&corridor) == 0); // back to INACTIVE

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_update_fee_recipient() {
    let new_recipient: address = @0xBEEF;

    let mut scenario = ts::begin(OWNER);
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
            object::id_from_address(@0x3),
            object::id_from_address(@0x4),
            OWNER,
            b"Fee Test",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        corridor::update_fee_recipient(&mut corridor, &owner_cap, new_recipient);
        assert!(corridor::fee_recipient(&corridor) == new_recipient);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = corridor::ECorridorNameEmpty)]
fun test_register_empty_name_fails() {
    let mut scenario = ts::begin(OWNER);
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
            object::id_from_address(@0x3),
            object::id_from_address(@0x4),
            OWNER,
            b"", // empty name
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.end();
}
