"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatSui, timeAgo } from "@/lib/utils";

interface DataPoint {
  hour: string;
  jumps: number;
  trades: number;
  revenue: number;
}

interface EventLogEntry {
  type: string;
  timestamp: number;
  suiAmount: number;
  items: number;
  trader: string;
}

interface Props {
  data: DataPoint[];
  eventLog?: EventLogEntry[];
  range: string;
  onRangeChange: (range: string) => void;
  isLoading?: boolean;
}

const RANGES = [
  { key: "24h", label: "24H" },
  { key: "3d", label: "3D" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "all", label: "All" },
];

function formatEventType(type: string): string {
  switch (type) {
    case "TollPaidEvent": return "Toll Paid";
    case "TradeExecutedEvent": return "Trade";
    case "SwapEvent": return "Swap";
    default: return type.replace(/Event$/, "");
  }
}

export function VolumeChart({ data, eventLog, range, onRangeChange, isLoading }: Props) {
  const [showLog, setShowLog] = useState(false);
  const hasData = data.some((d) => d.jumps > 0 || d.trades > 0);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title">Activity</h3>
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => onRangeChange(r.key)}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                range === r.key
                  ? "bg-eve-orange text-white shadow-sm shadow-eve-orange/20"
                  : "text-eve-muted hover:text-eve-text"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-6 h-6 text-eve-orange animate-spin" />
            <p className="text-xs text-eve-muted">Loading chart data...</p>
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#525252", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={range === "24h" ? 3 : range === "3d" ? 5 : range === "7d" ? 3 : 4}
              />
              <YAxis
                tick={{ fill: "#525252", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  fontSize: "12px",
                  padding: "12px 16px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                }}
                labelStyle={{ color: "#f5f5f5", fontWeight: 600, marginBottom: 6 }}
                itemStyle={{ padding: 0 }}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
              <Bar dataKey="jumps" name="Jumps" fill="#e8622b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trades" name="Trades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-eve-muted" />
            </div>
            <p className="text-sm text-eve-text-dim font-medium">No activity data</p>
            <p className="text-xs text-eve-muted mt-1.5">Chart will populate as transactions occur</p>
          </div>
        )}
      </div>

      {/* Event Log Toggle */}
      {eventLog && eventLog.length > 0 && (
        <div className="mt-4 border-t border-white/[0.04] pt-3">
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-2 text-xs text-eve-muted hover:text-eve-text transition-colors w-full"
          >
            {showLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span className="font-medium uppercase tracking-wider">{eventLog.length} Events</span>
            <div className="flex-1 border-b border-white/[0.04]" />
          </button>

          {showLog && (
            <div className="mt-3 max-h-64 overflow-y-auto space-y-0 rounded-xl border border-white/[0.04] bg-white/[0.01]">
              <div className="grid grid-cols-[80px_1fr_90px_60px] gap-2 px-3 py-2 text-[10px] text-eve-muted uppercase tracking-wider font-medium border-b border-white/[0.04] sticky top-0 bg-eve-surface/90 backdrop-blur-sm">
                <span>Type</span>
                <span>Time</span>
                <span className="text-right">SUI</span>
                <span className="text-right">Items</span>
              </div>
              {eventLog.map((e, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[80px_1fr_90px_60px] gap-2 px-3 py-2 text-[11px] border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                >
                  <span className={`font-medium ${
                    e.type === "SwapEvent" ? "text-eve-blue" :
                    e.type === "TollPaidEvent" ? "text-eve-orange" :
                    "text-eve-green"
                  }`}>
                    {formatEventType(e.type)}
                  </span>
                  <span className="text-eve-text-dim">{timeAgo(e.timestamp)}</span>
                  <span className="text-right text-eve-text font-mono text-[10px]">
                    {e.suiAmount > 0 ? formatSui(e.suiAmount) : "—"}
                  </span>
                  <span className="text-right text-eve-text-dim font-mono text-[10px]">
                    {e.items > 0 ? e.items : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
