#[test_only]
module fen::deepbook_adapter_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use fen::corridor::{Self, CorridorRegistry, Corridor, CorridorOwnerCap};
use fen::deepbook_adapter::{Self, BalanceManagerRegistry};

const OWNER: address = @0xA;
const OTHER: address = @0xB;
const OPERATOR: address = @0xC;

fun setup(scenario: &mut ts::Scenario) {
    scenario.next_tx(OWNER);
    {
        corridor::init_for_testing(scenario.ctx());
        deepbook_adapter::init_for_testing(scenario.ctx());
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
            b"DeepBook Test Corridor",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };
}

// ===== Link / Unlink Tests =====

#[test]
fun test_link_balance_manager() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);
        let bm_id = object::id_from_address(@0xB0);

        assert!(!deepbook_adapter::has_balance_manager(&db_registry, corridor_id));

        deepbook_adapter::link_balance_manager(
            &mut db_registry,
            &owner_cap,
            corridor_id,
            bm_id,
            OPERATOR,
            scenario.ctx(),
        );

        assert!(deepbook_adapter::has_balance_manager(&db_registry, corridor_id));
        assert!(deepbook_adapter::balance_manager_id(&db_registry, corridor_id) == bm_id);
        assert!(deepbook_adapter::balance_manager_operator(&db_registry, corridor_id) == OPERATOR);

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_unlink_balance_manager() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);
        let bm_id = object::id_from_address(@0xB0);

        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id, bm_id, OPERATOR, scenario.ctx(),
        );
        assert!(deepbook_adapter::has_balance_manager(&db_registry, corridor_id));

        deepbook_adapter::unlink_balance_manager(&mut db_registry, &owner_cap, corridor_id);
        assert!(!deepbook_adapter::has_balance_manager(&db_registry, corridor_id));

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_relink_after_unlink() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);
        let bm_id1 = object::id_from_address(@0xB1);
        let bm_id2 = object::id_from_address(@0xB2);

        // Link first manager
        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id, bm_id1, OPERATOR, scenario.ctx(),
        );
        assert!(deepbook_adapter::balance_manager_id(&db_registry, corridor_id) == bm_id1);

        // Unlink
        deepbook_adapter::unlink_balance_manager(&mut db_registry, &owner_cap, corridor_id);

        // Link a different manager
        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id, bm_id2, OTHER, scenario.ctx(),
        );
        assert!(deepbook_adapter::balance_manager_id(&db_registry, corridor_id) == bm_id2);
        assert!(deepbook_adapter::balance_manager_operator(&db_registry, corridor_id) == OTHER);

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== Order Recording Tests =====

#[test]
fun test_record_order_placed() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);
        let bm_id = object::id_from_address(@0xB0);
        let pool_id = object::id_from_address(@0xAA01);

        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id, bm_id, OPERATOR, scenario.ctx(),
        );

        // Record a bid order
        deepbook_adapter::record_order_placed(
            &db_registry,
            &owner_cap,
            corridor_id,
            pool_id,
            true,   // is_bid
            1000,   // price
            50,     // quantity
            1,      // client_order_id
        );

        // Record an ask order
        deepbook_adapter::record_order_placed(
            &db_registry,
            &owner_cap,
            corridor_id,
            pool_id,
            false,  // is_ask
            2000,
            25,
            2,
        );

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_record_orders_cancelled() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);
        let bm_id = object::id_from_address(@0xB0);
        let pool_id = object::id_from_address(@0xAA01);

        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id, bm_id, OPERATOR, scenario.ctx(),
        );

        deepbook_adapter::record_orders_cancelled(
            &db_registry,
            &owner_cap,
            corridor_id,
            pool_id,
        );

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== Error: Wrong Owner =====

#[test, expected_failure(abort_code = deepbook_adapter::ENotOwner)]
fun test_link_wrong_owner_fails() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    // Register second corridor with OTHER
    scenario.next_tx(OTHER);
    {
        let mut registry = scenario.take_shared<CorridorRegistry>();
        let clk = clock::create_for_testing(scenario.ctx());
        corridor::register_corridor(
            &mut registry,
            object::id_from_address(@0x10), object::id_from_address(@0x20),
            object::id_from_address(@0x30), object::id_from_address(@0x40),
            OTHER, b"Other Corridor", &clk, scenario.ctx(),
        );
        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };

    // OWNER tries to link manager to OTHER's corridor using OWNER's cap
    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        // Use a corridor_id that doesn't match OWNER's cap
        let fake_corridor_id = object::id_from_address(@0xFA1E);

        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, fake_corridor_id,
            object::id_from_address(@0xB0), OPERATOR, scenario.ctx(),
        );

        ts::return_shared(db_registry);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== Error: Already Linked =====

#[test, expected_failure(abort_code = deepbook_adapter::EManagerAlreadyLinked)]
fun test_double_link_fails() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);

        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id,
            object::id_from_address(@0xB1), OPERATOR, scenario.ctx(),
        );

        // Try linking again
        deepbook_adapter::link_balance_manager(
            &mut db_registry, &owner_cap, corridor_id,
            object::id_from_address(@0xB2), OPERATOR, scenario.ctx(),
        );

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

// ===== Error: Not Linked =====

#[test, expected_failure(abort_code = deepbook_adapter::EManagerNotLinked)]
fun test_unlink_not_linked_fails() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let mut db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);

        deepbook_adapter::unlink_balance_manager(&mut db_registry, &owner_cap, corridor_id);

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = deepbook_adapter::EManagerNotLinked)]
fun test_record_order_not_linked_fails() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);

        deepbook_adapter::record_order_placed(
            &db_registry, &owner_cap, corridor_id,
            object::id_from_address(@0xAA01),
            true, 1000, 50, 1,
        );

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = deepbook_adapter::EManagerNotLinked)]
fun test_cancel_orders_not_linked_fails() {
    let mut scenario = ts::begin(OWNER);
    setup(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let db_registry = scenario.take_shared<BalanceManagerRegistry>();
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let corridor_id = object::id(&corridor);

        deepbook_adapter::record_orders_cancelled(
            &db_registry, &owner_cap, corridor_id,
            object::id_from_address(@0xAA01),
        );

        ts::return_shared(db_registry);
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}
