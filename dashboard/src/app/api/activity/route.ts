import { NextResponse } from "next/server";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

const client = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });
const PACKAGE_ID = process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0xb05f71abd959c6ffe9c5bb2a2bfb316d201f01dbca8c4508c59bb09efdc20f09";

const EVENT_TYPES = [
  "corridor::CorridorCreatedEvent",
  "corridor::CorridorStatusChangedEvent",
  "toll_gate::TollPaidEvent",
  "toll_gate::TollConfigUpdatedEvent",
  "toll_gate::SurgeActivatedEvent",
  "toll_gate::SurgeDeactivatedEvent",
  "depot::TradeExecutedEvent",
  "depot::DepotConfigUpdatedEvent",
  "depot::DepotActivatedEvent",
  "depot::DepotDeactivatedEvent",
  "liquidity_pool::PoolCreatedEvent",
  "liquidity_pool::SwapEvent",
  "liquidity_pool::LiquidityChangedEvent",
];

interface FenEvent {
  id: string;
  type: string;
  timestamp: number;
  corridorId: string;
  description: string;
  value?: number;
  data: Record<string, unknown>;
}

function describeEvent(type: string, data: Record<string, unknown>): { description: string; value?: number } {
  const short = type.replace(`${PACKAGE_ID}::`, "");
  switch (short) {
    case "corridor::CorridorCreatedEvent":
      return { description: `Corridor registered` };
    case "corridor::CorridorStatusChangedEvent": {
      const statusMap: Record<string, string> = { "0": "inactive", "1": "active", "2": "emergency" };
      return { description: `Status changed to ${statusMap[String(data.new_status)] || data.new_status}` };
    }
    case "toll_gate::TollPaidEvent":
      return { description: "Toll paid at gate", value: Number(data.amount || 0) };
    case "toll_gate::TollConfigUpdatedEvent":
      return { description: `Toll set to ${Number(data.toll_amount || 0) / 1e9} SUI` };
    case "toll_gate::SurgeActivatedEvent":
      return { description: `Surge pricing activated (${Number(data.surge_numerator || 0) / 100}x)` };
    case "toll_gate::SurgeDeactivatedEvent":
      return { description: "Surge pricing deactivated" };
    case "depot::TradeExecutedEvent":
      return { description: `Trade: ${data.input_amount} items exchanged`, value: Number(data.fee_collected || 0) };
    case "depot::DepotConfigUpdatedEvent":
      return { description: `Depot configured (${data.ratio_in}:${data.ratio_out}, ${Number(data.fee_bps || 0) / 100}% fee)` };
    case "depot::DepotActivatedEvent":
      return { description: "Depot activated" };
    case "depot::DepotDeactivatedEvent":
      return { description: "Depot deactivated" };
    case "liquidity_pool::PoolCreatedEvent":
      return { description: "AMM pool created" };
    case "liquidity_pool::SwapEvent":
      return { description: `AMM swap executed`, value: Number(data.sui_amount || 0) };
    case "liquidity_pool::LiquidityChangedEvent":
      return { description: "Pool liquidity changed" };
    default:
      return { description: short };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const corridorId = searchParams.get("corridorId");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  try {
    const allEvents: FenEvent[] = [];

    // Query all FEN event types in parallel
    const queries = EVENT_TYPES.map(async (eventType) => {
      try {
        const result = await client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::${eventType}` },
          limit,
          order: "descending",
        });
        return result.data.map((e) => {
          const data = (e.parsedJson || {}) as Record<string, unknown>;
          const { description, value } = describeEvent(e.type || "", data);
          return {
            id: e.id.txDigest + "-" + e.id.eventSeq,
            type: eventType.split("::")[1] || eventType,
            timestamp: Number(e.timestampMs || Date.now()),
            corridorId: (data.corridor_id as string) || "",
            description,
            value,
            data,
          };
        });
      } catch {
        return [];
      }
    });

    const results = await Promise.all(queries);
    for (const events of results) {
      allEvents.push(...events);
    }

    // Filter by corridor if specified
    const filtered = corridorId
      ? allEvents.filter((e) => e.corridorId === corridorId)
      : allEvents;

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      events: filtered.slice(0, limit),
      total: filtered.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch events", details: String(error) },
      { status: 500 }
    );
  }
}
