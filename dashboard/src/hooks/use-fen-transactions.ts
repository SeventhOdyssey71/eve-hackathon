"use client";

import { useCallback, useState } from "react";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";
import {
  buildRegisterCorridor,
  buildSetTollConfig,
  buildActivateSurge,
  buildDeactivateSurge,
  buildEmergencyLock,
  buildEmergencyUnlock,
  buildSetDepotConfig,
  buildWithdrawAll,
  buildActivateCorridor,
  buildDeactivateCorridor,
  buildLinkBalanceManager,
  buildUnlinkBalanceManager,
  buildRecordOrderPlaced,
  buildCreateTreasury,
  buildWithdraw,
  buildActivateDepot,
  buildDeactivateDepot,
} from "@/lib/transactions";
import type { Transaction } from "@mysten/sui/transactions";

type TxStatus = "idle" | "pending" | "success" | "error";

function useFenTx() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("fenPackageId");
  const registryId = useNetworkVariable("corridorRegistryId");

  const execute = useCallback(
    async (buildTx: () => Transaction) => {
      if (!account) {
        setError("Connect your wallet first");
        setStatus("error");
        return null;
      }
      setStatus("pending");
      setError(null);
      try {
        const tx = buildTx();
        const result = await signAndExecute({ transaction: tx });
        setDigest(result.digest);
        setStatus("success");
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [account, signAndExecute]
  );

  return { status, error, digest, execute, account, packageId, registryId };
}

export function useRegisterCorridor() {
  const { execute, ...rest } = useFenTx();

  const registerCorridor = useCallback(
    (params: {
      name: string;
      sourceGateId: string;
      destGateId: string;
      depotAId: string;
      depotBId: string;
      feeRecipient: string;
    }) =>
      execute(() =>
        buildRegisterCorridor({
          packageId: rest.packageId,
          registryId: rest.registryId,
          ...params,
        })
      ),
    [execute, rest.packageId, rest.registryId]
  );

  return { registerCorridor, ...rest };
}

export function useSetTollConfig() {
  const { execute, ...rest } = useFenTx();

  const setTollConfig = useCallback(
    (corridorId: string, ownerCapId: string, gateId: string, tollAmount: number) =>
      execute(() =>
        buildSetTollConfig({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
          gateId,
          tollAmount,
        })
      ),
    [execute, rest.packageId]
  );

  return { setTollConfig, ...rest };
}

export function useSurgeControl() {
  const { execute, ...rest } = useFenTx();

  const activateSurge = useCallback(
    (corridorId: string, ownerCapId: string, gateId: string, surgeNumerator: number) =>
      execute(() =>
        buildActivateSurge({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
          gateId,
          surgeNumerator,
        })
      ),
    [execute, rest.packageId]
  );

  const deactivateSurge = useCallback(
    (corridorId: string, ownerCapId: string, gateId: string) =>
      execute(() =>
        buildDeactivateSurge({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
          gateId,
        })
      ),
    [execute, rest.packageId]
  );

  return { activateSurge, deactivateSurge, ...rest };
}

export function useEmergencyControl() {
  const { execute, ...rest } = useFenTx();

  const emergencyLock = useCallback(
    (corridorId: string, ownerCapId: string) =>
      execute(() =>
        buildEmergencyLock({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
        })
      ),
    [execute, rest.packageId]
  );

  const emergencyUnlock = useCallback(
    (corridorId: string, ownerCapId: string) =>
      execute(() =>
        buildEmergencyUnlock({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
        })
      ),
    [execute, rest.packageId]
  );

  return { emergencyLock, emergencyUnlock, ...rest };
}

export function useCorridorStatus() {
  const { execute, ...rest } = useFenTx();

  const activateCorridor = useCallback(
    (corridorId: string, ownerCapId: string) =>
      execute(() =>
        buildActivateCorridor({ packageId: rest.packageId, corridorId, ownerCapId })
      ),
    [execute, rest.packageId]
  );

  const deactivateCorridor = useCallback(
    (corridorId: string, ownerCapId: string) =>
      execute(() =>
        buildDeactivateCorridor({ packageId: rest.packageId, corridorId, ownerCapId })
      ),
    [execute, rest.packageId]
  );

  return { activateCorridor, deactivateCorridor, ...rest };
}

export function useWithdrawRevenue() {
  const { execute, ...rest } = useFenTx();

  const withdrawAll = useCallback(
    (treasuryId: string, ownerCapId: string) =>
      execute(() =>
        buildWithdrawAll({ packageId: rest.packageId, treasuryId, ownerCapId })
      ),
    [execute, rest.packageId]
  );

  return { withdrawAll, ...rest };
}

export function useDepotConfig() {
  const { execute, ...rest } = useFenTx();

  const setDepotConfig = useCallback(
    (params: {
      corridorId: string;
      ownerCapId: string;
      storageUnitId: string;
      inputTypeId: number;
      outputTypeId: number;
      ratioIn: number;
      ratioOut: number;
      feeBps: number;
    }) =>
      execute(() =>
        buildSetDepotConfig({
          packageId: rest.packageId,
          ...params,
        })
      ),
    [execute, rest.packageId]
  );

  const activateDepot = useCallback(
    (corridorId: string, ownerCapId: string, storageUnitId: string) =>
      execute(() =>
        buildActivateDepot({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
          storageUnitId,
        })
      ),
    [execute, rest.packageId]
  );

  const deactivateDepot = useCallback(
    (corridorId: string, ownerCapId: string, storageUnitId: string) =>
      execute(() =>
        buildDeactivateDepot({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
          storageUnitId,
        })
      ),
    [execute, rest.packageId]
  );

  return { setDepotConfig, activateDepot, deactivateDepot, ...rest };
}

export function useTreasury() {
  const { execute, ...rest } = useFenTx();

  const createTreasury = useCallback(
    (corridorId: string, ownerCapId: string, feeRecipient: string) =>
      execute(() =>
        buildCreateTreasury({
          packageId: rest.packageId,
          corridorId,
          ownerCapId,
          feeRecipient,
        })
      ),
    [execute, rest.packageId]
  );

  const withdraw = useCallback(
    (treasuryId: string, ownerCapId: string, amount: number) =>
      execute(() =>
        buildWithdraw({
          packageId: rest.packageId,
          treasuryId,
          ownerCapId,
          amount,
        })
      ),
    [execute, rest.packageId]
  );

  const withdrawAll = useCallback(
    (treasuryId: string, ownerCapId: string) =>
      execute(() =>
        buildWithdrawAll({ packageId: rest.packageId, treasuryId, ownerCapId })
      ),
    [execute, rest.packageId]
  );

  return { createTreasury, withdraw, withdrawAll, ...rest };
}

// --- DeepBook Hooks ---

export function useDeepBookBalanceManager() {
  const { execute, ...rest } = useFenTx();

  const linkBalanceManager = useCallback(
    (registryId: string, ownerCapId: string, corridorId: string, balanceManagerId: string, operator: string) =>
      execute(() =>
        buildLinkBalanceManager({
          packageId: rest.packageId,
          registryId,
          ownerCapId,
          corridorId,
          balanceManagerId,
          operator,
        })
      ),
    [execute, rest.packageId]
  );

  const unlinkBalanceManager = useCallback(
    (registryId: string, ownerCapId: string, corridorId: string) =>
      execute(() =>
        buildUnlinkBalanceManager({
          packageId: rest.packageId,
          registryId,
          ownerCapId,
          corridorId,
        })
      ),
    [execute, rest.packageId]
  );

  return { linkBalanceManager, unlinkBalanceManager, ...rest };
}

export function useDeepBookOrders() {
  const { execute, ...rest } = useFenTx();

  const recordOrderPlaced = useCallback(
    (params: {
      registryId: string;
      ownerCapId: string;
      corridorId: string;
      poolId: string;
      isBid: boolean;
      price: number;
      quantity: number;
      clientOrderId: number;
    }) =>
      execute(() =>
        buildRecordOrderPlaced({
          packageId: rest.packageId,
          ...params,
        })
      ),
    [execute, rest.packageId]
  );

  return { recordOrderPlaced, ...rest };
}
