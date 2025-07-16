"use client";
import { useState, useMemo } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { abi } from "../../public/artifacts/eth/Ping.json";
import { formatEther } from "viem";
import { sepolia } from "wagmi/chains";

const CONTRACT_ADDR = process.env.NEXT_PUBLIC_PING_CONTRACT as `0x${string}`;

export function PingPanelEth() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: hash, isPending, writeContract } = useWriteContract();
  const [sentAt, setSentAt] = useState<number | null>(null);

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  async function handlePing() {
    if (!isConnected) return;
    setSentAt(performance.now());
    writeContract({
      address: CONTRACT_ADDR,
      abi: abi,
      functionName: "ping",
    });
  }

  const stats = useMemo(() => {
    if (!receipt) return null;
    const gasUsed = receipt.gasUsed;
    const effGasPrice = receipt.effectiveGasPrice; 
    const totalWei = gasUsed * effGasPrice;
    return {
      gasUsed,
      effGasPrice,
      totalWei,
    };
  }, [receipt]);

  const elapsedMs =
    sentAt && (isConfirmed || isConfirming) ? performance.now() - sentAt : null;

  const explorer = hash
    ? `https://sepolia.etherscan.io/tx/${hash}`
    : null;

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 text-sm space-y-2">
      <button
        onClick={handlePing}
        disabled={true}
        className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet…" : "Send ping"}
      </button>

      {hash && (
        <div className="break-all space-y-1">
          <div>
            Tx: {hash}{" "}
            <a
              href={explorer ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="underline text-blue-400"
            >
              View in Explorer
            </a>
          </div>

          {isConfirming && <div className="text-xs text-gray-400">Waiting for confirmation…</div>}
          {isConfirmed && stats && (
            <div className="mt-1 text-xs text-gray-300 space-y-0.5">
              <div>Gas Used: {stats.gasUsed.toString()}</div>
              <div>
                Effective Gas Price: {formatEther(stats.effGasPrice)} ETH
                /gas
              </div>
              <div>
                Total Fee: {formatEther(stats.totalWei)} ETH
              </div>
              {elapsedMs !== null && (
                <div>Send → Confirm: {Math.round(elapsedMs)} ms</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
