"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold mb-4">24h Activity</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={{ stroke: "#2a2a3a" }}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={{ stroke: "#2a2a3a" }}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#12121a",
                border: "1px solid #2a2a3a",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Bar dataKey="jumps" name="Jumps" fill="#c64f05" radius={[2, 2, 0, 0]} />
            <Bar dataKey="trades" name="Trades" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
