"use client";
import { useState } from "react";
import { usePingProgram } from "./usePingProgram";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function PingPanel() {
  const program = usePingProgram();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [lastSig, setLastSig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<null | {
    feeLamports: number;
    baseFeeLamports: number;
    priorityLamports: number;
    cu?: number;
    blockTime?: number;
    confirmMs: number;
  }>(null);

  function lamportsToSol(l: number) {
    return l / LAMPORTS_PER_SOL;
  }

  async function handlePing() {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const t0 = performance.now();

      const sig = await program.methods
        .ping()
        .accounts({
          payer: publicKey,
        })
        .rpc();

      const t1 = performance.now();
      setLastSig(sig);

      const tx = await connection.getTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      const feeLamports = tx?.meta?.fee ?? 0;
      const cu = tx?.meta?.computeUnitsConsumed;
      const blockTime = tx?.blockTime ?? undefined;
      const numSigs = tx?.transaction?.signatures?.length ?? 0;
      const baseFeeLamports = numSigs * 5000; 
      const priorityLamports = Math.max(0, feeLamports - baseFeeLamports);

      setStats({
        feeLamports,
        baseFeeLamports,
        priorityLamports,
        cu,
        blockTime,
        confirmMs: t1 - t0,
      });
    } finally {
      setLoading(false);
    }
  }

  const explorer =
    lastSig ? `https://explorer.solana.com/tx/${lastSig}?cluster=devnet` : null;

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 text-sm">
      <button
        onClick={handlePing}
        disabled={!publicKey || !program || loading}
        className="mr-2 px-3 py-1 rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send ping"}
      </button>

      {lastSig && (
        <div className="mt-2 break-all space-y-1">
          <div>
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

          {stats && (
            <div className="mt-1 text-xs text-gray-300 space-y-0.5">
              <div>
                Total Fee: {lamportsToSol(stats.feeLamports).toFixed(9)} SOL
              </div>
              <div>
                Base Fee: {lamportsToSol(stats.baseFeeLamports).toFixed(9)} SOL
              </div>
              <div>
                Priority Fee: {lamportsToSol(stats.priorityLamports).toFixed(9)} SOL
              </div>
              {stats.cu !== undefined && (
                <div>Compute Units: {stats.cu.toLocaleString()}</div>
              )}
              <div>Send → Confirm: {Math.round(stats.confirmMs)} ms</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
