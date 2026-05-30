"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";
import { motion } from "framer-motion";

interface TerminalLine { text: string; type: "system" | "input" | "success" | "warning" | "info"; time: string; }

export default function DiagnosticConsole({ healthIndex, activeReports, confidenceThreshold }: { healthIndex: number | null; activeReports: number; confidenceThreshold: number; }) {
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: "ROAD WATCH LOG ACTIVE // GRID SYNCED", type: "system", time: "18:16:47" },
    { text: "AI DETECT ENGINE: GEMINI 2.5 STABLE", type: "info", time: "18:16:48" },
    { text: "Type 'help' to print list of civic commands.", type: "success", time: "18:16:48" }
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [terminalHistory, isScanning]);

  useEffect(() => {
    const feeds = [
      { text: "[AI Filter] Incoming Report #203... SCANNING...", type: "info" as const },
      { text: "[AI Filter] APPROVED: POTHOLE (85% severity) at 12.9782, 77.6435. Logged to DB.", type: "success" as const },
      { text: "[AI Filter] Incoming Report #204... SCANNING...", type: "info" as const },
      { text: "[AI Filter] REJECTED: SELFIE detected. Spam blocked.", type: "warning" as const },
      { text: "[AI Filter] Incoming Report #205... SCANNING...", type: "info" as const },
      { text: "[AI Filter] APPROVED: WATERLOGGING (62% severity) at 12.9341, 77.6105. Logged.", type: "success" as const }
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (isScanning) return;
      setTerminalHistory(prev => [...(prev.length > 15 ? prev.slice(prev.length - 15) : prev), { text: feeds[idx].text, type: feeds[idx].type, time: getTimestamp() }]);
      idx = (idx + 1) % feeds.length;
    }, 7000);
    return () => clearInterval(interval);
  }, [isScanning]);

  const processCommand = (cmd: string, cur: TerminalLine[]) => {
    const t = getTimestamp();
    if (cmd === "clear") return setTerminalHistory([]);
    if (cmd === "scan") {
      if (isScanning) return;
      setIsScanning(true);
      const lines = ["Opening connection to Gemini AI...", "Evaluating contour profiles...", `Applying filters (${confidenceThreshold}%)...`, "SCAN SUCCESS: [3 Road Hazards detected and mapped]"];
      let i = 0;
      const interval = setInterval(() => {
        if (i < lines.length) { setTerminalHistory(p => [...p, { text: `[AI_TUNE] ${lines[i]}`, type: i === 3 ? "success" : "info", time: getTimestamp() }]); i++; }
        else { setIsScanning(false); clearInterval(interval); }
      }, 900);
      return;
    }
    const db: Record<string, { text: string; type: TerminalLine["type"] }[]> = {
      help: [
        { text: "CIVIC SYSTEM COMMAND DIRECTORY:", type: "system" },
        ...["help: print all active commands", "status: view city safety index", "scan: simulate live AI image scan", "reports: view active hazard database", "spam: inspect anti-spam shield stats", "allocate: boost local repair budgets", "clear: wipe console history"].map(c => ({ text: `  ${c.split(":")[0].padEnd(10)} - ${c.split(":")[1]}`, type: "info" as const }))
      ],
      status: [
        { text: `AI ENGINE STATUS   : ONLINE [gemini-2.5-flash]`, type: "success" },
        { text: `SAFETY CLUSTER IDX : ${healthIndex ?? 84}% (Target: 90%+)`, type: "system" },
        { text: `ACTIVE DISPATCHES  : ${activeReports} verified hazard zones`, type: "system" }
      ],
      reports: [
        { text: "VERIFIED ROAD HAZARD FEED DATABASE:", type: "system" },
        { text: "  [104] INDIRA NAGAR SECTOR A | CRITICAL POTHOLE | DEPTH: 9.2cm", type: "warning" },
        { text: "  [105] WHITEFIELD MAIN ROAD  | HIGH WEAR CRACK  | DEPTH: 6.8cm", type: "warning" }
      ],
      allocate: [
        { text: "!!! EMERGENCY CIVIC DISPATCH PROTOCOL AUTHORIZED !!!", type: "warning" },
        { text: "DISPATCHING ₹45 LAKH CASH FLOW PRIORITY TO HIGH-RISK SECTORS...", type: "success" }
      ],
      spam: [
        { text: "=== GEMINI 2.5 ANTI-SPAM ACTIVE MONITOR ===", type: "system" },
        { text: "  Shield Filter Mode : AUTO-TRIAGE ENFORCER (Active)", type: "success" },
        { text: "  Spam uploads blocked: 224 selfies / unrelated files rejected", type: "warning" }
      ]
    };
    db.nodes = db.reports; db.override = db.allocate; db.filter = db.spam;
    if (db[cmd]) setTerminalHistory([...cur, ...db[cmd].map(c => ({ ...c, time: t }))]);
    else setTerminalHistory([...cur, { text: `ERR: Unknown command "${cmd}". Type 'help'.`, type: "warning", time: t }]);
  };

  const handleSub = (e: React.FormEvent) => {
    e.preventDefault(); if (!terminalInput.trim()) return;
    const c = terminalInput.trim().toLowerCase();
    const next = [...terminalHistory, { text: `> ${terminalInput}`, type: "input" as const, time: getTimestamp() }];
    setTerminalHistory(next); setTerminalInput(""); processCommand(c, next);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 flex flex-col">
      <div className="bg-white border border-black/5 p-8 rounded-[36px] flex flex-col justify-between h-full min-h-[460px] shadow-sm relative">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A1F] flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> ROAD SAFETY ACTIVITY STREAM</span>
          <div className="flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-mono text-stone-400">SYNC: ONLINE</span></div>
        </div>

        <div className="flex-1 bg-stone-50 border border-black/5 rounded-2xl p-5 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[250px] mb-5 space-y-2.5 text-left shadow-inner">
          {terminalHistory.map((line, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-stone-400 select-none">[{line.time}]</span>
              <span className={`break-all ${line.type === 'input' ? 'text-[#FF5A1F] font-bold' : line.type === 'system' ? 'text-indigo-650 font-bold' : line.type === 'success' ? 'text-emerald-600 font-bold' : line.type === 'warning' ? 'text-rose-600 font-bold' : 'text-stone-700'}`}>{line.text}</span>
            </div>
          ))}
          {isScanning && (
            <div className="flex items-center space-x-2">
              <span className="text-stone-400">[{getTimestamp()}]</span>
              <div className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '0.2s' }} /><span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '0.4s' }} /></div>
              <span className="text-stone-500 italic font-semibold">Gemini AI analyzing photo...</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {["status", "scan", "reports", "spam", "allocate"].map(cmd => (
            <button key={cmd} onClick={() => { const n = [...terminalHistory, { text: `> ${cmd}`, type: "input" as const, time: getTimestamp() }]; setTerminalHistory(n); processCommand(cmd, n); }} disabled={cmd === 'scan' && isScanning} className={`px-3.5 py-1.5 border rounded-full text-[9px] font-mono transition-colors uppercase font-bold tracking-wider ${cmd === 'spam' ? 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-[#FF5A1F]' : 'bg-stone-100 hover:bg-stone-200 border-black/5 text-stone-500'}`}>[{cmd === 'status' ? 'SYSTEM_STATUS' : cmd === 'scan' ? 'AI_PHOTO_SCAN' : cmd === 'reports' ? 'ACTIVE_REPORTS' : cmd === 'spam' ? 'ANTI_SPAM' : 'BOOST_BUDGET'}]</button>
          ))}
        </div>

        <form onSubmit={handleSub} className="flex gap-2.5">
          <div className="flex-1 bg-stone-50 border border-black/5 rounded-2xl px-4 py-3 flex items-center space-x-2.5 focus-within:border-orange-300 transition-all">
            <span className="text-[#FF5A1F] font-mono text-xs select-none">&gt;</span>
            <input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} placeholder="Type diagnostic command (e.g. status, scan)..." className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-stone-850 placeholder:text-stone-400" />
          </div>
          <button type="submit" className="px-5 py-3 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95">ENTER</button>
        </form>
      </div>
    </motion.div>
  );
}
