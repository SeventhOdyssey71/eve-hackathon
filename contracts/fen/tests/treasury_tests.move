#[test_only]
module fen::treasury_tests;

use sui::test_scenario::{Self as ts};
use sui::clock;
use sui::coin;
use sui::sui::SUI;
use fen::corridor::{Self, CorridorRegistry, Corridor, CorridorOwnerCap};
use fen::treasury::{Self, Treasury};

const OWNER: address = @0xA;

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
            object::id_from_address(@0x3),
            object::id_from_address(@0x4),
            OWNER,
            b"Treasury Test",
            &clk,
            scenario.ctx(),
        );

        clock::destroy_for_testing(clk);
        ts::return_shared(registry);
    };
}

#[test]
fun test_create_treasury() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::create_treasury(
            object::id(&corridor),
            &owner_cap,
            OWNER,
            scenario.ctx(),
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let treasury = scenario.take_shared<Treasury>();
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::fee_recipient(&treasury) == OWNER);
        ts::return_shared(treasury);
    };

    scenario.end();
}

#[test]
fun test_deposit_and_withdraw() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::create_treasury(
            object::id(&corridor),
            &owner_cap,
            OWNER,
            scenario.ctx(),
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    // Deposit
    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let deposit_coin = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());

        treasury::deposit(&mut treasury, deposit_coin);
        assert!(treasury::balance_value(&treasury) == 1_000_000_000);
        assert!(treasury::total_deposited(&treasury) == 1_000_000_000);

        ts::return_shared(treasury);
    };

    // Withdraw partial
    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::withdraw(&mut treasury, &owner_cap, 500_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 500_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 500_000_000);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    // Withdraw all
    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::withdraw_all(&mut treasury, &owner_cap, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 1_000_000_000);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test, expected_failure(abort_code = treasury::EInsufficientBalance)]
fun test_withdraw_more_than_balance_fails() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::create_treasury(
            object::id(&corridor),
            &owner_cap,
            OWNER,
            scenario.ctx(),
        );

        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        // Try to withdraw from empty treasury
        treasury::withdraw(&mut treasury, &owner_cap, 1, scenario.ctx());

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_update_fee_recipient() {
    let new_recipient: address = @0xCAFE;

    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        assert!(treasury::fee_recipient(&treasury) == OWNER);
        treasury::update_fee_recipient(&mut treasury, &owner_cap, new_recipient);
        assert!(treasury::fee_recipient(&treasury) == new_recipient);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_multiple_deposits() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();

        let c1 = coin::mint_for_testing<SUI>(100_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c1);
        assert!(treasury::balance_value(&treasury) == 100_000_000);
        assert!(treasury::total_deposited(&treasury) == 100_000_000);

        let c2 = coin::mint_for_testing<SUI>(200_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c2);
        assert!(treasury::balance_value(&treasury) == 300_000_000);
        assert!(treasury::total_deposited(&treasury) == 300_000_000);

        let c3 = coin::mint_for_testing<SUI>(700_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c3);
        assert!(treasury::balance_value(&treasury) == 1_000_000_000);
        assert!(treasury::total_deposited(&treasury) == 1_000_000_000);

        ts::return_shared(treasury);
    };

    scenario.end();
}

#[test]
fun test_withdraw_all_empty_treasury() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::withdraw_all(&mut treasury, &owner_cap, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 0);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_deposit_withdraw_deposit_again() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        let c1 = coin::mint_for_testing<SUI>(500_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c1);

        treasury::withdraw(&mut treasury, &owner_cap, 200_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 300_000_000);

        let c2 = coin::mint_for_testing<SUI>(400_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c2);
        assert!(treasury::balance_value(&treasury) == 700_000_000);
        assert!(treasury::total_deposited(&treasury) == 900_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 200_000_000);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_treasury_corridor_id() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let cid = object::id(&corridor);
        treasury::create_treasury(cid, &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let treasury = scenario.take_shared<Treasury>();
        assert!(treasury::corridor_id(&treasury) == object::id(&corridor));
        ts::return_shared(treasury);
        ts::return_shared(corridor);
    };

    scenario.end();
}

