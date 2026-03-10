"use client";

import { useState } from "react";
import { useTradeRoutes, useCorridors } from "@/hooks/use-corridors";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, TrendingUp, Droplets, Filter } from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function TradePage() {
  const [sortBy, setSortBy] = useState<"profit" | "liquidity">("profit");
  const { routes } = useTradeRoutes();
  const { corridors } = useCorridors();
  const account = useCurrentAccount();

  const sorted = [...routes].sort((a, b) =>
    sortBy === "profit" ? b.netProfit - a.netProfit : b.liquidity - a.liquidity
  );

  const activeCorridors = corridors.filter((c) => c.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Trade Routes</h1>
        <p className="text-sm text-eve-text-dim mt-1">
          Find the most profitable corridors to trade through
        </p>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-eve-muted" />
        <span className="text-xs text-eve-text-dim">Sort by:</span>
        <button
          onClick={() => setSortBy("profit")}
          className={`text-xs px-3 py-1 rounded transition-colors ${
            sortBy === "profit"
              ? "bg-eve-orange/10 text-eve-orange border border-eve-orange/20"
              : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <TrendingUp className="w-3 h-3 inline mr-1" /> Profit
        </button>
        <button
          onClick={() => setSortBy("liquidity")}
          className={`text-xs px-3 py-1 rounded transition-colors ${
            sortBy === "liquidity"
              ? "bg-eve-orange/10 text-eve-orange border border-eve-orange/20"
              : "text-eve-text-dim hover:text-eve-text"
          }`}
        >
          <Droplets className="w-3 h-3 inline mr-1" /> Liquidity
        </button>
      </div>

      {/* Trade routes table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-eve-border text-xs text-eve-text-dim uppercase tracking-wider">
              <th className="text-left p-4">Route</th>
              <th className="text-left p-4">Trade Pair</th>
              <th className="text-right p-4">Rate</th>
              <th className="text-right p-4">Toll</th>
              <th className="text-right p-4">Net Profit</th>
              <th className="text-right p-4">Liquidity</th>
              <th className="text-right p-4"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((route, i) => (
              <tr
                key={`${route.corridorId}-${route.from}-${i}`}
                className="border-b border-eve-border/50 hover:bg-eve-elevated/50 transition-colors"
              >
                <td className="p-4">
                  <div className="font-medium text-eve-text">{route.corridorName}</div>
                  <div className="flex items-center gap-1 text-xs text-eve-text-dim mt-0.5">
                    {route.from} <ArrowRight className="w-3 h-3 text-eve-orange" /> {route.to}
                  </div>
                </td>
                <td className="p-4 text-eve-text-dim">
                  {route.inputItem} → {route.outputItem}
                </td>
                <td className="p-4 text-right text-eve-text">
                  {route.effectiveRate}:1
                </td>
                <td className="p-4 text-right text-eve-text-dim">
                  {route.tollCost} SUI
                </td>
                <td className="p-4 text-right">
                  <span className={route.netProfit > 0 ? "text-eve-green" : "text-eve-red"}>
                    +{route.netProfit.toFixed(1)} SUI
                  </span>
                </td>
                <td className="p-4 text-right text-eve-text-dim">
                  {formatNumber(route.liquidity)} units
                </td>
                <td className="p-4 text-right">
                  <Link
                    href={`/corridors/${route.corridorId}`}
                    className="text-xs text-eve-orange hover:text-eve-orange-light transition-colors"
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
        <h3 className="text-sm font-bold mb-4">Trade Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label">Route</label>
            <select className="input-field text-sm">
              {activeCorridors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}: {c.sourceGate.solarSystem} → {c.destGate.solarSystem}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" placeholder="100" className="input-field text-sm" defaultValue={100} />
          </div>
          <div>
            <label className="label">Estimated Return</label>
            <div className="card-elevated p-2.5 text-sm">
              <span className="text-eve-green font-bold">+8.5 SUI</span>
              <span className="text-eve-text-dim ml-2">(after toll + fees)</span>
            </div>
          </div>
          <div>
            <button
              className="btn-primary w-full text-sm"
              disabled={!account}
            >
              {account ? "Execute Trade" : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
