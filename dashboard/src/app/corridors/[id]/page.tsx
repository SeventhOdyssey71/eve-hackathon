"use client";

import { use } from "react";
import Link from "next/link";
import { useCorridor, useActivity, useChartData } from "@/hooks/use-corridors";
import { formatSui, formatNumber, formatPercent, abbreviateAddress, timeAgo, statusBg } from "@/lib/utils";
import { ArrowRight, ArrowLeft, Shield, Zap, Package } from "lucide-react";
import { VolumeChart } from "@/components/dashboard/VolumeChart";

export default function CorridorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { corridor, isLoading } = useCorridor(id);
  const { events } = useActivity(id);
  const { data: chartData } = useChartData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-eve-muted">Loading corridor...</p>
      </div>
    );
  }

  if (!corridor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-eve-muted">Corridor not found</p>
      </div>
    );
  }

  const totalRevenue = corridor.totalTollRevenue + corridor.totalTradeRevenue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/corridors" className="text-eve-text-dim hover:text-eve-text">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{corridor.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(corridor.status)}`}>
              {corridor.status}
            </span>
          </div>
          <p className="text-sm text-eve-text-dim mt-1">
            Operated by {abbreviateAddress(corridor.owner)}
          </p>
        </div>
      </div>

      {/* Route visualization */}
      <div className="card p-6">
        <div className="grid grid-cols-5 gap-4 items-center">
          {/* Gate A */}
          <div className="text-center">
            <div className="card-elevated p-4 mb-2">
              <Shield className="w-6 h-6 text-eve-orange mx-auto mb-2" />
              <div className="text-sm font-bold">{corridor.sourceGate.name}</div>
              <div className="text-xs text-eve-text-dim">{corridor.sourceGate.solarSystem}</div>
              <div className="text-xs text-eve-orange mt-1">
                Toll: {formatSui(corridor.sourceGate.tollAmount)}
              </div>
              {corridor.sourceGate.surgeActive && (
                <div className="text-xs text-yellow-400 flex items-center justify-center gap-1 mt-1">
                  <Zap className="w-3 h-3" /> {corridor.sourceGate.surgeMultiplier / 100}% surge
                </div>
              )}
            </div>
          </div>

          {/* Depot A */}
          <div className="text-center">
            <div className="card-elevated p-4 mb-2">
              <Package className="w-6 h-6 text-eve-blue mx-auto mb-2" />
              <div className="text-sm font-bold">{corridor.depotA.name}</div>
              <div className="text-xs text-eve-text-dim mt-1">
                {corridor.depotA.inputItem.name} → {corridor.depotA.outputItem.name}
              </div>
              <div className="text-xs text-eve-orange mt-1">
                {corridor.depotA.ratioIn}:{corridor.depotA.ratioOut} ({formatPercent(corridor.depotA.feeBps)} fee)
              </div>
              <div className="text-xs text-eve-text-dim mt-1">
                Stock: {formatNumber(corridor.depotA.outputStock)} units
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-2">
            <ArrowRight className="w-8 h-8 text-eve-orange" />
            <div className="text-[10px] text-eve-text-dim uppercase tracking-wider">linked</div>
            <ArrowLeft className="w-8 h-8 text-eve-orange" />
          </div>

          {/* Depot B */}
          <div className="text-center">
            <div className="card-elevated p-4 mb-2">
              <Package className="w-6 h-6 text-eve-blue mx-auto mb-2" />
              <div className="text-sm font-bold">{corridor.depotB.name}</div>
              <div className="text-xs text-eve-text-dim mt-1">
                {corridor.depotB.inputItem.name} → {corridor.depotB.outputItem.name}
              </div>
              <div className="text-xs text-eve-orange mt-1">
                {corridor.depotB.ratioIn}:{corridor.depotB.ratioOut} ({formatPercent(corridor.depotB.feeBps)} fee)
              </div>
              <div className="text-xs text-eve-text-dim mt-1">
                Stock: {formatNumber(corridor.depotB.outputStock)} units
              </div>
            </div>
          </div>

          {/* Gate B */}
          <div className="text-center">
            <div className="card-elevated p-4 mb-2">
              <Shield className="w-6 h-6 text-eve-orange mx-auto mb-2" />
              <div className="text-sm font-bold">{corridor.destGate.name}</div>
              <div className="text-xs text-eve-text-dim">{corridor.destGate.solarSystem}</div>
              <div className="text-xs text-eve-orange mt-1">
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
          { label: "Total Trades", value: formatNumber(corridor.totalTrades), sub: `Across both depots` },
          { label: "Last Activity", value: timeAgo(corridor.lastActivityAt), sub: `Created ${timeAgo(corridor.createdAt)}` },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="text-xs text-eve-text-dim uppercase tracking-wider">{stat.label}</div>
            <div className="text-lg font-bold text-eve-orange mt-1">{stat.value}</div>
            <div className="text-xs text-eve-muted mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolumeChart data={chartData} />
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3">Corridor Activity</h3>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-xs text-eve-muted">No recent activity</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-eve-orange mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-eve-text">{e.description}</div>
                    <div className="text-eve-muted">{timeAgo(e.timestamp)}</div>
                  </div>
                  {e.value && (
                    <div className="text-eve-orange shrink-0">{formatSui(e.value)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
