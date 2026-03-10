import type { Corridor, ActivityEvent, DashboardStats, TradeRoute } from "./types";

const ITEMS = {
  crudeFuel: { typeId: 78437, name: "Crude Fuel", icon: "fuel" },
  refinedFuel: { typeId: 78515, name: "Refined Fuel", icon: "fuel" },
  technocore: { typeId: 84868, name: "Technocore", icon: "tech" },
  smartParts: { typeId: 88319, name: "Smart Parts", icon: "gear" },
  salvage: { typeId: 88335, name: "Salvage", icon: "recycle" },
  nanoPaste: { typeId: 90184, name: "Nano Paste", icon: "flask" },
};

export const MOCK_CORRIDORS: Corridor[] = [
  {
    id: "0xc001",
    name: "Helios Express",
    status: "active",
    sourceGate: {
      id: "0xg001", name: "Helios Gate Alpha", solarSystem: "Helios-7",
      tollAmount: 500_000_000, surgeActive: false, surgeMultiplier: 10000,
      emergencyLocked: false, isOnline: true,
    },
    destGate: {
      id: "0xg002", name: "Nexus Gate Beta", solarSystem: "Nexus-12",
      tollAmount: 500_000_000, surgeActive: false, surgeMultiplier: 10000,
      emergencyLocked: false, isOnline: true,
    },
    depotA: {
      id: "0xd001", name: "Helios Fuel Depot", inputItem: ITEMS.crudeFuel,
      outputItem: ITEMS.refinedFuel, ratioIn: 3, ratioOut: 1, feeBps: 250,
      isActive: true, inputStock: 4500, outputStock: 1200,
    },
    depotB: {
      id: "0xd002", name: "Nexus Trade Hub", inputItem: ITEMS.technocore,
      outputItem: ITEMS.smartParts, ratioIn: 1, ratioOut: 5, feeBps: 300,
      isActive: true, inputStock: 80, outputStock: 350,
    },
    owner: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    feeRecipient: "0xabc123def456abc123def456abc123def456abc123def456abc123def456abcd",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    totalJumps: 1247,
    totalTrades: 892,
    totalTollRevenue: 623_500_000_000,
    totalTradeRevenue: 178_200_000_000,
    lastActivityAt: Date.now() - 3 * 60 * 1000,
  },
  {
    id: "0xc002",
    name: "Darkrift Passage",
    status: "active",
    sourceGate: {
      id: "0xg003", name: "Rift Entry", solarSystem: "Darkrift-3",
      tollAmount: 1_000_000_000, surgeActive: true, surgeMultiplier: 15000,
      emergencyLocked: false, isOnline: true,
    },
    destGate: {
      id: "0xg004", name: "Rift Exit", solarSystem: "Shadowmere-9",
      tollAmount: 1_000_000_000, surgeActive: true, surgeMultiplier: 15000,
      emergencyLocked: false, isOnline: true,
    },
    depotA: {
      id: "0xd003", name: "Rift Salvage Yard", inputItem: ITEMS.salvage,
      outputItem: ITEMS.nanoPaste, ratioIn: 10, ratioOut: 1, feeBps: 500,
      isActive: true, inputStock: 15000, outputStock: 980,
    },
    depotB: {
      id: "0xd004", name: "Shadow Market", inputItem: ITEMS.nanoPaste,
      outputItem: ITEMS.technocore, ratioIn: 2, ratioOut: 1, feeBps: 400,
      isActive: true, inputStock: 450, outputStock: 180,
    },
    owner: "0xdef789012345def789012345def789012345def789012345def789012345defa",
    feeRecipient: "0xdef789012345def789012345def789012345def789012345def789012345defa",
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    totalJumps: 534,
    totalTrades: 421,
    totalTollRevenue: 801_000_000_000,
    totalTradeRevenue: 210_500_000_000,
    lastActivityAt: Date.now() - 12 * 60 * 1000,
  },
  {
    id: "0xc003",
    name: "Frontier Supply Line",
    status: "inactive",
    sourceGate: {
      id: "0xg005", name: "Frontier Gate", solarSystem: "Frontier-1",
      tollAmount: 250_000_000, surgeActive: false, surgeMultiplier: 10000,
      emergencyLocked: false, isOnline: false,
    },
    destGate: {
      id: "0xg006", name: "Core Gate", solarSystem: "Core-44",
      tollAmount: 250_000_000, surgeActive: false, surgeMultiplier: 10000,
      emergencyLocked: false, isOnline: false,
    },
    depotA: {
      id: "0xd005", name: "Frontier Outpost", inputItem: ITEMS.crudeFuel,
      outputItem: ITEMS.smartParts, ratioIn: 5, ratioOut: 1, feeBps: 200,
      isActive: false, inputStock: 2000, outputStock: 300,
    },
    depotB: {
      id: "0xd006", name: "Core Warehouse", inputItem: ITEMS.smartParts,
      outputItem: ITEMS.refinedFuel, ratioIn: 1, ratioOut: 3, feeBps: 150,
      isActive: false, inputStock: 150, outputStock: 400,
    },
    owner: "0x456789abcdef456789abcdef456789abcdef456789abcdef456789abcdef4567",
    feeRecipient: "0x456789abcdef456789abcdef456789abcdef456789abcdef456789abcdef4567",
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    totalJumps: 2103,
    totalTrades: 1567,
    totalTollRevenue: 525_750_000_000,
    totalTradeRevenue: 313_400_000_000,
    lastActivityAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "0xc004",
    name: "Siege Corridor",
    status: "emergency",
    sourceGate: {
      id: "0xg007", name: "Warzone Alpha", solarSystem: "Conflict-8",
      tollAmount: 2_000_000_000, surgeActive: false, surgeMultiplier: 10000,
      emergencyLocked: true, isOnline: true,
    },
    destGate: {
      id: "0xg008", name: "Warzone Beta", solarSystem: "Bastion-2",
      tollAmount: 2_000_000_000, surgeActive: false, surgeMultiplier: 10000,
      emergencyLocked: true, isOnline: true,
    },
    depotA: {
      id: "0xd007", name: "War Supply Cache", inputItem: ITEMS.refinedFuel,
      outputItem: ITEMS.smartParts, ratioIn: 2, ratioOut: 1, feeBps: 100,
      isActive: false, inputStock: 800, outputStock: 100,
    },
    depotB: {
      id: "0xd008", name: "Bastion Armory", inputItem: ITEMS.technocore,
      outputItem: ITEMS.nanoPaste, ratioIn: 1, ratioOut: 3, feeBps: 100,
      isActive: false, inputStock: 50, outputStock: 90,
    },
    owner: "0x789abc012345789abc012345789abc012345789abc012345789abc012345789a",
    feeRecipient: "0x789abc012345789abc012345789abc012345789abc012345789abc012345789a",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    totalJumps: 89,
    totalTrades: 34,
    totalTollRevenue: 178_000_000_000,
    totalTradeRevenue: 17_000_000_000,
    lastActivityAt: Date.now() - 6 * 60 * 60 * 1000,
  },
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: "e1", type: "jump", corridorId: "0xc001", corridorName: "Helios Express", actor: "0xaaa...1234", description: "Jumped Helios-7 → Nexus-12", timestamp: Date.now() - 3 * 60 * 1000, value: 500_000_000 },
  { id: "e2", type: "trade", corridorId: "0xc002", corridorName: "Darkrift Passage", actor: "0xbbb...5678", description: "Traded 100 Salvage → 10 Nano Paste", timestamp: Date.now() - 8 * 60 * 1000, value: 50_000_000 },
  { id: "e3", type: "jump", corridorId: "0xc001", corridorName: "Helios Express", actor: "0xccc...9012", description: "Jumped Nexus-12 → Helios-7", timestamp: Date.now() - 12 * 60 * 1000, value: 500_000_000 },
  { id: "e4", type: "toll_config", corridorId: "0xc002", corridorName: "Darkrift Passage", actor: "0xdef...defa", description: "Activated surge pricing (1.5x)", timestamp: Date.now() - 45 * 60 * 1000 },
  { id: "e5", type: "trade", corridorId: "0xc001", corridorName: "Helios Express", actor: "0xddd...3456", description: "Traded 30 Crude Fuel → 10 Refined Fuel", timestamp: Date.now() - 52 * 60 * 1000, value: 25_000_000 },
  { id: "e6", type: "emergency", corridorId: "0xc004", corridorName: "Siege Corridor", actor: "0x789...789a", description: "Emergency lockdown activated", timestamp: Date.now() - 6 * 60 * 60 * 1000 },
  { id: "e7", type: "corridor_created", corridorId: "0xc002", corridorName: "Darkrift Passage", actor: "0xdef...defa", description: "New corridor registered", timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 },
  { id: "e8", type: "trade", corridorId: "0xc002", corridorName: "Darkrift Passage", actor: "0xeee...7890", description: "Traded 50 Nano Paste → 25 Technocore", timestamp: Date.now() - 15 * 60 * 1000, value: 100_000_000 },
];

