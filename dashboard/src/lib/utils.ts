import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function abbreviateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatSui(mist: number): string {
  const sui = mist / 1_000_000_000;
  if (sui >= 1_000_000) return `${(sui / 1_000_000).toFixed(1)}M SUI`;
  if (sui >= 1_000) return `${(sui / 1_000).toFixed(1)}K SUI`;
  return `${sui.toFixed(2)} SUI`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function statusColor(status: string): string {
  switch (status) {
    case "active": return "text-eve-green";
    case "inactive": return "text-eve-muted";
    case "emergency": return "text-eve-red";
    case "online": return "text-eve-green";
    case "offline": return "text-eve-muted";
    default: return "text-eve-text-dim";
  }
}

export function statusBg(status: string): string {
  switch (status) {
    case "active": return "bg-eve-green/10 text-eve-green border-eve-green/20";
    case "inactive": return "bg-eve-muted/10 text-eve-muted border-eve-muted/20";
    case "emergency": return "bg-eve-red/10 text-eve-red border-eve-red/20";
    default: return "bg-eve-muted/10 text-eve-muted border-eve-muted/20";
  }
}