// ===== Security & Edge-Case Tests =====

#[test]
fun test_three_deposits_verify_total() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();

        let c1 = coin::mint_for_testing<SUI>(111_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c1);

        let c2 = coin::mint_for_testing<SUI>(222_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c2);

        let c3 = coin::mint_for_testing<SUI>(333_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c3);

        assert!(treasury::balance_value(&treasury) == 666_000_000);
        assert!(treasury::total_deposited(&treasury) == 666_000_000);

        ts::return_shared(treasury);
    };

    scenario.end();
}

#[test]
fun test_withdraw_exact_balance() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let c = coin::mint_for_testing<SUI>(750_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c);
        ts::return_shared(treasury);
    };

    // Withdraw the exact full balance
    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        treasury::withdraw(&mut treasury, &owner_cap, 750_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 750_000_000);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_withdraw_zero() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        let c = coin::mint_for_testing<SUI>(500_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c);

        // Withdraw 0 — should succeed without changing balance
        treasury::withdraw(&mut treasury, &owner_cap, 0, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 500_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 0);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_deposit_after_partial_withdrawal() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        // Deposit 1 SUI
        let c1 = coin::mint_for_testing<SUI>(1_000_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c1);
        assert!(treasury::balance_value(&treasury) == 1_000_000_000);

        // Withdraw half
        treasury::withdraw(&mut treasury, &owner_cap, 400_000_000, scenario.ctx());
        assert!(treasury::balance_value(&treasury) == 600_000_000);

        // Deposit more
        let c2 = coin::mint_for_testing<SUI>(300_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c2);
        assert!(treasury::balance_value(&treasury) == 900_000_000);
        assert!(treasury::total_deposited(&treasury) == 1_300_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 400_000_000);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}

#[test]
fun test_treasury_tracks_totals() {
    let mut scenario = ts::begin(OWNER);
    setup_corridor(&mut scenario);

    scenario.next_tx(OWNER);
    {
        let corridor = scenario.take_shared<Corridor>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();
        treasury::create_treasury(object::id(&corridor), &owner_cap, OWNER, scenario.ctx());
        ts::return_shared(corridor);
        scenario.return_to_sender(owner_cap);
    };

    scenario.next_tx(OWNER);
    {
        let mut treasury = scenario.take_shared<Treasury>();
        let owner_cap = scenario.take_from_sender<CorridorOwnerCap>();

        // Verify initial state
        assert!(treasury::total_deposited(&treasury) == 0);
        assert!(treasury::total_withdrawn(&treasury) == 0);
        assert!(treasury::balance_value(&treasury) == 0);

        // Deposit 500
        let c1 = coin::mint_for_testing<SUI>(500_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c1);

        // Deposit 300
        let c2 = coin::mint_for_testing<SUI>(300_000_000, scenario.ctx());
        treasury::deposit(&mut treasury, c2);

        assert!(treasury::total_deposited(&treasury) == 800_000_000);

        // Withdraw 200
        treasury::withdraw(&mut treasury, &owner_cap, 200_000_000, scenario.ctx());
        assert!(treasury::total_withdrawn(&treasury) == 200_000_000);

        // Withdraw 100
        treasury::withdraw(&mut treasury, &owner_cap, 100_000_000, scenario.ctx());
        assert!(treasury::total_withdrawn(&treasury) == 300_000_000);

        // Final state: deposited=800M, withdrawn=300M, balance=500M
        assert!(treasury::balance_value(&treasury) == 500_000_000);
        assert!(treasury::total_deposited(&treasury) == 800_000_000);
        assert!(treasury::total_withdrawn(&treasury) == 300_000_000);

        ts::return_shared(treasury);
        scenario.return_to_sender(owner_cap);
    };

    scenario.end();
}
