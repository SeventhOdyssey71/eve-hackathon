"use client";

import { Bell, Search } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { abbreviateAddress } from "@/lib/utils";

export function Header() {
  const account = useCurrentAccount();

  return (
    <header className="h-14 bg-eve-surface border-b border-eve-border flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eve-muted" />
        <input
          type="text"
          placeholder="Search corridors, gates, addresses..."
          className="input-field pl-10 py-1.5 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-eve-text-dim hover:text-eve-text transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-eve-orange rounded-full" />
        </button>

        {/* Wallet Status Indicator */}
        {account && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-eve-elevated border border-eve-border rounded text-sm">
            <div className="w-2 h-2 rounded-full bg-eve-green" />
            <span className="text-eve-text">{abbreviateAddress(account.address)}</span>
          </div>
        )}

        {/* Sui Wallet Connect Button */}
        <ConnectButton
          connectText="Connect Wallet"
          className="btn-primary flex items-center gap-2 py-1.5 text-sm"
        />
      </div>
    </header>
  );
}
