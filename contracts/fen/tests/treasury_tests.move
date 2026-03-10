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
