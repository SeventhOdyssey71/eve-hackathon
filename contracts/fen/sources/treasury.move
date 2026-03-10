/// Frontier Exchange Network — Treasury
///
/// Each corridor can have a treasury that accumulates SUI from toll payments.
/// The corridor owner can withdraw accumulated funds to the fee recipient address.
module fen::treasury;

use sui::{
    balance::{Self, Balance},
    coin::{Self, Coin},
    event,
    sui::SUI,
};
use fen::corridor::{Self, CorridorOwnerCap};

// === Errors ===
#[error(code = 0)]
const ENotOwner: vector<u8> = b"Not the treasury owner";
#[error(code = 1)]
const EInsufficientBalance: vector<u8> = b"Insufficient treasury balance";

// === Structs ===

/// Shared treasury object linked to a corridor.
public struct Treasury has key {
    id: UID,
    corridor_id: ID,
    fee_recipient: address,
    balance: Balance<SUI>,
    total_deposited: u64,
    total_withdrawn: u64,
}

// === Events ===
public struct TreasuryCreatedEvent has copy, drop {
    treasury_id: ID,
    corridor_id: ID,
    fee_recipient: address,
}

public struct DepositEvent has copy, drop {
    treasury_id: ID,
    amount: u64,
}

public struct WithdrawEvent has copy, drop {
    treasury_id: ID,
    amount: u64,
    recipient: address,
}

// === Public Functions ===

/// Create a new treasury for a corridor.
public fun create_treasury(
    corridor_id: ID,
    owner_cap: &CorridorOwnerCap,
    fee_recipient: address,
    ctx: &mut TxContext,
) {
    assert!(corridor::corridor_id(owner_cap) == corridor_id, ENotOwner);

    let treasury_uid = object::new(ctx);
    let treasury_id = object::uid_to_inner(&treasury_uid);

    let treasury = Treasury {
        id: treasury_uid,
        corridor_id,
        fee_recipient,
        balance: balance::zero(),
        total_deposited: 0,
        total_withdrawn: 0,
    };

    event::emit(TreasuryCreatedEvent {
        treasury_id,
        corridor_id,
        fee_recipient,
    });

    transfer::share_object(treasury);
}

/// Deposit SUI into the treasury (e.g., from toll collection).
public fun deposit(treasury: &mut Treasury, coin: Coin<SUI>) {
    let amount = coin::value(&coin);
    balance::join(&mut treasury.balance, coin::into_balance(coin));
    treasury.total_deposited = treasury.total_deposited + amount;

    event::emit(DepositEvent {
        treasury_id: object::id(treasury),
        amount,
    });
}

/// Withdraw a specific amount from the treasury.
public fun withdraw(
    treasury: &mut Treasury,
    owner_cap: &CorridorOwnerCap,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(corridor::corridor_id(owner_cap) == treasury.corridor_id, ENotOwner);
    assert!(balance::value(&treasury.balance) >= amount, EInsufficientBalance);

    let withdrawn = coin::from_balance(balance::split(&mut treasury.balance, amount), ctx);
    treasury.total_withdrawn = treasury.total_withdrawn + amount;

    event::emit(WithdrawEvent {
        treasury_id: object::id(treasury),
        amount,
        recipient: treasury.fee_recipient,
    });

    transfer::public_transfer(withdrawn, treasury.fee_recipient);
}

/// Withdraw all funds from the treasury.
public fun withdraw_all(
    treasury: &mut Treasury,
    owner_cap: &CorridorOwnerCap,
    ctx: &mut TxContext,
) {
    assert!(corridor::corridor_id(owner_cap) == treasury.corridor_id, ENotOwner);

    let amount = balance::value(&treasury.balance);
    if (amount == 0) return;

    let withdrawn = coin::from_balance(balance::split(&mut treasury.balance, amount), ctx);
    treasury.total_withdrawn = treasury.total_withdrawn + amount;

    event::emit(WithdrawEvent {
        treasury_id: object::id(treasury),
        amount,
        recipient: treasury.fee_recipient,
    });

    transfer::public_transfer(withdrawn, treasury.fee_recipient);
}

/// Update the fee recipient for future withdrawals.
public fun update_fee_recipient(
    treasury: &mut Treasury,
    owner_cap: &CorridorOwnerCap,
    new_recipient: address,
) {
    assert!(corridor::corridor_id(owner_cap) == treasury.corridor_id, ENotOwner);
    treasury.fee_recipient = new_recipient;
}

// === View Functions ===
public fun corridor_id(treasury: &Treasury): ID { treasury.corridor_id }
public fun fee_recipient(treasury: &Treasury): address { treasury.fee_recipient }
public fun balance_value(treasury: &Treasury): u64 { balance::value(&treasury.balance) }
public fun total_deposited(treasury: &Treasury): u64 { treasury.total_deposited }
public fun total_withdrawn(treasury: &Treasury): u64 { treasury.total_withdrawn }
