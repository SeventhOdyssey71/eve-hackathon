"use client";

import Link from "next/link";
import { useCorridors } from "@/hooks/use-corridors";
import { formatSui, formatNumber, timeAgo, statusBg } from "@/lib/utils";
import { ArrowRight, Zap, Route, Loader2 } from "lucide-react";

export default function CorridorsPage() {
  const { corridors, isLoading } = useCorridors();

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corridors</h1>
          <p className="text-sm text-eve-text-dim mt-1">All registered trade corridors</p>
        </div>
        <Link href="/operate" className="btn-primary">
          + Create Corridor
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-eve-muted animate-spin" />
        </div>
      ) : corridors.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-eve-elevated flex items-center justify-center mb-4">
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
          {corridors.map((c) => (
            <Link
              key={c.id}
              href={`/corridors/${c.id}`}
              className="card p-5 hover:border-eve-orange/30 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-eve-text group-hover:text-eve-orange transition-colors">
                      {c.name}
                    </h3>
                    <span className={`badge ${statusBg(c.status)}`}>
                      {c.status}
                    </span>
                    {c.sourceGate.surgeActive && (
                      <span className="badge badge-surge">
                        <Zap className="w-3 h-3" /> SURGE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-eve-text-dim mb-4">
                    <span className="text-eve-text font-medium">{c.sourceGate.solarSystem}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-eve-orange" />
                    <span className="text-eve-text font-medium">{c.destGate.solarSystem}</span>
                  </div>

                  <div className="flex gap-6 text-xs text-eve-text-dim">
                    <div>
                      <span className="text-eve-muted">Depot A:</span>{" "}
                      {c.depotA.inputItem.name} → {c.depotA.outputItem.name}{" "}
                      <span className="text-eve-orange font-medium">({c.depotA.ratioIn}:{c.depotA.ratioOut})</span>
                    </div>
                    <div>
                      <span className="text-eve-muted">Depot B:</span>{" "}
                      {c.depotB.inputItem.name} → {c.depotB.outputItem.name}{" "}
                      <span className="text-eve-orange font-medium">({c.depotB.ratioIn}:{c.depotB.ratioOut})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0 ml-8">
                  <div className="text-base font-semibold text-eve-orange">
                    {formatSui(c.totalTollRevenue + c.totalTradeRevenue)}
                  </div>
                  <div className="text-xs text-eve-text-dim">total revenue</div>
                  <div className="text-xs text-eve-text-dim mt-2">
                    {formatNumber(c.totalJumps)} jumps · {formatNumber(c.totalTrades)} trades
                  </div>
                  <div className="text-xs text-eve-muted">{timeAgo(c.lastActivityAt)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
