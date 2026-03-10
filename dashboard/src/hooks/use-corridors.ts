"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";
import type { Corridor, DashboardStats, ActivityEvent, TradeRoute } from "@/lib/types";

const STATUS_MAP: Record<number, Corridor["status"]> = {
  0: "inactive",
  1: "active",
  2: "emergency",
};

function decodeNameBytes(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return new TextDecoder().decode(new Uint8Array(raw));
  return "";
}

function parseCorridorObject(id: string, fields: Record<string, unknown>): Corridor {
  const statusNum = Number(fields.status ?? 0);
  return {
    id,
    name: decodeNameBytes(fields.name),
    status: STATUS_MAP[statusNum] || "inactive",
    owner: (fields.owner as string) || "",
    feeRecipient: (fields.fee_recipient as string) || "",
    sourceGate: {
      id: (fields.source_gate_id as string) || "",
      name: "",
      solarSystem: "",
      tollAmount: 0,
      surgeActive: false,
      surgeMultiplier: 10000,
      emergencyLocked: false,
      isOnline: true,
    },
    destGate: {
      id: (fields.dest_gate_id as string) || "",
      name: "",
      solarSystem: "",
      tollAmount: 0,
      surgeActive: false,
      surgeMultiplier: 10000,
      emergencyLocked: false,
      isOnline: true,
    },
    depotA: {
      id: (fields.depot_a_id as string) || "",
      name: "",
      inputItem: { typeId: 0, name: "", icon: "" },
      outputItem: { typeId: 0, name: "", icon: "" },
      ratioIn: 1,
      ratioOut: 1,
      feeBps: 0,
      isActive: false,
      inputStock: 0,
      outputStock: 0,
    },
    depotB: {
      id: (fields.depot_b_id as string) || "",
      name: "",
      inputItem: { typeId: 0, name: "", icon: "" },
      outputItem: { typeId: 0, name: "", icon: "" },
      ratioIn: 1,
      ratioOut: 1,
      feeBps: 0,
      isActive: false,
      inputStock: 0,
      outputStock: 0,
    },
    totalJumps: Number(fields.total_jumps || 0),
    totalTrades: Number(fields.total_trades || 0),
    totalTollRevenue: Number(fields.total_toll_revenue || 0),
    totalTradeRevenue: Number(fields.total_trade_revenue || 0),
    createdAt: Number(fields.created_at || Date.now()),
    lastActivityAt: Number(fields.last_activity_at || Date.now()),
  };
}

/**
 * Discover corridors by querying CorridorCreatedEvent, then fetch each object.
 * This works because the CorridorRegistry uses a Table (dynamic fields) which
 * aren't visible via getObject on the registry itself.
 */
export function useCorridors(): {
  corridors: Corridor[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const packageId = useNetworkVariable("fenPackageId");
  const isConfigured = packageId !== "0x0";

  // Step 1: Query CorridorCreatedEvent to discover corridor IDs
  const { data: eventsData, isLoading: eventsLoading, error: eventsError, refetch } = useSuiClientQuery(
    "queryEvents",
    {
      query: { MoveEventType: `${packageId}::corridor::CorridorCreatedEvent` },
      limit: 50,
      order: "descending" as const,
    },
    { enabled: isConfigured }
  );

  const corridorIds: string[] = [];
  if (eventsData?.data) {
    for (const event of eventsData.data) {
      const parsed = event.parsedJson as Record<string, unknown> | undefined;
      if (parsed?.corridor_id) {
        const cId = parsed.corridor_id as string;
        if (!corridorIds.includes(cId)) corridorIds.push(cId);
      }
    }
  }

  // Step 2: Fetch each corridor object by ID (multiGetObjects)
  const { data: objectsData, isLoading: objectsLoading } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids: corridorIds,
      options: { showContent: true },
    },
    { enabled: corridorIds.length > 0 }
  );

  const corridors: Corridor[] = [];
  if (objectsData) {
    for (const obj of objectsData) {
      if (obj.data?.content && "fields" in obj.data.content) {
        const fields = obj.data.content.fields as Record<string, unknown>;
        // The Corridor struct has an `id` field that's a UID wrapper
        const objId = obj.data.objectId;
        corridors.push(parseCorridorObject(objId, fields));
      }
    }
  }

  return {
    corridors,
    isLoading: eventsLoading || objectsLoading,
    error: eventsError as Error | null,
    refetch,
  };
}

export function useCorridor(id: string): {
  corridor: Corridor | null;
  isLoading: boolean;
  error: Error | null;
} {
  const isValid = id.startsWith("0x") && id.length > 3;

  const { data, isLoading, error } = useSuiClientQuery(
    "getObject",
    {
      id,
      options: { showContent: true, showOwner: true },
    },
    { enabled: isValid }
  );

  if (!isValid || !data?.data?.content) {
    return { corridor: null, isLoading: isValid ? isLoading : false, error: error as Error | null };
  }

  if ("fields" in data.data.content) {
    const fields = data.data.content.fields as Record<string, unknown>;
    return {
      corridor: parseCorridorObject(id, fields),
      isLoading: false,
      error: null,
    };
  }

  return { corridor: null, isLoading, error: error as Error | null };
}

export function useDashboardStats(): {
  stats: DashboardStats;
  isLoading: boolean;
} {
  const { corridors, isLoading } = useCorridors();

  const stats: DashboardStats = {
    totalCorridors: corridors.length,
    activeCorridors: corridors.filter((c) => c.status === "active").length,
    totalVolume24h: 0,
    totalRevenue24h: corridors.reduce((sum, c) => sum + c.totalTollRevenue + c.totalTradeRevenue, 0),
    totalJumps24h: corridors.reduce((sum, c) => sum + c.totalJumps, 0),
    totalTrades24h: corridors.reduce((sum, c) => sum + c.totalTrades, 0),
  };

  return { stats, isLoading };
}

