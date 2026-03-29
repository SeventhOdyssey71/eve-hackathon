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
    <div className="card p-6">
      <h3 className="section-title mb-6">24h Activity</h3>
      <div className="h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: "#525252", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: "#525252", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  fontSize: "12px",
                  padding: "12px 16px",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(20px)",
                }}
                labelStyle={{ color: "#f5f5f5", fontWeight: 600, marginBottom: 6 }}
                itemStyle={{ padding: 0 }}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />
              <Bar dataKey="jumps" name="Jumps" fill="#e8622b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="trades" name="Trades" fill="#3b82f6" radius={[6, 6, 0, 0]} />
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
    </div>
  );
}
