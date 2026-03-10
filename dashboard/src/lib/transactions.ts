import { Transaction } from "@mysten/sui/transactions";

/**
 * PTB builders for all FEN on-chain operations.
 * Each function returns a Transaction ready for signing.
 *
 * Arguments match the Move function signatures exactly.
 * Admin operations require the AdminCap object ID.
 */

// --- Corridor Registration ---
// Move: register_corridor(registry, source_gate_id, dest_gate_id, depot_a_id, depot_b_id, fee_recipient, name, clock, ctx)

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

// Move: activate_corridor(corridor, ctx)
export function buildActivateCorridor({
  packageId,
  corridorId,
}: {
  packageId: string;
  corridorId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::activate_corridor`,
    arguments: [tx.object(corridorId)],
  });
  return tx;
}

// Move: deactivate_corridor(corridor, ctx)
export function buildDeactivateCorridor({
  packageId,
  corridorId,
}: {
  packageId: string;
  corridorId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::deactivate_corridor`,
    arguments: [tx.object(corridorId)],
  });
  return tx;
}

// Move: update_fee_recipient(corridor, new_recipient, ctx)
export function buildUpdateFeeRecipient({
  packageId,
  corridorId,
  newRecipient,
}: {
  packageId: string;
  corridorId: string;
  newRecipient: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::corridor::update_fee_recipient`,
    arguments: [tx.object(corridorId), tx.pure.address(newRecipient)],
  });
  return tx;
}

// --- Toll Gate Operations ---
// Move: set_toll_config(config, admin, gate_id, toll_amount, fee_recipient)

export function buildSetTollConfig({
  packageId,
  configId,
  adminCapId,
  gateId,
  tollAmount,
  feeRecipient,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  gateId: string;
  tollAmount: number;
  feeRecipient: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::set_toll_config`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(gateId),
      tx.pure.u64(tollAmount),
      tx.pure.address(feeRecipient),
    ],
  });
  return tx;
}

// Move: pay_toll_and_jump(config, source_gate, destination_gate, character, payment, clock, ctx)
export function buildPayTollAndJump({
  packageId,
  configId,
  sourceGateId,
  destGateId,
  characterId,
  paymentCoinId,
}: {
  packageId: string;
  configId: string;
  sourceGateId: string;
  destGateId: string;
  characterId: string;
  paymentCoinId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::pay_toll_and_jump`,
    arguments: [
      tx.object(configId),
      tx.object(sourceGateId),
      tx.object(destGateId),
      tx.object(characterId),
      tx.object(paymentCoinId),
      tx.object("0x6"), // Sui Clock
    ],
  });
  return tx;
}

// Move: activate_surge(config, admin, gate_id, surge_numerator)
export function buildActivateSurge({
  packageId,
  configId,
  adminCapId,
  gateId,
  surgeNumerator,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  gateId: string;
  surgeNumerator: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::activate_surge`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(gateId),
      tx.pure.u64(surgeNumerator),
    ],
  });
  return tx;
}

// Move: deactivate_surge(config, admin, gate_id)
export function buildDeactivateSurge({
  packageId,
  configId,
  adminCapId,
  gateId,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  gateId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::deactivate_surge`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(gateId),
    ],
  });
  return tx;
}

// Move: emergency_lock(config, admin, gate_id)
export function buildEmergencyLock({
  packageId,
  configId,
  adminCapId,
  gateId,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  gateId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::emergency_lock`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(gateId),
    ],
  });
  return tx;
}

// Move: emergency_unlock(config, admin, gate_id)
export function buildEmergencyUnlock({
  packageId,
  configId,
  adminCapId,
  gateId,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  gateId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::toll_gate::emergency_unlock`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(gateId),
    ],
  });
  return tx;
}

// --- Depot Operations ---
// Move: set_depot_config(config, admin, storage_unit_id, input_type_id, output_type_id, ratio_in, ratio_out, fee_bps)

export function buildSetDepotConfig({
  packageId,
  configId,
  adminCapId,
  storageUnitId,
  inputTypeId,
  outputTypeId,
  ratioIn,
  ratioOut,
  feeBps,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
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
      tx.object(configId),
      tx.object(adminCapId),
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

// Move: execute_trade(config, storage_unit, character, input_item, ctx)
export function buildExecuteTrade({
  packageId,
  configId,
  storageUnitId,
  characterId,
  inputItemId,
}: {
  packageId: string;
  configId: string;
  storageUnitId: string;
  characterId: string;
  inputItemId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::execute_trade`,
    arguments: [
      tx.object(configId),
      tx.object(storageUnitId),
      tx.object(characterId),
      tx.object(inputItemId),
    ],
  });
  return tx;
}

