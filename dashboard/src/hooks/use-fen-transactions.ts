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
  buildCreateBalanceManager,
  buildLinkBalanceManager,
  buildDepositSui,
  buildWithdrawSui,
  buildSwapSuiForDeep,
  buildSwapDeepForSui,
  buildPlaceLimitOrder,
  buildCancelAllOrders,
  buildClaimRebates,
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
  const configId = useNetworkVariable("fenConfigId");

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

  return { status, error, digest, execute, account, packageId, registryId, configId };
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
    (adminCapId: string, gateId: string, tollAmount: number, feeRecipient: string) =>
      execute(() =>
        buildSetTollConfig({
          packageId: rest.packageId,
          configId: rest.configId,
          adminCapId,
          gateId,
          tollAmount,
          feeRecipient,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  return { setTollConfig, ...rest };
}

export function useSurgeControl() {
  const { execute, ...rest } = useFenTx();

  const activateSurge = useCallback(
    (adminCapId: string, gateId: string, surgeNumerator: number) =>
      execute(() =>
        buildActivateSurge({
          packageId: rest.packageId,
          configId: rest.configId,
          adminCapId,
          gateId,
          surgeNumerator,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  const deactivateSurge = useCallback(
    (adminCapId: string, gateId: string) =>
      execute(() =>
        buildDeactivateSurge({
          packageId: rest.packageId,
          configId: rest.configId,
          adminCapId,
          gateId,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  return { activateSurge, deactivateSurge, ...rest };
}

export function useEmergencyControl() {
  const { execute, ...rest } = useFenTx();

  const emergencyLock = useCallback(
    (adminCapId: string, gateId: string) =>
      execute(() =>
        buildEmergencyLock({
          packageId: rest.packageId,
          configId: rest.configId,
          adminCapId,
          gateId,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  const emergencyUnlock = useCallback(
    (adminCapId: string, gateId: string) =>
      execute(() =>
        buildEmergencyUnlock({
          packageId: rest.packageId,
          configId: rest.configId,
          adminCapId,
          gateId,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  return { emergencyLock, emergencyUnlock, ...rest };
}

export function useCorridorStatus() {
  const { execute, ...rest } = useFenTx();

  const activateCorridor = useCallback(
    (corridorId: string) =>
      execute(() =>
        buildActivateCorridor({ packageId: rest.packageId, corridorId })
      ),
    [execute, rest.packageId]
  );

  const deactivateCorridor = useCallback(
    (corridorId: string) =>
      execute(() =>
        buildDeactivateCorridor({ packageId: rest.packageId, corridorId })
      ),
    [execute, rest.packageId]
  );

  return { activateCorridor, deactivateCorridor, ...rest };
}

export function useWithdrawRevenue() {
  const { execute, ...rest } = useFenTx();

  const withdrawAll = useCallback(
    (treasuryId: string) =>
      execute(() =>
        buildWithdrawAll({ packageId: rest.packageId, treasuryId })
      ),
    [execute, rest.packageId]
  );

  return { withdrawAll, ...rest };
}

export function useDepotConfig() {
  const { execute, ...rest } = useFenTx();

  const setDepotConfig = useCallback(
    (params: {
      adminCapId: string;
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
          configId: rest.configId,
          ...params,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  return { setDepotConfig, ...rest };
}

// --- DeepBook Hooks ---

export function useDeepBookBalanceManager() {
  const { execute, ...rest } = useFenTx();

  const createBalanceManager = useCallback(
    () =>
      execute(() =>
        buildCreateBalanceManager({ packageId: rest.packageId })
      ),
    [execute, rest.packageId]
  );

  const linkBalanceManager = useCallback(
    (adminCapId: string, corridorId: string, balanceManagerId: string, operator: string) =>
      execute(() =>
        buildLinkBalanceManager({
          packageId: rest.packageId,
          configId: rest.configId,
          adminCapId,
          corridorId,
          balanceManagerId,
          operator,
        })
      ),
    [execute, rest.packageId, rest.configId]
  );

  const depositSui = useCallback(
    (balanceManagerId: string, coinId: string) =>
      execute(() =>
        buildDepositSui({ packageId: rest.packageId, balanceManagerId, coinId })
      ),
    [execute, rest.packageId]
  );

  const withdrawSui = useCallback(
    (balanceManagerId: string, amount: number) =>
      execute(() =>
        buildWithdrawSui({ packageId: rest.packageId, balanceManagerId, amount })
      ),
    [execute, rest.packageId]
  );

  return { createBalanceManager, linkBalanceManager, depositSui, withdrawSui, ...rest };
}

export function useDeepBookSwap() {
  const { execute, ...rest } = useFenTx();

  const swapSuiForDeep = useCallback(
    (poolId: string, suiCoinId: string, deepFeeCoinId: string, minDeepOut: number) =>
      execute(() =>
        buildSwapSuiForDeep({
          packageId: rest.packageId,
          poolId,
          suiCoinId,
          deepFeeCoinId,
          minDeepOut,
        })
      ),
    [execute, rest.packageId]
  );

  const swapDeepForSui = useCallback(
    (poolId: string, deepCoinId: string, deepFeeCoinId: string, minSuiOut: number) =>
      execute(() =>
        buildSwapDeepForSui({
          packageId: rest.packageId,
          poolId,
          deepCoinId,
          deepFeeCoinId,
          minSuiOut,
        })
      ),
    [execute, rest.packageId]
  );

  return { swapSuiForDeep, swapDeepForSui, ...rest };
}

export function useDeepBookOrders() {
  const { execute, ...rest } = useFenTx();

  const placeLimitOrder = useCallback(
    (params: {
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
    }) =>
      execute(() =>
        buildPlaceLimitOrder({ packageId: rest.packageId, ...params })
      ),
    [execute, rest.packageId]
  );

  const cancelAllOrders = useCallback(
    (poolId: string, balanceManagerId: string, baseType: string, quoteType: string) =>
      execute(() =>
        buildCancelAllOrders({
          packageId: rest.packageId,
          poolId,
          balanceManagerId,
          baseType,
          quoteType,
        })
      ),
    [execute, rest.packageId]
  );

  const claimRebates = useCallback(
    (poolId: string, balanceManagerId: string, baseType: string, quoteType: string) =>
      execute(() =>
        buildClaimRebates({
          packageId: rest.packageId,
          poolId,
          balanceManagerId,
          baseType,
          quoteType,
        })
      ),
    [execute, rest.packageId]
  );

  return { placeLimitOrder, cancelAllOrders, claimRebates, ...rest };
}
