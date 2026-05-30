"use client";

import { useState } from "react";
import { Compass, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HazardTarget { id: string; road: string; severity: string; depth: string; coords: string; top: string; left: string; color: string; }

const hazardTargets: HazardTarget[] = [
  { id: "REPORT-104", road: "Indira Nagar Ring Rd", severity: "CRITICAL", depth: "9.2cm", coords: "12.9716, 77.6412", top: "45%", left: "40%", color: "bg-[#FF5A1F] shadow-orange-500/40" },
  { id: "REPORT-105", road: "Whitefield Main Rd", severity: "HIGH", depth: "6.8cm", coords: "12.9698, 77.7499", top: "70%", left: "70%", color: "bg-amber-500 shadow-amber-500/40" },
  { id: "REPORT-106", road: "Koramangala 80 Feet Rd", severity: "MEDIUM", depth: "4.1cm", coords: "12.9352, 77.6244", top: "20%", left: "60%", color: "bg-indigo-500 shadow-indigo-500/40" },
  { id: "REPORT-107", road: "MG Road Junction", severity: "LOW", depth: "1.8cm", coords: "12.9744, 77.6111", top: "35%", left: "20%", color: "bg-emerald-500 shadow-emerald-500/40" }
];

export default function RadarScanner() {
  const [selectedTarget, setSelectedTarget] = useState<HazardTarget | null>(hazardTargets[0]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5 flex flex-col space-y-6">
      <div className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm flex flex-col justify-between h-full min-h-[460px] relative overflow-hidden text-center group">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A1F] flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> ACTIVE SAFETY SCANNER</span>
          <span className="text-[9px] font-mono text-stone-400">SYS_SAFETY_RADAR</span>
        </div>

        <div className="relative w-64 h-64 mx-auto my-6 flex items-center justify-center">
          <div className="absolute w-44 h-44 bg-orange-100 rounded-full blur-[80px] opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute w-56 h-56 rounded-full border border-stone-200/50" />
          <div className="absolute w-44 h-44 rounded-full border border-stone-200/30" />
          <div className="absolute w-32 h-32 rounded-full border border-stone-200/50 border-dashed" />
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'conic-gradient(from 0deg, rgba(255,90,31,0.08) 0deg, rgba(255,90,31,0) 90deg)', animation: 'radar-sweep 5s linear infinite' }} />

          <div className="absolute w-full h-full flex items-center justify-center animate-[float-slow_8s_ease-in-out_infinite]">
            <div className="absolute w-16 h-36 bg-orange-400/10 border border-orange-500/20 backdrop-blur-xs rounded-[50%_50%_10%_90%] origin-bottom-right rotate-[40deg] translate-x-[-8px] translate-y-[-18px]" />
            <div className="absolute w-16 h-28 bg-orange-300/10 border border-orange-500/20 backdrop-blur-xs rounded-[40%_60%_20%_80%] origin-bottom-right rotate-[75deg] translate-x-[-12px] translate-y-[-14px]" />
            <div className="absolute w-16 h-36 bg-orange-400/10 border border-orange-500/20 backdrop-blur-xs rounded-[50%_50%_90%_10%] origin-bottom-left rotate-[-40deg] translate-x-[8px] translate-y-[-18px]" />
            <div className="absolute w-16 h-28 bg-orange-300/10 border border-orange-500/20 backdrop-blur-xs rounded-[40%_60%_80%_20%] origin-bottom-left rotate-[-75deg] translate-x-[12px] translate-y-[-14px]" />
            <div className="absolute w-1.5 h-36 bg-gradient-to-b from-orange-400 via-[#FF5A1F] to-[#E84E15] rounded-full shadow-[0_0_15px_rgba(255,90,31,0.4)] z-10" />
            <div className="absolute w-4 h-4 bg-orange-600 rounded-full shadow-md z-20 -translate-y-16 border border-white" />
          </div>

          {hazardTargets.map((target) => (
            <button key={target.id} onClick={() => setSelectedTarget(target)} className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-125 z-30 flex items-center justify-center ${target.color}`} style={{ top: target.top, left: target.left }} >
              <span className="absolute w-5 h-5 rounded-full border border-current opacity-30 animate-ping pointer-events-none" />
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedTarget && (
            <motion.div key={selectedTarget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-stone-50 border border-black/5 rounded-2xl text-left" >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-[#FF5A1F] flex items-center gap-1.5"><Radio className="w-3.5 h-3.5 animate-pulse" /> TARGET: {selectedTarget.id}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${selectedTarget.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : selectedTarget.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'}`}>{selectedTarget.severity} RISK</span>
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
  );
}
