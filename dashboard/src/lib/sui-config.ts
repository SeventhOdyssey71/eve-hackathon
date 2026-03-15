import { createNetworkConfig } from "@mysten/dapp-kit";

// Deployed FEN contract addresses (Sui testnet)
const FEN_PACKAGE_ID =
  process.env.NEXT_PUBLIC_FEN_PACKAGE_ID ||
  "0x294fc90bf2c62a428ebed1a5e10406ef023b22a458881ef667b02af6e99d89af";
const CORRIDOR_REGISTRY_ID =
  process.env.NEXT_PUBLIC_CORRIDOR_REGISTRY_ID ||
  "0x8cef4d30d52630f224b1b0909de1c6238264ba7ecdffb827313ff30592de7687";

const { networkConfig, useNetworkVariable } = createNetworkConfig({
  testnet: {
    network: "testnet",
    url: "https://fullnode.testnet.sui.io:443",
    variables: {
      fenPackageId: FEN_PACKAGE_ID,
      corridorRegistryId: CORRIDOR_REGISTRY_ID,
    },
  },
  devnet: {
    network: "devnet",
    url: "https://fullnode.devnet.sui.io:443",
    variables: {
      fenPackageId: FEN_PACKAGE_ID,
      corridorRegistryId: CORRIDOR_REGISTRY_ID,
    },
  },
  mainnet: {
    network: "mainnet",
    url: "https://fullnode.mainnet.sui.io:443",
    variables: {
      fenPackageId: FEN_PACKAGE_ID,
      corridorRegistryId: CORRIDOR_REGISTRY_ID,
    },
  },
});

export { networkConfig, useNetworkVariable };

export const SPONSORED_TX_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_SPONSORED_TX === "true";

export type SuiNetwork = "testnet" | "devnet" | "mainnet";
export type EveTenant = "stillness" | "utopia";
type SearchParamsLike = { get(name: string): string | null };

const VALID_NETWORKS: SuiNetwork[] = ["testnet", "devnet", "mainnet"];
const VALID_TENANTS: EveTenant[] = ["stillness", "utopia"];

export function getConfiguredNetwork(): SuiNetwork {
  const network = process.env.NEXT_PUBLIC_SUI_NETWORK;
  return VALID_NETWORKS.includes(network as SuiNetwork)
    ? (network as SuiNetwork)
    : "testnet";
}

export function getConfiguredTenant(): EveTenant {
  const tenant = process.env.NEXT_PUBLIC_EVE_TENANT;
  return VALID_TENANTS.includes(tenant as EveTenant)
    ? (tenant as EveTenant)
    : "utopia";
}

export function parseTenant(input: string | null | undefined): EveTenant | null {
  return VALID_TENANTS.includes(input as EveTenant) ? (input as EveTenant) : null;
}

export function getActiveNetwork(): SuiNetwork {
  return getConfiguredNetwork();
}

export function getActiveTenant(searchParams?: SearchParamsLike): EveTenant {
  const tenantFromSearch = searchParams ? parseTenant(searchParams.get("tenant")) : null;
  if (tenantFromSearch) {
    return tenantFromSearch;
  }

  if (typeof window !== "undefined") {
    const tenantFromWindow = parseTenant(
      new URLSearchParams(window.location.search).get("tenant"),
    );
    if (tenantFromWindow) {
      return tenantFromWindow;
    }
  }

  return getConfiguredTenant();
}

export function getNetworkLabel(
  network: SuiNetwork = getConfiguredNetwork(),
  tenant: EveTenant = getConfiguredTenant(),
): string {
  return `${tenant[0].toUpperCase()}${tenant.slice(1)} / Sui ${network[0].toUpperCase()}${network.slice(1)}`;
}
