import { createNetworkConfig } from "@mysten/dapp-kit";

// Deployed FEN contract addresses (Sui testnet)
const FEN_PACKAGE_ID = process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0xb05f71abd959c6ffe9c5bb2a2bfb316d201f01dbca8c4508c59bb09efdc20f09";
const CORRIDOR_REGISTRY_ID = process.env.NEXT_PUBLIC_CORRIDOR_REGISTRY_ID || "0xe01806aa7e0ebf3ea03140137b972b795f81059e654b53ee99c9711dc3ce1b2d";

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

export type SuiNetwork = "testnet" | "devnet" | "mainnet";

export function getActiveNetwork(): SuiNetwork {
  return (process.env.NEXT_PUBLIC_SUI_NETWORK as SuiNetwork) || "testnet";
}