export function useActivity(corridorId?: string): {
  events: ActivityEvent[];
  isLoading: boolean;
} {
  const packageId = useNetworkVariable("fenPackageId");
  const isConfigured = packageId !== "0x0";

  // Query all events from the corridor module, or specific corridor events
  const { data, isLoading } = useSuiClientQuery(
    "queryEvents",
    {
      query: corridorId
        ? { MoveEventType: `${packageId}::corridor::CorridorStatusChangedEvent` }
        : { MoveModule: { package: packageId, module: "corridor" } },
      limit: 20,
      order: "descending" as const,
    },
    { enabled: isConfigured }
  );

  // Also query toll_gate and depot events
  const { data: tollData } = useSuiClientQuery(
    "queryEvents",
    {
      query: { MoveModule: { package: packageId, module: "toll_gate" } },
      limit: 20,
      order: "descending" as const,
    },
    { enabled: isConfigured }
  );

  const { data: depotData } = useSuiClientQuery(
    "queryEvents",
    {
      query: { MoveModule: { package: packageId, module: "depot" } },
      limit: 20,
      order: "descending" as const,
    },
    { enabled: isConfigured }
  );

  const events: ActivityEvent[] = [];
  const allEvents = [
    ...(data?.data || []),
    ...(tollData?.data || []),
    ...(depotData?.data || []),
  ].sort((a, b) => Number(b.timestampMs || 0) - Number(a.timestampMs || 0));

  for (const event of allEvents.slice(0, 20)) {
    const parsed = event.parsedJson as Record<string, unknown> | undefined;
    if (parsed) {
      const eventName = event.type.split("::").pop() || "";
      events.push({
        id: event.id.txDigest + event.id.eventSeq,
        type: inferEventType(event.type),
        corridorId: (parsed.corridor_id as string) || "",
        corridorName: decodeNameBytes(parsed.corridor_name),
        actor: (parsed.actor as string) || (parsed.payer as string) || (parsed.trader as string) || "",
        description: formatEventDescription(eventName, parsed),
        timestamp: Number(event.timestampMs || Date.now()),
        value: parsed.amount_paid ? Number(parsed.amount_paid) : parsed.fee_collected ? Number(parsed.fee_collected) : undefined,
      });
    }
  }

  return { events, isLoading: isConfigured ? isLoading : false };
}

function formatEventDescription(eventName: string, parsed: Record<string, unknown>): string {
  switch (eventName) {
    case "CorridorCreatedEvent":
      return `Corridor "${decodeNameBytes(parsed.corridor_name)}" registered`;
    case "CorridorStatusChangedEvent":
      return `Corridor status changed to ${STATUS_MAP[Number(parsed.new_status)] || "unknown"}`;
    case "TollPaidEvent":
      return "Toll paid for gate jump";
    case "TollConfigUpdatedEvent":
      return "Toll configuration updated";
    case "SurgeActivatedEvent":
      return "Surge pricing activated";
    case "SurgeDeactivatedEvent":
      return "Surge pricing deactivated";
    case "TradeExecutedEvent":
      return "Trade executed at depot";
    case "DepotConfigUpdatedEvent":
      return "Depot configuration updated";
    case "DepotActivatedEvent":
      return "Depot activated";
    case "DepotDeactivatedEvent":
      return "Depot deactivated";
    default:
      return eventName.replace(/Event$/, "").replace(/([A-Z])/g, " $1").trim();
  }
}

function inferEventType(eventType: string): ActivityEvent["type"] {
  if (eventType.includes("TollPaid") || eventType.includes("Jump")) return "jump";
  if (eventType.includes("Trade")) return "trade";
  if (eventType.includes("TollConfig") || eventType.includes("Surge")) return "toll_config";
  if (eventType.includes("DepotConfig") || eventType.includes("DepotActivated") || eventType.includes("DepotDeactivated")) return "depot_config";
  if (eventType.includes("Emergency") || eventType.includes("StatusChanged")) return "emergency";
  if (eventType.includes("CorridorCreated")) return "corridor_created";
  return "jump";
}

export function useTradeRoutes(): {
  routes: TradeRoute[];
  isLoading: boolean;
} {
  const { corridors, isLoading } = useCorridors();

  const routes: TradeRoute[] = [];
  for (const c of corridors) {
    if (c.status !== "active") continue;
    if (c.depotA.isActive) {
      routes.push({
        corridorId: c.id,
        corridorName: c.name,
        from: c.sourceGate.solarSystem || "System A",
        to: c.destGate.solarSystem || "System B",
        inputItem: c.depotA.inputItem.name || "Input",
        outputItem: c.depotA.outputItem.name || "Output",
        effectiveRate: c.depotA.ratioIn / c.depotA.ratioOut || 1,
        tollCost: c.sourceGate.tollAmount / 1_000_000_000,
        netProfit: 0,
        liquidity: c.depotA.outputStock,
      });
    }
    if (c.depotB.isActive) {
      routes.push({
        corridorId: c.id,
        corridorName: c.name,
        from: c.destGate.solarSystem || "System B",
        to: c.sourceGate.solarSystem || "System A",
        inputItem: c.depotB.inputItem.name || "Input",
        outputItem: c.depotB.outputItem.name || "Output",
        effectiveRate: c.depotB.ratioIn / c.depotB.ratioOut || 1,
        tollCost: c.destGate.tollAmount / 1_000_000_000,
        netProfit: 0,
        liquidity: c.depotB.outputStock,
      });
    }
  }

  return { routes, isLoading };
}

export function useChartData() {
  return {
    data: Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      jumps: 0,
      trades: 0,
      revenue: 0,
    })),
    isLoading: false,
  };
}
