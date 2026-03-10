/// FEN Shared Configuration
///
/// Shared config object for all FEN extensions. Uses Sui dynamic fields
/// to store typed configuration per corridor, gate, and depot.
/// Pattern borrowed from world-contracts/extension_examples/config.move.
module fen::config;

use sui::dynamic_field as df;

// === Errors ===
const ERuleAlreadyExists: u64 = 1;
const ERuleDoesNotExist: u64 = 2;

// === Structs ===

/// Shared configuration object for the entire FEN deployment.
/// Extensions attach their own typed config as dynamic fields.
public struct FenConfig has key {
    id: UID,
}

/// Admin capability for managing FEN configuration.
public struct AdminCap has key, store {
    id: UID,
}

// === Init ===

fun init(ctx: &mut TxContext) {
    let config = FenConfig { id: object::new(ctx) };
    transfer::share_object(config);

    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());
}

// === Public Functions ===

/// Check if a rule exists under a given key.
public fun has_rule<K: copy + drop + store, V: store>(
    config: &FenConfig,
    key: K,
): bool {
    df::exists_with_type<K, V>(&config.id, key)
}

/// Borrow a rule (read-only).
public fun borrow_rule<K: copy + drop + store, V: store>(
    config: &FenConfig,
    key: K,
): &V {
    assert!(df::exists_with_type<K, V>(&config.id, key), ERuleDoesNotExist);
    df::borrow<K, V>(&config.id, key)
}

// === Admin Functions ===

/// Borrow a rule mutably (requires AdminCap).
public fun borrow_rule_mut<K: copy + drop + store, V: store>(
    config: &mut FenConfig,
    _admin: &AdminCap,
    key: K,
): &mut V {
    assert!(df::exists_with_type<K, V>(&config.id, key), ERuleDoesNotExist);
    df::borrow_mut<K, V>(&mut config.id, key)
}

/// Add a new rule. Aborts if key already exists.
public fun add_rule<K: copy + drop + store, V: store>(
    config: &mut FenConfig,
    _admin: &AdminCap,
    key: K,
    value: V,
) {
    assert!(!df::exists_with_type<K, V>(&config.id, key), ERuleAlreadyExists);
    df::add<K, V>(&mut config.id, key, value);
}

/// Set a rule (insert or overwrite).
public fun set_rule<K: copy + drop + store, V: store + drop>(
    config: &mut FenConfig,
    _admin: &AdminCap,
    key: K,
    value: V,
) {
    if (df::exists_with_type<K, V>(&config.id, key)) {
        let existing = df::borrow_mut<K, V>(&mut config.id, key);
        *existing = value;
    } else {
        df::add<K, V>(&mut config.id, key, value);
    }
}

/// Remove a rule and return the value.
public fun remove_rule<K: copy + drop + store, V: store>(
    config: &mut FenConfig,
    _admin: &AdminCap,
    key: K,
): V {
    assert!(df::exists_with_type<K, V>(&config.id, key), ERuleDoesNotExist);
    df::remove<K, V>(&mut config.id, key)
}
