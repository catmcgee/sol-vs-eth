// TODO we need a separate connect button for eth so eth flow doesnt work right now
"use client";
import { ReactNode } from "react";
import {
  WagmiProvider,
  createConfig,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  injected,
} from "wagmi/connectors";
import { http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const projectId = "sol-vs-eth-demo"
const rpcUrl = process.env.NEXT_PUBLIC_ETH_RPC_URL;

export const wagmiConfig = createConfig({
  chains: [sepolia], 
  connectors: [
    injected(),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl), 
  },
});

export function EthWalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
