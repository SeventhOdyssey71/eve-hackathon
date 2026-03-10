"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";

/**
 * Discover CorridorOwnerCap objects owned by the connected wallet.
 * Returns a map from corridorId -> ownerCapId so the Operate page
 * can pass the real cap into every admin transaction.
 */
export function useOwnerCaps(): {
  caps: Map<string, string>;
  isLoading: boolean;
  refetch: () => void;
} {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("fenPackageId");
  const isReady = !!account && packageId !== "0x0";

  const { data, isLoading, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: {
        StructType: `${packageId}::corridor::CorridorOwnerCap`,
      },
      options: { showContent: true },
      limit: 50,
    },
    { enabled: isReady }
  );

  const caps = new Map<string, string>();

  if (data?.data) {
    for (const obj of data.data) {
      if (obj.data?.content && "fields" in obj.data.content) {
        const fields = obj.data.content.fields as Record<string, unknown>;
        const capId = obj.data.objectId;
        const corridorId = fields.corridor_id as string;
        if (corridorId) {
          caps.set(corridorId, capId);
        }
      }
    }
  }

  return { caps, isLoading: isReady ? isLoading : false, refetch };
}
