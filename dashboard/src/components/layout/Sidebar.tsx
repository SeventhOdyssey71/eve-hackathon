"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Settings, ArrowRightLeft, Zap, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/corridors", label: "Corridors", icon: Route },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/swap", label: "AMM Swap", icon: Repeat },
  { href: "/operate", label: "Operate", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-eve-surface border-r border-eve-border flex flex-col shrink-0">
      <div className="p-5 border-b border-eve-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-eve-orange/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-eve-orange" />
          </div>
          <div>
            <div className="text-sm font-semibold text-eve-text tracking-wide">FEN</div>
            <div className="text-[10px] text-eve-text-dim">Frontier Exchange Network</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-eve-orange/10 text-eve-orange"
                  : "text-eve-text-dim hover:text-eve-text hover:bg-eve-elevated"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-eve-border">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-eve-green" />
          <span className="text-eve-text-dim">Sui Testnet</span>
        </div>
      </div>
    </aside>
  );
}
