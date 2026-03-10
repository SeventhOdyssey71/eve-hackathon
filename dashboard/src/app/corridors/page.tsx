"use client";

import Link from "next/link";
import { useCorridors } from "@/hooks/use-corridors";
import { formatSui, formatNumber, timeAgo, statusBg } from "@/lib/utils";
import { ArrowRight, Zap } from "lucide-react";

export default function CorridorsPage() {
  const { corridors, isLoading } = useCorridors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Corridors</h1>
          <p className="text-sm text-eve-text-dim mt-1">All registered trade corridors</p>
        </div>
        <Link href="/operate" className="btn-primary text-sm">
          + Create Corridor
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-eve-muted text-sm">Loading corridors...</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {corridors.map((c) => (
            <Link
              key={c.id}
              href={`/corridors/${c.id}`}
              className="card p-5 hover:border-eve-orange/30 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-bold text-eve-text group-hover:text-eve-orange transition-colors">
                      {c.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(c.status)}`}>
                      {c.status}
                    </span>
                    {c.sourceGate.surgeActive && (
                      <span className="text-xs px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> SURGE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-eve-text-dim mb-4">
                    <span className="text-eve-text">{c.sourceGate.solarSystem}</span>
                    <ArrowRight className="w-3 h-3 text-eve-orange" />
                    <span className="text-eve-text">{c.destGate.solarSystem}</span>
                  </div>

                  <div className="flex gap-6 text-xs text-eve-text-dim">
                    <div>
                      <span className="text-eve-muted">Depot A:</span>{" "}
                      {c.depotA.inputItem.name} → {c.depotA.outputItem.name}{" "}
                      <span className="text-eve-orange">({c.depotA.ratioIn}:{c.depotA.ratioOut})</span>
                    </div>
                    <div>
                      <span className="text-eve-muted">Depot B:</span>{" "}
                      {c.depotB.inputItem.name} → {c.depotB.outputItem.name}{" "}
                      <span className="text-eve-orange">({c.depotB.ratioIn}:{c.depotB.ratioOut})</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0 ml-6">
                  <div className="text-sm font-bold text-eve-orange">
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
