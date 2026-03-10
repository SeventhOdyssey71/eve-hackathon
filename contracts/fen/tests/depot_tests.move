#[test_only]
module fen::depot_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use fen::corridor::{Self, CorridorRegistry, Corridor, CorridorOwnerCap};
use fen::depot;

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
            b"Depot Test Corridor",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };
}

#[test]
fun test_set_depot_config() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            100, // input_type_id
            200, // output_type_id
            1,   // ratio_in
            1,   // ratio_out
            50,  // fee_bps (0.5%)
        );

        assert!(depot::depot_config_exists(&corridor, depot_id));
        // Newly created depot should be inactive
        assert!(!depot::is_depot_active(&corridor, depot_id));
        assert!(depot::depot_fee_bps(&corridor, depot_id) == 50);

        let (ratio_in, ratio_out) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in == 1);
        assert!(ratio_out == 1);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_activate_depot() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Must set config before activating
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            100, 200, 1, 1, 50,
        );

        assert!(!depot::is_depot_active(&corridor, depot_id));

        depot::activate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(depot::is_depot_active(&corridor, depot_id));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_deactivate_depot() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Set config and activate
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            100, 200, 1, 1, 50,
        );
        depot::activate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(depot::is_depot_active(&corridor, depot_id));

        // Deactivate
        depot::deactivate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(!depot::is_depot_active(&corridor, depot_id));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_config_ratio_1_to_1() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            1,  // ratio_in
            1,  // ratio_out  (1:1 exchange)
            100, // fee_bps (1%)
        );

        let (ratio_in, ratio_out) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in == 1);
        assert!(ratio_out == 1);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_config_ratio_3_to_1() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_B);

        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            3,  // ratio_in
            1,  // ratio_out  (3:1 exchange — 3 input for 1 output)
            200, // fee_bps (2%)
        );

        let (ratio_in, ratio_out) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in == 3);
        assert!(ratio_out == 1);
        assert!(depot::depot_fee_bps(&corridor, depot_id) == 200);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_config_ratio_1_to_2() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            1,  // ratio_in
            2,  // ratio_out  (1:2 exchange — 1 input for 2 output)
            500, // fee_bps (5%)
        );

        let (ratio_in, ratio_out) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in == 1);
        assert!(ratio_out == 2);
        assert!(depot::depot_fee_bps(&corridor, depot_id) == 500);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = depot::ERatioZero)]
fun test_ratio_in_zero_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // ratio_in = 0 should fail
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            0,  // ratio_in = 0 (invalid)
            1,
            100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = depot::ERatioZero)]