// Move: activate_depot(config, admin, storage_unit_id)
export function buildActivateDepot({
  packageId,
  configId,
  adminCapId,
  storageUnitId,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  storageUnitId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::activate_depot`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(storageUnitId),
    ],
  });
  return tx;
}

// Move: deactivate_depot(config, admin, storage_unit_id)
export function buildDeactivateDepot({
  packageId,
  configId,
  adminCapId,
  storageUnitId,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  storageUnitId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::depot::deactivate_depot`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(storageUnitId),
    ],
  });
  return tx;
}

// --- Treasury Operations ---
// Move: withdraw(treasury, amount, ctx)

export function buildWithdraw({
  packageId,
  treasuryId,
  amount,
}: {
  packageId: string;
  treasuryId: string;
  amount: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::withdraw`,
    arguments: [tx.object(treasuryId), tx.pure.u64(amount)],
  });
  return tx;
}

// Move: withdraw_all(treasury, ctx)
export function buildWithdrawAll({
  packageId,
  treasuryId,
}: {
  packageId: string;
  treasuryId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::withdraw_all`,
    arguments: [tx.object(treasuryId)],
  });
  return tx;
}

// Move: create_treasury(corridor_id, fee_recipient, ctx)
export function buildCreateTreasury({
  packageId,
  corridorId,
  feeRecipient,
}: {
  packageId: string;
  corridorId: string;
  feeRecipient: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::treasury::create_treasury`,
    arguments: [tx.pure.id(corridorId), tx.pure.address(feeRecipient)],
  });
  return tx;
}

// --- DeepBook Adapter Operations ---

// Move: create_balance_manager(ctx) -> BalanceManager
export function buildCreateBalanceManager({
  packageId,
}: {
  packageId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::create_balance_manager`,
  });
  return tx;
}

// Move: link_balance_manager(config, admin, corridor_id, balance_manager_id, operator)
export function buildLinkBalanceManager({
  packageId,
  configId,
  adminCapId,
  corridorId,
  balanceManagerId,
  operator,
}: {
  packageId: string;
  configId: string;
  adminCapId: string;
  corridorId: string;
  balanceManagerId: string;
  operator: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::link_balance_manager`,
    arguments: [
      tx.object(configId),
      tx.object(adminCapId),
      tx.pure.id(corridorId),
      tx.pure.id(balanceManagerId),
      tx.pure.address(operator),
    ],
  });
  return tx;
}

// Move: deposit_sui(balance_manager, coin, ctx)
export function buildDepositSui({
  packageId,
  balanceManagerId,
  coinId,
}: {
  packageId: string;
  balanceManagerId: string;
  coinId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::deposit_sui`,
    arguments: [tx.object(balanceManagerId), tx.object(coinId)],
  });
  return tx;
}

// Move: deposit_deep(balance_manager, coin, ctx)
export function buildDepositDeep({
  packageId,
  balanceManagerId,
  coinId,
}: {
  packageId: string;
  balanceManagerId: string;
  coinId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::deposit_deep`,
    arguments: [tx.object(balanceManagerId), tx.object(coinId)],
  });
  return tx;
}

// Move: withdraw_sui(balance_manager, amount, ctx) -> Coin<SUI>
export function buildWithdrawSui({
  packageId,
  balanceManagerId,
  amount,
}: {
  packageId: string;
  balanceManagerId: string;
  amount: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::withdraw_sui`,
    arguments: [tx.object(balanceManagerId), tx.pure.u64(amount)],
  });
  return tx;
}

