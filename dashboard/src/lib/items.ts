/**
 * EVE Frontier item type catalog.
 * Fetches real item names from the Utopia World API, with a static fallback.
 * Source: https://world-api-utopia.uat.pub.evefrontier.com/v2/types
 */

export interface ItemInfo {
  name: string;
  icon: string;
  category?: string;
  volume?: number;
}

// Static fallback for known items (real names from Utopia API)
const STATIC_CATALOG: Record<number, ItemInfo> = {
  78437: { name: "EU-90 Fuel", icon: "fuel", category: "Commodity" },
  78515: { name: "SOF-80 Fuel", icon: "fuel", category: "Commodity" },
  84868: { name: "SOF-40 Fuel", icon: "fuel", category: "Commodity" },
  88319: { name: "D2 Fuel", icon: "fuel", category: "Commodity" },
  88335: { name: "D1 Fuel", icon: "fuel", category: "Commodity" },
  90184: { name: "Relay", icon: "tech", category: "Commodity" },
  77518: { name: "Lens 3X", icon: "tech", category: "Charge" },
  77728: { name: "Sophrogon", icon: "material", category: "Material" },
  77801: { name: "Nickel-Iron Veins", icon: "ore", category: "Material" },
  77803: { name: "Silicon Dust", icon: "material", category: "Material" },
  77818: { name: "Unstable Fuel", icon: "fuel", category: "Commodity" },
  78516: { name: "EU-40 Fuel", icon: "fuel", category: "Commodity" },
  84556: { name: "Smart Turret", icon: "tech", category: "Deployable" },
  88764: { name: "Salvaged Materials", icon: "recycle", category: "Commodity" },
  89087: { name: "Synod Technocore", icon: "tech", category: "Material" },
  89088: { name: "Exclave Technocore", icon: "tech", category: "Material" },
};

// Runtime cache populated from the Utopia World API
let apiCatalog: Record<number, ItemInfo> | null = null;
let fetchPromise: Promise<void> | null = null;

const UTOPIA_API = "https://world-api-utopia.uat.pub.evefrontier.com";

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

async function fetchCatalog(): Promise<void> {
  try {
    const res = await fetch(`${UTOPIA_API}/v2/types?limit=400`);
    if (!res.ok) return;
    const data = await res.json();
    const catalog: Record<number, ItemInfo> = {};
    for (const item of data.data || []) {
      catalog[item.id] = {
        name: item.name,
        icon: inferIcon(item.categoryName || ""),
        category: item.categoryName,
        volume: item.volume,
      };
    }
    apiCatalog = catalog;
  } catch {
    // API unavailable — static fallback will be used
  }
}

/**
 * Initialize the item catalog from the Utopia World API.
 * Call once at app startup. Non-blocking — returns immediately,
 * populates the cache in the background.
 */
export function initItemCatalog(): void {
  if (!fetchPromise) {
    fetchPromise = fetchCatalog();
  }
}

export function getItemName(typeId: number): string {
  return apiCatalog?.[typeId]?.name || STATIC_CATALOG[typeId]?.name || `Item #${typeId}`;
}

export function getItemIcon(typeId: number): string {
  return apiCatalog?.[typeId]?.icon || STATIC_CATALOG[typeId]?.icon || "";
}

export function getItemInfo(typeId: number): ItemInfo {
  return (
    apiCatalog?.[typeId] ||
    STATIC_CATALOG[typeId] ||
    { name: `Item #${typeId}`, icon: "" }
  );
}

/**
 * Get the full catalog (API + static merged). Useful for search/browse.
 */
export function getAllItems(): Record<number, ItemInfo> {
  return { ...STATIC_CATALOG, ...apiCatalog };
}