fun test_ratio_out_zero_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // ratio_out = 0 should fail
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            1,
            0,  // ratio_out = 0 (invalid)
            100,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_fee_bps_zero() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Zero fee should be valid (free exchange)
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            1, 1,
            0,  // zero fee
        );

        assert!(depot::depot_fee_bps(&corridor, depot_id) == 0);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_fee_bps_max() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Large fee (100% = 10000 bps)
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            10, 20,
            1, 1,
            10000,  // 100% fee
        );

        assert!(depot::depot_fee_bps(&corridor, depot_id) == 10000);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_update_existing_config() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Set initial config
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            100, 200,
            1, 1,
            50,
        );

        assert!(depot::depot_fee_bps(&corridor, depot_id) == 50);
        let (ratio_in, ratio_out) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in == 1 && ratio_out == 1);

        // Update config with new values
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            300, 400,
            2, 3,
            150,
        );

        assert!(depot::depot_fee_bps(&corridor, depot_id) == 150);
        let (ratio_in2, ratio_out2) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in2 == 2 && ratio_out2 == 3);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_depot_status_changes() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Config must exist first
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            100, 200, 1, 1, 50,
        );

        // Initial state: inactive
        assert!(!depot::is_depot_active(&corridor, depot_id));

        // Activate
        depot::activate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(depot::is_depot_active(&corridor, depot_id));

        // Deactivate
        depot::deactivate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(!depot::is_depot_active(&corridor, depot_id));

        // Re-activate
        depot::activate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(depot::is_depot_active(&corridor, depot_id));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_config_both_depots() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_a_id = object::id_from_address(DEPOT_A);
        let depot_b_id = object::id_from_address(DEPOT_B);

        // Configure depot A
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_a_id,
            100, 200,
            1, 2,
            100,
        );

        // Configure depot B with different params
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_b_id,
            300, 400,
            3, 1,
            250,
        );

        // Verify independent configs
        assert!(depot::depot_config_exists(&corridor, depot_a_id));
        assert!(depot::depot_config_exists(&corridor, depot_b_id));

        assert!(depot::depot_fee_bps(&corridor, depot_a_id) == 100);
        assert!(depot::depot_fee_bps(&corridor, depot_b_id) == 250);

        let (a_in, a_out) = depot::depot_ratio(&corridor, depot_a_id);
        assert!(a_in == 1 && a_out == 2);

        let (b_in, b_out) = depot::depot_ratio(&corridor, depot_b_id);
        assert!(b_in == 3 && b_out == 1);

        // Activate only depot A
        depot::activate_depot(&mut corridor, &owner_cap, depot_a_id);
        assert!(depot::is_depot_active(&corridor, depot_a_id));
        assert!(!depot::is_depot_active(&corridor, depot_b_id));

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = depot::EDepotMismatch)]
fun test_set_config_wrong_depot_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        // Use an ID that doesn't belong to this corridor
        let bad_depot_id = object::id_from_address(@0xDEAD);

        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            bad_depot_id,
            100, 200, 1, 1, 50,
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure]
fun test_set_config_wrong_owner_fails() {
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
        let mut corridor_1 = scenario.take_shared<Corridor>();
        let mut corridor_2 = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        let cap_corridor_id = corridor::corridor_id(&owner_cap);

        // Use the corridor that doesn't match the cap, with a depot_id from that corridor
        if (cap_corridor_id == object::id(&corridor_1)) {
            let depot_id = corridor::depot_a_id(&corridor_2);
            depot::set_depot_config(
                &mut corridor_2,
                &owner_cap,
                depot_id,
                100, 200, 1, 1, 50,
            );
        } else {
            let depot_id = corridor::depot_a_id(&corridor_1);
            depot::set_depot_config(
                &mut corridor_1,
                &owner_cap,
                depot_id,
                100, 200, 1, 1, 50,
            );
        };

        ts::return_shared(corridor_1);
        ts::return_shared(corridor_2);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = depot::EDepotNotConfigured)]
fun test_activate_unconfigured_depot_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Try to activate without setting config first
        depot::activate_depot(&mut corridor, &owner_cap, depot_id);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = depot::EDepotNotConfigured)]
fun test_deactivate_unconfigured_depot_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Try to deactivate without setting config first
        depot::deactivate_depot(&mut corridor, &owner_cap, depot_id);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_is_depot_active_no_config() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Without config, depot should report inactive and not existing
        assert!(!depot::depot_config_exists(&corridor, depot_id));
        assert!(!depot::is_depot_active(&corridor, depot_id));

        ts::return_shared(corridor);
    };

    scenario.end();
}

#[test]
fun test_update_config_preserves_active_status() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let depot_id = object::id_from_address(DEPOT_A);

        // Set config and activate
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            100, 200, 1, 1, 50,
        );
        depot::activate_depot(&mut corridor, &owner_cap, depot_id);
        assert!(depot::is_depot_active(&corridor, depot_id));

        // Update config — set_depot_config updates fields but does not touch is_active
        depot::set_depot_config(
            &mut corridor,
            &owner_cap,
            depot_id,
            300, 400, 2, 3, 100,
        );

        // Should still be active after update
        assert!(depot::is_depot_active(&corridor, depot_id));
        assert!(depot::depot_fee_bps(&corridor, depot_id) == 100);

        let (ratio_in, ratio_out) = depot::depot_ratio(&corridor, depot_id);
        assert!(ratio_in == 2 && ratio_out == 3);

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}
