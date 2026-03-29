import { Transaction } from "@mysten/sui/transactions";

/**
 * PTB builders for all FEN on-chain operations.
 * Each function returns a Transaction ready for signing.
 *
 * These match the published fen::corridor, fen::toll_gate, fen::depot,
 * fen::treasury, and fen::deepbook_adapter Move modules exactly.
 */

// --- Corridor Registration ---
// Move: fen::corridor::register_corridor(registry, source_gate_id, dest_gate_id, depot_a_id, depot_b_id, fee_recipient, name, clock, ctx)

export function buildRegisterCorridor({
  packageId,
  registryId,
  sourceGateId,
  destGateId,
  depotAId,
  depotBId,
  feeRecipient,
  name,
}: {
  packageId: string;
  registryId: string;
  sourceGateId: string;
  destGateId: string;
  depotAId: string;
  depotBId: string;
  feeRecipient: string;
  name: string;
}) {
  const tx = new Transaction();
  const nameBytes = new TextEncoder().encode(name);
  tx.moveCall({
    target: `${packageId}::corridor::register_corridor`,
    arguments: [
      tx.object(registryId),
      tx.pure.id(sourceGateId),
      tx.pure.id(destGateId),
      tx.pure.id(depotAId),
      tx.pure.id(depotBId),
      tx.pure.address(feeRecipient),
      tx.pure("vector<u8>", Array.from(nameBytes)),
      tx.object("0x6"), // Sui Clock shared object
    ],
  });
  return tx;
}

// Move: fen::corridor::activate_corridor(corridor, owner_cap, ctx)
export function buildActivateCorridor({
  packageId,
  corridorId,
  ownerCapId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::activate_corridor`,
    arguments: [tx.object(corridorId), tx.object(ownerCapId)],
  });
  return tx;
}

// Move: fen::corridor::deactivate_corridor(corridor, owner_cap, ctx)
export function buildDeactivateCorridor({
  packageId,
  corridorId,
  ownerCapId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::deactivate_corridor`,
    arguments: [tx.object(corridorId), tx.object(ownerCapId)],
  });
  return tx;
}

// Move: fen::corridor::update_fee_recipient(corridor, owner_cap, new_recipient)
export function buildUpdateFeeRecipient({
  packageId,
  corridorId,
  ownerCapId,
  newRecipient,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  newRecipient: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::update_fee_recipient`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.address(newRecipient),
    ],
  });
  return tx;
}

// --- Toll Gate Operations ---
// Move: fen::toll_gate::set_toll_config(corridor, owner_cap, gate_id, toll_amount)

export function buildSetTollConfig({
  packageId,
  corridorId,
  ownerCapId,
  gateId,
  tollAmount,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  gateId: string;
  tollAmount: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::set_toll_config`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(gateId),
      tx.pure.u64(tollAmount),
    ],
  });
  return tx;
}

// Move: fen::toll_gate::pay_toll_and_jump(corridor, source_gate, dest_gate, character, payment, clock, ctx)
export function buildPayTollAndJump({
  packageId,
  corridorId,
  sourceGateId,
  destGateId,
  characterId,
  paymentCoinId,
}: {
  packageId: string;
  corridorId: string;
  sourceGateId: string;
  destGateId: string;
  characterId: string;
  paymentCoinId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::pay_toll_and_jump`,
    arguments: [
      tx.object(corridorId),
      tx.object(sourceGateId),
      tx.object(destGateId),
      tx.object(characterId),
      tx.object(paymentCoinId),
      tx.object("0x6"), // Sui Clock
    ],
  });
  return tx;
}

// Move: fen::toll_gate::activate_surge(corridor, owner_cap, gate_id, surge_numerator)
export function buildActivateSurge({
  packageId,
  corridorId,
  ownerCapId,
  gateId,
  surgeNumerator,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  gateId: string;
  surgeNumerator: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::activate_surge`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(gateId),
      tx.pure.u64(surgeNumerator),
    ],
  });
  return tx;
}

// Move: fen::toll_gate::deactivate_surge(corridor, owner_cap, gate_id)
export function buildDeactivateSurge({
  packageId,
  corridorId,
  ownerCapId,
  gateId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  gateId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::deactivate_surge`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(gateId),
    ],
  });
  return tx;
}

// Move: fen::corridor::emergency_lock(corridor, owner_cap, ctx)
export function buildEmergencyLock({
  packageId,
  corridorId,
  ownerCapId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::emergency_lock`,
    arguments: [tx.object(corridorId), tx.object(ownerCapId)],
  });
  return tx;
}

