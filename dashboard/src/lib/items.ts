/**
 * EVE Frontier item type catalog.
 * Maps on-chain item type IDs to human-readable names and icons.
 * Source: EVE Frontier static data / world-contracts item definitions.
 */

interface ItemInfo {
  name: string;
  icon: string;
}

const ITEM_CATALOG: Record<number, ItemInfo> = {
  // Fuels
  78437: { name: "Crude Fuel", icon: "fuel" },
  78515: { name: "Refined Fuel", icon: "fuel" },
  // Tech components
  84868: { name: "Technocore", icon: "tech" },
  88319: { name: "Smart Parts", icon: "gear" },
  // Salvage & materials
  88335: { name: "Salvage", icon: "recycle" },
  90184: { name: "Nano Paste", icon: "flask" },
  // Ores
  77518: { name: "Veldite", icon: "ore" },
  77520: { name: "Pyroxite", icon: "ore" },
  77522: { name: "Crokite", icon: "ore" },
  77524: { name: "Arkonite", icon: "ore" },
  // Processed materials
  79314: { name: "Carbon", icon: "material" },
  79316: { name: "Silicon", icon: "material" },
  79318: { name: "Iron", icon: "material" },
  79320: { name: "Copper", icon: "material" },
  79322: { name: "Titanium", icon: "material" },
  // Generic test items
  1001: { name: "Test Ore Alpha", icon: "ore" },
  1002: { name: "Test Alloy Beta", icon: "material" },
  1011: { name: "Test Fuel Gamma", icon: "fuel" },
};

export function getItemName(typeId: number): string {
  return ITEM_CATALOG[typeId]?.name || `Item #${typeId}`;
}

export function getItemIcon(typeId: number): string {
  return ITEM_CATALOG[typeId]?.icon || "";
}

export function getItemInfo(typeId: number): ItemInfo {
  return ITEM_CATALOG[typeId] || { name: `Item #${typeId}`, icon: "" };
}
