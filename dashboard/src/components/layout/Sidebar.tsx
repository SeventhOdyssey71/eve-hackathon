"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Settings, ArrowRightLeft, Zap, Repeat, Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-5 border-b border-eve-border">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
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
              onClick={() => setMobileOpen(false)}
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
          <div className="w-1.5 h-1.5 rounded-full bg-eve-green animate-pulse" />
          <span className="text-eve-text-dim">Sui Testnet</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-eve-surface border border-eve-border flex items-center justify-center"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-eve-text" />
        ) : (
          <Menu className="w-5 h-5 text-eve-text" />
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-60 bg-eve-surface border-r border-eve-border flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-eve-surface border-r border-eve-border flex-col shrink-0">
        {navContent}
      </aside>
    </>
  );
}
