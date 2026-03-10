"use client";

import { useState } from "react";
import { useTradeRoutes, useCorridors } from "@/hooks/use-corridors";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, TrendingUp, Droplets, Filter, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function TradePage() {
  const [sortBy, setSortBy] = useState<"profit" | "liquidity">("profit");
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const { routes } = useTradeRoutes();
  const { corridors } = useCorridors();
  const account = useCurrentAccount();

  const sorted = [...routes].sort((a, b) =>
    sortBy === "profit" ? b.netProfit - a.netProfit : b.liquidity - a.liquidity
  );

  const activeRoute = routes[selectedRoute] || routes[0];
  const estimatedReturn = activeRoute
    ? ((quantity / activeRoute.effectiveRate) * activeRoute.netProfit) / 100
    : 0;

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trade Routes</h1>
        <p className="text-sm text-eve-text-dim mt-1">
          Find the most profitable corridors to trade through
        </p>
      </div>

      {routes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-eve-elevated flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-7 h-7 text-eve-muted" />
          </div>
          <h3 className="text-lg font-semibold text-eve-text mb-1">No trade routes available</h3>
          <p className="text-sm text-eve-text-dim max-w-sm mb-6">
            Trade routes will appear here when active corridors with configured depots are registered on-chain.
          </p>
          <Link href="/corridors" className="btn-primary">View Corridors</Link>
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-eve-muted" />
            <span className="text-xs text-eve-text-dim font-medium">Sort by:</span>
            <button
              onClick={() => setSortBy("profit")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                sortBy === "profit"
                  ? "bg-eve-orange/10 text-eve-orange"
                  : "text-eve-text-dim hover:text-eve-text hover:bg-eve-elevated"
              }`}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" /> Profit
            </button>
            <button
              onClick={() => setSortBy("liquidity")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                sortBy === "liquidity"
                  ? "bg-eve-orange/10 text-eve-orange"
                  : "text-eve-text-dim hover:text-eve-text hover:bg-eve-elevated"
              }`}
            >
              <Droplets className="w-3 h-3 inline mr-1" /> Liquidity
            </button>
          </div>

          {/* Trade routes table */}
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-eve-border text-xs text-eve-text-faint uppercase tracking-wider">
                  <th className="text-left py-3 px-5 font-medium">Route</th>
                  <th className="text-left py-3 px-4 font-medium">Trade Pair</th>
                  <th className="text-right py-3 px-4 font-medium">Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Toll</th>
                  <th className="text-right py-3 px-4 font-medium">Net Profit</th>
                  <th className="text-right py-3 px-4 font-medium">Liquidity</th>
                  <th className="text-right py-3 px-5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((route, i) => (
                  <tr
                    key={`${route.corridorId}-${route.from}-${i}`}
                    className="border-b border-eve-border/40 hover:bg-eve-elevated/40 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-eve-text">{route.corridorName}</div>
                      <div className="flex items-center gap-1 text-xs text-eve-text-dim mt-0.5">
                        {route.from} <ArrowRight className="w-3 h-3 text-eve-orange" /> {route.to}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-eve-text-dim">
                      {route.inputItem} → {route.outputItem}
                    </td>
                    <td className="py-3.5 px-4 text-right text-eve-text font-medium">
                      {route.effectiveRate}:1
                    </td>
                    <td className="py-3.5 px-4 text-right text-eve-text-dim">
                      {route.tollCost} SUI
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-medium ${route.netProfit > 0 ? "text-eve-green" : route.netProfit < 0 ? "text-eve-red" : "text-eve-text-dim"}`}>
                        {route.netProfit > 0 ? "+" : ""}{route.netProfit.toFixed(1)} SUI
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-eve-text-dim">
                      {formatNumber(route.liquidity)} units
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/corridors/${route.corridorId}`}
                        className="text-xs text-eve-orange font-medium hover:text-eve-orange-light transition-colors"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trade calculator */}
          <div className="card p-6">
            <h3 className="section-title mb-5">Trade Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
              <div>
                <label className="label">Route</label>
                <select
                  className="input-field text-[13px]"
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(Number(e.target.value))}
                >
                  {routes.map((r, i) => (
                    <option key={`${r.corridorId}-${r.from}-${i}`} value={i}>
                      {r.corridorName}: {r.inputItem} → {r.outputItem}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  placeholder="100"
                  className="input-field text-[13px]"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div>
                <label className="label">Estimated Return</label>
                <div className="card-elevated px-4 py-2.5 text-[13px]">
                  <span className={`font-semibold ${estimatedReturn >= 0 ? "text-eve-green" : "text-eve-red"}`}>
                    {estimatedReturn >= 0 ? "+" : ""}{estimatedReturn.toFixed(2)} SUI
                  </span>
                  <span className="text-eve-muted ml-2 text-xs">(after toll + fees)</span>
                </div>
              </div>
              <div>
                <button
                  className="btn-primary w-full"
                  disabled={!account}
                >
                  {account ? "Execute Trade" : "Connect Wallet"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
