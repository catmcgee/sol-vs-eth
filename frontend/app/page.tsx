"use client";
import { SolanaWalletProvider } from "../chains/sol/SolanaWalletProvider";
import { EthWalletProvider } from "../chains/eth/EthWalletProvider";
import PlaygroundContent from "./components/PlaygroundContent";

export default function PlaygroundPage() {
  return (
    <SolanaWalletProvider>
      <EthWalletProvider>
        <PlaygroundContent />
      </EthWalletProvider>
    </SolanaWalletProvider>
  );
}
