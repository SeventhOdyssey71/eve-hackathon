import type { ActivityEvent } from "@/lib/types";
import { timeAgo, formatSui } from "@/lib/utils";
import { ArrowRightLeft, Zap, Settings, AlertTriangle, Plus } from "lucide-react";

const EVENT_ICONS: Record<string, typeof Zap> = {
  jump: Zap,
  trade: ArrowRightLeft,
  toll_config: Settings,
  depot_config: Settings,
  emergency: AlertTriangle,
  corridor_created: Plus,
};

const EVENT_COLORS: Record<string, string> = {
  jump: "text-eve-blue",
  trade: "text-eve-green",
  toll_config: "text-eve-orange",
  depot_config: "text-eve-orange",
  emergency: "text-eve-red",
  corridor_created: "text-eve-green",
};

interface Props {
  events: ActivityEvent[];
}

export function RecentActivity({ events }: Props) {
  return (
    <div className="card p-4 h-full">
      <h3 className="text-sm font-bold mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {events.map((event) => {
          const Icon = EVENT_ICONS[event.type] || Zap;
          const color = EVENT_COLORS[event.type] || "text-eve-muted";
          return (
            <div key={event.id} className="flex items-start gap-3">
              <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-eve-text truncate">{event.description}</div>
                <div className="text-[10px] text-eve-muted">
                  {event.corridorName} · {timeAgo(event.timestamp)}
                </div>
              </div>
              {event.value && (
                <span className="text-xs text-eve-orange shrink-0">
                  {formatSui(event.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
