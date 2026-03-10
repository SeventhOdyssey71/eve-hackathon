import { formatSui, formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";
import { Route, Zap, TrendingUp, ArrowRightLeft } from "lucide-react";

interface Props {
  stats: DashboardStats;
}

const STAT_ITEMS = [
  { key: "activeCorridors" as const, label: "Active Corridors", icon: Route, format: (v: number) => `${v}`, sub: (s: DashboardStats) => `${s.totalCorridors} total` },
  { key: "totalJumps24h" as const, label: "Jumps (24h)", icon: Zap, format: formatNumber, sub: () => "gate traversals" },
  { key: "totalTrades24h" as const, label: "Trades (24h)", icon: ArrowRightLeft, format: formatNumber, sub: () => "depot exchanges" },
  { key: "totalRevenue24h" as const, label: "Revenue (24h)", icon: TrendingUp, format: formatSui, sub: () => "toll + trade fees" },
];

export function StatsGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_ITEMS.map(({ key, label, icon: Icon, format, sub }) => (
        <div key={key} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-eve-text-dim uppercase tracking-wider">{label}</span>
            <Icon className="w-4 h-4 text-eve-orange" />
          </div>
          <div className="text-2xl font-bold text-eve-text">{format(stats[key])}</div>
          <div className="text-xs text-eve-muted mt-1">{sub(stats)}</div>
        </div>
      ))}
    </div>
  );
}
