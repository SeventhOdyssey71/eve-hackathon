"use client";

import { useState } from "react";
import { useActivity } from "@/hooks/use-corridors";
import { formatSui, timeAgo, abbreviateAddress, explorerUrl } from "@/lib/utils";
import { Activity, ExternalLink, Filter, Zap, ArrowRightLeft, Shield, Settings, Droplets } from "lucide-react";
import Link from "next/link";

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  jump: { label: "Jump", color: "text-eve-blue", icon: Zap },
  trade: { label: "Trade", color: "text-eve-green", icon: ArrowRightLeft },
  toll_config: { label: "Config", color: "text-eve-yellow", icon: Settings },
  depot_config: { label: "Depot", color: "text-eve-orange", icon: Settings },
  emergency: { label: "Emergency", color: "text-eve-red", icon: Shield },
  corridor_created: { label: "Created", color: "text-eve-orange", icon: Droplets },
};

type EventFilter = "all" | "jump" | "trade" | "toll_config" | "depot_config" | "emergency" | "corridor_created";

export default function ActivityPage() {
  const { events, isLoading } = useActivity();
  const [filter, setFilter] = useState<EventFilter>("all");

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Explorer</h1>
          <p className="text-sm text-eve-text-dim mt-1">
            Real-time on-chain events across all FEN corridors
          </p>
        </div>
        <div className="text-sm text-eve-text-dim">
          {events.length} event{events.length !== 1 ? "s" : ""} indexed
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-eve-muted" />
        {(["all", "jump", "trade", "toll_config", "depot_config", "emergency", "corridor_created"] as const).map((key) => {
          const config = key === "all" ? null : EVENT_TYPE_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === key
                  ? "bg-eve-orange/10 text-eve-orange"
                  : "text-eve-text-dim hover:text-eve-text hover:bg-eve-elevated"
              }`}
            >
              {key === "all" ? "All Events" : config?.label || key}
            </button>
          );
        })}
      </div>

      {/* Events table */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-20">
          <div className="animate-pulse text-eve-text-dim text-sm">Loading events...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Activity className="w-10 h-10 text-eve-muted mb-3" />
          <h3 className="text-lg font-semibold text-eve-text mb-1">No Events Found</h3>
          <p className="text-sm text-eve-text-dim">
            {filter !== "all" ? "Try a different filter." : "Events appear when corridors are used on-chain."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-eve-border text-xs text-eve-text-faint uppercase tracking-wider">
                <th className="text-left py-3 px-5 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Description</th>
                <th className="text-left py-3 px-4 font-medium">Corridor</th>
                <th className="text-right py-3 px-4 font-medium">Value</th>
                <th className="text-right py-3 px-4 font-medium">Time</th>
                <th className="text-right py-3 px-5 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => {
                const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.jump;
                const Icon = config.icon;
                const txDigest = event.id.replace(/\d+$/, "");
                return (
                  <tr key={event.id} className="border-b border-eve-border/40 hover:bg-eve-elevated/40 transition-colors">
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-eve-text">
                      {event.description}
                    </td>
                    <td className="py-3 px-4">
                      {event.corridorName ? (
                        <Link
                          href={`/corridors/${event.corridorId}`}
                          className="text-eve-orange hover:text-eve-orange-light transition-colors"
                        >
                          {event.corridorName}
                        </Link>
                      ) : event.corridorId ? (
                        <span className="text-eve-text-dim font-mono text-xs">
                          {abbreviateAddress(event.corridorId)}
                        </span>
                      ) : (
                        <span className="text-eve-muted">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {event.value ? (
                        <span className="text-eve-green font-medium">{formatSui(event.value)}</span>
                      ) : (
                        <span className="text-eve-muted">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-eve-text-dim">
                      {timeAgo(event.timestamp)}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <a
                        href={explorerUrl("tx", txDigest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-eve-orange hover:text-eve-orange-light transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
