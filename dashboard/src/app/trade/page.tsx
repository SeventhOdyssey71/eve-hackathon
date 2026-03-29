"use client";

import { useState, useCallback } from "react";
import { useTradeRoutes, useCorridors } from "@/hooks/use-corridors";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, TrendingUp, Droplets, Filter, ArrowRightLeft, Zap, Info } from "lucide-react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/sui-config";

export default function TradePage() {
  const [sortBy, setSortBy] = useState<"rate" | "toll" | "fee">("rate");
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const { routes } = useTradeRoutes();
  const { corridors } = useCorridors();
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("fenPackageId");

  const sorted = [...routes].sort((a, b) => {
    switch (sortBy) {
      case "rate": return a.effectiveRate - b.effectiveRate; // lower ratio = better
      case "toll": return a.tollCost - b.tollCost;
      case "fee": return a.effectiveRate - b.effectiveRate;
      default: return 0;
    }
  });

  const activeRoute = routes[selectedRoute] || routes[0];

  // Calculate real estimated output based on depot ratio and fee
  const calcOutput = (route: typeof activeRoute, qty: number) => {
    if (!route || route.effectiveRate === 0) return { output: 0, fee: 0, tollSui: 0 };
    const rawOutput = Math.floor(qty / route.effectiveRate);
    // fee is already embedded in effectiveRate for fixed-ratio depots
    // tollCost is in SUI
    return {
      output: rawOutput,
      fee: 0,
      tollSui: route.tollCost,
    };
  };

  const estimate = activeRoute ? calcOutput(activeRoute, quantity) : { output: 0, fee: 0, tollSui: 0 };

  const [showRequirements, setShowRequirements] = useState(false);

  const handleTrade = useCallback(() => {
    if (!account || !activeRoute || quantity <= 0) return;
    // Show requirements dialog — actual execution requires EVE Frontier game objects
    setShowRequirements(true);
  }, [account, activeRoute, quantity]);

  // Count active vs total corridors for the header stat
  const activeCorrCount = corridors.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-8 max-w-[1440px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trade Routes</h1>
          <p className="text-sm text-eve-text-dim mt-1">
            Find the best corridors to trade through
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-eve-text-dim">
            {routes.length} route{routes.length !== 1 ? "s" : ""} across {activeCorrCount} active corridor{activeCorrCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-7 h-7 text-eve-muted" />
          </div>
          <h3 className="text-lg font-semibold text-eve-text mb-1">No trade routes available</h3>
          <p className="text-sm text-eve-text-dim max-w-sm mb-6">
            Trade routes appear when active corridors have configured and activated depots.
            {corridors.length > 0 && corridors.every((c) => c.status !== "active") && (
              <span className="block mt-2 text-eve-yellow">
                {corridors.length} corridor{corridors.length !== 1 ? "s" : ""} found but none are active yet.
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <Link href="/corridors" className="btn-secondary">View Corridors</Link>
            <Link href="/operate" className="btn-primary">Create Corridor</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-eve-muted" />
            <span className="text-xs text-eve-text-dim font-medium">Sort by:</span>
            {([
              { key: "rate", label: "Best Rate", icon: TrendingUp },
              { key: "toll", label: "Lowest Toll", icon: Zap },
              { key: "fee", label: "Lowest Fee", icon: Droplets },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  sortBy === key
                    ? "bg-eve-orange/10 text-eve-orange"
                    : "text-eve-text-dim hover:text-eve-text hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="w-3 h-3 inline mr-1" /> {label}
              </button>
            ))}
          </div>

          {/* Trade routes table */}
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-eve-text-faint uppercase tracking-wider">
                  <th className="text-left py-3 px-5 font-medium">Route</th>
                  <th className="text-left py-3 px-4 font-medium">Trade Pair</th>
                  <th className="text-right py-3 px-4 font-medium">Exchange Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Toll Cost</th>
                  <th className="text-right py-3 px-4 font-medium">Liquidity</th>
                  <th className="text-right py-3 px-5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((route, i) => (
                  <tr
                    key={`${route.corridorId}-${route.from}-${i}`}
                    className={`border-b border-white/[0.06]/40 hover:bg-white/[0.04]/40 transition-colors cursor-pointer ${
                      routes.indexOf(route) === selectedRoute ? "bg-eve-orange/5" : ""
                    }`}
                    onClick={() => setSelectedRoute(routes.indexOf(route))}
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-eve-text">{route.corridorName}</div>
                      <div className="flex items-center gap-1 text-xs text-eve-text-dim mt-0.5">
                        {route.from} <ArrowRight className="w-3 h-3 text-eve-orange" /> {route.to}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-eve-text">{route.inputItem}</span>
                      <span className="text-eve-muted mx-1.5">→</span>
                      <span className="text-eve-text">{route.outputItem}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-eve-orange font-semibold">
                        {route.effectiveRate.toFixed(2)}:1
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-eve-text-dim">
                      {route.tollCost > 0 ? (
                        <span>{route.tollCost.toFixed(4)} SUI</span>
                      ) : (
                        <span className="text-eve-green">Free</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-eve-text-dim">
                      {route.liquidity > 0 ? (
                        `${formatNumber(route.liquidity)} units`
                      ) : (
                        <span className="text-eve-muted">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/corridors/${route.corridorId}`}
                        className="text-xs text-eve-orange font-medium hover:text-eve-orange-light transition-colors"
                        onClick={(e) => e.stopPropagation()}
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
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title">Trade Calculator</h3>
              {activeRoute && (
                <span className="text-xs text-eve-text-dim">
                  {activeRoute.corridorName}: {activeRoute.inputItem} → {activeRoute.outputItem}
                </span>
              )}
            </div>

            {activeRoute ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    <label className="label">Input Quantity ({activeRoute.inputItem})</label>
                    <input
                      type="number"
                      placeholder="100"
                      className="input-field text-[13px]"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="label">You Receive ({activeRoute.outputItem})</label>
                    <div className="card-elevated px-4 py-2.5 text-[13px]">
                      <span className="font-semibold text-eve-orange text-lg">
                        {estimate.output}
                      </span>
                      <span className="text-eve-muted ml-2 text-xs">units</span>
                    </div>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="bg-eve-bg rounded-xl p-4">
                  <div className="text-xs font-semibold text-eve-text-dim mb-3 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Cost Breakdown
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-eve-muted">Exchange Rate</div>
                      <div className="text-eve-text font-medium mt-0.5">
                        {activeRoute.effectiveRate.toFixed(2)} : 1
                      </div>
                    </div>
                    <div>
                      <div className="text-eve-muted">Gate Toll</div>
                      <div className="text-eve-text font-medium mt-0.5">
                        {activeRoute.tollCost > 0 ? `${activeRoute.tollCost.toFixed(4)} SUI` : "Free"}
                      </div>
                    </div>
                    <div>
                      <div className="text-eve-muted">Input</div>
                      <div className="text-eve-text font-medium mt-0.5">
                        {quantity} {activeRoute.inputItem}
                      </div>
                    </div>
                    <div>
                      <div className="text-eve-muted">Output</div>
                      <div className="text-eve-orange font-semibold mt-0.5">
                        {estimate.output} {activeRoute.outputItem}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    className="btn-primary flex-1"
                    disabled={!account || quantity <= 0}
                    onClick={handleTrade}
                  >
                    {!account
                      ? "Connect Wallet to Trade"
                      : quantity <= 0
                        ? "Enter Quantity"
                        : `Trade ${quantity} ${activeRoute.inputItem} for ${estimate.output} ${activeRoute.outputItem}`}
                  </button>
                  <Link
                    href={`/corridors/${activeRoute.corridorId}`}
                    className="btn-secondary"
                  >
                    View Corridor
                  </Link>
                </div>

                {account && (
                  <p className="text-[10px] text-eve-muted text-center">
                    This will submit a transaction to pay the toll and execute the trade in a single PTB.
                    You need SUI for the toll and the input items in your inventory.
                    <span className="block mt-1 text-eve-yellow/70">
                      Requires EVE Frontier Character, Gate, SSU, and Item objects in your wallet.
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-eve-muted text-center py-4">Select a route above to calculate trade costs</p>
            )}
          </div>
        </>
      )}

      {/* Requirements dialog */}
      {showRequirements && activeRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRequirements(false)}>
          <div className="card p-6 max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-eve-text">Trade Transaction Preview</h3>
            <p className="text-sm text-eve-text-dim">
              This trade chains <code className="text-eve-orange text-xs">toll_gate::pay_toll_and_jump</code> + <code className="text-eve-orange text-xs">depot::execute_trade</code> in a single PTB and requires:
            </p>
            <div className="bg-eve-bg rounded-xl p-4 space-y-2 text-xs font-mono">
              <div><span className="text-eve-muted">package:</span> <span className="text-eve-text">{packageId.slice(0, 16)}...</span></div>
              <div><span className="text-eve-muted">corridor:</span> <span className="text-eve-text">{activeRoute.corridorId.slice(0, 16)}...</span></div>
              <div><span className="text-eve-muted">toll:</span> <span className="text-eve-text">{activeRoute.tollCost} SUI</span></div>
              <div><span className="text-eve-muted">input:</span> <span className="text-eve-text">{quantity} {activeRoute.inputItem}</span></div>
              <div><span className="text-eve-muted">output:</span> <span className="text-eve-orange">{estimate.output} {activeRoute.outputItem}</span></div>
              <div className="border-t border-white/[0.06]/40 pt-2 mt-2">
                <div><span className="text-eve-muted">source_gate:</span> <span className="text-eve-yellow">required (EVE Frontier Gate)</span></div>
                <div><span className="text-eve-muted">dest_gate:</span> <span className="text-eve-yellow">required (EVE Frontier Gate)</span></div>
                <div><span className="text-eve-muted">character:</span> <span className="text-eve-yellow">required (Character NFT)</span></div>
                <div><span className="text-eve-muted">storage_unit:</span> <span className="text-eve-yellow">required (SSU object)</span></div>
                <div><span className="text-eve-muted">input_item:</span> <span className="text-eve-yellow">required (in-game Item)</span></div>
              </div>
            </div>
            <p className="text-xs text-eve-muted">
              These objects are created within the EVE Frontier game world. Connect with an EVE Frontier wallet that holds these objects to execute trades.
            </p>
            <button className="btn-secondary w-full" onClick={() => setShowRequirements(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
