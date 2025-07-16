"use client";
import { SolanaWalletProvider } from "../chains/sol/SolanaWalletProvider";
import PlaygroundContent from "./components/PlaygroundContent";

export default function PlaygroundPage() {
  return (
    <SolanaWalletProvider>
      <PlaygroundContent />
    </SolanaWalletProvider>
  );
}
