"use client";

import Link from "next/link";
import { useCorridors } from "@/hooks/use-corridors";
import { formatSui, formatNumber, timeAgo, statusBg, abbreviateAddress, explorerUrl } from "@/lib/utils";
import { ArrowRight, Zap, Route, ExternalLink, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { SkeletonCorridorList, SkeletonStatsGrid } from "@/components/ui/Skeleton";

export default function CorridorsPage() {
  const { corridors, isLoading } = useCorridors();

  const totalRevenue = corridors.reduce((s, c) => s + c.totalTollRevenue + c.totalTradeRevenue, 0);
  const totalJumps = corridors.reduce((s, c) => s + c.totalJumps, 0);
  const totalTrades = corridors.reduce((s, c) => s + c.totalTrades, 0);
  const activeCount = corridors.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6 max-w-[1440px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corridors</h1>
          <p className="text-sm text-eve-text-dim mt-1">Browse all registered trade corridors on the FEN network</p>
        </div>
        <Link href="/operate" className="btn-primary">
          + Create Corridor
        </Link>
      </div>

      {/* Network Summary */}
      {isLoading ? (
        <SkeletonStatsGrid />
      ) : corridors.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="stat-label">Corridors</div>
              <Route className="w-4 h-4 text-eve-orange" />
            </div>
            <div className="text-xl font-bold mt-1">{corridors.length}</div>
            <div className="text-xs text-eve-muted mt-0.5">{activeCount} active</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="stat-label">Network Revenue</div>
              <TrendingUp className="w-4 h-4 text-eve-orange" />
            </div>
            <div className="text-xl font-bold text-eve-orange mt-1">{formatSui(totalRevenue)}</div>
            <div className="text-xs text-eve-muted mt-0.5">toll + trade fees</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="stat-label">Total Jumps</div>
              <Zap className="w-4 h-4 text-eve-blue" />
            </div>
            <div className="text-xl font-bold mt-1">{formatNumber(totalJumps)}</div>
            <div className="text-xs text-eve-muted mt-0.5">gate traversals</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="stat-label">Total Trades</div>
              <BarChart3 className="w-4 h-4 text-eve-green" />
            </div>
            <div className="text-xl font-bold mt-1">{formatNumber(totalTrades)}</div>
            <div className="text-xs text-eve-muted mt-0.5">depot + AMM swaps</div>
          </div>
        </div>
      ) : null}

      {/* Corridor List */}
      {isLoading ? (
        <SkeletonCorridorList />
      ) : corridors.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
            <Route className="w-7 h-7 text-eve-muted" />
          </div>
          <h3 className="text-lg font-semibold text-eve-text mb-1">No corridors yet</h3>
          <p className="text-sm text-eve-text-dim max-w-sm mb-6">
            Register your first trade corridor to start collecting toll revenue and enabling cross-system trading.
          </p>
          <Link href="/operate" className="btn-primary">Register Your First Corridor</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {corridors.map((c) => {
            const revenue = c.totalTollRevenue + c.totalTradeRevenue;
            return (
              <Link
                key={c.id}
                href={`/corridors/${c.id}`}
                className="card p-5 hover:border-eve-orange/30 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-eve-text group-hover:text-eve-orange transition-colors truncate">
                        {c.name}
                      </h3>
                      <span className={`badge ${statusBg(c.status)} shrink-0`}>
                        {c.status}
                      </span>
                      {c.sourceGate.surgeActive && (
                        <span className="badge badge-surge shrink-0">
                          <Zap className="w-3 h-3" /> SURGE
                        </span>
                      )}
                    </div>

                    {/* Route with Object IDs */}
                    <div className="flex items-center gap-2 text-xs text-eve-text-dim mb-3">
                      <a
                        href={explorerUrl("object", c.sourceGate.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-eve-text hover:text-eve-orange transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {abbreviateAddress(c.sourceGate.id)}
                      </a>
                      <ArrowRight className="w-3.5 h-3.5 text-eve-orange shrink-0" />
                      <a
                        href={explorerUrl("object", c.destGate.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-eve-text hover:text-eve-orange transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {abbreviateAddress(c.destGate.id)}
                      </a>
                    </div>

                    {/* Toll + Depot info */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                      <div className="text-eve-text-dim">
                        <span className="text-eve-muted">Tolls:</span>{" "}
                        <span className="text-eve-orange font-medium">{formatSui(c.sourceGate.tollAmount)}</span>
                        {" / "}
                        <span className="text-eve-orange font-medium">{formatSui(c.destGate.tollAmount)}</span>
                      </div>
                      <div className="text-eve-text-dim">
                        <span className="text-eve-muted">Depot A:</span>{" "}
                        {c.depotA.inputItem.name} → {c.depotA.outputItem.name}{" "}
                        <span className="text-eve-text font-medium">({c.depotA.ratioIn}:{c.depotA.ratioOut})</span>
                      </div>
                      <div className="text-eve-text-dim">
                        <span className="text-eve-muted">Depot B:</span>{" "}
                        {c.depotB.inputItem.name} → {c.depotB.outputItem.name}{" "}
                        <span className="text-eve-text font-medium">({c.depotB.ratioIn}:{c.depotB.ratioOut})</span>
                      </div>
                    </div>

                    {/* Operator */}
                    <div className="flex items-center gap-2 mt-2.5 text-[11px] text-eve-muted">
                      <span>Operator:</span>
                      <span className="font-mono">{abbreviateAddress(c.owner)}</span>
                      <span className="text-eve-text-faint">·</span>
                      <span>ID: {abbreviateAddress(c.id)}</span>
                      <ExternalLink className="w-3 h-3 text-eve-muted group-hover:text-eve-orange transition-colors" />
                    </div>
                  </div>

                  {/* Right side stats */}
                  <div className="text-right space-y-1 shrink-0 ml-6">
                    <div className="text-lg font-bold text-eve-orange">
                      {formatSui(revenue)}
                    </div>
                    <div className="text-[10px] text-eve-muted uppercase tracking-wider">revenue</div>
                    <div className="flex items-center gap-3 justify-end mt-3 text-xs text-eve-text-dim">
                      <div className="text-center">
                        <div className="font-semibold text-eve-text">{formatNumber(c.totalJumps)}</div>
                        <div className="text-[10px] text-eve-muted">jumps</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-eve-text">{formatNumber(c.totalTrades)}</div>
                        <div className="text-[10px] text-eve-muted">trades</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-eve-muted mt-2">{timeAgo(c.lastActivityAt)}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
