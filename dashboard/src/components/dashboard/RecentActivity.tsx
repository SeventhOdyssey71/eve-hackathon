import type { ActivityEvent } from "@/lib/types";
import { timeAgo, formatSui } from "@/lib/utils";
import { ArrowRightLeft, Zap, Settings, AlertTriangle, Plus, Clock } from "lucide-react";

const EVENT_ICONS: Record<string, typeof Zap> = {
  jump: Zap,
  trade: ArrowRightLeft,
  toll_config: Settings,
  depot_config: Settings,
  emergency: AlertTriangle,
  corridor_created: Plus,
};

const EVENT_COLORS: Record<string, string> = {
  jump: "text-eve-blue bg-eve-blue/10",
  trade: "text-eve-green bg-eve-green/10",
  toll_config: "text-eve-orange bg-eve-orange/10",
  depot_config: "text-eve-orange bg-eve-orange/10",
  emergency: "text-eve-red bg-eve-red/10",
  corridor_created: "text-eve-green bg-eve-green/10",
};

interface Props {
  events: ActivityEvent[];
}

export function RecentActivity({ events }: Props) {
  return (
    <div className="card p-6 h-full flex flex-col">
      <h3 className="section-title mb-5">Recent Activity</h3>
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-eve-muted" />
          </div>
          <p className="text-sm text-eve-text-dim font-medium">No activity yet</p>
          <p className="text-xs text-eve-muted mt-1.5">Events will appear here as they happen</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type] || Zap;
            const color = EVENT_COLORS[event.type] || "text-eve-muted bg-white/[0.04]";
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-eve-text leading-snug">{event.description}</div>
                  <div className="text-[11px] text-eve-muted mt-1">
                    {event.corridorName ? `${event.corridorName} · ` : ""}{timeAgo(event.timestamp)}
                  </div>
                </div>
                {event.value != null && event.value > 0 && (
                  <span className="text-xs font-semibold text-eve-orange shrink-0 font-mono">
                    {formatSui(event.value)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
