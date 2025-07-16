// this is temporary just to test that this works, but ideally we programmatically grab idls from the examples dir
"use client";
import { useMemo } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../../public/idls/ping.json"; 

export function usePingProgram() {
    const { connection } = useConnection();
    const anchorWallet = useAnchorWallet(); 
  
    return useMemo(() => {
      if (!connection || !anchorWallet) return null;
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });
      return new Program(idl as Idl, provider);
    }, [connection, anchorWallet]);
  }