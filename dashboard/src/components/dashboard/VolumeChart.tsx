"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";

interface DataPoint {
  hour: string;
  jumps: number;
  trades: number;
  revenue: number;
}

interface Props {
  data: DataPoint[];
}

export function VolumeChart({ data }: Props) {
  const hasData = data.some((d) => d.jumps > 0 || d.trades > 0);

  return (
    <div className="card p-5">
      <h3 className="section-title mb-5">24h Activity</h3>
      <div className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232336" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101018",
                  border: "1px solid #232336",
                  borderRadius: "10px",
                  fontSize: "12px",
                  padding: "10px 14px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: "#f1f5f9", fontWeight: 500, marginBottom: 4 }}
                itemStyle={{ padding: 0 }}
                cursor={{ fill: "rgba(100,116,139,0.06)" }}
              />
              <Bar dataKey="jumps" name="Jumps" fill="#d4600a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trades" name="Trades" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-xl bg-eve-elevated flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-eve-muted" />
            </div>
            <p className="text-sm text-eve-text-dim">No activity data</p>
            <p className="text-xs text-eve-muted mt-1">Chart will populate as transactions occur</p>
          </div>
        )}
      </div>
    </div>
  );
}