// Move: fen::corridor::emergency_unlock(corridor, owner_cap, ctx)
export function buildEmergencyUnlock({
  packageId,
  corridorId,
  ownerCapId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::emergency_unlock`,
    arguments: [tx.object(corridorId), tx.object(ownerCapId)],
  });
  return tx;
}

// --- Depot Operations ---
// Move: fen::depot::set_depot_config(corridor, owner_cap, storage_unit_id, input_type_id, output_type_id, ratio_in, ratio_out, fee_bps)

export function buildSetDepotConfig({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
  inputTypeId,
  outputTypeId,
  ratioIn,
  ratioOut,
  feeBps,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
  inputTypeId: number;
  outputTypeId: number;
  ratioIn: number;
  ratioOut: number;
  feeBps: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::set_depot_config`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
      tx.pure.u64(inputTypeId),
      tx.pure.u64(outputTypeId),
      tx.pure.u64(ratioIn),
      tx.pure.u64(ratioOut),
      tx.pure.u64(feeBps),
    ],
  });
  return tx;
}

// Move: fen::depot::execute_trade(corridor, storage_unit, character, input_item, clock, ctx)
export function buildExecuteTrade({
  packageId,
  corridorId,
  storageUnitId,
  characterId,
  inputItemId,
}: {
  packageId: string;
  corridorId: string;
  storageUnitId: string;
  characterId: string;
  inputItemId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::execute_trade`,
    arguments: [
      tx.object(corridorId),
      tx.object(storageUnitId),
      tx.object(characterId),
      tx.object(inputItemId),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: fen::depot::activate_depot(corridor, owner_cap, storage_unit_id)
export function buildActivateDepot({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::activate_depot`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
    ],
  });
  return tx;
}

// Move: fen::depot::deactivate_depot(corridor, owner_cap, storage_unit_id)
export function buildDeactivateDepot({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::deactivate_depot`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
    ],
  });
  return tx;
}

// --- Treasury Operations ---
// Move: fen::treasury::create_treasury(corridor_id, owner_cap, fee_recipient, ctx)

export function buildCreateTreasury({
  packageId,
  corridorId,
  ownerCapId,
  feeRecipient,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  feeRecipient: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::create_treasury`,
    arguments: [
      tx.pure.id(corridorId),
      tx.object(ownerCapId),
      tx.pure.address(feeRecipient),
    ],
  });
  return tx;
}

// Move: fen::treasury::withdraw(treasury, owner_cap, amount, ctx)
export function buildWithdraw({
  packageId,
  treasuryId,
  ownerCapId,
  amount,
}: {
  packageId: string;
  treasuryId: string;
  ownerCapId: string;
  amount: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::withdraw`,
    arguments: [
      tx.object(treasuryId),
      tx.object(ownerCapId),
      tx.pure.u64(amount),
    ],
  });
  return tx;
}

// Move: fen::treasury::withdraw_all(treasury, owner_cap, ctx)
export function buildWithdrawAll({
  packageId,
  treasuryId,
  ownerCapId,
}: {
  packageId: string;
  treasuryId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::withdraw_all`,
    arguments: [tx.object(treasuryId), tx.object(ownerCapId)],
  });
  return tx;
}

// Move: fen::treasury::deposit(treasury, coin)
export function buildDeposit({
  packageId,
  treasuryId,
  coinId,
}: {
  packageId: string;
  treasuryId: string;
  coinId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::deposit`,
    arguments: [tx.object(treasuryId), tx.object(coinId)],
  });
  return tx;
}

// --- AMM Liquidity Pool Operations ---
// Move: fen::liquidity_pool::create_pool(corridor, owner_cap, storage_unit_id, item_type_id, fee_bps, initial_sui, initial_items)

export function buildCreatePool({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
  itemTypeId,
  feeBps,
  initialSuiAmount,
  initialItems,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
  itemTypeId: number;
  feeBps: number;
  initialSuiAmount: number;
  initialItems: number;
}) {
  const tx = new Transaction();
  const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(initialSuiAmount)]);
  tx.moveCall({
    target: `${packageId}::liquidity_pool::create_pool`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
      tx.pure.u64(itemTypeId),
      tx.pure.u64(feeBps),
      suiCoin,
      tx.pure.u64(initialItems),
    ],
  });
  return tx;
}

// Move: fen::liquidity_pool::activate_pool(corridor, owner_cap, storage_unit_id)
export function buildActivatePool({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::liquidity_pool::activate_pool`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
    ],
  });
  return tx;
}

