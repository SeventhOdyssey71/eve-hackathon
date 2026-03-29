import { createNetworkConfig } from "@mysten/dapp-kit";

// Deployed FEN contract addresses (Sui testnet)
const FEN_PACKAGE_ID =
  process.env.NEXT_PUBLIC_FEN_PACKAGE_ID ||
  "0xff753421606a061120d2fcd75df86fdb0682d78051e6e365ec2af81f0f56620a";
const CORRIDOR_REGISTRY_ID =
  process.env.NEXT_PUBLIC_CORRIDOR_REGISTRY_ID ||
  "0x2ec8e3f9be1952852fd6879005a580c705f25b57ad3077f9d369b355e807aa4c";

// EVE Frontier World Package IDs (from builder-documentation)
export const WORLD_PACKAGE_IDS = {
  utopia: "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75",
  stillness: "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c",
} as const;

export const OBJECT_REGISTRY_IDS = {
  utopia: "0xc2b969a72046c47e24991d69472afb2216af9e91caf802684514f39706d7dc57",
  stillness: "0x454a9aa3d37e1d08d3c9181239c1b683781e4087fbbbd48c935d54b6736fd05c",
} as const;

// World API endpoints
export const WORLD_API_URLS = {
  utopia: "https://world-api-utopia.uat.pub.evefrontier.com",
  stillness: "https://world-api-stillness.live.tech.evefrontier.com",
} as const;

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
