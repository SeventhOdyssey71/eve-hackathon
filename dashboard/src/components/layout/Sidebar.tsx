"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Settings, ArrowRightLeft, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/corridors", label: "Corridors", icon: Route },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/operate", label: "Operate", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-eve-surface border-r border-eve-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-eve-border">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-eve-orange" />
          <div>
            <div className="text-sm font-bold text-eve-orange tracking-wider">FEN</div>
            <div className="text-[10px] text-eve-text-dim uppercase tracking-widest">
              Frontier Exchange
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors",
                isActive
                  ? "bg-eve-orange/10 text-eve-orange border border-eve-orange/20"
                  : "text-eve-text-dim hover:text-eve-text hover:bg-eve-elevated"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Network status */}
      <div className="p-4 border-t border-eve-border">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-eve-green animate-pulse" />
          <span className="text-eve-text-dim">Sui Testnet</span>
        </div>
      </div>
    </aside>
  );
}