// Move: fen::liquidity_pool::deactivate_pool(corridor, owner_cap, storage_unit_id)
export function buildDeactivatePool({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::liquidity_pool::deactivate_pool`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
    ],
  });
  return tx;
}

// Move: fen::liquidity_pool::add_liquidity(corridor, owner_cap, storage_unit_id, sui, additional_items)
export function buildAddLiquidity({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
  suiAmount,
  additionalItems,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
  suiAmount: number;
  additionalItems: number;
}) {
  const tx = new Transaction();
  const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(suiAmount)]);
  tx.moveCall({
    target: `${packageId}::liquidity_pool::add_liquidity`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
      suiCoin,
      tx.pure.u64(additionalItems),
    ],
  });
  return tx;
}

// Move: fen::liquidity_pool::remove_liquidity(corridor, owner_cap, storage_unit_id, sui_amount, items_to_remove, ctx)
export function buildRemoveLiquidity({
  packageId,
  corridorId,
  ownerCapId,
  storageUnitId,
  suiAmount,
  itemsToRemove,
}: {
  packageId: string;
  corridorId: string;
  ownerCapId: string;
  storageUnitId: string;
  suiAmount: number;
  itemsToRemove: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::liquidity_pool::remove_liquidity`,
    arguments: [
      tx.object(corridorId),
      tx.object(ownerCapId),
      tx.pure.id(storageUnitId),
      tx.pure.u64(suiAmount),
      tx.pure.u64(itemsToRemove),
    ],
  });
  return tx;
}

// Move: fen::liquidity_pool::sell_items(corridor, storage_unit, character, input_item, min_sui_out, clock, ctx)
export function buildSellItems({
  packageId,
  corridorId,
  storageUnitId,
  characterId,
  inputItemId,
  minSuiOut,
}: {
  packageId: string;
  corridorId: string;
  storageUnitId: string;
  characterId: string;
  inputItemId: string;
  minSuiOut: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::liquidity_pool::sell_items`,
    arguments: [
      tx.object(corridorId),
      tx.object(storageUnitId),
      tx.object(characterId),
      tx.object(inputItemId),
      tx.pure.u64(minSuiOut),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: fen::liquidity_pool::buy_items(corridor, storage_unit, character, payment, min_items_out, clock, ctx)
export function buildBuyItems({
  packageId,
  corridorId,
  storageUnitId,
  characterId,
  suiAmount,
  minItemsOut,
}: {
  packageId: string;
  corridorId: string;
  storageUnitId: string;
  characterId: string;
  suiAmount: number;
  minItemsOut: number;
}) {
  const tx = new Transaction();
  const [suiCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(suiAmount)]);
  tx.moveCall({
    target: `${packageId}::liquidity_pool::buy_items`,
    arguments: [
      tx.object(corridorId),
      tx.object(storageUnitId),
      tx.object(characterId),
      suiCoin,
      tx.pure.u64(minItemsOut),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// --- Composite: Toll + Trade in a single PTB ---

export function buildTollAndTrade({
  packageId,
  corridorId,
  sourceGateId,
  destGateId,
  characterId,
  tollAmount,
  storageUnitId,
  inputItemId,
}: {
  packageId: string;
  corridorId: string;
  sourceGateId: string;
  destGateId: string;
  characterId: string;
  tollAmount: number;
  storageUnitId: string;
  inputItemId: string;
}) {
  const tx = new Transaction();
  // Step 1: Split toll payment from gas
  const [tollCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(tollAmount)]);
  // Step 2: Pay toll and jump
  tx.moveCall({
    target: `${packageId}::toll_gate::pay_toll_and_jump`,
    arguments: [
      tx.object(corridorId),
      tx.object(sourceGateId),
      tx.object(destGateId),
      tx.object(characterId),
      tollCoin,
      tx.object("0x6"), // Clock
    ],
  });
  // Step 3: Execute trade at depot
  tx.moveCall({
    target: `${packageId}::depot::execute_trade`,
    arguments: [
      tx.object(corridorId),
      tx.object(storageUnitId),
      tx.object(characterId),
      tx.object(inputItemId),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// --- DeepBook Adapter Operations ---

// Move: fen::deepbook_adapter::link_balance_manager(registry, owner_cap, corridor_id, balance_manager_id, operator, ctx)
export function buildLinkBalanceManager({
  packageId,
  registryId,
  ownerCapId,
  corridorId,
  balanceManagerId,
  operator,
}: {
  packageId: string;
  registryId: string;
  ownerCapId: string;
  corridorId: string;
  balanceManagerId: string;
  operator: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::link_balance_manager`,
    arguments: [
      tx.object(registryId),
      tx.object(ownerCapId),
      tx.pure.id(corridorId),
      tx.pure.id(balanceManagerId),
      tx.pure.address(operator),
    ],
  });
  return tx;
}

