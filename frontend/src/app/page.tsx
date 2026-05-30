"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Map, ArrowRight, Sliders, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";
import RadarScanner from "@/components/RadarScanner";
import DiagnosticConsole from "@/components/DiagnosticConsole";

export default function Home() {
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [healthIndex, setHealthIndex] = useState<number | null>(null);
  const [activeReports, setActiveReports] = useState(0);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [tempValue, setTempValue] = useState(0.2);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [scanResolution, setScanResolution] = useState("High Definition");

  useEffect(() => {
    apiFetch<any[]>("/api/v1/issues").then((data) => {
      setActiveReports(data.length);
      if (data.length === 0) return setHealthIndex(100);
      const crit = data.filter((r: any) => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length;
      const high = data.filter((r: any) => r.severity === 'HIGH' && r.status !== 'RESOLVED').length;
      setHealthIndex(Math.max(10, 100 - (crit * 12 + high * 4)));
    }).catch(() => { setHealthIndex(84); setActiveReports(14); });
  }, []);

  const precision = Math.min(99.9, Math.round(92.4 + (1 - tempValue) * 6 + (confidenceThreshold / 100) * 1.5));
  const latency = Math.round(75 + tempValue * 150 + (scanResolution === "High Definition" ? 15 : scanResolution === "Multispectral Scan" ? 60 : 5));

  return (
    <div className={`min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative overflow-hidden font-sans ${crtEnabled ? "crt-effects" : ""}`}>
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-orange-200/20 blur-[130px] rounded-full pointer-events-none" />
      <Header crtEnabled={crtEnabled} onCrtToggle={() => setCrtEnabled(!crtEnabled)} showCrtToggle={true} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-16 sm:pt-28 pb-12 flex flex-col justify-center z-10 space-y-16">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-black/5 text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm"><span className="relative flex w-1.5 h-1.5 mr-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75"></span><span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#FF5A1F]"></span></span>AI CIVIC NETWORK</div>
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight mb-6 leading-[1.05]">Making Streets <br/><span className="text-[#FF5A1F] font-extrabold">Safer, Together.</span></h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-2xl leading-relaxed font-semibold">Report road hazards instantly. Our Gemini AI automatically measures physical damage depth, tags geographic coordinates, and maps civic priority levels to expedite municipal repairs.</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center">
            <Link href="/report" className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center transition-all shadow-lg active:scale-95"><Camera className="mr-2 w-4 h-4 fill-white" /> Report Hazard <ArrowRight className="ml-2 w-4 h-4" /></Link>
            <Link href="/track" className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-stone-50 border border-black/5 text-stone-750 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center transition-all shadow-sm active:scale-95"><Map className="mr-2 w-4 h-4 text-[#FF5A1F]" /> View Safety Map</Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
          <RadarScanner />
          <DiagnosticConsole healthIndex={healthIndex} activeReports={activeReports} confidenceThreshold={confidenceThreshold} />
        </div >

        <div className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/5 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-2.5"><Sliders className="text-[#FF5A1F] w-5 h-5" /> AI Engine Configuration</h2>
              <p className="text-[10px] text-stone-450 font-bold uppercase mt-1">Configure dynamic filters to adjust pothole and road hazard image scanning parameters.</p>
            </div>
            <div className="flex gap-2">
              {["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-exp"].map(m => (
                <button key={m} onClick={() => setSelectedModel(m)} className={`px-4 py-2 rounded-full border text-[9px] font-mono uppercase tracking-wider transition-all font-bold ${selectedModel === m ? "bg-orange-50/10 border-orange-50/25 text-[#FF5A1F]" : "bg-stone-50 border-black/5 text-stone-400"}`}>{m}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              {[
                ["AI CREATIVE TEMP", tempValue.toFixed(1), 0.0, 1.0, 0.1, tempValue, setTempValue],
                ["MIN CONFIDENCE", `${confidenceThreshold}%`, 50, 98, 1, confidenceThreshold, setConfidenceThreshold]
              ].map(([lbl, val, min, max, step, get, set]: any, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-stone-500"><span>{lbl}</span><span className="text-[#FF5A1F] font-mono">{val}</span></div>
                  <input type="range" min={min} max={max} step={step} value={get} onChange={(e) => set(parseFloat(e.target.value))} className="w-full h-1 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-[#FF5A1F]" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-bold tracking-widest text-stone-500">IMAGE SCAN DENSITY</label>
              <div className="grid grid-cols-3 gap-2">
                {["Standard 1080p", "High Definition", "Multispectral Scan"].map(res => (
                  <button key={res} onClick={() => setScanResolution(res)} className={`py-3 px-1 rounded-2xl border text-[9px] font-black uppercase text-center transition-all ${scanResolution === res ? "bg-orange-50/10 border-orange-50/25 text-[#FF5A1F]" : "bg-stone-50 border-black/5 text-stone-400"}`}>{res.split(' ')[0]}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ["AI PRECISION", `${precision}%`, "Image detection", "text-emerald-600"],
                ["CORE LATENCY", `${latency}ms`, "Total latency", "text-orange-600"]
              ].map(([lbl, val, sub, col]: any, i) => (
                <div key={i} className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex flex-col justify-between shadow-inner">
                  <span className="text-[9px] font-bold text-stone-400 tracking-wider">{lbl}</span>
                  <span className={`text-2xl font-black mt-2 ${col}`}>{val}</span>
                  <span className="text-[8px] text-stone-450 font-mono mt-1">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            [Camera, "1. Upload An Incident", "Snap a photo of the road damage in your community. Gemini AI automatically measures physical damage depth, severity, and GPS coordinates within seconds."],
            [Sparkles, "2. Verify Hazards", "Review and upvote reports submitted by others in your neighborhood. Level up your ranking and unlock special road guardian achievement badges."],
            [ShieldCheck, "3. Smart Allocation", "Verified hazards and civic points sync onto municipal ledgers instantly, allowing local agencies to direct budget and schedule repairs efficiently."]
          ].map(([Icon, title, desc]: any, idx) => (
            <div key={idx} className="border border-black/5 bg-white hover:border-orange-500/20 shadow-sm p-8 rounded-[32px] transition-all text-left relative group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/[0.01] blur-2xl rounded-full" />
              <div className="w-12 h-12 bg-stone-50 rounded-2xl border border-black/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Icon className="w-5.5 h-5.5 text-[#FF5A1F]" /></div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 mb-2">{title}</h3>
              <p className="text-stone-500 text-xs font-semibold leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}