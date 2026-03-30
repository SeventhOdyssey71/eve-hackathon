"use client";

import { useMemo } from "react";
import { useCorridors } from "@/hooks/use-corridors";
import { formatSui, formatNumber, abbreviateAddress, explorerUrl } from "@/lib/utils";
import { Trophy, TrendingUp, Zap, ArrowRightLeft, Crown, Medal } from "lucide-react";
import Link from "next/link";
import { SkeletonStatsGrid, SkeletonTable } from "@/components/ui/Skeleton";

const RANK_COLORS = ["text-eve-yellow", "text-eve-text", "text-eve-orange", "text-eve-text-dim", "text-eve-muted"];
const RANK_BADGES = [
  { icon: Crown, bg: "bg-eve-yellow/10", border: "border-eve-yellow/30" },
  { icon: Medal, bg: "bg-eve-text/5", border: "border-white/[0.06]" },
  { icon: Medal, bg: "bg-eve-orange/10", border: "border-eve-orange/30" },
];

export default function RankingsPage() {
  const { corridors, isLoading } = useCorridors();

  const byRevenue = useMemo(
    () => [...corridors].sort((a, b) => (b.totalTollRevenue + b.totalTradeRevenue) - (a.totalTollRevenue + a.totalTradeRevenue)),
    [corridors]
  );

  const byJumps = useMemo(
    () => [...corridors].sort((a, b) => b.totalJumps - a.totalJumps),
    [corridors]
  );

  const byTrades = useMemo(
    () => [...corridors].sort((a, b) => b.totalTrades - a.totalTrades),
    [corridors]
  );

  // Operator leaderboard: group by owner, sum revenues
  const operators = useMemo(() => {
    const map = new Map<string, { address: string; corridors: number; revenue: number; jumps: number; trades: number }>();
    for (const c of corridors) {
      const existing = map.get(c.owner) || { address: c.owner, corridors: 0, revenue: 0, jumps: 0, trades: 0 };
      existing.corridors += 1;
      existing.revenue += c.totalTollRevenue + c.totalTradeRevenue;
      existing.jumps += c.totalJumps;
      existing.trades += c.totalTrades;
      map.set(c.owner, existing);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [corridors]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1440px]">
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <SkeletonStatsGrid />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1440px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
          <p className="text-sm text-eve-text-dim mt-1">
            Top corridors and operators across the FEN network
          </p>
        </div>
        <div className="text-sm text-eve-text-dim">
          {corridors.length} corridor{corridors.length !== 1 ? "s" : ""} tracked
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatSui(corridors.reduce((s, c) => s + c.totalTollRevenue + c.totalTradeRevenue, 0)), icon: TrendingUp },
          { label: "Total Jumps", value: formatNumber(corridors.reduce((s, c) => s + c.totalJumps, 0)), icon: Zap },
          { label: "Total Trades", value: formatNumber(corridors.reduce((s, c) => s + c.totalTrades, 0)), icon: ArrowRightLeft },
          { label: "Operators", value: String(operators.length), icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 text-xs text-eve-muted mb-1">
              <Icon className="w-3.5 h-3.5" /> {label}
            </div>
            <div className="text-lg font-semibold text-eve-text">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Corridors by Revenue */}
        <div className="card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-eve-orange" /> Top Corridors by Revenue
          </h3>
          <div className="space-y-3">
            {byRevenue.slice(0, 5).map((c, i) => {
              const badge = RANK_BADGES[i];
              const BadgeIcon = badge?.icon || Medal;
              return (
                <Link href={`/corridors/${c.id}`} key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04]/60 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badge?.bg || "bg-white/[0.04]"} border ${badge?.border || "border-white/[0.06]"}`}>
                    <BadgeIcon className={`w-4 h-4 ${RANK_COLORS[i] || "text-eve-muted"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-eve-text truncate">{c.name}</div>
                    <div className="text-xs text-eve-text-dim">
                      {formatNumber(c.totalJumps)} jumps | {formatNumber(c.totalTrades)} trades
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-eve-orange">{formatSui(c.totalTollRevenue + c.totalTradeRevenue)}</div>
                    <div className={`text-[10px] font-medium ${c.status === "active" ? "text-eve-green" : "text-eve-muted"}`}>
                      {c.status}
                    </div>
                  </div>
                </Link>
              );
            })}
            {corridors.length === 0 && (
              <p className="text-sm text-eve-muted text-center py-4">No corridors registered yet</p>
            )}
          </div>
        </div>

        {/* Operator Leaderboard */}
        <div className="card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-eve-yellow" /> Operator Leaderboard
          </h3>
          <div className="space-y-3">
            {operators.slice(0, 5).map((op, i) => {
              const badge = RANK_BADGES[i];
              const BadgeIcon = badge?.icon || Medal;
              return (
                <a
                  key={op.address}
                  href={explorerUrl("address", op.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04]/60 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badge?.bg || "bg-white/[0.04]"} border ${badge?.border || "border-white/[0.06]"}`}>
                    <BadgeIcon className={`w-4 h-4 ${RANK_COLORS[i] || "text-eve-muted"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-eve-text font-mono">{abbreviateAddress(op.address)}</div>
                    <div className="text-xs text-eve-text-dim">
                      {op.corridors} corridor{op.corridors !== 1 ? "s" : ""} | {formatNumber(op.jumps + op.trades)} total ops
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-eve-orange">{formatSui(op.revenue)}</div>
                  </div>
                </a>
              );
            })}
            {operators.length === 0 && (
              <p className="text-sm text-eve-muted text-center py-4">No operators yet</p>
            )}
          </div>
        </div>

        {/* Most Active by Jumps */}
        <div className="card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-eve-blue" /> Most Active (Jumps)
          </h3>
          <div className="space-y-2">
            {byJumps.slice(0, 5).map((c, i) => (
              <Link href={`/corridors/${c.id}`} key={c.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04]/60 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${RANK_COLORS[i]}`}>#{i + 1}</span>
                  <span className="text-sm text-eve-text">{c.name}</span>
                </div>
                <span className="text-sm font-semibold text-eve-blue">{formatNumber(c.totalJumps)} jumps</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Most Active by Trades */}
        <div className="card p-5">
          <h3 className="section-title mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-eve-green" /> Most Active (Trades)
          </h3>
          <div className="space-y-2">
            {byTrades.slice(0, 5).map((c, i) => (
              <Link href={`/corridors/${c.id}`} key={c.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/[0.04]/60 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 text-center ${RANK_COLORS[i]}`}>#{i + 1}</span>
                  <span className="text-sm text-eve-text">{c.name}</span>
                </div>
                <span className="text-sm font-semibold text-eve-green">{formatNumber(c.totalTrades)} trades</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
