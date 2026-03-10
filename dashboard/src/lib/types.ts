export type CorridorStatus = "active" | "inactive" | "emergency";

export interface Corridor {
  id: string;
  name: string;
  status: CorridorStatus;
  sourceGate: Gate;
  destGate: Gate;
  depotA: Depot;
  depotB: Depot;
  owner: string;
  feeRecipient: string;
  createdAt: number;
  totalJumps: number;
  totalTrades: number;
  totalTollRevenue: number;
  totalTradeRevenue: number;
  lastActivityAt: number;
}

export interface Gate {
  id: string;
  name: string;
  solarSystem: string;
  tollAmount: number;
  surgeActive: boolean;
  surgeMultiplier: number;
  emergencyLocked: boolean;
  isOnline: boolean;
}

export interface Depot {
  id: string;
  name: string;
  inputItem: ItemType;
  outputItem: ItemType;
  ratioIn: number;
  ratioOut: number;
  feeBps: number;
  isActive: boolean;
  inputStock: number;
  outputStock: number;
}

export interface ItemType {
  typeId: number;
  name: string;
  icon: string;
}

export interface ActivityEvent {
  id: string;
  type: "jump" | "trade" | "toll_config" | "depot_config" | "emergency" | "corridor_created";
  corridorId: string;
  corridorName: string;
  actor: string;
  description: string;
  timestamp: number;
  value?: number;
}

export interface DashboardStats {
  totalCorridors: number;
  activeCorridors: number;
  totalVolume24h: number;
  totalRevenue24h: number;
  totalJumps24h: number;
  totalTrades24h: number;
}

export interface TradeRoute {
  corridorId: string;
  corridorName: string;
  from: string;
  to: string;
  inputItem: string;
  outputItem: string;
  effectiveRate: number;
  tollCost: number;
  netProfit: number;
  liquidity: number;
}
