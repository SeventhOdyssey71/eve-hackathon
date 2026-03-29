import { formatSui, formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";
import { Route, Zap, TrendingUp, ArrowRightLeft } from "lucide-react";

interface Props {
  stats: DashboardStats;
}

const STAT_ITEMS = [
  { key: "activeCorridors" as const, label: "Active Corridors", icon: Route, format: (v: number) => `${v}`, sub: (s: DashboardStats) => `${s.totalCorridors} total` },
  { key: "totalJumps24h" as const, label: "Total Jumps", icon: Zap, format: formatNumber, sub: () => "gate traversals" },
  { key: "totalTrades24h" as const, label: "Total Trades", icon: ArrowRightLeft, format: formatNumber, sub: () => "depot exchanges" },
  { key: "totalRevenue24h" as const, label: "Total Revenue", icon: TrendingUp, format: formatSui, sub: () => "toll + trade fees" },
];

export function StatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {STAT_ITEMS.map(({ key, label, icon: Icon, format, sub }) => (
        <div key={key} className="card p-6 glass-hover">
          <div className="flex items-center justify-between mb-4">
            <span className="stat-label">{label}</span>
            <div className="w-9 h-9 rounded-xl bg-eve-orange/8 flex items-center justify-center">
              <Icon className="w-4 h-4 text-eve-orange/80" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-eve-text">{format(stats[key])}</div>
          <div className="stat-sub">{sub(stats)}</div>
        </div>
      ))}
    </div>
  );
}
