import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable } = createNetworkConfig({
  testnet: {
    network: "testnet",
    url: "https://fullnode.testnet.sui.io:443",
    variables: {
      fenPackageId: process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0x0",
      corridorRegistryId:
        process.env.NEXT_PUBLIC_CORRIDOR_REGISTRY_ID || "0x0",
      fenConfigId: process.env.NEXT_PUBLIC_FEN_CONFIG_ID || "0x0",
    },
  },
  devnet: {
    network: "devnet",
    url: "https://fullnode.devnet.sui.io:443",
    variables: {
      fenPackageId: process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0x0",
      corridorRegistryId:
        process.env.NEXT_PUBLIC_CORRIDOR_REGISTRY_ID || "0x0",
      fenConfigId: process.env.NEXT_PUBLIC_FEN_CONFIG_ID || "0x0",
    },
  },
  mainnet: {
    network: "mainnet",
    url: "https://fullnode.mainnet.sui.io:443",
    variables: {
      fenPackageId: process.env.NEXT_PUBLIC_FEN_PACKAGE_ID || "0x0",
      corridorRegistryId:
        process.env.NEXT_PUBLIC_CORRIDOR_REGISTRY_ID || "0x0",
      fenConfigId: process.env.NEXT_PUBLIC_FEN_CONFIG_ID || "0x0",
    },
  },
});

export { networkConfig, useNetworkVariable };

export type SuiNetwork = "testnet" | "devnet" | "mainnet";

export function getActiveNetwork(): SuiNetwork {
  return (process.env.NEXT_PUBLIC_SUI_NETWORK as SuiNetwork) || "testnet";
}
