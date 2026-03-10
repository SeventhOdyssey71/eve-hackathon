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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_ITEMS.map(({ key, label, icon: Icon, format, sub }) => (
        <div key={key} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">{label}</span>
            <div className="w-8 h-8 rounded-lg bg-eve-orange/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-eve-orange" />
            </div>
          </div>
          <div className="stat-value text-eve-text">{format(stats[key])}</div>
          <div className="stat-sub">{sub(stats)}</div>
        </div>
      ))}
    </div>
  );
}
