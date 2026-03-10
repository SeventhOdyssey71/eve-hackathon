/// FEN Treasury
///
/// Manages accumulated corridor revenue. Toll and trade fees flow here
/// and can be withdrawn by the corridor's fee recipient.
///
/// Revenue flows:
///   toll_gate -> pay_toll_and_jump -> SUI sent to fee_recipient directly
///   depot -> execute_trade -> fee portion tracked here for withdrawal
///
/// For MVP, toll revenue goes directly to fee_recipient via coin::split
/// in toll_gate.move. This module tracks aggregate stats and handles
/// any pooled revenue that needs explicit withdrawal.
module fen::treasury;

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::event;

// === Errors ===
const ENotRecipient: u64 = 1;
const EInsufficientBalance: u64 = 2;

// === Structs ===

/// Treasury vault for a single corridor.
/// Holds pooled trade fees until withdrawn by the fee recipient.
public struct Treasury has key {
    id: UID,
    /// The corridor this treasury belongs to
    corridor_id: ID,
    /// Who can withdraw from this treasury
    fee_recipient: address,
    /// Accumulated balance
    balance: Balance<SUI>,
    /// Total ever withdrawn
    total_withdrawn: u64,
}

// === Events ===

public struct TreasuryDepositEvent has copy, drop {
    treasury_id: ID,
    corridor_id: ID,
    amount: u64,
}

public struct TreasuryWithdrawEvent has copy, drop {
    treasury_id: ID,
    corridor_id: ID,
    amount: u64,
    recipient: address,
}

// === Public Functions ===

/// Create a treasury for a corridor.
public fun create_treasury(
    corridor_id: ID,
    fee_recipient: address,
    ctx: &mut TxContext,
): ID {
    let treasury = Treasury {
        id: object::new(ctx),
        corridor_id,
        fee_recipient,
        balance: balance::zero(),
        total_withdrawn: 0,
    };
    let id = object::id(&treasury);
    transfer::share_object(treasury);
    id
}

/// Deposit revenue into the treasury (called by depot after trades).
public(package) fun deposit(
    treasury: &mut Treasury,
    payment: Coin<SUI>,
) {
    let amount = coin::value(&payment);
    let payment_balance = coin::into_balance(payment);
    balance::join(&mut treasury.balance, payment_balance);

    event::emit(TreasuryDepositEvent {
        treasury_id: object::id(treasury),
        corridor_id: treasury.corridor_id,
        amount,
    });
}

/// Withdraw accumulated revenue. Only fee recipient can call.
public fun withdraw(
    treasury: &mut Treasury,
    amount: u64,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == treasury.fee_recipient, ENotRecipient);
    assert!(balance::value(&treasury.balance) >= amount, EInsufficientBalance);

    let withdrawn = coin::take(&mut treasury.balance, amount, ctx);
    treasury.total_withdrawn = treasury.total_withdrawn + amount;

    event::emit(TreasuryWithdrawEvent {
        treasury_id: object::id(treasury),
        corridor_id: treasury.corridor_id,
        amount,
        recipient: treasury.fee_recipient,
    });

    transfer::public_transfer(withdrawn, treasury.fee_recipient);
}

/// Withdraw all accumulated revenue.
public fun withdraw_all(
    treasury: &mut Treasury,
    ctx: &mut TxContext,
) {
    let amount = balance::value(&treasury.balance);
    if (amount > 0) {
        withdraw(treasury, amount, ctx);
    };
}

// === View Functions ===

public fun corridor_id(treasury: &Treasury): ID { treasury.corridor_id }
public fun fee_recipient(treasury: &Treasury): address { treasury.fee_recipient }
public fun balance_value(treasury: &Treasury): u64 { balance::value(&treasury.balance) }
public fun total_withdrawn(treasury: &Treasury): u64 { treasury.total_withdrawn }
