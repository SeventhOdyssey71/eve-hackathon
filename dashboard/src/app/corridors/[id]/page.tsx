"use client";

import { use } from "react";
import Link from "next/link";
import { useCorridor, useActivity, useChartData, usePoolConfigs } from "@/hooks/use-corridors";
import { formatSui, formatNumber, formatPercent, abbreviateAddress, timeAgo, statusBg, explorerUrl } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Shield, Zap, Package, AlertCircle, Droplets, ExternalLink } from "lucide-react";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { SkeletonStatsGrid, SkeletonChart, SkeletonActivityList, Skeleton } from "@/components/ui/Skeleton";

export default function CorridorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { corridor, isLoading } = useCorridor(id);
  const { events } = useActivity(id);
  const { data: chartData } = useChartData();
  const { poolA, poolB } = usePoolConfigs(
    corridor?.id || "",
    corridor?.depotA.id || "",
    corridor?.depotB.id || "",
  );

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-[1400px]">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="card p-6">
          <div className="grid grid-cols-5 gap-4 items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <SkeletonStatsGrid />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><SkeletonChart /></div>
          <SkeletonActivityList />
        </div>
      </div>
    );
  }

  if (!corridor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center animate-slide-up">
        <div className="w-12 h-12 rounded-xl bg-eve-elevated flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-eve-muted" />
        </div>
        <p className="text-sm text-eve-text-dim">Corridor not found</p>
        <Link href="/corridors" className="text-xs text-eve-orange mt-2 hover:underline">Back to corridors</Link>
      </div>
    );
  }

  const totalRevenue = corridor.totalTollRevenue + corridor.totalTradeRevenue;

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center gap-4">
        <Link href="/corridors" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{corridor.name}</h1>
            <span className={`badge ${statusBg(corridor.status)}`}>
              {corridor.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-eve-text-dim">
              Operated by{" "}
              <a
                href={explorerUrl("address", corridor.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-eve-orange hover:text-eve-orange-light transition-colors inline-flex items-center gap-1"
              >
                {abbreviateAddress(corridor.owner)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
        <a
          href={explorerUrl("object", corridor.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs inline-flex items-center gap-1.5"
        >
          View on Explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Route visualization */}
      <div className="card p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
          <div className="text-center">
            <div className="card-elevated p-4">
              <div className="w-10 h-10 rounded-xl bg-eve-orange/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-eve-orange" />
              </div>
              <div className="text-sm font-semibold">{corridor.sourceGate.name || "Gate A"}</div>
              <div className="text-xs text-eve-text-dim mt-0.5">{corridor.sourceGate.solarSystem || "Unknown"}</div>
              <div className="text-xs text-eve-orange font-medium mt-2">
                Toll: {formatSui(corridor.sourceGate.tollAmount)}
              </div>
              {corridor.sourceGate.surgeActive && (
                <div className="badge badge-surge mt-2 mx-auto">
                  <Zap className="w-3 h-3" /> {corridor.sourceGate.surgeMultiplier / 100}%
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <div className="card-elevated p-4">
              <div className="w-10 h-10 rounded-xl bg-eve-blue/10 flex items-center justify-center mx-auto mb-3">
                <Package className="w-5 h-5 text-eve-blue" />
              </div>
              <div className="text-sm font-semibold">{corridor.depotA.name || "Depot A"}</div>
              <div className="text-xs text-eve-text-dim mt-1">
                {corridor.depotA.inputItem.name || "Input"} → {corridor.depotA.outputItem.name || "Output"}
              </div>
              <div className="text-xs text-eve-orange font-medium mt-1">
                {corridor.depotA.ratioIn}:{corridor.depotA.ratioOut} ({formatPercent(corridor.depotA.feeBps)} fee)
              </div>
              <div className="text-xs text-eve-muted mt-1">
                Stock: {formatNumber(corridor.depotA.outputStock)}
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-2">
            <ArrowRight className="w-8 h-8 text-eve-orange" />
            <div className="text-[10px] text-eve-text-faint uppercase tracking-wider font-medium">linked</div>
            <ArrowLeft className="w-8 h-8 text-eve-orange" />
          </div>

          <div className="text-center">
            <div className="card-elevated p-4">
              <div className="w-10 h-10 rounded-xl bg-eve-blue/10 flex items-center justify-center mx-auto mb-3">
                <Package className="w-5 h-5 text-eve-blue" />
              </div>
              <div className="text-sm font-semibold">{corridor.depotB.name || "Depot B"}</div>
              <div className="text-xs text-eve-text-dim mt-1">
                {corridor.depotB.inputItem.name || "Input"} → {corridor.depotB.outputItem.name || "Output"}
              </div>
              <div className="text-xs text-eve-orange font-medium mt-1">
                {corridor.depotB.ratioIn}:{corridor.depotB.ratioOut} ({formatPercent(corridor.depotB.feeBps)} fee)
              </div>
              <div className="text-xs text-eve-muted mt-1">
                Stock: {formatNumber(corridor.depotB.outputStock)}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="card-elevated p-4">
              <div className="w-10 h-10 rounded-xl bg-eve-orange/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-eve-orange" />
              </div>
              <div className="text-sm font-semibold">{corridor.destGate.name || "Gate B"}</div>
              <div className="text-xs text-eve-text-dim mt-0.5">{corridor.destGate.solarSystem || "Unknown"}</div>
              <div className="text-xs text-eve-orange font-medium mt-2">
                Toll: {formatSui(corridor.destGate.tollAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatSui(totalRevenue), sub: `Toll: ${formatSui(corridor.totalTollRevenue)} / Trade: ${formatSui(corridor.totalTradeRevenue)}` },
          { label: "Total Jumps", value: formatNumber(corridor.totalJumps), sub: `Since ${new Date(corridor.createdAt).toLocaleDateString()}` },
          { label: "Total Trades", value: formatNumber(corridor.totalTrades), sub: "Across both depots" },
          { label: "Last Activity", value: timeAgo(corridor.lastActivityAt), sub: `Created ${timeAgo(corridor.createdAt)}` },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="stat-label">{stat.label}</div>
            <div className="text-xl font-semibold text-eve-orange mt-1">{stat.value}</div>
            <div className="stat-sub">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* AMM Pools */}
      {(poolA || poolB) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { pool: poolA, label: "Pool A (Depot A)" },
            { pool: poolB, label: "Pool B (Depot B)" },
          ].filter(({ pool }) => pool).map(({ pool, label }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                  <Droplets className="w-4 h-4 text-eve-orange" /> {label}
                </h3>
                <span className={`badge ${pool!.isActive ? "badge-active" : "badge-inactive"}`}>
                  {pool!.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="stat-label">SUI Reserve</div>
                  <div className="text-lg font-semibold text-eve-orange mt-1">{formatSui(pool!.reserveSui)}</div>
                </div>
                <div>
                  <div className="stat-label">Item Reserve</div>
                  <div className="text-lg font-semibold mt-1">{formatNumber(pool!.reserveItems)}</div>
                </div>
                <div>
                  <div className="stat-label">Spot Price</div>
                  <div className="text-sm font-medium mt-1">
                    {pool!.reserveItems > 0
                      ? `${(pool!.reserveSui / pool!.reserveItems / 1_000_000_000).toFixed(4)} SUI/item`
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="stat-label">Pool Fee</div>
                  <div className="text-sm font-medium mt-1">{formatPercent(pool!.feeBps)}</div>
                </div>
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t border-eve-border text-xs text-eve-text-dim">
                <span>{pool!.totalSwaps} swaps</span>
                <span>Vol: {formatSui(pool!.totalSuiVolume)}</span>
                <span>Fees: {formatSui(pool!.totalFeesCollected)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolumeChart data={chartData} />
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">Corridor Activity</h3>
          {events.length === 0 ? (
            <p className="text-xs text-eve-muted py-4 text-center">No recent activity for this corridor</p>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-eve-orange mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-eve-text text-[13px]">{e.description}</div>
                    <div className="text-eve-muted">{timeAgo(e.timestamp)}</div>
                  </div>
                  {e.value != null && e.value > 0 && (
                    <div className="text-eve-orange font-medium shrink-0">{formatSui(e.value)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
