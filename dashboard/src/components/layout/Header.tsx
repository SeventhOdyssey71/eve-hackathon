"use client";

import { Search } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { abbreviateAddress } from "@/lib/utils";

export function Header() {
  const account = useCurrentAccount();

  return (
    <header className="h-16 bg-eve-surface border-b border-eve-border flex items-center justify-between px-8 shrink-0">
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eve-muted" />
        <input
          type="text"
          placeholder="Search corridors, gates..."
          className="input-field pl-10 py-2 text-[13px]"
          aria-label="Search"
        />
      </div>

      <div className="flex items-center gap-3">
        {account && (
          <div className="flex items-center gap-2 px-3 py-2 bg-eve-elevated rounded-lg text-[13px]">
            <div className="w-2 h-2 rounded-full bg-eve-green" />
            <span className="text-eve-text font-medium">{abbreviateAddress(account.address)}</span>
          </div>
        )}

        <ConnectButton
          connectText="Connect Wallet"
          className="btn-primary"
        />
      </div>
    </header>
  );
}
