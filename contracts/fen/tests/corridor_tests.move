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

// ===== State Machine Error Tests =====

#[test, expected_failure(abort_code = corridor::ECorridorAlreadyActive)]
fun test_activate_already_active_fails() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"State Test", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        // Try activating again
        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = corridor::ECorridorNotActive)]
fun test_deactivate_inactive_fails() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"Deactivate Test", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        corridor::deactivate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = corridor::ECorridorEmergencyLocked)]
fun test_emergency_unlock_non_emergency_fails() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"Unlock Test", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        corridor::emergency_unlock(&mut corridor, &owner_cap, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = corridor::ECorridorAlreadyActive)]
fun test_activate_emergency_corridor_fails() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"Emergency Activate", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        corridor::emergency_lock(&mut corridor, &owner_cap, scenario.ctx());
        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_emergency_lock_from_active() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"Lock From Active", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::is_active(&corridor));
        corridor::emergency_lock(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::is_emergency(&corridor));
        assert!(!corridor::is_active(&corridor));
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_full_lifecycle() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"Full Lifecycle", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        // INACTIVE(0) -> ACTIVE(1) -> INACTIVE(0)
        assert!(corridor::status(&corridor) == 0);
        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::status(&corridor) == 1);
        corridor::deactivate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::status(&corridor) == 0);

        // INACTIVE(0) -> EMERGENCY(2) -> INACTIVE(0)
        corridor::emergency_lock(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::status(&corridor) == 2);
        corridor::emergency_unlock(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::status(&corridor) == 0);

        // INACTIVE -> ACTIVE -> EMERGENCY -> INACTIVE
        corridor::activate_corridor(&mut corridor, &owner_cap, scenario.ctx());
        corridor::emergency_lock(&mut corridor, &owner_cap, scenario.ctx());
        corridor::emergency_unlock(&mut corridor, &owner_cap, scenario.ctx());
        assert!(corridor::status(&corridor) == 0);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_register_multiple_corridors() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            OWNER, b"Corridor Alpha", &clk, scenario.ctx(),
        );
        assert!(corridor::corridor_count(&registry) == 1);

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(@0x5), object::id_from_address(@0x6),
            object::id_from_address(@0x7), object::id_from_address(@0x8),
            OWNER, b"Corridor Beta", &clk, scenario.ctx(),
        );
        assert!(corridor::corridor_count(&registry) == 2);

        corridor::register_corridor(
            &mut registry,
            object::id_from_address(@0x9), object::id_from_address(@0xA),
            object::id_from_address(@0xB), object::id_from_address(@0xC),
            OWNER, b"Corridor Gamma", &clk, scenario.ctx(),
        );
        assert!(corridor::corridor_count(&registry) == 3);

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.end();
}

#[test]
fun test_corridor_view_functions() {
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
            object::id_from_address(@0x1), object::id_from_address(@0x2),
            object::id_from_address(@0x3), object::id_from_address(@0x4),
            @0xFEE, b"View Test", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        assert!(corridor::name(&corridor) == b"View Test");
        assert!(corridor::owner(&corridor) == OWNER);
        assert!(corridor::fee_recipient(&corridor) == @0xFEE);
        assert!(corridor::status(&corridor) == 0);
        assert!(!corridor::is_active(&corridor));
        assert!(!corridor::is_emergency(&corridor));
        assert!(corridor::total_jumps(&corridor) == 0);
        assert!(corridor::total_trades(&corridor) == 0);
        assert!(corridor::total_toll_revenue(&corridor) == 0);
        assert!(corridor::total_trade_revenue(&corridor) == 0);
        assert!(corridor::source_gate_id(&corridor) == object::id_from_address(@0x1));
        assert!(corridor::dest_gate_id(&corridor) == object::id_from_address(@0x2));
        assert!(corridor::depot_a_id(&corridor) == object::id_from_address(@0x3));
        assert!(corridor::depot_b_id(&corridor) == object::id_from_address(@0x4));
        ts::return_shared(corridor);
    };

    scenario.end();
}
