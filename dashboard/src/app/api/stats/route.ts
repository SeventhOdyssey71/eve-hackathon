import { NextRequest, NextResponse } from "next/server";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

const NETWORK =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as "testnet" | "devnet" | "mainnet") ||
  "testnet";
const client = new SuiJsonRpcClient({
  network: NETWORK,
  url: getJsonRpcFullnodeUrl(NETWORK),
});
const PACKAGE_ID = process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0x4c2f4a85fdf9667aca3c877b71b112dd017dab2824c251b9291f407b033a441a";

const RANGE_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "all": Infinity,
};

function bucketConfig(range: string): { count: number; labelFn: (d: Date) => string } {
  switch (range) {
    case "24h": return { count: 24, labelFn: (d) => `${d.getHours()}:00` };
    case "3d": return { count: 36, labelFn: (d) => `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00` };
    case "7d": return { count: 28, labelFn: (d) => `${d.getMonth() + 1}/${d.getDate()} ${d.getHours() < 12 ? "AM" : "PM"}` };
    case "30d": return { count: 30, labelFn: (d) => `${d.getMonth() + 1}/${d.getDate()}` };
    default: return { count: 30, labelFn: (d) => `${d.getMonth() + 1}/${d.getDate()}` };
  }
}

export async function GET(request: NextRequest) {
  try {
    const range = request.nextUrl.searchParams.get("range") || "24h";
    const rangeMs = RANGE_MS[range] || RANGE_MS["24h"];
    const { count: bucketCount, labelFn } = bucketConfig(range);

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

    // Fetch events
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
    const allEvents = [...tollEvents.data, ...tradeEvents.data, ...swapEvents.data];

    const jumps24h = tollEvents.data.filter((e) => now - Number(e.timestampMs || 0) < day).length;
    const trades24h = tradeEvents.data.filter((e) => now - Number(e.timestampMs || 0) < day).length;
    const swaps24h = swapEvents.data.filter((e) => now - Number(e.timestampMs || 0) < day).length;

    // Build bucketed chart data
    const totalMs = rangeMs === Infinity ? (now - Math.min(...allEvents.map(e => Number(e.timestampMs || now)), now)) || day : rangeMs;
    const bucketMs = totalMs / bucketCount;

    const chartData = Array.from({ length: bucketCount }, (_, i) => {
      const bucketStart = now - (bucketCount - 1 - i) * bucketMs;
      const bucketEnd = bucketStart + bucketMs;
      const label = labelFn(new Date(bucketStart));

      const jumpsInBucket = tollEvents.data.filter((e) => {
        const t = Number(e.timestampMs || 0);
        return t >= bucketStart && t < bucketEnd;
      }).length;

      const tradesInBucket = tradeEvents.data.filter((e) => {
        const t = Number(e.timestampMs || 0);
        return t >= bucketStart && t < bucketEnd;
      }).length + swapEvents.data.filter((e) => {
        const t = Number(e.timestampMs || 0);
        return t >= bucketStart && t < bucketEnd;
      }).length;

      let revenueInBucket = 0;
      for (const e of [...tollEvents.data, ...swapEvents.data]) {
        const t = Number(e.timestampMs || 0);
        if (t >= bucketStart && t < bucketEnd) {
          const data = e.parsedJson as Record<string, unknown>;
          revenueInBucket += Number(data?.amount_paid || data?.sui_amount || 0);
        }
      }

      return { hour: label, jumps: jumpsInBucket, trades: tradesInBucket, revenue: revenueInBucket };
    });

    // Build event log for extended view
    const eventLog = allEvents
      .filter((e) => rangeMs === Infinity || now - Number(e.timestampMs || 0) < rangeMs)
      .sort((a, b) => Number(b.timestampMs || 0) - Number(a.timestampMs || 0))
      .slice(0, 50)
      .map((e) => {
        const data = e.parsedJson as Record<string, unknown>;
        const type = e.type.split("::").pop() || "";
        return {
          type,
          timestamp: Number(e.timestampMs || 0),
          suiAmount: Number(data?.amount_paid || data?.sui_amount || data?.fee_collected || 0),
          items: Number(data?.item_quantity || data?.input_quantity || 0),
          trader: (data?.payer || data?.trader || "") as string,
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
      chartData,
      eventLog,
      range,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
