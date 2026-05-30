"use client";

import { useState, useEffect } from "react";
import { Compass, Radio, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoadIssues } from "@/lib/api";

export default function RadarScanner() {
  const [userCoords, setUserCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);

  const { data, loading } = useRoadIssues();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(p => { setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setIsGpsActive(true); }, () => {}, { enableHighAccuracy: true });
    }
  }, []);

  const radarReports = (data || []).map((r: any) => {
    const dx = (r.longitude - userCoords.lng) * 111320 * Math.cos(userCoords.lat * Math.PI / 180), dy = (r.latitude - userCoords.lat) * 111320;
    const colors: Record<string, string> = { CRITICAL: "bg-[#FF5A1F] shadow-orange-500/40", HIGH: "bg-amber-500 shadow-amber-500/40", MEDIUM: "bg-indigo-500 shadow-indigo-500/40" };
    return {
      id: `REPORT-${r.id}`, road: r.road_name || r.address || `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`, severity: r.severity || "LOW", depth: r.infra_type || "OTHER", distance: Math.sqrt(dx * dx + dy * dy), angle: Math.atan2(dx, dy),
      coords: `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}`, color: colors[r.severity] || "bg-emerald-500 shadow-emerald-500/40"
    };
  });

  const displayReports = radarReports.sort((a: any, b: any) => a.distance - b.distance).slice(0, 6);
  const maxDistance = Math.max(...displayReports.map((r: any) => r.distance), 1000);

  useEffect(() => { if (displayReports.length > 0 && !selectedTarget) setSelectedTarget(displayReports[0]); }, [displayReports, selectedTarget]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5 flex flex-col space-y-6">
      <div className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm flex flex-col justify-between h-full min-h-[460px] relative overflow-hidden text-center group">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A1F] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> {isGpsActive ? "📡 ACTIVE GPS SCANNER" : "🧭 RADAR SCANNER (STATIC)"}
          </span>
          <span className="text-[9px] font-mono text-stone-400">SYS_SAFETY_RADAR</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[264px]"><Loader2 className="w-8 h-8 animate-spin text-[#FF5A1F]" /></div>
        ) : displayReports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[264px] text-stone-400 font-bold uppercase text-xs">No active hazards detected in range</div>
        ) : (
          <div className="relative w-64 h-64 mx-auto my-6 flex items-center justify-center">
            <div className="absolute w-44 h-44 bg-orange-100 rounded-full blur-[80px] opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            {["w-56 h-56 border-stone-200/50", "w-44 h-44 border-stone-200/30", "w-32 h-32 border-stone-200/50 border-dashed"].map((cls, i) => <div key={i} className={`absolute rounded-full border ${cls}`} />)}
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'conic-gradient(from 0deg, rgba(255,90,31,0.08) 0deg, rgba(255,90,31,0) 90deg)', animation: 'radar-sweep 5s linear infinite' }} />

            <div className="absolute w-full h-full flex items-center justify-center animate-[float-slow_8s_ease-in-out_infinite]">
              <div className="absolute w-1.5 h-36 bg-gradient-to-b from-orange-400 via-[#FF5A1F] to-[#E84E15] rounded-full shadow-[0_0_15px_rgba(255,90,31,0.4)] z-10" />
              <div className="absolute w-4 h-4 bg-orange-600 rounded-full shadow-md z-20 -translate-y-16 border border-white" />
            </div>

            {displayReports.map((target: any) => {
              const fraction = target.distance / maxDistance;
              const left = 50 + fraction * 40 * Math.sin(target.angle);
              const top = 50 - fraction * 40 * Math.cos(target.angle);
              return (
                <button
                  key={target.id}
                  onClick={() => setSelectedTarget(target)}
                  className={`absolute w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-125 z-30 flex items-center justify-center ${target.color}`}
                  style={{ top: `${top}%`, left: `${left}%` }}
                >
                  <span className="absolute w-5 h-5 rounded-full border border-current opacity-30 animate-ping pointer-events-none" />
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedTarget && (
            <motion.div key={selectedTarget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-stone-50 border border-black/5 rounded-2xl text-left" >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase text-[#FF5A1F] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> TARGET: {selectedTarget.id}
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${selectedTarget.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : selectedTarget.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'}`}>
                  {selectedTarget.severity} RISK
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-[10px] text-stone-500 font-bold">
                <div>ROADWAY: <span className="text-stone-900 block mt-0.5 font-extrabold line-clamp-1">{selectedTarget.road}</span></div>
                <div>HAZARD / DIST: <span className="text-stone-900 block mt-0.5 font-extrabold">{selectedTarget.depth} ({Math.round(selectedTarget.distance)}m)</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
