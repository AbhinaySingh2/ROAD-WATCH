"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Camera, Map, BarChart3, AlertTriangle, ArrowRight, ShieldCheck, 
  Activity, Trophy, Sparkles, Cpu, Terminal, Layers, Radio, Sliders, 
  Zap, Compass, RotateCcw, Monitor, Eye, Play, Database, ShieldAlert,
  Heart, User, CheckCircle
} from "lucide-react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

interface TerminalLine {
  text: string;
  type: "system" | "input" | "success" | "warning" | "info";
  time: string;
}

export default function Home() {
  // Retro tech display option state
  const [crtEnabled, setCrtEnabled] = useState(false);
  
  // Database states
  const [healthIndex, setHealthIndex] = useState<number | null>(null);
  const [activeReports, setActiveReports] = useState(0);

  // Active hazard selection
  const [selectedTarget, setSelectedTarget] = useState<{
    id: string;
    road: string;
    severity: string;
    depth: string;
    coords: string;
  } | null>({
    id: "REPORT-104",
    road: "Indira Nagar Inner Ring Rd",
    severity: "CRITICAL",
    depth: "9.2cm",
    coords: "12.9716, 77.6412"
  });

  // Interactive AI Parameters
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [tempValue, setTempValue] = useState(0.2);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [scanResolution, setScanResolution] = useState("High Definition");

  // Interactive activity log stream
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: "ROAD WATCH LOG ACTIVE // GRID SYNCED", type: "system", time: "18:16:47" },
    { text: "AI DETECT ENGINE: GEMINI 2.5 STABLE", type: "info", time: "18:16:48" },
    { text: "Type 'help' to print list of civic commands.", type: "success", time: "18:16:48" }
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch real database status
  useEffect(() => {
    apiFetch<any[]>("/api/v1/issues")
      .then((data) => {
        setActiveReports(data.length);
        if (data.length === 0) {
          setHealthIndex(100);
          return;
        }
        const activeCritical = data.filter((r: any) => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length;
        const activeHigh = data.filter((r: any) => r.severity === 'HIGH' && r.status !== 'RESOLVED').length;
        const penalty = (activeCritical * 12) + (activeHigh * 4);
        setHealthIndex(Math.max(10, 100 - penalty));
      })
      .catch(err => {
        console.error("Failed to fetch health score:", err);
        setHealthIndex(84); // default fallback
        setActiveReports(14);
      });
  }, []);

  // Scroll activity log to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, isScanning]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  // Helper to format time
  const getTimestamp = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  // Dynamic simulated live feed of incoming citizen reports (Gemini AI Anti-Spam Shield)
  useEffect(() => {
    const feeds = [
      { text: "[AI Filter] Incoming Report #203... SCANNING...", type: "info" as const },
      { text: "[AI Filter] APPROVED: POTHOLE (85% severity) at 12.9782, 77.6435. Logged to DB.", type: "success" as const },
      { text: "[AI Filter] Incoming Report #204... SCANNING...", type: "info" as const },
      { text: "[AI Filter] REJECTED: SELFIE detected (Not a road safety hazard!). Spam blocked.", type: "warning" as const },
      { text: "[AI Filter] Incoming Report #205... SCANNING...", type: "info" as const },
      { text: "[AI Filter] APPROVED: WATERLOGGING (62% severity) at 12.9341, 77.6105. Logged to DB.", type: "success" as const },
      { text: "[AI Filter] Incoming Report #206... SCANNING...", type: "info" as const },
      { text: "[AI Filter] REJECTED: COFFEE CUP detected (Not a road safety hazard!). Spam blocked.", type: "warning" as const },
      { text: "[AI Filter] Incoming Report #207... SCANNING...", type: "info" as const },
      { text: "[AI Filter] APPROVED: ROAD CRACK (45% severity) at 12.9642, 77.7122. Logged to DB.", type: "success" as const },
      { text: "[AI Filter] Incoming Report #208... SCANNING...", type: "info" as const },
      { text: "[AI Filter] REJECTED: PET DOG detected (Not a road safety hazard!). Spam blocked.", type: "warning" as const }
    ];

    let currentFeedIdx = 0;
    const interval = setInterval(() => {
      if (isScanning) return; // Don't interrupt manual scans
      
      const item = feeds[currentFeedIdx];
      const time = getTimestamp();
      
      setTerminalHistory(prev => {
        const pruned = prev.length > 25 ? prev.slice(prev.length - 25) : prev;
        return [...pruned, { text: item.text, type: item.type, time }];
      });
      
      currentFeedIdx = (currentFeedIdx + 1) % feeds.length;
    }, 7000); // Trigger every 7 seconds for an active feed

    return () => clearInterval(interval);
  }, [isScanning]);

  // Handle Terminal input commands
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const command = terminalInput.trim().toLowerCase();
    const newHistory = [...terminalHistory, { text: `> ${terminalInput}`, type: "input" as const, time: getTimestamp() }];
    setTerminalHistory(newHistory);
    setTerminalInput("");

    processCommand(command, newHistory);
  };

  const processCommand = (command: string, currentHistory: TerminalLine[]) => {
    const time = getTimestamp();
    
    if (command === "help") {
      setTerminalHistory([
        ...currentHistory,
        { text: "ROAD WATCH LOG DIRECTORY:", type: "system", time },
        { text: "  help      - Print out list of available civic commands.", type: "info", time },
        { text: "  status    - View active Gemini models and city safety metrics.", type: "info", time },
        { text: "  scan      - Simulate a live AI image scan flow over road coordinates.", type: "info", time },
        { text: "  reports   - Return database catalog of recent active hazard reports.", type: "info", time },
        { text: "  spam      - Inspect active Gemini AI anti-spam shield diagnostics.", type: "info", time },
        { text: "  allocate  - Allocate municipal budget priority to high-risk zones.", type: "warning", time },
        { text: "  clear     - Wipe out all console screen logs.", type: "info", time }
      ]);
    } else if (command === "status") {
      setTerminalHistory([
        ...currentHistory,
        { text: `AI MODEL STATUS    : ACTIVE & ONLINE [gemini-2.5-flash]`, type: "success", time },
        { text: `RESPONSE LATENCY   : 124ms (Inference fully synchronized)`, type: "info", time },
        { text: `CITY SAFETY INDEX  : ${healthIndex ?? 84}% (Threshold: 90%+)`, type: "system", time },
        { text: `ACTIVE HAZARDS     : ${activeReports} verified community reports`, type: "system", time },
        { text: `MUNICIPAL LEDGER   : CONNECTED (Budget sync established)`, type: "info", time }
      ]);
    } else if (command === "scan") {
      if (isScanning) return;
      setIsScanning(true);
      
      let lines = [
        "Opening connection to Gemini AI image pipeline...",
        "Evaluating contour profiles and estimating depth ratios...",
        `Applying confidence filters (Current minimum: ${confidenceThreshold}%)...`,
        "SCAN SUCCESS: [3 Road Hazards detected and mapped on safety ledger]"
      ];
      
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < lines.length) {
          setTerminalHistory(prev => [
            ...prev,
            { text: `[AI_TUNE] ${lines[idx]}`, type: idx === 3 ? "success" : "info", time: getTimestamp() }
          ]);
          idx++;
        } else {
          setIsScanning(false);
          clearInterval(interval);
        }
      }, 900);
    } else if (command === "reports" || command === "nodes") {
      setTerminalHistory([
        ...currentHistory,
        { text: "ACTIVE HAZARD DATABASE LOGS:", type: "system", time },
        { text: "  [ID] REPORT-104 | LOC: Indira Nagar | SEVERITY: CRITICAL | DEPTH: 9.2cm", type: "warning", time },
        { text: "  [ID] REPORT-105 | LOC: Whitefield   | SEVERITY: HIGH     | DEPTH: 6.8cm", type: "warning", time },
        { text: "  [ID] REPORT-106 | LOC: Koramangala  | SEVERITY: MEDIUM   | DEPTH: 4.1cm", type: "info", time }
      ]);
    } else if (command === "allocate" || command === "override") {
      setTerminalHistory([
        ...currentHistory,
        { text: "!!! CIVIC BUDGET DISPATCH PROTOCOL !!!", type: "warning", time },
        { text: "AUTHORIZING EMERGENCY REPAIR DISBURSEMENT.", type: "warning", time },
        { text: "DISPATCHING ₹45 LAKH EMERGENCY BUDGET TO INDIRA NAGAR SECTOR A...", type: "success", time },
        { text: "BUDGET OVERVIEW: DISPATCH_COMPLETED_SUCCESSFULLY", type: "system", time }
      ]);
    } else if (command === "spam" || command === "filter") {
      setTerminalHistory([
        ...currentHistory,
        { text: "=== GEMINI 2.5 ANTI-SPAM SHIELD ONLINE ===", type: "system", time },
        { text: "  Anti-Spam Filter Mode : AUTO-TRIAGE SHIELD (Active)", type: "success", time },
        { text: "  Total Uploads Scanned : 1,248 incoming items", type: "info", time },
        { text: "  Civic Potholes Approved : 1,024 reports registered", type: "success", time },
        { text: "  Spam / Selfies Blocked  : 224 uploads filtered & deleted", type: "warning", time },
        { text: "  Shield False-Positive Rate: < 0.05% margin", type: "info", time }
      ]);
    } else if (command === "clear") {
      setTerminalHistory([]);
    } else {
      setTerminalHistory([
        ...currentHistory,
        { text: `ERR: Unknown command "${command}". Type 'help' to print options.`, type: "warning", time }
      ]);
    }
  };

  // Run a quick pre-built command
  const triggerPresetCommand = (cmd: string) => {
    const newHistory = [...terminalHistory, { text: `> ${cmd}`, type: "input" as const, time: getTimestamp() }];
    setTerminalHistory(newHistory);
    processCommand(cmd, newHistory);
  };

  // Mock hazards mapped in our UI
  const hazardTargets = [
    { id: "REPORT-104", road: "Indira Nagar Ring Rd", severity: "CRITICAL", depth: "9.2cm", coords: "12.9716, 77.6412", top: "45%", left: "40%", color: "bg-[#FF5A1F] shadow-orange-500/40" },
    { id: "REPORT-105", road: "Whitefield Main Rd", severity: "HIGH", depth: "6.8cm", coords: "12.9698, 77.7499", top: "70%", left: "70%", color: "bg-amber-500 shadow-amber-500/40" },
    { id: "REPORT-106", road: "Koramangala 80 Feet Rd", severity: "MEDIUM", depth: "4.1cm", coords: "12.9352, 77.6244", top: "20%", left: "60%", color: "bg-indigo-500 shadow-indigo-500/40" },
    { id: "REPORT-107", road: "MG Road Junction", severity: "LOW", depth: "1.8cm", coords: "12.9744, 77.6111", top: "35%", left: "20%", color: "bg-emerald-500 shadow-emerald-500/40" }
  ];

  // Dynamic values calculated from Sliders
  const calculatedPrecision = Math.min(99.9, Math.round(92.4 + (1 - tempValue) * 6 + (confidenceThreshold / 100) * 1.5));
  const calculatedLatency = Math.round(75 + tempValue * 150 + (scanResolution === "High Definition" ? 15 : scanResolution === "Multispectral Scan" ? 60 : 5));

  return (
    <div className={`min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative overflow-hidden font-sans ${crtEnabled ? "crt-effects" : ""}`}>
      {/* Custom CRT styles and Radar animations */}
      <style jsx global>{`
        @keyframes radar-sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crt-flicker {
          0% { opacity: 0.985; }
          50% { opacity: 1; }
          100% { opacity: 0.99; }
        }
        @keyframes crt-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.95; }
        }
        
        .crt-effects {
          animation: crt-flicker 0.15s infinite;
        }
        .crt-effects::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%);
          z-index: 9999;
          background-size: 100% 4px;
          pointer-events: none;
        }
      `}</style>

      {/* Elegant warm light blur backlights (Solar Blooms) */}
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-orange-200/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-200/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Centered Floating Pill Navigation Header (Riotters Reference style) */}
      <div className="w-full flex justify-center py-6 px-4 sticky top-0 z-50 pointer-events-none">
        <header className="w-full max-w-4xl bg-white/70 border border-black/5 backdrop-blur-xl rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] pointer-events-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="text-base font-black tracking-tight text-stone-900 uppercase">
              Road<span className="text-[#FF5A1F]">Watch</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-stone-500">
            <Link href="/track" className="hover:text-stone-900 transition-colors flex items-center gap-1"><Map className="w-3.5 h-3.5" /> Safety Map</Link>
            <Link href="/leaderboard" className="hover:text-stone-900 transition-colors flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Leaderboard</Link>
            <Link href="/dashboard" className="hover:text-stone-900 transition-colors flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Dashboard</Link>
          </nav>

          <div className="flex items-center space-x-3.5">
            {/* Retro screen mode toggle */}
            <button 
              onClick={() => setCrtEnabled(!crtEnabled)}
              className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                crtEnabled 
                  ? "bg-stone-900 border-stone-900 text-white shadow-md shadow-black/10" 
                  : "bg-stone-50 border-black/5 text-stone-500 hover:text-stone-900"
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>Retro: {crtEnabled ? "ON" : "OFF"}</span>
            </button>

            <Link href="/report" className="px-5 py-2.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white text-[10px] font-black uppercase tracking-widest rounded-full transition-all shadow-md shadow-orange-500/10 active:scale-95">
              Report Hazard
            </Link>
          </div>
        </header>
      </div>

      {/* Main Spacious Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-16 sm:pt-28 pb-12 flex flex-col justify-center z-10 space-y-16">
        
        {/* Intro Typographic Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-black/5 text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
            <span className="relative flex w-1.5 h-1.5 mr-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75"></span>
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#FF5A1F]"></span>
            </span>
            AI-POWERED CIVIC INFRASTRUCTURE NETWORK
          </div>

          <h1 className="text-5xl sm:text-7xl font-light tracking-tight mb-6 text-stone-900 leading-[1.05]">
            Making Our Streets <br/>
            <span className="text-[#FF5A1F] font-extrabold">Safer, Together.</span>
          </h1>
          
          <p className="text-stone-500 text-sm sm:text-base max-w-2xl leading-relaxed font-semibold">
            Report road hazards instantly. Our Gemini AI automatically measures physical damage depth, tags geographic coordinates, and maps civic priority levels to expedite municipal repairs.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center">
            <Link href="/report" className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center transition-all shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 active:scale-95">
              <Camera className="mr-2 w-4 h-4 fill-white" /> Report Hazard 
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link href="/track" className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-stone-50 border border-black/5 text-stone-700 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 active:scale-95">
              <Map className="mr-2 w-4 h-4 text-[#FF5A1F]" /> View Safety Map
            </Link>
          </div>
        </motion.div>

        {/* 2-Column Riotters HUD / Civic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
          
          {/* LEFT: Gorgeous CSS Organic Civic Flower Graphic & Radar (lg:col-span-5) */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-5 flex flex-col space-y-6"
          >
            <div className="bg-white border border-black/5 p-8 rounded-[36px] shadow-[0_10px_40px_rgba(0,0,0,0.015)] flex flex-col justify-between h-full min-h-[460px] relative overflow-hidden text-center group">
              
              <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A1F] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#FF5A1F]" /> ACTIVE SAFETY SCANNER
                </span>
                <span className="text-[9px] font-mono text-stone-400">SYS_SAFETY_RADAR</span>
              </div>

              {/* Central Abstract Organic CSS Flower - Inspired by reference butterfly/flower 3D graphic */}
              <div className="relative w-64 h-64 mx-auto my-6 flex items-center justify-center">
                
                {/* Wide soft coral blur drop */}
                <div className="absolute w-44 h-44 bg-orange-100 rounded-full blur-[80px] opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                
                {/* Concentric clean light rings */}
                <div className="absolute w-56 h-56 rounded-full border border-stone-200/50" />
                <div className="absolute w-44 h-44 rounded-full border border-stone-200/30" />
                <div className="absolute w-32 h-32 rounded-full border border-stone-200/50 border-dashed" />
                
                {/* Thin orange scanner bar (sweeps under organic shape) */}
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                  background: 'conic-gradient(from 0deg, rgba(255,90,31,0.08) 0deg, rgba(255,90,31,0) 90deg)',
                  animation: 'radar-sweep 5s linear infinite'
                }} />

                {/* Layered CSS Glassmorphic Coral Petals (Organic 3D Shape Mockup) */}
                <div className="absolute w-full h-full flex items-center justify-center animate-[float-slow_8s_ease-in-out_infinite]">
                  {/* Petal Left 1 */}
                  <div className="absolute w-16 h-36 bg-orange-400/10 border border-orange-500/20 backdrop-blur-xs rounded-[50%_50%_10%_90%] origin-bottom-right rotate-[40deg] translate-x-[-8px] translate-y-[-18px]" />
                  {/* Petal Left 2 */}
                  <div className="absolute w-16 h-28 bg-orange-300/10 border border-orange-500/20 backdrop-blur-xs rounded-[40%_60%_20%_80%] origin-bottom-right rotate-[75deg] translate-x-[-12px] translate-y-[-14px]" />
                  
                  {/* Petal Right 1 */}
                  <div className="absolute w-16 h-36 bg-orange-400/10 border border-orange-500/20 backdrop-blur-xs rounded-[50%_50%_90%_10%] origin-bottom-left rotate-[-40deg] translate-x-[8px] translate-y-[-18px]" />
                  {/* Petal Right 2 */}
                  <div className="absolute w-16 h-28 bg-orange-300/10 border border-orange-500/20 backdrop-blur-xs rounded-[40%_60%_80%_20%] origin-bottom-left rotate-[-75deg] translate-x-[12px] translate-y-[-14px]" />
                  
                  {/* Central glowing orange column (mimics modern turbine spindle) */}
                  <div className="absolute w-1.5 h-36 bg-gradient-to-b from-orange-400 via-[#FF5A1F] to-[#E84E15] rounded-full shadow-[0_0_15px_rgba(255,90,31,0.4)] z-10" />
                  
                  {/* Top orange crown dial */}
                  <div className="absolute w-4 h-4 bg-orange-600 rounded-full shadow-md z-20 -translate-y-16 border border-white" />
                </div>

                {/* Floating Map Hazard Dots */}
                {hazardTargets.map((target) => (
                  <button
                    key={target.id}
                    onClick={() => setSelectedTarget(target)}
                    className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-125 z-30 flex items-center justify-center ${target.color}`}
                    style={{ top: target.top, left: target.left }}
                  >
                    <span className="absolute w-5 h-5 rounded-full border border-current opacity-30 animate-ping pointer-events-none" />
                  </button>
                ))}
              </div>

              {/* Selected Target HUD Readout (Clean white card overlay) */}
              <AnimatePresence mode="wait">
                {selectedTarget && (
                  <motion.div 
                    key={selectedTarget.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-stone-50 border border-black/5 rounded-2xl text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-[#FF5A1F] flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#FF5A1F] animate-pulse" /> TARGET REPORT: {selectedTarget.id}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        selectedTarget.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                        selectedTarget.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'
                      }`}>
                        {selectedTarget.severity} RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-[10px] text-stone-500 font-bold">
                      <div>ROADWAY: <span className="text-stone-900 block mt-0.5 font-extrabold">{selectedTarget.road}</span></div>
                      <div>GAP DEPTH: <span className="text-stone-900 block mt-0.5 font-extrabold">{selectedTarget.depth}</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* RIGHT: High-contrast Monospace Civic Action Shell (lg:col-span-7) */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="bg-white border border-black/5 p-8 rounded-[36px] flex flex-col justify-between h-full min-h-[460px] shadow-[0_10px_40px_rgba(0,0,0,0.015)] relative">
              
              <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A1F] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#FF5A1F]" /> ROAD SAFETY ACTIVITY STREAM
                </span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-stone-400">LEDGER_SYNC: ONLINE</span>
                </div>
              </div>

              {/* Console Screen Buffer (Minimalist light theme styling) */}
              <div className="flex-1 bg-stone-50 border border-black/5 rounded-2xl p-5 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[250px] mb-5 space-y-2.5 text-left shadow-inner">
                {terminalHistory.map((line, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="text-stone-400 select-none">[{line.time}]</span>
                    <span className={`break-all ${
                      line.type === 'input' ? 'text-[#FF5A1F] font-bold' :
                      line.type === 'system' ? 'text-indigo-600 font-bold' :
                      line.type === 'success' ? 'text-emerald-600 font-bold' :
                      line.type === 'warning' ? 'text-rose-600 font-bold' :
                      'text-stone-700'
                    }`}>
                      {line.text}
                    </span>
                  </div>
                ))}
                
                {isScanning && (
                  <div className="flex items-center space-x-2">
                    <span className="text-stone-400">[{getTimestamp()}]</span>
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-stone-500 italic font-semibold">Gemini AI analyzing photo...</span>
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>

              {/* Command Shortcuts (Clean pill buttons) */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button 
                  onClick={() => triggerPresetCommand("status")}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-[9px] font-mono text-stone-500 hover:text-stone-900 transition-colors uppercase font-bold tracking-wider"
                >
                  [SYSTEM_STATUS]
                </button>
                <button 
                  onClick={() => triggerPresetCommand("scan")}
                  disabled={isScanning}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-[9px] font-mono text-stone-500 hover:text-stone-900 transition-colors uppercase font-bold tracking-wider"
                >
                  [AI_PHOTO_SCAN]
                </button>
                <button 
                  onClick={() => triggerPresetCommand("reports")}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-[9px] font-mono text-stone-500 hover:text-stone-900 transition-colors uppercase font-bold tracking-wider"
                >
                  [ACTIVE_REPORTS]
                </button>
                <button 
                  onClick={() => triggerPresetCommand("spam")}
                  className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full text-[9px] font-mono text-[#FF5A1F] transition-colors uppercase font-bold tracking-wider"
                >
                  [ANTI_SPAM_SHIELD]
                </button>
                <button 
                  onClick={() => triggerPresetCommand("allocate")}
                  className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-[9px] font-mono text-stone-500 hover:text-stone-900 transition-colors uppercase font-bold tracking-wider"
                >
                  [BOOST_BUDGET]
                </button>
              </div>

              {/* Console Input Bar */}
              <form onSubmit={handleTerminalSubmit} className="flex gap-2.5">
                <div className="flex-1 bg-stone-50 border border-black/5 rounded-2xl px-4 py-3 flex items-center space-x-2.5 focus-within:border-orange-300 focus-within:ring-1 focus-within:ring-orange-200 transition-all">
                  <span className="text-[#FF5A1F] font-mono text-xs select-none">&gt;</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Type diagnostic command (e.g. status, scan)..."
                    className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-stone-800 placeholder:text-stone-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-colors active:scale-95"
                >
                  ENTER
                </button>
              </form>
            </div>
          </motion.div>
        </div >

        {/* Dynamic AI Detection Engine Tuning Panel */}
        <motion.div
          variants={itemVariants}
          className="bg-white border border-black/5 p-8 rounded-[36px] shadow-[0_10px_40px_rgba(0,0,0,0.015)] relative text-left"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/5 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-stone-900 flex items-center gap-2.5">
                <Sliders className="text-[#FF5A1F] w-5 h-5" /> AI Engine Configuration
              </h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase mt-1 tracking-wider">Configure dynamic filters to adjust pothole and road hazard image scanning parameters.</p>
            </div>
            <div className="flex gap-2">
              {["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-exp"].map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`px-4 py-2 rounded-full border text-[9px] font-mono uppercase tracking-wider transition-all font-bold ${
                    selectedModel === model
                      ? "bg-orange-500/10 border-orange-500/25 text-[#FF5A1F] shadow-sm shadow-orange-500/5"
                      : "bg-stone-50 border-black/5 text-stone-400 hover:text-stone-700"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Config sliders */}
            <div className="space-y-6">
              {/* Temperature slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-stone-500">
                  <span>AI CREATIVE TEMP</span>
                  <span className="text-[#FF5A1F] font-mono">{tempValue.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={tempValue}
                  onChange={(e) => setTempValue(parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#FF5A1F] focus:outline-none border border-black/5"
                />
              </div>

              {/* Confidence filter threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-stone-500">
                  <span>MIN DETECTION CONFIDENCE</span>
                  <span className="text-[#FF5A1F] font-mono">{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#FF5A1F] focus:outline-none border border-black/5"
                />
              </div>
            </div>

            {/* Column 2: Sensor Resolution Selection */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold tracking-widest text-stone-500">IMAGE SCAN DENSITY</label>
              <div className="grid grid-cols-3 gap-2">
                {["Standard 1080p", "High Definition", "Multispectral Scan"].map((res) => (
                  <button
                    key={res}
                    onClick={() => setScanResolution(res)}
                    className={`py-3 px-1 rounded-2xl border text-[9px] font-black uppercase text-center transition-all ${
                      scanResolution === res
                        ? "bg-orange-500/10 border-orange-500/25 text-[#FF5A1F] font-black"
                        : "bg-stone-50 border-black/5 text-stone-400 hover:text-stone-700"
                    }`}
                  >
                    {res.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Dynamic Indicator dials */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex flex-col justify-between shadow-inner">
                <span className="text-[9px] font-bold text-stone-400 tracking-wider">AI PRECISION</span>
                <span className="text-2xl font-black text-emerald-600 mt-2">{calculatedPrecision}%</span>
                <span className="text-[8px] text-stone-400 font-mono mt-1">Image detection rate</span>
              </div>
              <div className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex flex-col justify-between shadow-inner">
                <span className="text-[9px] font-bold text-stone-400 tracking-wider">CORE LATENCY</span>
                <span className="text-2xl font-black text-orange-600 mt-2">{calculatedLatency}ms</span>
                <span className="text-[8px] text-stone-400 font-mono mt-1">Total response latency</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Operations Steps */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: Camera,
              title: "1. Upload An Incident",
              desc: "Snap a photo of the road damage in your community. Gemini AI automatically measures the depth, severity, and GPS coordinates within seconds.",
              color: "border-black/5 text-[#FF5A1F] bg-white hover:border-orange-500/20 shadow-sm"
            },
            {
              icon: Sparkles,
              title: "2. Verify Hazards",
              desc: "Review and upvote reports submitted by others in your neighborhood. Level up your ranking and unlock special road guardian achievement badges.",
              color: "border-black/5 text-[#FF5A1F] bg-white hover:border-orange-500/20 shadow-sm"
            },
            {
              icon: ShieldCheck,
              title: "3. Smart Allocation",
              desc: "Verified hazards and civic points sync onto municipal repair ledgers instantly, allowing local agencies to direct budget and schedule repairs efficiently.",
              color: "border-black/5 text-[#FF5A1F] bg-white hover:border-orange-500/20 shadow-sm"
            }
          ].map((step, idx) => (
            <div key={idx} className={`border ${step.color} p-8 rounded-[32px] transition-all text-left relative group`}>
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/[0.01] blur-2xl rounded-full" />
              <div className="w-12 h-12 bg-stone-50 rounded-2xl border border-black/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <step.icon className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 mb-2">{step.title}</h3>
              <p className="text-stone-500 text-xs font-semibold leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}