// Move: withdraw_deep(balance_manager, amount, ctx) -> Coin<DEEP>
export function buildWithdrawDeep({
  packageId,
  balanceManagerId,
  amount,
}: {
  packageId: string;
  balanceManagerId: string;
  amount: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::withdraw_deep`,
    arguments: [tx.object(balanceManagerId), tx.pure.u64(amount)],
  });
  return tx;
}

// Move: swap_sui_for_deep(pool, sui_in, deep_fee, min_deep_out, clock, ctx)
export function buildSwapSuiForDeep({
  packageId,
  poolId,
  suiCoinId,
  deepFeeCoinId,
  minDeepOut,
}: {
  packageId: string;
  poolId: string;
  suiCoinId: string;
  deepFeeCoinId: string;
  minDeepOut: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::swap_sui_for_deep`,
    arguments: [
      tx.object(poolId),
      tx.object(suiCoinId),
      tx.object(deepFeeCoinId),
      tx.pure.u64(minDeepOut),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: swap_deep_for_sui(pool, deep_in, deep_fee, min_sui_out, clock, ctx)
export function buildSwapDeepForSui({
  packageId,
  poolId,
  deepCoinId,
  deepFeeCoinId,
  minSuiOut,
}: {
  packageId: string;
  poolId: string;
  deepCoinId: string;
  deepFeeCoinId: string;
  minSuiOut: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::swap_deep_for_sui`,
    arguments: [
      tx.object(poolId),
      tx.object(deepCoinId),
      tx.object(deepFeeCoinId),
      tx.pure.u64(minSuiOut),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: place_limit_order<B,Q>(pool, bm, client_order_id, order_type, price, quantity, is_bid, expire_timestamp, clock, ctx)
export function buildPlaceLimitOrder({
  packageId,
  poolId,
  balanceManagerId,
  baseType,
  quoteType,
  clientOrderId,
  orderType,
  price,
  quantity,
  isBid,
  expireTimestamp,
}: {
  packageId: string;
  poolId: string;
  balanceManagerId: string;
  baseType: string;
  quoteType: string;
  clientOrderId: number;
  orderType: number;
  price: number;
  quantity: number;
  isBid: boolean;
  expireTimestamp: number;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::place_limit_order`,
    typeArguments: [baseType, quoteType],
    arguments: [
      tx.object(poolId),
      tx.object(balanceManagerId),
      tx.pure.u64(clientOrderId),
      tx.pure.u8(orderType),
      tx.pure.u64(price),
      tx.pure.u64(quantity),
      tx.pure.bool(isBid),
      tx.pure.u64(expireTimestamp),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: place_market_order<B,Q>(pool, bm, client_order_id, quantity, is_bid, clock, ctx)
export function buildPlaceMarketOrder({
  packageId,
  poolId,
  balanceManagerId,
  baseType,
  quoteType,
  clientOrderId,
  quantity,
  isBid,
}: {
  packageId: string;
  poolId: string;
  balanceManagerId: string;
  baseType: string;
  quoteType: string;
  clientOrderId: number;
  quantity: number;
  isBid: boolean;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::place_market_order`,
    typeArguments: [baseType, quoteType],
    arguments: [
      tx.object(poolId),
      tx.object(balanceManagerId),
      tx.pure.u64(clientOrderId),
      tx.pure.u64(quantity),
      tx.pure.bool(isBid),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: cancel_order<B,Q>(pool, bm, order_id, clock, ctx)
export function buildCancelOrder({
  packageId,
  poolId,
  balanceManagerId,
  baseType,
  quoteType,
  orderId,
}: {
  packageId: string;
  poolId: string;
  balanceManagerId: string;
  baseType: string;
  quoteType: string;
  orderId: string; // u128 as string
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::cancel_order`,
    typeArguments: [baseType, quoteType],
    arguments: [
      tx.object(poolId),
      tx.object(balanceManagerId),
      tx.pure.u128(BigInt(orderId)),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: cancel_all_orders<B,Q>(pool, bm, clock, ctx)
export function buildCancelAllOrders({
  packageId,
  poolId,
  balanceManagerId,
  baseType,
  quoteType,
}: {
  packageId: string;
  poolId: string;
  balanceManagerId: string;
  baseType: string;
  quoteType: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::cancel_all_orders`,
    typeArguments: [baseType, quoteType],
    arguments: [
      tx.object(poolId),
      tx.object(balanceManagerId),
      tx.object("0x6"), // Clock
    ],
  });
  return tx;
}

// Move: claim_rebates<B,Q>(pool, bm, ctx)
export function buildClaimRebates({
  packageId,
  poolId,
  balanceManagerId,
  baseType,
  quoteType,
}: {
  packageId: string;
  poolId: string;
  balanceManagerId: string;
  baseType: string;
  quoteType: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::claim_rebates`,
    typeArguments: [baseType, quoteType],
    arguments: [tx.object(poolId), tx.object(balanceManagerId)],
  });
  return tx;
}

// Move: mint_trade_cap(balance_manager, ctx) -> TradeCap
export function buildMintTradeCap({
  packageId,
  balanceManagerId,
}: {
  packageId: string;
  balanceManagerId: string;
}) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::deepbook_adapter::mint_trade_cap`,
    arguments: [tx.object(balanceManagerId)],
  });
  return tx;
}
