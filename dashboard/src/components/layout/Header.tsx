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
    <header className="h-14 bg-eve-surface/30 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-5 md:px-8 shrink-0">
      <div className="ml-10 md:ml-0 flex items-center gap-3">
        <span className="text-[11px] text-eve-muted font-medium tracking-wider uppercase">
          {getNetworkLabel(network, tenant)}
        </span>
        <div className="hidden md:flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
          {(["utopia", "stillness"] as EveTenant[]).map((value) => (
            <Link
              key={value}
              href={tenantHref(value)}
              className={`rounded-lg px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                tenant === value
                  ? "bg-eve-orange text-white shadow-sm shadow-eve-orange/20"
                  : "text-eve-muted hover:text-eve-text"
              }`}
            >
              {value}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {account && (
          <a
            href={explorerUrl("address", account.address, network)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-xl text-[12px] hover:bg-white/[0.06] transition-all duration-200 border border-white/[0.06] group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-eve-green" />
            <span className="text-eve-text-dim font-medium font-mono">{abbreviateAddress(account.address)}</span>
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
