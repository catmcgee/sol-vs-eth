// this is a spagetti rn 
"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { SolanaConnectButton } from "../../chains/sol/SolanaWalletProvider";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { PingPanel } from "./PingPanel"; 

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface InfoJson {
  summaries: Record<string, string>;
  tooltips?: Record<string, string>;
  mappings: { src: string; dst: string; note: string }[];
}

interface ExampleMetadata {
  name: string;
  title: string;
  solFile: string;
  rustFile: string;
  ethSummary: string;
  solSummary: string;
}

interface ExamplesManifest {
  examples: ExampleMetadata[];
  generated: string;
}

export default function PlaygroundContent() {
  const [manifest, setManifest] = useState<ExamplesManifest | null>(null);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoJson | null>(null);
  const [allTooltips, setAllTooltips] = useState<Record<string, string>>({});
  const [codeSol, setCodeSol] = useState<string>("");
  const [codeRs, setCodeRs] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredSide, setHoveredSide] = useState<"sol" | "rs" | null>(null);
  const [themeLoaded, setThemeLoaded] = useState<boolean>(false);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [programId, setProgramId] = useState<PublicKey | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [sending, setSending] = useState(false);

  const solLineIds = useRef<(string | undefined)[]>([]);
  const rsLineIds = useRef<(string | undefined)[]>([]);

  const solEditorRef = useRef<any>(null);
  const rsEditorRef = useRef<any>(null);

  const solDecorations = useRef<string[]>([]);
  const rsDecorations = useRef<string[]>([]);

  const pingProgramId = new PublicKey("GaQXYnYGmdjFKW3Cr7iYZB8ZXsQttrxZZvQWiqeXeWZZ");

  const setupDraculaTheme = async (monaco: any) => {
    if (themeLoaded) return;
    
    try {
      const draculaTheme = await import('monaco-themes/themes/Dracula.json');
      monaco.editor.defineTheme('dracula', draculaTheme.default || draculaTheme);
      setThemeLoaded(true);
    } catch (error) {
      console.error('Failed to load Dracula theme:', error);
    }
  };

  useEffect(() => {
    fetch("/examples/manifest.json")
      .then((r) => r.json())
      .then((manifest: ExamplesManifest) => {
        setManifest(manifest);
        if (manifest.examples.length > 0) {
          setSelectedExample(manifest.examples[0].name);
        }
      })
      .catch((err) => console.error("Failed to load examples manifest:", err));
  }, []);

  useEffect(() => {
    if (!selectedExample || !manifest) return;

    const example = manifest.examples.find(ex => ex.name === selectedExample);
    if (!example) return;

    let solTooltips: Record<string, string> = {};
    let rustTooltips: Record<string, string> = {};
    let infoData: InfoJson | null = null;

    const combineAndSetData = () => {
      const combinedTooltips = {
        ...solTooltips,
        ...rustTooltips,
        ...(infoData?.tooltips || {})
      };
      setAllTooltips(combinedTooltips);
      
      if (infoData) {
        setInfo(infoData);
      }
    };

    fetch(`/examples/${selectedExample}/info.json`)
      .then((r) => r.json())
      .then((data: InfoJson) => {
        infoData = data;
        combineAndSetData();
      })
      .catch((err) => console.error(`Failed to load info for ${selectedExample}:`, err));

    fetch(`/examples/${selectedExample}/${example.solFile}`)
      .then((r) => r.text())
      .then((txt) => {
        const { cleanText, ids, tooltips } = parseFile(txt);
        setCodeSol(cleanText);
        solLineIds.current = ids;
        solTooltips = tooltips;
        combineAndSetData();
      })
      .catch((err) => console.error(`Failed to load ${example.solFile}:`, err));

    fetch(`/examples/${selectedExample}/${example.rustFile}`)
      .then((r) => r.text())
      .then((txt) => {
        const { cleanText, ids, tooltips } = parseFile(txt);
        setCodeRs(cleanText);
        rsLineIds.current = ids;
        rustTooltips = tooltips;
        combineAndSetData();
      })
      .catch((err) => console.error(`Failed to load ${example.rustFile}:`, err));
  }, [selectedExample, manifest]);

  async function ensureSolForFees(minSol = 0.1) {
    if (!connection) return;
    if (!publicKey) throw new Error("No wallet connected");
  
    const bal = await connection.getBalance(publicKey);
    if (bal >= minSol * LAMPORTS_PER_SOL) return;
  
    const sig = await connection.requestAirdrop(publicKey, minSol * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
  }  

  async function handleDeployClick() {
        if (!pingProgramId) {
          alert("No program ID in manifest for this example");
          return;
        }
        setDeploying(true);
        try {
          await ensureSolForFees();
          setProgramId(new PublicKey(pingProgramId));
        } finally {
          setDeploying(false);
        }
      }
    
      async function handlePing() {
        if (!connection || !publicKey) return;
        setSending(true);
        try {
          await ensureSolForFees();
          const tx = new Transaction().add(
            SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: publicKey, lamports: 0 })
          );
          const sig = await sendTransaction(tx, connection);
          await connection.confirmTransaction(sig, "confirmed");
          console.log("Ping tx:", sig);
        } finally {
          setSending(false);
        }
      }

  function parseFile(txt: string): { cleanText: string; ids: (string | undefined)[]; tooltips: Record<string, string> } {
    const cleanLines: string[] = [];
    const ids: (string | undefined)[] = [];
    const tooltips: Record<string, string> = {};

    txt.split(/\r?\n/).forEach((line) => {
      const idMatch = line.match(/@id:([\w-]+)/);
      const explainMatch = line.match(/@explain:(.+)/);
      
      const id = idMatch?.[1];
      ids.push(id);

      if (id && explainMatch) {
        tooltips[id] = explainMatch[1].trim();
      }

      if (idMatch) {
        const idx = line.indexOf("//");
        line = idx >= 0 ? line.slice(0, idx) : line;
      }
      cleanLines.push(rtrim(line));
    });

    return { cleanText: cleanLines.join("\n"), ids, tooltips };
  }

  function rtrim(str: string) {
    return str.replace(/\s+$/, "");
  }

  function computeHighlightIds(): Set<string> {
    if (!hoveredId || !info) return new Set();
    const ids = new Set<string>([hoveredId]);
    info.mappings.forEach((m) => {
      if (m.src === hoveredId) ids.add(m.dst);
      if (m.dst === hoveredId) ids.add(m.src);
    });
    return ids;
  }

  useEffect(() => {
    const highlightIds = computeHighlightIds();

    function applyDecorations(editor: any, lineIds: (string | undefined)[], store: { current: string[] }) {
      if (!editor) return;
      const monaco = require("monaco-editor");
      const newDecorations = lineIds
        .map((id, idx) => (id && highlightIds.has(id) ? idx + 1 : null))
        .filter((x): x is number => x !== null)
        .map((lineNumber: number) => ({
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: { isWholeLine: true, className: "highlightLine" }
        }));
      store.current = editor.deltaDecorations(store.current, newDecorations);
    }

    applyDecorations(solEditorRef.current, solLineIds.current, solDecorations);
    applyDecorations(rsEditorRef.current, rsLineIds.current, rsDecorations);
  }, [hoveredId, info]);

  function handleMouseMove(side: "sol" | "rs") {
    return (e: any) => {
          const pos = e.target.position;
         if (!pos) return;
          const lineIds = side === "sol" ? solLineIds.current : rsLineIds.current;
         const id = lineIds[pos.lineNumber - 1];
          setHoveredId(id ?? null);
          setHoveredSide(id ? side : null);
        };
    }

  async function editorDidMount(editor: any, monaco: any, side: "sol" | "rs") {
    await setupDraculaTheme(monaco);
    
    if (side === "sol") solEditorRef.current = editor;
    else rsEditorRef.current = editor;

    editor.onMouseMove(handleMouseMove(side));
    editor.onMouseLeave(() => {
      setHoveredId(null);
      setHoveredSide(null);
    });
  }

  const hoveredTooltip = hoveredId && allTooltips[hoveredId] ? allTooltips[hoveredId] : null;
  
  const getMappedTooltip = () => {
    if (!hoveredId || !info) return { mappedId: null, mappedTooltip: null };
    
    const mapping = info.mappings.find(m => m.src === hoveredId || m.dst === hoveredId);
    if (!mapping) return { mappedId: null, mappedTooltip: null };
    
    const mappedId = mapping.src === hoveredId ? mapping.dst : mapping.src;
    const mappedTooltip = allTooltips[mappedId] || null;
    
    return { mappedId, mappedTooltip };
  };
  
  const { mappedId, mappedTooltip } = getMappedTooltip();
  const currentExample = selectedExample && manifest ? manifest.examples.find(ex => ex.name === selectedExample) : null;

  return (
      <main className="flex flex-col gap-4 p-4 bg-gray-900 text-white min-h-screen">
        {/* Header --------------------------------------------------------------- */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">EVM ⇄ SVM</h1>
  
          {manifest && manifest.examples.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="example-select" className="text-sm text-gray-300">
                Example:
              </label>
              <select
                id="example-select"
                value={selectedExample || ""}
                onChange={(e) => setSelectedExample(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
              >
                {manifest.examples.map((example) => (
                  <option key={example.name} value={example.name}>
                    {example.title}
                  </option>
                ))}
              </select>
  
              {/* Connect Wallet button */}
              <SolanaConnectButton />
            </div>
          )}
        </div>
  
        {/* Code panes ----------------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4">
          {/* Ethereum (Solidity) side */}
          <div className="flex flex-col">
            {currentExample && (
              <div className="mb-3 p-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700">
                <div className="text-sm font-medium text-purple-400 mb-1">Ethereum</div>
                <div className="text-sm">{currentExample.ethSummary}</div>
              </div>
            )}
            <MonacoEditor
              height="60vh"
              defaultLanguage="sol"
              value={codeSol}
              theme={themeLoaded ? "dracula" : "vs-dark"}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: "off" }}
              onMount={(editor, monaco) => editorDidMount(editor, monaco, "sol")}
            />
            {((hoveredTooltip && hoveredSide === "sol") || (mappedTooltip && hoveredSide === "rs")) && (
              <div className="mt-3 p-3 bg-gray-800 text-gray-100 rounded-lg shadow-lg border border-gray-700">
                {hoveredSide === "sol" ? hoveredTooltip : mappedTooltip}
              </div>
            )}
          </div>
  
          {/* Solana (Rust) side */}
          <div className="flex flex-col">
            {currentExample && (
              <div className="mb-3 p-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700">
                <div className="text-sm font-medium text-orange-400 mb-1">Solana</div>
                <div className="text-sm">{currentExample.solSummary}</div>
              </div>
            )}
            <MonacoEditor
              height="60vh"
              defaultLanguage="rust"
              value={codeRs}
              theme={themeLoaded ? "dracula" : "vs-dark"}
              options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: "off" }}
              onMount={(editor, monaco) => editorDidMount(editor, monaco, "rs")}
            />
            {((hoveredTooltip && hoveredSide === "rs") || (mappedTooltip && hoveredSide === "sol")) && (
              <div className="mt-3 p-3 bg-gray-800 text-gray-100 rounded-lg shadow-lg border border-gray-700">
                {hoveredSide === "rs" ? hoveredTooltip : mappedTooltip}
              </div>
            )}
  
  <PingPanel />
<div className="mt-2 text-xs text-gray-400 break-all">
  Program: {pingProgramId.toBase58()}
</div>
          </div>
        </div>
  
        <style jsx global>{`
          .highlightLine {
            background-color: rgba(189, 147, 249, 0.3) !important;
          }
        `}</style>
      </main>
  );
  
}
