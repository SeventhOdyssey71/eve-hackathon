"use client";

import { useState, useEffect } from "react";
import { type ItemInfo, getItemInfo, getItemName, getAllItems } from "@/lib/items";

const UTOPIA_API = "https://world-api-utopia.uat.pub.evefrontier.com";

/**
 * React hook that fetches the full item catalog from the Utopia World API
 * and triggers re-renders when data arrives.
 */
export function useItemCatalog() {
  const [catalog, setCatalog] = useState<Record<number, ItemInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${UTOPIA_API}/v2/types?limit=400`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        const items: Record<number, ItemInfo> = {};
        for (const item of data.data || []) {
          items[item.id] = {
            name: item.name,
            icon: inferIcon(item.categoryName || ""),
            category: item.categoryName,
            volume: item.volume,
          };
        }
        if (!cancelled) {
          setCatalog(items);
        }
      } catch {
        // Fall through to static catalog
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    catalog,
    isLoading,
    getItem: (typeId: number) => catalog[typeId] || getItemInfo(typeId),
    getName: (typeId: number) => catalog[typeId]?.name || getItemName(typeId),
    totalItems: Object.keys(catalog).length,
  };
}

function inferIcon(categoryName: string): string {
  switch (categoryName) {
    case "Commodity": return "fuel";
    case "Material": return "material";
    case "Module": return "gear";
    case "Charge": return "tech";
    case "Deployable": return "tech";
    case "Asteroid": return "ore";
    default: return "";
  }
}
