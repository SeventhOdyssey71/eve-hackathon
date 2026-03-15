import { NextResponse } from "next/server";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

const NETWORK =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "devnet" | "mainnet") ||
  "testnet";
const client = new SuiJsonRpcClient({
  network: NETWORK,
  url: getJsonRpcFullnodeUrl(NETWORK),
});
const PACKAGE_ID = process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0x294fc90bf2c62a428ebed1a5e10406ef023b22a458881ef667b02af6e99d89af";

export async function GET() {
  try {
    // Get all corridor IDs from CorridorCreatedEvent
    const eventsResult = await client.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::corridor::CorridorCreatedEvent` },
      limit: 50,
      order: "descending",
    });

    const corridorIds: string[] = [];
    for (const event of eventsResult.data) {
      const data = event.parsedJson as Record<string, unknown>;
      const id = data?.corridor_id as string;
      if (id && !corridorIds.includes(id)) corridorIds.push(id);
    }

    // Fetch all corridor objects
    let totalJumps = 0;
    let totalTrades = 0;
    let totalTollRevenue = 0;
    let totalTradeRevenue = 0;
    let activeCount = 0;

    if (corridorIds.length > 0) {
      const objects = await client.multiGetObjects({
        ids: corridorIds,
        options: { showContent: true },
      });

      for (const obj of objects) {
        if (obj.data?.content && "fields" in obj.data.content) {
          const f = obj.data.content.fields as Record<string, unknown>;
          totalJumps += Number(f.total_jumps || 0);
          totalTrades += Number(f.total_trades || 0);
          totalTollRevenue += Number(f.total_toll_revenue || 0);
          totalTradeRevenue += Number(f.total_trade_revenue || 0);
          if (Number(f.status) === 1) activeCount++;
        }
      }
    }

    // Count recent events for 24h activity (toll payments, trades, swaps)
    const [tollEvents, tradeEvents, swapEvents] = await Promise.all([
      client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::toll_gate::TollPaidEvent` },
        limit: 50,
        order: "descending",
      }).catch(() => ({ data: [] })),
      client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::depot::TradeExecutedEvent` },
        limit: 50,
        order: "descending",
      }).catch(() => ({ data: [] })),
      client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::liquidity_pool::SwapEvent` },
        limit: 50,
        order: "descending",
      }).catch(() => ({ data: [] })),
    ]);

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const jumps24h = tollEvents.data.filter((e) => now - Number(e.timestampMs || 0) < day).length;
    const trades24h = tradeEvents.data.filter((e) => now - Number(e.timestampMs || 0) < day).length;
    const swaps24h = swapEvents.data.filter((e) => now - Number(e.timestampMs || 0) < day).length;

    // Build hourly chart data from events
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourStart = now - (23 - i) * 60 * 60 * 1000;
      const hourEnd = hourStart + 60 * 60 * 1000;
      const hour = new Date(hourStart).getHours();

      const jumpsInHour = tollEvents.data.filter((e) => {
        const t = Number(e.timestampMs || 0);
        return t >= hourStart && t < hourEnd;
      }).length;

      const tradesInHour = tradeEvents.data.filter((e) => {
        const t = Number(e.timestampMs || 0);
        return t >= hourStart && t < hourEnd;
      }).length + swapEvents.data.filter((e) => {
        const t = Number(e.timestampMs || 0);
        return t >= hourStart && t < hourEnd;
      }).length;

      let revenueInHour = 0;
      for (const e of tollEvents.data) {
        const t = Number(e.timestampMs || 0);
        if (t >= hourStart && t < hourEnd) {
          const data = e.parsedJson as Record<string, unknown>;
          revenueInHour += Number(data?.amount || 0);
        }
      }

      return {
        hour: `${hour}:00`,
        jumps: jumpsInHour,
        trades: tradesInHour,
        revenue: revenueInHour,
      };
    });

    return NextResponse.json({
      totalCorridors: corridorIds.length,
      activeCorridors: activeCount,
      totalJumps,
      totalTrades,
      totalTollRevenue,
      totalTradeRevenue,
      totalRevenue: totalTollRevenue + totalTradeRevenue,
      jumps24h,
      trades24h,
      swaps24h,
      chartData: hourlyData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats", details: String(error) },
      { status: 500 }
    );
  }
}