export const MOCK_STATS: DashboardStats = {
  totalCorridors: 4,
  activeCorridors: 2,
  totalVolume24h: 15_400_000_000,
  totalRevenue24h: 3_850_000_000,
  totalJumps24h: 187,
  totalTrades24h: 143,
};

export const MOCK_TRADE_ROUTES: TradeRoute[] = [
  { corridorId: "0xc001", corridorName: "Helios Express", from: "Helios-7", to: "Nexus-12", inputItem: "Crude Fuel", outputItem: "Refined Fuel", effectiveRate: 3.0, tollCost: 0.5, netProfit: 2.1, liquidity: 1200 },
  { corridorId: "0xc001", corridorName: "Helios Express", from: "Nexus-12", to: "Helios-7", inputItem: "Technocore", outputItem: "Smart Parts", effectiveRate: 5.0, tollCost: 0.5, netProfit: 8.5, liquidity: 350 },
  { corridorId: "0xc002", corridorName: "Darkrift Passage", from: "Darkrift-3", to: "Shadowmere-9", inputItem: "Salvage", outputItem: "Nano Paste", effectiveRate: 10.0, tollCost: 1.5, netProfit: 3.2, liquidity: 980 },
  { corridorId: "0xc002", corridorName: "Darkrift Passage", from: "Shadowmere-9", to: "Darkrift-3", inputItem: "Nano Paste", outputItem: "Technocore", effectiveRate: 2.0, tollCost: 1.5, netProfit: 5.7, liquidity: 180 },
];

export const MOCK_CHART_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  jumps: Math.floor(Math.random() * 20 + 5),
  trades: Math.floor(Math.random() * 15 + 3),
  revenue: Math.floor(Math.random() * 500_000_000 + 100_000_000),
}));
