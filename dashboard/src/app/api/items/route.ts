import { NextResponse } from "next/server";

const UTOPIA_API = "https://world-api-utopia.uat.pub.evefrontier.com";

// Cache the item catalog for 10 minutes
let cachedData: { items: Record<string, unknown>[]; fetchedAt: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  try {
    // Return cached data if fresh
    if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_TTL) {
      return NextResponse.json({
        items: cachedData.items,
        total: cachedData.items.length,
        source: "cache",
      });
    }

    const res = await fetch(`${UTOPIA_API}/v2/types?limit=400`, {
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Utopia API unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items = (data.data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      name: item.name,
      category: item.categoryName,
      volume: item.volume,
      mass: item.mass,
    }));

    cachedData = { items, fetchedAt: Date.now() };

    return NextResponse.json({
      items,
      total: items.length,
      source: "utopia-api",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch item catalog" },
      { status: 500 }
    );
  }
}
