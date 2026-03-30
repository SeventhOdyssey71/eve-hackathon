"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Settings, ArrowRightLeft, Zap, Repeat, Menu, X, Activity, Trophy, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/corridors", label: "Corridors", icon: Route },
  { href: "/trade", label: "Trade", icon: ArrowRightLeft },
  { href: "/swap", label: "AMM Swap", icon: Repeat },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/operate", label: "Operate", icon: Settings },
  { href: "/authorize", label: "Setup", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="p-6 pb-5">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <img src="/FEN-Logo.png" alt="FEN" className="w-7 h-7 rounded-lg object-contain" />
          <div>
            <div className="text-sm font-bold text-eve-text tracking-wide">FEN</div>
            <div className="text-[10px] text-eve-muted font-medium">Frontier Exchange Network</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-eve-orange/10 text-eve-orange"
                  : "text-eve-muted hover:text-eve-text hover:bg-white/[0.04]"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-eve-green" />
          <span className="text-eve-muted font-medium">Sui Testnet</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center"
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
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-60 bg-eve-surface/95 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] bg-eve-surface/50 border-r border-white/[0.04] flex-col shrink-0">
        {navContent}
      </aside>
    </>
  );
}
