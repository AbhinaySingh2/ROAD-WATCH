"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from 'next/dynamic';
const MapWrapper = dynamic(() => import('@/components/Map'), { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-[#FF5A1F]" /></div> });
import { Search, Loader2, Map, ShieldAlert, ShieldCheck, Compass, RefreshCw, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoadIssues, apiFetch } from "@/lib/api";

export default function TrackPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(h);
  }, [searchQuery]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [isSafetyRoutingActive, setIsSafetyRoutingActive] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const { data } = useRoadIssues();

  useEffect(() => {
    if (data) {
      setReports(data.map((r: any) => ({ id: r.id, latitude: r.latitude, longitude: r.longitude, damage_type: r.infra_type, severity: r.severity, assigned_authority: r.assigned_authority, upvotes: r.upvotes || 0, impact_score: r.impact_score || 0, image_url: r.image_url })));
      setLoading(false);
    }
  }, [data]);

  const handleUpvote = async (id: number) => {
    try {
      const u = await apiFetch<any>(`/api/v1/issues/${id}/upvote`, { method: "POST" });
      setReports(p => p.map(r => r.id === id ? { ...r, upvotes: u.upvotes, impact_score: u.impact_score } : r));
    } catch {}
  };

  const toggleRouting = () => { setCalibrating(true); setTimeout(() => { setIsSafetyRoutingActive(p => !p); setCalibrating(false); }, 700); };
  const filtered = reports.filter(r => debouncedQuery === "" || r.id.toString() === debouncedQuery.replace("#", ""));
  const critical = reports.filter(r => r.severity === 'CRITICAL').length;

  return (
    <div className="h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans overflow-hidden">
      <header className="px-6 py-4.5 border-b border-black/5 flex items-center justify-between bg-white/70 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-black text-lg uppercase">Road<span className="text-[#FF5A1F]">Watch</span></Link>
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-[9px] uppercase tracking-widest font-black text-[#FF5A1F] rounded-full animate-pulse">Safety Center</span>
        </div>
        <Link href="/dashboard" className="text-xs uppercase tracking-widest font-black text-stone-500 hover:text-stone-950 flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-[#FF5A1F]" /> Dashboard</Link>
      </header>

      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-69px)] relative overflow-hidden">
        <aside className={`w-full md:w-80 bg-white border-r border-black/5 flex flex-col overflow-y-auto overscroll-contain ${viewMode === 'list' ? 'flex flex-1' : 'hidden md:flex'}`}>
          <div className="p-5 border-b border-black/5 bg-stone-50/50 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FF5A1F] mb-3.5">🛡️ AI Safety Routing</h3>
            <div className="p-3.5 rounded-2xl bg-white border border-black/5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-750 uppercase">Pothole Avoidance</span>
                <button onClick={toggleRouting} disabled={calibrating} className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center ${isSafetyRoutingActive ? 'bg-[#FF5A1F]' : 'bg-stone-200'}`} >
                  <motion.div layout className="bg-white w-4.5 h-4.5 rounded-full shadow-md" animate={{ x: isSafetyRoutingActive ? 22 : 0 }} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {calibrating ? (
                  <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 flex flex-col items-center gap-2 text-stone-450 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#FF5A1F]" /><span className="font-bold uppercase tracking-widest text-[9px]">Calculating Safe Path...</span>
                  </motion.div>
                ) : (
                  <motion.div key={isSafetyRoutingActive ? "act" : "det"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-left">
                    <div className={`flex items-center gap-1.5 font-extrabold text-xs ${isSafetyRoutingActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isSafetyRoutingActive ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4 animate-pulse" />}
                      <span>{isSafetyRoutingActive ? 'SAFETY ROUTE ACTIVE' : 'HAZARDS DETECTED'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-stone-400 pt-1 border-t border-black/5">
                      <div>Safety: <span className="text-stone-800 block font-black text-xs">{isSafetyRoutingActive ? '98%' : '35%'}</span></div>
                      <div>{isSafetyRoutingActive ? 'Avoided:' : 'Hazards:'} <span className="text-stone-800 block font-black text-xs">{isSafetyRoutingActive ? '4 Hazards' : `${critical} Clusters`}</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-4 border-b border-black/5 text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-stone-450 mb-2">Search Reports</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input type="text" placeholder="Enter ID (e.g. 5)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-stone-50 border border-black/5 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold focus:outline-none" />
            </div>
          </div>
          
          <div className="p-4 flex-1 space-y-3.5 text-left">
            <label className="block text-[9px] font-black uppercase tracking-widest text-stone-450">Active Catalog</label>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#FF5A1F]" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-stone-450 text-xs text-center py-6 font-semibold uppercase">No reports</p>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="p-3.5 bg-stone-50/50 rounded-2xl border border-black/5 hover:border-orange-500/20 transition-colors">
                  <div className="flex justify-between items-start mb-2"><h3 className="font-extrabold text-xs text-stone-800">#{r.id} {r.damage_type}</h3><span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${r.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-655' : r.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-655' : 'bg-yellow-500/10 text-yellow-655'}`}>{r.severity}</span></div>
                  <div className="flex justify-between items-center text-[10px] text-stone-455 pt-1.5 border-t border-black/5 mt-2"><p className="line-clamp-1 max-w-[120px] font-bold uppercase">{r.assigned_authority}</p><span className="flex items-center gap-1 font-black text-[#FF5A1F]">👍 {r.upvotes}</span></div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className={`flex-1 p-4 h-full relative ${viewMode === 'map' ? 'block' : 'hidden md:block'}`}>
          <div className="w-full h-full min-h-[500px] md:h-full relative rounded-[32px] overflow-hidden border border-black/5 bg-white shadow-sm">
            <MapWrapper reports={filtered} onUpvote={handleUpvote} isSafetyRoutingActive={isSafetyRoutingActive} />
          </div>
          
          <div className="absolute top-8 left-8 z-[400] bg-white/90 border border-black/5 p-4 rounded-2xl shadow-sm text-left">
            <div className="text-[9px] text-[#FF5A1F] font-black uppercase mb-1.5">Reports</div>
            <div className="text-3xl font-black text-stone-900">{reports.length}</div>
          </div>

          <div className="absolute top-8 right-8 z-[400] bg-white/90 border border-black/5 p-4 rounded-2xl shadow-sm flex gap-6 text-left text-xs font-black">
            {[["Temp", "28.4°C"], ["Humidity", "42%"]].map(([l, v]) => <div key={l}><span className="text-[8px] text-stone-400 uppercase block mb-1">{l}</span>{v}</div>)}
            <div><span className="text-[8px] text-stone-400 uppercase block mb-1">Sensor</span><span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />SYNC</span></div>
          </div>
        </main>

        <div className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[999]">
          <button onClick={() => setViewMode(prev => prev === "map" ? "list" : "map")} className="bg-gradient-to-br from-[#FF6B35] to-[#FF5A1F] text-white font-black px-6 py-4.5 rounded-full shadow-lg flex items-center gap-2 text-xs tracking-widest uppercase cursor-pointer">
            {viewMode === "map" ? <><Search className="w-4 h-4" /><span>List</span></> : <><Map className="w-4 h-4" /><span>Map</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
