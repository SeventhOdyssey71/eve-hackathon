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
