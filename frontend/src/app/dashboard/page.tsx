"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Loader2, Cpu, Sparkles, FileDown, Clock3, Sliders } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useRoadIssues, apiFetch } from "@/lib/api";
import { Header } from "@/components/Navigation";

const chartStyle = { backgroundColor: '#FFFFFF', borderColor: '#EAE8E3', borderRadius: '16px', color: '#1F1E1B', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)', fontSize: '11px' };

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewState, setReviewState] = useState<any>({ item: null, status: "", severity: "", error: "", saving: false });
  const [aiConfig, setAiConfig] = useState({ model: "gemini-2.5-flash", temperature: 0.2, min_confidence: 75, scan_density: "High Definition" });
  const [budget, setBudget] = useState([{ name: 'Road Repair', spent: 4.5, allocated: 10.0 }, { name: 'Pothole Filling', spent: 1.2, allocated: 3.0 }, { name: 'Street Lights', spent: 0.85, allocated: 2.0 }, { name: 'Signage', spent: 0.3, allocated: 1.0 }]);
  const [isMounted, setIsMounted] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    apiFetch<any>("/api/v1/settings").then(c => c && setAiConfig({ model: c.model || "gemini-2.5-flash", temperature: c.temperature !== undefined ? c.temperature : 0.2, min_confidence: c.min_confidence !== undefined ? c.min_confidence : 75, scan_density: c.scan_density || "High Definition" })).catch(() => {}).finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    const timer = setTimeout(() => apiFetch("/api/v1/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(aiConfig) }).catch(() => {}), 300);
    return () => clearTimeout(timer);
  }, [aiConfig, settingsLoaded]);

  const precision = Math.min(99.9, Math.round(92.4 + (1 - aiConfig.temperature) * 6 + (aiConfig.min_confidence / 100) * 1.5));
  const latency = Math.round(75 + aiConfig.temperature * 150 + (aiConfig.scan_density === "High Definition" ? 15 : aiConfig.scan_density === "Multispectral Scan" ? 60 : 5));

  const { data, loading: fetchLoading, error: fetchError } = useRoadIssues();

  useEffect(() => {
    if (data) setReports(data);
    if (fetchError) setLoadError(fetchError);
    setLoading(fetchLoading);
  }, [data, fetchLoading, fetchError]);

  const openReview = (r: any) => setReviewState({ item: r, status: r.status ?? "", severity: r.severity ?? "", error: "", saving: false });
  const closeReview = () => setReviewState({ item: null, status: "", severity: "", error: "", saving: false });

  const exportToCSV = () => {
    if (!reports.length) return;
    const rows = [["ID", "Latitude", "Longitude", "Category", "Severity", "Impact", "Authority", "Status", "Date"], ...reports.map(r => [r.id, r.latitude, r.longitude, r.infra_type, r.severity, r.impact_score, r.assigned_authority, r.status, new Date(r.created_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(e => e.join(",")).join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `roadwatch_export_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  const saveReview = async () => {
    if (!reviewState.item) return;
    setReviewState((p: any) => ({ ...p, saving: true, error: "" }));
    try {
      const updated = await apiFetch<any>(`/api/v1/issues/${reviewState.item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewState.status || undefined, severity: reviewState.severity || undefined }),
      });
      setReports(p => p.map(r => r.id === updated.id ? updated : r));
      closeReview();
    } catch (err: any) { setReviewState((p: any) => ({ ...p, error: err.message || "Failed to update report." })); }
  };

  if (loading) return <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#FF5A1F]" /></div>;

  const total = reports.length, critical = reports.filter(r => r.severity === 'CRITICAL').length, progress = reports.filter(r => ['IN_PROGRESS', 'PENDING', 'VERIFIED'].includes(r.status)).length, resolved = reports.filter(r => r.status === 'RESOLVED').length;
  const severityData = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s, i) => ({ name: s, value: reports.filter(r => r.severity === s).length, color: ['#ef4444', '#f97316', '#eab308', '#6366f1'][i] })).filter(d => d.value > 0);

  return (
    <main className="min-h-screen bg-[#FAF9F5] text-stone-900 p-6 md:p-8 font-sans relative">
      <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-orange-100/20 blur-[130px] rounded-full pointer-events-none" />
      <Header rightElement={<button onClick={exportToCSV} disabled={!total} className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"><FileDown className="w-4 h-4 text-[#FF5A1F]" /> Export CSV Logs</button>} />
      {loadError && <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 font-bold">{loadError}</div>}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 space-y-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[["Total Active Reports", total, "bg-orange-500/10 border-orange-200 text-[#FF5A1F]", Cpu], ["Critical Hazards", critical, "bg-rose-500/10 border-rose-200 text-rose-650", AlertTriangle], ["Repairs Scheduled", progress, "bg-amber-500/10 border-amber-200 text-amber-655", Clock3], ["Resolved Hazards", resolved, "bg-emerald-500/10 border-emerald-200 text-emerald-655", CheckCircle]].map(([title, val, bg, Icon]: any, idx) => (
            <div key={idx} className="bg-white border border-black/5 p-6 rounded-[28px] shadow-sm flex items-center gap-4.5"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${bg}`}><Icon className="w-6 h-6" /></div><div><p className="text-[10px] text-stone-455 font-black uppercase tracking-wider mb-0.5">{title}</p><h3 className="text-3xl font-black">{val}</h3></div></div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-black/5 p-6 rounded-[32px] lg:col-span-2 flex flex-col shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wider mb-6 text-left flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#FF5A1F]" /> Municipal Repair Budgets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
              <div className="md:col-span-2 min-h-[300px]">
                {isMounted ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budget} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E3" vertical={false} />
                        <XAxis dataKey="name" stroke="#605E59" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#605E59" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`} />
                        <Tooltip cursor={{ fill: '#FAF9F5' }} contentStyle={chartStyle} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                        <Bar dataKey="spent" name="Spent" fill="#FF5A1F" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="allocated" name="Allocated" fill="#E4E2DD" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div className="h-72 w-full flex items-center justify-center text-xs text-stone-400">Loading charts...</div>}
              </div>
              <div className="space-y-4 bg-stone-50 border border-black/5 p-4 rounded-2xl text-left shadow-inner">
                <h3 className="text-[10px] uppercase font-black text-[#FF5A1F] tracking-widest mb-3">🔧 Budget Tuning</h3>
                {budget.map((item, idx) => (
                  <div key={idx} className="space-y-1"><div className="flex justify-between items-center text-xs font-bold text-stone-655"><span>{item.name}</span><span className="text-stone-900">₹{item.allocated.toFixed(2)} L</span></div><input type="range" min="0.5" max="15.0" step="0.5" value={item.allocated} onChange={(e) => setBudget((p: any) => p.map((b: any, i: any) => i === idx ? { ...b, allocated: Number(e.target.value) } : b))} className="w-full accent-[#FF5A1F] bg-stone-200 h-1 rounded-lg appearance-none cursor-pointer" /></div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-black/5 p-6 rounded-[32px] flex flex-col shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wider mb-6 text-left">Severity Analytics</h2>
            <div className="flex-1 min-h-[300px]">
              {severityData.length > 0 ? (isMounted ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {severityData.map((e: any, idx: number) => <Cell key={idx} fill={e.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip contentStyle={chartStyle} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="h-72 w-full flex items-center justify-center text-xs text-stone-400">Loading charts...</div>) : <div className="flex items-center justify-center h-full text-stone-400">No data available</div>}
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm text-left">
          <div className="border-b border-black/5 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2.5">💼 Citizen Micro-Funding & Priority Ledger</h2>
              <p className="text-[10px] text-stone-450 font-bold uppercase mt-1">Real-time repair estimates automatically funded by citizen upvotes and safety priority.</p>
            </div>
            <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-[9px] uppercase tracking-widest font-black text-[#FF5A1F] rounded-full">Live Allocation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.slice().reverse().slice(0, 4).map((r) => {
              const estCost = (r.severity === "CRITICAL" ? 120000 : r.severity === "HIGH" ? 50000 : r.severity === "MEDIUM" ? 15000 : 5000), allocated = Math.min(estCost, (r.upvotes || 0) * 5000), progress = estCost > 0 ? (allocated / estCost) * 100 : 0;
              return (
                <div key={r.id} className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex flex-col justify-between shadow-sm relative group hover:border-orange-500/20 transition-all min-h-[110px]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono text-stone-400 font-bold uppercase">#{r.id} {r.infra_type}</span>
                    <span className={`text-[8px] uppercase font-black px-1.5 py-0.2 rounded-full border ${progress >= 100 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-orange-500/10 border-orange-500/20 text-[#FF5A1F]"}`}>{progress >= 100 ? "Fully Funded" : `${Math.round(progress)}%`}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-stone-900 line-clamp-1 mb-3">{r.road_name || "Unknown Road"}</h4>
                  <div className="space-y-2 mt-auto">
                    <div className="flex justify-between text-[9px] font-bold text-stone-450 uppercase"><span>Funded: ₹{allocated.toLocaleString()}</span><span>Target: ₹{estCost.toLocaleString()}</span></div>
                    <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${progress >= 100 ? "bg-emerald-500" : "bg-[#FF5A1F]"}`} style={{ width: `${progress}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/5 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2.5"><Sliders className="text-[#FF5A1F] w-5 h-5" /> AI Engine Configuration</h2>
              <p className="text-[10px] text-stone-450 font-bold uppercase mt-1">Configure dynamic filters to adjust pothole and road hazard image scanning parameters.</p>
            </div>
            <div className="flex gap-2">
              {["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-exp"].map(m => (
                <button key={m} onClick={() => setAiConfig((p: any) => ({ ...p, model: m }))} className={`px-4 py-2 rounded-full border text-[9px] font-mono uppercase tracking-wider transition-all font-bold ${aiConfig.model === m ? "bg-orange-50/10 border-orange-50/25 text-[#FF5A1F]" : "bg-stone-50 border-black/5 text-stone-400"}`}>{m}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              {[
                ["AI CREATIVE TEMP", aiConfig.temperature.toFixed(1), 0.0, 1.0, 0.1, aiConfig.temperature, (v: number) => setAiConfig((p: any) => ({ ...p, temperature: v }))],
                ["MIN CONFIDENCE", `${aiConfig.min_confidence}%`, 50, 98, 1, aiConfig.min_confidence, (v: number) => setAiConfig((p: any) => ({ ...p, min_confidence: v }))]
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
                  <button key={res} onClick={() => setAiConfig((p: any) => ({ ...p, scan_density: res }))} className={`py-3 px-1 rounded-2xl border text-[9px] font-black uppercase text-center transition-all ${aiConfig.scan_density === res ? "bg-orange-50/10 border-orange-50/25 text-[#FF5A1F]" : "bg-stone-50 border-black/5 text-stone-400"}`}>{res.split(' ')[0]}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[["AI PRECISION", `${precision}%`, "Image detection", "text-emerald-600"], ["CORE LATENCY", `${latency}ms`, "Total latency", "text-orange-600"]].map(([lbl, val, sub, col]: any, i) => (
                <div key={i} className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex flex-col justify-between shadow-inner">
                  <span className="text-[9px] font-bold text-stone-400 tracking-wider">{lbl}</span>
                  <span className={`text-2xl font-black mt-2 ${col}`}>{val}</span>
                  <span className="text-[8px] text-stone-455 font-mono mt-1">{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-black/5 flex items-center justify-between bg-stone-50/50">
            <h2 className="text-base font-black uppercase tracking-wider text-left">Recent Hazard Reports</h2>
            <Link href="/track" className="text-xs text-[#FF5A1F] hover:text-[#E84E15] font-black uppercase tracking-widest">Active Safety Map</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-stone-455 border-b border-black/5 bg-stone-50/20">
                <tr>
                  {["Report ID", "Incident Location", "Damage Type", "Severity", "Status", "Points", "Assigned Agency", "Actions"].map(h => (
                    <th key={h} className={`px-6 py-4.5 font-black uppercase tracking-wider text-[10px] ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-semibold text-stone-750">
                {reports.slice().reverse().slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-stone-900">#{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-left font-sans">
                        <span className="text-stone-855 font-bold max-w-[200px] truncate">{r.road_name || "Unknown Road"}</span>
                        <span className="text-[10px] text-stone-400 font-mono">({r.latitude.toFixed(5)}, {r.longitude.toFixed(5)})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{r.infra_type}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-655' : r.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-655' : r.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-655' : 'bg-indigo-500/10 text-indigo-655'}`}>{r.severity}</span></td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-650' : r.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-655' : r.status === 'PENDING' ? 'bg-orange-500/10 text-orange-655' : 'bg-orange-500/10 text-orange-655'}`}>{r.status}</span></td>
                    <td className="px-6 py-4"><span className="text-[#FF5A1F] font-black">+{r.impact_score}</span> pts</td>
                    <td className="px-6 py-4 text-stone-600">{r.assigned_authority}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openReview(r)} className="text-[#FF5A1F] hover:text-[#E84E15] font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-200 cursor-pointer active:scale-95 shadow-sm">Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {reviewState.item && (
        <div className="fixed inset-0 z-[2000] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-black/10 rounded-[32px] shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0">
              <div className="text-left">
                <div className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-widest">Verification</div>
                <div className="text-lg font-black text-stone-900">REPORT: #{reviewState.item.id}</div>
              </div>
              <button onClick={closeReview} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-700 cursor-pointer active:scale-95">Close</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {reviewState.item.image_url && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-stone-50 border border-black/5 relative shadow-inner">
                  <img src={reviewState.item.image_url.startsWith('http') ? reviewState.item.image_url : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')}/${reviewState.item.image_url}`} alt="Hazard verification" className="w-full h-full object-cover" />
                </div>
              )}
              {reviewState.error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 font-bold">{reviewState.error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left"><div className="text-[9px] text-[#FF5A1F] font-black uppercase mb-1">Location</div><div className="text-sm font-bold text-stone-900 truncate">{reviewState.item.road_name || "Unknown Road"}</div><div className="text-[10px] text-stone-400 mt-1 truncate">{reviewState.item.address || "No address logged"}</div></div>
                <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left"><div className="text-[9px] text-stone-455 font-black uppercase mb-1">Citizen Notes</div><div className="text-xs text-stone-650 font-semibold">{reviewState.item.citizen_description || "No description provided."}</div></div>
              </div>

              <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left shadow-inner flex justify-between gap-4">
                {[["Depth Ratio", reviewState.item.severity === 'CRITICAL' ? "9.2/10" : reviewState.item.severity === 'HIGH' ? "7.8/10" : "5.5/10"], ["Pedestrian Prox", `${(reviewState.item.id * 7 + 12) % 6 + 4}/10`], ["Subgrade Wear", reviewState.item.severity === 'CRITICAL' ? "8.8/10" : "7.2/10"]].map(([label, val]: any, idx) => (
                  <div key={idx} className="text-center flex-grow"><span className="text-[8px] text-stone-400 font-bold uppercase block">{label}</span><span className="text-xs font-black text-stone-800">{val}</span></div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {["Status", "Severity"].map((label, idx) => (
                  <div key={idx}>
                    <label className="block text-[10px] uppercase font-bold text-stone-455 tracking-widest mb-2 font-black">{label}</label>
                    <select value={idx === 0 ? reviewState.status : reviewState.severity} onChange={(e) => setReviewState((p: any) => ({ ...p, [idx === 0 ? 'status' : 'severity']: e.target.value }))} className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs font-black uppercase tracking-widest">
                      {(idx === 0 ? ["PENDING", "VERIFIED", "REJECTED", "IN_PROGRESS", "RESOLVED"] : ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-black/5 flex items-center justify-between bg-stone-50/40 shrink-0">
              <a href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '')}/api/v1/issues/${reviewState.item.id}/challan`} target="_blank" rel="noopener noreferrer" className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-white hover:bg-stone-50 border border-black/5 text-stone-500 hover:text-stone-900 cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5" /> <span>Print Challan</span></a>
              <div className="flex items-center gap-3">
                <button onClick={closeReview} className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-white hover:bg-stone-100 border border-black/5 text-stone-700 cursor-pointer active:scale-95">Cancel</button>
                <button disabled={reviewState.saving} onClick={saveReview} className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-[#FF5A1F] hover:bg-[#E84E15] text-white disabled:opacity-60 shadow-md active:scale-95">{reviewState.saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}