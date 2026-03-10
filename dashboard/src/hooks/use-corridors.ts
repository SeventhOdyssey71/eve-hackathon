"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";
import { MOCK_CORRIDORS, MOCK_STATS, MOCK_ACTIVITY, MOCK_CHART_DATA, MOCK_TRADE_ROUTES } from "@/lib/mock-data";
import type { Corridor, DashboardStats, ActivityEvent, TradeRoute } from "@/lib/types";

const USE_MOCK = process.env.NEXT_PUBLIC_FEN_PACKAGE_ID === "0x0" || !process.env.NEXT_PUBLIC_FEN_PACKAGE_ID;

/** Fetch all corridors from on-chain registry, falling back to mock data */
export function useCorridors(): {
  corridors: Corridor[];
  isLoading: boolean;
  error: Error | null;
} {
  const registryId = useNetworkVariable("corridorRegistryId");

  const { data, isLoading, error } = useSuiClientQuery(
    "getObject",
    {
      id: registryId,
      options: { showContent: true, showOwner: true },
    },
    { enabled: !USE_MOCK && registryId !== "0x0" }
  );

  if (USE_MOCK || !data) {
    return { corridors: MOCK_CORRIDORS, isLoading: false, error: null };
  }

  // When real data is available, parse on-chain corridor objects
  // For now, this serves as the integration point — once deployed,
  // we'd parse data.data?.content into Corridor[]
  return {
    corridors: MOCK_CORRIDORS, // Will be replaced with parsed on-chain data
    isLoading,
    error: error as Error | null,
  };
}

/** Fetch a single corridor by ID */
export function useCorridor(id: string): {
  corridor: Corridor | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useSuiClientQuery(
    "getObject",
    {
      id,
      options: { showContent: true, showOwner: true },
    },
    { enabled: !USE_MOCK && id !== "0x0" && !id.startsWith("0xc0") }
  );

  if (USE_MOCK || !data) {
    const corridor = MOCK_CORRIDORS.find((c) => c.id === id);
    return { corridor, isLoading: false, error: null };
  }

  return {
    corridor: MOCK_CORRIDORS.find((c) => c.id === id),
    isLoading,
    error: error as Error | null,
  };
}

/** Dashboard aggregate stats */
export function useDashboardStats(): {
  stats: DashboardStats;
  isLoading: boolean;
} {
  // Derived from corridors in real implementation
  return { stats: MOCK_STATS, isLoading: false };
}

/** Recent activity events — would query on-chain events */
export function useActivity(corridorId?: string): {
  events: ActivityEvent[];
  isLoading: boolean;
} {
  const events = corridorId
    ? MOCK_ACTIVITY.filter((e) => e.corridorId === corridorId)
    : MOCK_ACTIVITY;
  return { events, isLoading: false };
}

/** Trade routes derived from corridor depot configs */
export function useTradeRoutes(): {
  routes: TradeRoute[];
  isLoading: boolean;
} {
  return { routes: MOCK_TRADE_ROUTES, isLoading: false };
}

/** Chart data — in production, aggregate from on-chain events */
export function useChartData() {
  return { data: MOCK_CHART_DATA, isLoading: false };
}