// Move: fen::deepbook_adapter::unlink_balance_manager(registry, owner_cap, corridor_id)
export function buildUnlinkBalanceManager({
  packageId,
  registryId,
  ownerCapId,
  corridorId,
}: {
  packageId: string;
  registryId: string;
  ownerCapId: string;
  corridorId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::unlink_balance_manager`,
    arguments: [
      tx.object(registryId),
      tx.object(ownerCapId),
      tx.pure.id(corridorId),
    ],
  });
  return tx;
}

// Move: fen::deepbook_adapter::record_order_placed(registry, owner_cap, corridor_id, pool_id, is_bid, price, quantity, client_order_id)
export function buildRecordOrderPlaced({
  packageId,
  registryId,
  ownerCapId,
  corridorId,
  poolId,
  isBid,
  price,
  quantity,
  clientOrderId,
}: {
  packageId: string;
  registryId: string;
  ownerCapId: string;
  corridorId: string;
  poolId: string;
  isBid: boolean;
  price: number;
  quantity: number;
  clientOrderId: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::record_order_placed`,
    arguments: [
      tx.object(registryId),
      tx.object(ownerCapId),
      tx.pure.id(corridorId),
      tx.pure.id(poolId),
      tx.pure.bool(isBid),
      tx.pure.u64(price),
      tx.pure.u64(quantity),
      tx.pure.u64(clientOrderId),
    ],
  });
  return tx;
}

// --- EVE Frontier Extension Authorization ---
// Authorizes FEN's FenAuth witness type on a StorageUnit or Gate.
// Uses the 3-step borrow pattern: borrow OwnerCap from Character → authorize → return.

const WORLD_PACKAGE_ID = "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75";

export function buildAuthorizeStorageUnitExtension({
  fenPackageId,
  characterId,
  storageUnitId,
  ownerCapId,
}: {
  fenPackageId: string;
  characterId: string;
  storageUnitId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  const authType = `${fenPackageId}::toll_gate::FenAuth`;

  // Step 1: Borrow OwnerCap<StorageUnit> from Character
  const [cap, receipt] = tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [`${WORLD_PACKAGE_ID}::storage_unit::StorageUnit`],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });

  // Step 2: Authorize FenAuth extension on the StorageUnit
  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::storage_unit::authorize_extension`,
    typeArguments: [authType],
    arguments: [tx.object(storageUnitId), cap],
  });

  // Step 3: Return OwnerCap to Character
  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [`${WORLD_PACKAGE_ID}::storage_unit::StorageUnit`],
    arguments: [tx.object(characterId), cap, receipt],
  });

  return tx;
}

export function buildAuthorizeGateExtension({
  fenPackageId,
  characterId,
  gateId,
  ownerCapId,
}: {
  fenPackageId: string;
  characterId: string;
  gateId: string;
  ownerCapId: string;
}) {
  const tx = new Transaction();
  const authType = `${fenPackageId}::toll_gate::FenAuth`;

  const [cap, receipt] = tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::borrow_owner_cap`,
    typeArguments: [`${WORLD_PACKAGE_ID}::gate::Gate`],
    arguments: [tx.object(characterId), tx.object(ownerCapId)],
  });

  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::gate::authorize_extension`,
    typeArguments: [authType],
    arguments: [tx.object(gateId), cap],
  });

  tx.moveCall({
    target: `${WORLD_PACKAGE_ID}::character::return_owner_cap`,
    typeArguments: [`${WORLD_PACKAGE_ID}::gate::Gate`],
    arguments: [tx.object(characterId), cap, receipt],
  });

  return tx;
}
