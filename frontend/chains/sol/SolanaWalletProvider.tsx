"use client";
import React, {FC, ReactNode, useMemo} from "react";
import {clusterApiUrl} from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";

import "@solana/wallet-adapter-react-ui/styles.css";

export interface SolanaWalletProviderProps {
  endpoint?: string;
  wallets?: any[];
  autoConnect?: boolean;
  children: ReactNode;
}

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({
  endpoint,
  wallets,
  autoConnect = true,
  children
}) => {
  const _endpoint = useMemo(() => endpoint ?? clusterApiUrl("devnet"), [endpoint]);
  const _wallets = useMemo(() => wallets ?? [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [wallets]);

  return (
    <ConnectionProvider endpoint={_endpoint}>
      <WalletProvider wallets={_wallets} autoConnect={autoConnect}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const SolanaConnectButton: FC = () => <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-500 !text-white" />;