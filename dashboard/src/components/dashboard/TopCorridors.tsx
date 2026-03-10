import Link from "next/link";
import type { Corridor } from "@/lib/types";
import { formatSui, formatNumber, statusBg } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface Props {
  corridors: Corridor[];
}

export function TopCorridors({ corridors }: Props) {
  const sorted = [...corridors].sort(
    (a, b) =>
      b.totalTollRevenue + b.totalTradeRevenue - (a.totalTollRevenue + a.totalTradeRevenue)
  );

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-eve-border">
        <h3 className="text-sm font-bold">Top Corridors by Revenue</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-eve-border text-xs text-eve-text-dim uppercase tracking-wider">
            <th className="text-left p-3 pl-4">Corridor</th>
            <th className="text-left p-3">Route</th>
            <th className="text-left p-3">Status</th>
            <th className="text-right p-3">Jumps</th>
            <th className="text-right p-3">Trades</th>
            <th className="text-right p-3 pr-4">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr
              key={c.id}
              className="border-b border-eve-border/50 hover:bg-eve-elevated/50 transition-colors"
            >
              <td className="p-3 pl-4">
                <Link href={`/corridors/${c.id}`} className="font-medium hover:text-eve-orange transition-colors">
                  {c.name}
                </Link>
              </td>
              <td className="p-3">
                <span className="flex items-center gap-1 text-xs text-eve-text-dim">
                  {c.sourceGate.solarSystem}
                  <ArrowRight className="w-3 h-3 text-eve-orange" />
                  {c.destGate.solarSystem}
                </span>
              </td>
              <td className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded border ${statusBg(c.status)}`}>
                  {c.status}
                </span>
              </td>
              <td className="p-3 text-right text-eve-text-dim">{formatNumber(c.totalJumps)}</td>
              <td className="p-3 text-right text-eve-text-dim">{formatNumber(c.totalTrades)}</td>
              <td className="p-3 pr-4 text-right font-medium text-eve-orange">
                {formatSui(c.totalTollRevenue + c.totalTradeRevenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
