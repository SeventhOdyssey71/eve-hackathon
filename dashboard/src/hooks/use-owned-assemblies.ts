"use client";

import { useSuiClientQuery, useSuiClient } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect, useMemo } from "react";

export interface OwnedAssembly {
  id: string;
  type: "gate" | "storage_unit";
  typeId: number;
  name: string;
  isOnline: boolean;
}

/**
 * Discover Gate and StorageUnit objects owned by the connected wallet's address.
 * Queries Sui for objects matching the world-contracts Gate/StorageUnit types
 * and returns them with human-readable labels for the assembly picker UI.
 *
 * Since world-contracts types are not known at compile time (they depend on the
 * deployed world package), we query by the owner and then filter by module type.
 * We also fall back to checking all objects if the world package ID isn't known.
 */
export function useOwnedAssemblies(): {
  gates: OwnedAssembly[];
  storageUnits: OwnedAssembly[];
  isLoading: boolean;
  refetch: () => void;
} {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const isReady = !!account;

  // Fetch all owned objects with content so we can identify gates and SSUs by their module type
  const { data, isLoading, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      options: { showContent: true, showType: true },
      limit: 50,
    },
    { enabled: isReady }
  );

  const [metadataMap, setMetadataMap] = useState<Map<string, string>>(new Map());

  // Identify gates and storage units by their Move type
  const { gates: rawGates, storageUnits: rawUnits } = useMemo(() => {
    const gates: OwnedAssembly[] = [];
    const storageUnits: OwnedAssembly[] = [];

    if (!data?.data) return { gates, storageUnits };

    for (const obj of data.data) {
      if (!obj.data?.content || !("fields" in obj.data.content)) continue;

      const objType = obj.data.content.type || "";
      const fields = obj.data.content.fields as Record<string, unknown>;
      const objId = obj.data.objectId;

      if (objType.includes("::gate::Gate")) {
        gates.push({
          id: objId,
          type: "gate",
          typeId: Number(fields.type_id || 0),
          name: "",
          isOnline: isOnlineStatus(fields.status),
        });
      } else if (objType.includes("::storage_unit::StorageUnit")) {
        storageUnits.push({
          id: objId,
          type: "storage_unit",
          typeId: Number(fields.type_id || 0),
          name: "",
          isOnline: isOnlineStatus(fields.status),
        });
      }
    }

    return { gates, storageUnits };
  }, [data]);

  // Fetch metadata names for discovered assemblies
  const assemblyIds = useMemo(
    () => [...rawGates, ...rawUnits].map((a) => a.id),
    [rawGates, rawUnits]
  );

  useEffect(() => {
    if (assemblyIds.length === 0) return;

    async function fetchMetadata() {
      const newMap = new Map<string, string>();
      for (const id of assemblyIds) {
        try {
          const dfs = await client.getDynamicFields({ parentId: id, limit: 10 });
          for (const df of dfs.data) {
            // Metadata is typically stored as a dynamic field with a string key "name"
            if (
              df.name?.value === "name" ||
              (typeof df.name?.value === "object" && df.name?.type?.includes("Metadata"))
            ) {
              try {
                const dfObj = await client.getDynamicFieldObject({
                  parentId: id,
                  name: df.name,
                });
                if (dfObj.data?.content && "fields" in dfObj.data.content) {
                  const val = dfObj.data.content.fields as Record<string, unknown>;
                  const name = extractName(val);
                  if (name) newMap.set(id, name);
                }
              } catch {
                // skip if DF read fails
              }
            }
          }
        } catch {
          // skip if DF listing fails
        }
      }
      if (newMap.size > 0) setMetadataMap(newMap);
    }

    fetchMetadata();
  }, [assemblyIds.join(","), client]);

  // Merge metadata names into assemblies
  const gates = rawGates.map((g) => ({
    ...g,
    name: metadataMap.get(g.id) || `Gate ${g.id.slice(0, 8)}...`,
  }));

  const storageUnits = rawUnits.map((s) => ({
    ...s,
    name: metadataMap.get(s.id) || `SSU ${s.id.slice(0, 8)}...`,
  }));

  return { gates, storageUnits, isLoading: isReady ? isLoading : false, refetch };
}

function isOnlineStatus(status: unknown): boolean {
  if (typeof status === "object" && status !== null) {
    const s = status as Record<string, unknown>;
    // world-contracts Status enum: { variant: 2 } = ONLINE
    return Number(s.variant ?? s.value ?? 0) === 2;
  }
  return Number(status || 0) === 2;
}

function extractName(fields: Record<string, unknown>): string {
  // Try common patterns for name storage
  if (typeof fields.value === "string") return fields.value;
  if (typeof fields.name === "string") return fields.name;
  if (fields.value && typeof fields.value === "object") {
    const inner = fields.value as Record<string, unknown>;
    if (typeof inner.name === "string") return inner.name;
    if (typeof inner.value === "string") return inner.value;
  }
  return "";
}
