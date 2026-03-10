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
    <div className="card p-5 h-full flex flex-col">
      <h3 className="section-title mb-4">Recent Activity</h3>
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-10 h-10 rounded-xl bg-eve-elevated flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-eve-muted" />
          </div>
          <p className="text-sm text-eve-text-dim">No activity yet</p>
          <p className="text-xs text-eve-muted mt-1">Events will appear here as they happen</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type] || Zap;
            const color = EVENT_COLORS[event.type] || "text-eve-muted bg-eve-muted/10";
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-eve-text leading-tight truncate">{event.description}</div>
                  <div className="text-xs text-eve-muted mt-0.5">
                    {event.corridorName ? `${event.corridorName} · ` : ""}{timeAgo(event.timestamp)}
                  </div>
                </div>
                {event.value != null && event.value > 0 && (
                  <span className="text-xs font-medium text-eve-orange shrink-0">
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
