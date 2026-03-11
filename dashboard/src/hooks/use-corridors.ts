"use client";

import { useSuiClientQuery, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";
import { useState, useEffect, useMemo } from "react";
import type { Corridor, DashboardStats, ActivityEvent, TradeRoute, PoolConfig } from "@/lib/types";

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

// --- Toll/Depot dynamic field types ---
interface TollConfigFields {
  toll_amount: string | number;
  surge_active: boolean;
  surge_numerator: string | number;
}

interface DepotConfigFields {
  input_type_id: string | number;
  output_type_id: string | number;
  ratio_in: string | number;
  ratio_out: string | number;
  fee_bps: string | number;
  is_active: boolean;
  total_trades: string | number;
  total_volume_in: string | number;
  total_fees_collected: string | number;
}

/**
 * Discover corridors by querying CorridorCreatedEvent, then fetch each object,
 * then enrich with TollConfig and DepotConfig dynamic fields.
 */
export function useCorridors(): {
  corridors: Corridor[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const packageId = useNetworkVariable("fenPackageId");
  const isConfigured = packageId !== "0x0";
  const client = useSuiClient();

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

  // Step 3: Parse base corridor data
  const baseCorridors: Corridor[] = useMemo(() => {
    if (!objectsData) return [];
    const result: Corridor[] = [];
    for (const obj of objectsData) {
      if (obj.data?.content && "fields" in obj.data.content) {
        const fields = obj.data.content.fields as Record<string, unknown>;
        result.push(parseCorridorObject(obj.data.objectId, fields));
      }
    }
    return result;
  }, [objectsData]);

  // Step 4: Enrich with dynamic fields (TollConfig + DepotConfig)
  const [enrichedCorridors, setEnrichedCorridors] = useState<Corridor[]>([]);
  const stableKey = baseCorridors.map((c) => c.id).join(",");

  useEffect(() => {
    if (baseCorridors.length === 0) {
      setEnrichedCorridors([]);
      return;
    }

    let cancelled = false;

    async function enrich() {
      const enriched = await Promise.all(
        baseCorridors.map(async (c) => {
          const corridor = structuredClone(c);

          // Read TollConfig for source gate
          if (corridor.sourceGate.id) {
            const tollConfig = await fetchTollConfig(client, packageId, corridor.id, corridor.sourceGate.id);
            if (tollConfig) {
              corridor.sourceGate.tollAmount = Number(tollConfig.toll_amount);
              corridor.sourceGate.surgeActive = tollConfig.surge_active;
              corridor.sourceGate.surgeMultiplier = Number(tollConfig.surge_numerator);
            }
          }

          // Read TollConfig for dest gate
          if (corridor.destGate.id) {
            const tollConfig = await fetchTollConfig(client, packageId, corridor.id, corridor.destGate.id);
            if (tollConfig) {
              corridor.destGate.tollAmount = Number(tollConfig.toll_amount);
              corridor.destGate.surgeActive = tollConfig.surge_active;
              corridor.destGate.surgeMultiplier = Number(tollConfig.surge_numerator);
            }
          }

          // Read DepotConfig for depot A
          if (corridor.depotA.id) {
            const depotConfig = await fetchDepotConfig(client, packageId, corridor.id, corridor.depotA.id);
            if (depotConfig) {
              corridor.depotA.ratioIn = Number(depotConfig.ratio_in);
              corridor.depotA.ratioOut = Number(depotConfig.ratio_out);
              corridor.depotA.feeBps = Number(depotConfig.fee_bps);
              corridor.depotA.isActive = depotConfig.is_active;
              corridor.depotA.inputItem = {
                typeId: Number(depotConfig.input_type_id),
                name: `Item #${depotConfig.input_type_id}`,
                icon: "",
              };
              corridor.depotA.outputItem = {
                typeId: Number(depotConfig.output_type_id),
                name: `Item #${depotConfig.output_type_id}`,
                icon: "",
              };
            }
          }

          // Read DepotConfig for depot B
          if (corridor.depotB.id) {
            const depotConfig = await fetchDepotConfig(client, packageId, corridor.id, corridor.depotB.id);
            if (depotConfig) {
              corridor.depotB.ratioIn = Number(depotConfig.ratio_in);
              corridor.depotB.ratioOut = Number(depotConfig.ratio_out);
              corridor.depotB.feeBps = Number(depotConfig.fee_bps);
              corridor.depotB.isActive = depotConfig.is_active;
              corridor.depotB.inputItem = {
                typeId: Number(depotConfig.input_type_id),
                name: `Item #${depotConfig.input_type_id}`,
                icon: "",
              };
              corridor.depotB.outputItem = {
                typeId: Number(depotConfig.output_type_id),
                name: `Item #${depotConfig.output_type_id}`,
                icon: "",
              };
            }
          }

          return corridor;
        })
      );

      if (!cancelled) setEnrichedCorridors(enriched);
    }

    enrich();
    return () => { cancelled = true; };
  }, [stableKey, client, packageId]);

  // Return enriched data when available, otherwise base data
  const corridors = enrichedCorridors.length > 0 && enrichedCorridors.length === baseCorridors.length
    ? enrichedCorridors
    : baseCorridors;

  return {
    corridors,
    isLoading: eventsLoading || objectsLoading,
    error: eventsError as Error | null,
    refetch,
  };
}

async function fetchTollConfig(
  client: ReturnType<typeof useSuiClient>,
  packageId: string,
  corridorId: string,
  gateId: string,
): Promise<TollConfigFields | null> {
  try {
    const result = await client.getDynamicFieldObject({
      parentId: corridorId,
      name: {
        type: `${packageId}::toll_gate::TollConfigKey`,
        value: { gate_id: gateId },
      },
    });
    if (result.data?.content && "fields" in result.data.content) {
      const outer = result.data.content.fields as Record<string, unknown>;
      // Dynamic field objects have { name, value } structure
      const value = (outer.value ?? outer) as Record<string, unknown>;
      return {
        toll_amount: value.toll_amount as string | number,
        surge_active: Boolean(value.surge_active),
        surge_numerator: value.surge_numerator as string | number,
      };
    }
  } catch {
    // Dynamic field doesn't exist yet (toll not configured)
  }
  return null;
}

async function fetchDepotConfig(
  client: ReturnType<typeof useSuiClient>,
  packageId: string,
  corridorId: string,
  storageUnitId: string,
): Promise<DepotConfigFields | null> {
  try {
    const result = await client.getDynamicFieldObject({
      parentId: corridorId,
      name: {
        type: `${packageId}::depot::DepotConfigKey`,
        value: { storage_unit_id: storageUnitId },
      },
    });
    if (result.data?.content && "fields" in result.data.content) {
      const outer = result.data.content.fields as Record<string, unknown>;
      const value = (outer.value ?? outer) as Record<string, unknown>;
      return {
        input_type_id: value.input_type_id as string | number,
        output_type_id: value.output_type_id as string | number,
        ratio_in: value.ratio_in as string | number,
        ratio_out: value.ratio_out as string | number,
        fee_bps: value.fee_bps as string | number,
        is_active: Boolean(value.is_active),
        total_trades: value.total_trades as string | number,
        total_volume_in: value.total_volume_in as string | number,
        total_fees_collected: value.total_fees_collected as string | number,
      };
    }
  } catch {
    // Dynamic field doesn't exist yet (depot not configured)
  }
  return null;
}

interface PoolConfigFields {
  item_type_id: string | number;
  reserve_sui: unknown; // Balance<SUI> object
  reserve_items: string | number;
  fee_bps: string | number;
  is_active: boolean;
  total_swaps: string | number;
  total_sui_volume: string | number;
  total_item_volume: string | number;
  total_fees_collected: string | number;
}

async function fetchPoolConfig(
  client: ReturnType<typeof useSuiClient>,
  packageId: string,
  corridorId: string,
  storageUnitId: string,
): Promise<PoolConfig | null> {
  try {
    const result = await client.getDynamicFieldObject({
      parentId: corridorId,
      name: {
        type: `${packageId}::liquidity_pool::PoolConfigKey`,
        value: { storage_unit_id: storageUnitId },
      },
    });
    if (result.data?.content && "fields" in result.data.content) {
      const outer = result.data.content.fields as Record<string, unknown>;
      const value = (outer.value ?? outer) as Record<string, unknown>;
      // reserve_sui is a Balance<SUI> — stored as { value: string }
      let reserveSui = 0;
      if (value.reserve_sui && typeof value.reserve_sui === "object") {
        reserveSui = Number((value.reserve_sui as Record<string, unknown>).value || 0);
      } else {
        reserveSui = Number(value.reserve_sui || 0);
      }
      return {
        storageUnitId,
        itemTypeId: Number(value.item_type_id),
        reserveSui,
        reserveItems: Number(value.reserve_items),
        feeBps: Number(value.fee_bps),
        isActive: Boolean(value.is_active),
        totalSwaps: Number(value.total_swaps),
        totalSuiVolume: Number(value.total_sui_volume),
        totalItemVolume: Number(value.total_item_volume),
        totalFeesCollected: Number(value.total_fees_collected),
      };
    }
  } catch {
    // Pool not configured for this storage unit
  }
  return null;
}

export function usePoolConfigs(corridorId: string, depotAId: string, depotBId: string): {
  poolA: PoolConfig | null;
  poolB: PoolConfig | null;
  isLoading: boolean;
} {
  const packageId = useNetworkVariable("fenPackageId");
  const client = useSuiClient();
  const [poolA, setPoolA] = useState<PoolConfig | null>(null);
  const [poolB, setPoolB] = useState<PoolConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!corridorId || packageId === "0x0") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      const [a, b] = await Promise.all([
        depotAId ? fetchPoolConfig(client, packageId, corridorId, depotAId) : null,
        depotBId ? fetchPoolConfig(client, packageId, corridorId, depotBId) : null,
      ]);
      if (!cancelled) {
        setPoolA(a);
        setPoolB(b);
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [corridorId, depotAId, depotBId, client, packageId]);

  return { poolA, poolB, isLoading };
}

export function useCorridor(id: string): {
  corridor: Corridor | null;
  isLoading: boolean;
  error: Error | null;
} {
  const packageId = useNetworkVariable("fenPackageId");
  const client = useSuiClient();
  const isValid = id.startsWith("0x") && id.length > 3;

  const { data, isLoading, error } = useSuiClientQuery(
    "getObject",
    {
      id,
      options: { showContent: true, showOwner: true },
    },
    { enabled: isValid }
  );

  const [enriched, setEnriched] = useState<Corridor | null>(null);

  const baseCorridor = useMemo(() => {
    if (!isValid || !data?.data?.content) return null;
    if ("fields" in data.data.content) {
      const fields = data.data.content.fields as Record<string, unknown>;
      return parseCorridorObject(id, fields);
    }
    return null;
  }, [data, id, isValid]);

  useEffect(() => {
    if (!baseCorridor || packageId === "0x0") return;

    let cancelled = false;

    async function enrich() {
      const c = structuredClone(baseCorridor!);

      if (c.sourceGate.id) {
        const tc = await fetchTollConfig(client, packageId, c.id, c.sourceGate.id);
        if (tc) {
          c.sourceGate.tollAmount = Number(tc.toll_amount);
          c.sourceGate.surgeActive = tc.surge_active;
          c.sourceGate.surgeMultiplier = Number(tc.surge_numerator);
        }
      }
      if (c.destGate.id) {
        const tc = await fetchTollConfig(client, packageId, c.id, c.destGate.id);
        if (tc) {
          c.destGate.tollAmount = Number(tc.toll_amount);
          c.destGate.surgeActive = tc.surge_active;
          c.destGate.surgeMultiplier = Number(tc.surge_numerator);
        }
      }
      if (c.depotA.id) {
        const dc = await fetchDepotConfig(client, packageId, c.id, c.depotA.id);
        if (dc) {
          c.depotA.ratioIn = Number(dc.ratio_in);
          c.depotA.ratioOut = Number(dc.ratio_out);
          c.depotA.feeBps = Number(dc.fee_bps);
          c.depotA.isActive = dc.is_active;
          c.depotA.inputItem = { typeId: Number(dc.input_type_id), name: `Item #${dc.input_type_id}`, icon: "" };
          c.depotA.outputItem = { typeId: Number(dc.output_type_id), name: `Item #${dc.output_type_id}`, icon: "" };
        }
      }
      if (c.depotB.id) {
        const dc = await fetchDepotConfig(client, packageId, c.id, c.depotB.id);
        if (dc) {
          c.depotB.ratioIn = Number(dc.ratio_in);
          c.depotB.ratioOut = Number(dc.ratio_out);
          c.depotB.feeBps = Number(dc.fee_bps);
          c.depotB.isActive = dc.is_active;
          c.depotB.inputItem = { typeId: Number(dc.input_type_id), name: `Item #${dc.input_type_id}`, icon: "" };
          c.depotB.outputItem = { typeId: Number(dc.output_type_id), name: `Item #${dc.output_type_id}`, icon: "" };
        }
      }

      if (!cancelled) setEnriched(c);
    }

    enrich();
    return () => { cancelled = true; };
  }, [baseCorridor?.id, client, packageId]);

  return {
    corridor: enriched || baseCorridor,
    isLoading: isValid ? isLoading : false,
    error: error as Error | null,
  };
}

export function useDashboardStats(): {
  stats: DashboardStats;
  isLoading: boolean;
} {
  const { corridors, isLoading: corridorsLoading } = useCorridors();
  const [apiStats, setApiStats] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setApiStats(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setApiLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats: DashboardStats = apiStats
    ? {
        totalCorridors: Number(apiStats.totalCorridors || corridors.length),
        activeCorridors: Number(apiStats.activeCorridors || 0),
        totalVolume24h: 0,
        totalRevenue24h: Number(apiStats.totalRevenue || 0),
        totalJumps24h: Number(apiStats.totalJumps || 0),
        totalTrades24h: Number(apiStats.totalTrades || 0),
      }
    : {
        totalCorridors: corridors.length,
        activeCorridors: corridors.filter((c) => c.status === "active").length,
        totalVolume24h: 0,
        totalRevenue24h: corridors.reduce((sum, c) => sum + c.totalTollRevenue + c.totalTradeRevenue, 0),
        totalJumps24h: corridors.reduce((sum, c) => sum + c.totalJumps, 0),
        totalTrades24h: corridors.reduce((sum, c) => sum + c.totalTrades, 0),
      };

  return { stats, isLoading: corridorsLoading && apiLoading };
}

export function useActivity(corridorId?: string): {
  events: ActivityEvent[];
  isLoading: boolean;
} {
  const packageId = useNetworkVariable("fenPackageId");
  const isConfigured = packageId !== "0x0";

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

  const { data: poolData } = useSuiClientQuery(
    "queryEvents",
    {
      query: { MoveModule: { package: packageId, module: "liquidity_pool" } },
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
    ...(poolData?.data || []),
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
    case "PoolCreatedEvent":
      return "AMM pool created";
    case "PoolActivatedEvent":
      return "AMM pool activated";
    case "PoolDeactivatedEvent":
      return "AMM pool deactivated";
    case "SwapEvent":
      return `AMM swap: ${Number(parsed.direction) === 0 ? "bought items" : "sold items"}`;
    case "LiquidityChangedEvent":
      return `Liquidity ${parsed.is_add ? "added" : "removed"}`;
    default:
      return eventName.replace(/Event$/, "").replace(/([A-Z])/g, " $1").trim();
  }
}

function inferEventType(eventType: string): ActivityEvent["type"] {
  if (eventType.includes("TollPaid") || eventType.includes("Jump")) return "jump";
  if (eventType.includes("Trade")) return "trade";
  if (eventType.includes("TollConfig") || eventType.includes("Surge")) return "toll_config";
  if (eventType.includes("DepotConfig") || eventType.includes("DepotActivated") || eventType.includes("DepotDeactivated")) return "depot_config";
  if (eventType.includes("SwapEvent") || eventType.includes("Pool") || eventType.includes("LiquidityChanged")) return "trade";
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
        effectiveRate: c.depotA.ratioOut > 0 ? c.depotA.ratioIn / c.depotA.ratioOut : 1,
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
        effectiveRate: c.depotB.ratioOut > 0 ? c.depotB.ratioIn / c.depotB.ratioOut : 1,
        tollCost: c.destGate.tollAmount / 1_000_000_000,
        netProfit: 0,
        liquidity: c.depotB.outputStock,
      });
    }
  }

  return { routes, isLoading };
}

export function useChartData() {
  const [chartData, setChartData] = useState(
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, "0")}:00`,
      jumps: 0,
      trades: 0,
      revenue: 0,
    }))
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.chartData && Array.isArray(data.chartData)) {
          setChartData(data.chartData);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return { data: chartData, isLoading: false };
}
