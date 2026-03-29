"use client";

import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { useNetworkVariable } from "@/lib/sui-config";

/**
 * Discovers the connected wallet's EVE Frontier Character.
 *
 * EVE Frontier's object ownership model:
 * - Wallet 0x62c8... (admin) creates the Character
 * - Character object lives at 0x5362... (shared)
 * - OwnerCap<Character> is owned by 0x5362... (the Character address)
 * - PlayerProfile (character::PlayerProfile) is owned by 0x9d8b... (character_address)
 *
 * Strategy:
 * 1. Look for character::PlayerProfile → extract character_id
 * 2. Look for OwnerCap<Character> → extract authorized_object_id
 * 3. Check if wallet address itself is a Character object
 */
export function useCharacter() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setCharacterId(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function discover() {
      try {
        for (const worldPkg of [
          "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75",
          "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c",
        ]) {
          // Strategy 1: character::PlayerProfile (correct module name)
          for (const moduleName of ["character", "smart_character"]) {
            const result = await client.getOwnedObjects({
              owner: account!.address,
              filter: { StructType: `${worldPkg}::${moduleName}::PlayerProfile` },
              options: { showContent: true },
            });

            if (cancelled) return;

            if (result.data.length > 0) {
              const content = result.data[0]?.data?.content;
              if (content && "fields" in content) {
                const fields = content.fields as Record<string, unknown>;
                const charId = fields.character_id as string;
                if (charId) {
                  setCharacterId(charId);
                  setIsLoading(false);
                  return;
                }
              }
            }
          }

          // Strategy 2: OwnerCap<Character>
          const capResult = await client.getOwnedObjects({
            owner: account!.address,
            filter: { StructType: `${worldPkg}::access::OwnerCap<${worldPkg}::character::Character>` },
            options: { showContent: true },
          });

          if (cancelled) return;

          if (capResult.data.length > 0) {
            const content = capResult.data[0]?.data?.content;
            if (content && "fields" in content) {
              const fields = content.fields as Record<string, unknown>;
              const charId = fields.authorized_object_id as string;
              if (charId) {
                setCharacterId(charId);
                setIsLoading(false);
                return;
              }
            }
          }
        }

        // Strategy 3: The wallet address itself may be a Character object
        try {
          const obj = await client.getObject({
            id: account!.address,
            options: { showType: true },
          });
          if (cancelled) return;
          const objType = obj.data?.type || "";
          if (objType.includes("character::Character")) {
            setCharacterId(account!.address);
            setIsLoading(false);
            return;
          }
        } catch {
          // Not a valid object — continue
        }
      } catch {
        // Character discovery failed — not critical
      }
      if (!cancelled) setIsLoading(false);
    }

    discover();
    return () => { cancelled = true; };
  }, [account?.address, client]);

  return { characterId, isLoading };
}

/**
 * Discovers owned Item objects (EVE Frontier in-game items) from the wallet.
 * Items have a type_id field identifying what kind of item they are.
 */
export function useOwnedItems() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const [items, setItems] = useState<Array<{ objectId: string; typeId: number; quantity: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!account?.address) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function discover() {
      try {
        // Look for Item objects — try both Utopia and Stillness world packages
        for (const worldPkg of [
          "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75",
          "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c",
        ]) {
          const result = await client.getOwnedObjects({
            owner: account!.address,
            filter: { StructType: `${worldPkg}::inventory::Item` },
            options: { showContent: true },
          });

          if (cancelled) return;

          if (result.data.length > 0) {
            const found = result.data
              .filter((o) => o.data?.content && "fields" in o.data.content)
              .map((o) => {
                const fields = (o.data!.content as { fields: Record<string, unknown> }).fields;
                return {
                  objectId: o.data!.objectId,
                  typeId: Number(fields.type_id || 0),
                  quantity: Number(fields.quantity || 1),
                };
              });
            if (found.length > 0) {
              setItems(found);
              break;
            }
          }
        }
      } catch {
        // Item discovery failed — not critical
      }
      if (!cancelled) setIsLoading(false);
    }

    discover();
    return () => { cancelled = true; };
  }, [account?.address, client]);

  return { items, isLoading };
}
