import Link from "next/link";
import type { Corridor } from "@/lib/types";
import { formatSui, formatNumber, statusBg } from "@/lib/utils";
import { ArrowRight, Route } from "lucide-react";

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
      <div className="px-5 py-4 border-b border-eve-border">
        <h3 className="section-title">Top Corridors by Revenue</h3>
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-eve-elevated flex items-center justify-center mb-3">
            <Route className="w-6 h-6 text-eve-muted" />
          </div>
          <p className="text-sm text-eve-text-dim">No corridors registered</p>
          <p className="text-xs text-eve-muted mt-1 mb-4">Register your first trade corridor to get started</p>
          <Link href="/operate" className="btn-primary text-xs">Register Corridor</Link>
        </div>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-eve-border text-xs text-eve-text-faint uppercase tracking-wider">
              <th className="text-left py-3 px-5 font-medium">Corridor</th>
              <th className="text-left py-3 px-4 font-medium">Route</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-right py-3 px-4 font-medium">Jumps</th>
              <th className="text-right py-3 px-4 font-medium">Trades</th>
              <th className="text-right py-3 px-5 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                className="border-b border-eve-border/40 hover:bg-eve-elevated/40 transition-colors"
              >
                <td className="py-3 px-5">
                  <Link href={`/corridors/${c.id}`} className="font-medium hover:text-eve-orange transition-colors">
                    {c.name}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1.5 text-xs text-eve-text-dim">
                    {c.sourceGate.solarSystem}
                    <ArrowRight className="w-3 h-3 text-eve-orange" />
                    {c.destGate.solarSystem}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`badge ${statusBg(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-eve-text-dim">{formatNumber(c.totalJumps)}</td>
                <td className="py-3 px-4 text-right text-eve-text-dim">{formatNumber(c.totalTrades)}</td>
                <td className="py-3 px-5 text-right font-medium text-eve-orange">
                  {formatSui(c.totalTollRevenue + c.totalTradeRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
