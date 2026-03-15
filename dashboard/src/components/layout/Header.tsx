"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { abbreviateAddress, explorerUrl } from "@/lib/utils";
import { getActiveNetwork, getActiveTenant, getNetworkLabel, type EveTenant } from "@/lib/sui-config";

export function Header() {
  const account = useCurrentAccount();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenant = getActiveTenant(searchParams);
  const network = getActiveNetwork();

  const tenantHref = (targetTenant: EveTenant) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tenant", targetTenant);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <header className="h-16 bg-eve-surface border-b border-eve-border flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="ml-10 md:ml-0 flex items-center gap-3">
        <span className="text-xs text-eve-text-dim font-medium tracking-wide uppercase">
          {getNetworkLabel(network, tenant)}
        </span>
        <div className="hidden md:flex items-center gap-1 rounded-lg border border-eve-border bg-eve-elevated p-1">
          {(["utopia", "stillness"] as EveTenant[]).map((value) => (
            <Link
              key={value}
              href={tenantHref(value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors ${
                tenant === value
                  ? "bg-eve-orange text-white"
                  : "text-eve-text-dim hover:text-eve-text"
              }`}
            >
              {value}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {account && (
          <a
            href={explorerUrl("address", account.address, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-eve-elevated rounded-lg text-[13px] hover:bg-eve-border transition-colors group"
          >
            <div className="w-2 h-2 rounded-full bg-eve-green" />
            <span className="text-eve-text font-medium">{abbreviateAddress(account.address)}</span>
            <ExternalLink className="w-3 h-3 text-eve-muted group-hover:text-eve-orange transition-colors" />
          </a>
        )}

        <ConnectButton
          connectText="Connect Wallet"
          className="btn-primary"
        />
      </div>
    </header>
  );
}
