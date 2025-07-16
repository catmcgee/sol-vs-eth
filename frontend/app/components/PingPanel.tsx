// this is temporary just to test that this works, but ideally we programmatically grab these things from the examples dir
"use client";
import { useState } from "react";
import { usePingProgram } from "./usePingProgram";
import { useWallet } from "@solana/wallet-adapter-react";

export function PingPanel() {
  const program = usePingProgram();
  const { publicKey } = useWallet();
  const [lastSig, setLastSig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePing() {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const sig = await program.methods
        .ping()              
        .accounts({
          payer: publicKey,        
        })
        .rpc();                    
      setLastSig(sig);
    } finally {
      setLoading(false);
    }
  }

  const explorer = lastSig
    ? `https://explorer.solana.com/tx/${lastSig}?cluster=devnet`
    : null;

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 text-sm">
      <div className="mb-2 font-semibold">Send a ping!</div>
      <button
        onClick={handlePing}
        disabled={!publicKey || !program || loading}
        className="mr-2 px-3 py-1 rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
      >
        Send ping
      </button>
      {lastSig && (
        <div className="mt-2 break-all">
          Tx: {lastSig}{" "}
          <a
            href={explorer ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="underline text-purple-400"
          >
            View in Explorer
          </a>
        </div>
      )}
    </div>
  );
}
