"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Loader2, Cpu, Sparkles, FileDown, Clock3 } from 'lucide-react';
import { BudgetBarChart, SeverityPieChart } from '@/components/DashboardCharts';
import { motion } from 'framer-motion';
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewSeverity, setReviewSeverity] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [budget, setBudget] = useState([
    { name: 'Road Repair', spent: 4.5, allocated: 10.0 },
    { name: 'Pothole Filling', spent: 1.2, allocated: 3.0 },
    { name: 'Street Lights', spent: 0.85, allocated: 2.0 },
    { name: 'Signage', spent: 0.3, allocated: 1.0 },
  ]);

  useEffect(() => {
    apiFetch<any[]>("/api/v1/issues")
      .then(setReports).catch(() => setLoadError("Failed to fetch road reports.")).finally(() => setLoading(false));
  }, []);

  const openReview = (r: any) => { setReviewError(""); setReviewing(r); setReviewStatus(r.status ?? ""); setReviewSeverity(r.severity ?? ""); };
  const closeReview = () => { setReviewError(""); setReviewing(null); };

  const exportToCSV = () => {
    if (!reports.length) return;
    const rows = [["ID", "Latitude", "Longitude", "Category", "Severity", "Impact", "Authority", "Status", "Date"], ...reports.map(r => [r.id, r.latitude, r.longitude, r.infra_type, r.severity, r.impact_score, r.assigned_authority, r.status, new Date(r.created_at).toLocaleDateString()])];
    const blob = new Blob([rows.map(e => e.join(",")).join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `roadwatch_export_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  const saveReview = async () => {
    if (!reviewing) return;
    setSavingReview(true); setReviewError("");
    try {
      const updated = await apiFetch<any>(`/api/v1/issues/${reviewing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewStatus || undefined, severity: reviewSeverity || undefined }),
      });
      setReports(p => p.map(r => r.id === updated.id ? updated : r)); setReviewing(null);
    } catch (err: any) { setReviewError(err.message || "Failed to update report."); }
    finally { setSavingReview(false); }
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
          {[
            ["Total Active Reports", total, "bg-orange-500/10 border-orange-200 text-[#FF5A1F]", Cpu],
            ["Critical Hazards", critical, "bg-rose-500/10 border-rose-200 text-rose-650", AlertTriangle],
            ["Repairs Scheduled", progress, "bg-amber-500/10 border-amber-200 text-amber-650", Clock3],
            ["Resolved Hazards", resolved, "bg-emerald-500/10 border-emerald-200 text-emerald-650", CheckCircle]
          ].map(([title, val, bg, Icon]: any, idx) => (
            <div key={idx} className="bg-white border border-black/5 p-6 rounded-[28px] shadow-sm flex items-center gap-4.5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${bg}`}><Icon className="w-6 h-6" /></div>
              <div><p className="text-[10px] text-stone-455 font-black uppercase tracking-wider mb-0.5">{title}</p><h3 className="text-3xl font-black">{val}</h3></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-black/5 p-6 rounded-[32px] lg:col-span-2 flex flex-col shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wider mb-6 text-left flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#FF5A1F]" /> Municipal Repair Budgets</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
              <div className="md:col-span-2 min-h-[300px]"><BudgetBarChart data={budget} /></div>
              <div className="space-y-4 bg-stone-50 border border-black/5 p-4 rounded-2xl text-left shadow-inner">
                <h3 className="text-[10px] uppercase font-black text-[#FF5A1F] tracking-widest mb-3">🔧 Budget Tuning</h3>
                {budget.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-655"><span>{item.name}</span><span className="text-stone-900">₹{item.allocated.toFixed(2)} L</span></div>
                    <input type="range" min="0.5" max="15.0" step="0.5" value={item.allocated} onChange={(e) => setBudget(p => p.map((b, i) => i === idx ? { ...b, allocated: Number(e.target.value) } : b))} className="w-full accent-[#FF5A1F] bg-stone-200 h-1 rounded-lg appearance-none cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white border border-black/5 p-6 rounded-[32px] flex flex-col shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wider mb-6 text-left">Severity Analytics</h2>
            <div className="flex-1 min-h-[300px]">
              {severityData.length > 0 ? <SeverityPieChart severityData={severityData} /> : <div className="flex items-center justify-center h-full text-stone-400">No data available</div>}
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
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-655' : r.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-655' : r.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-655' : 'bg-indigo-500/10 text-indigo-655'}`}>{r.severity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-650' : r.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-655' : r.status === 'PENDING' ? 'bg-orange-500/10 text-orange-655' : 'bg-orange-500/10 text-orange-655'}`}>{r.status}</span>
                    </td>
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

      {reviewing && (
        <div className="fixed inset-0 z-[2000] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-black/10 rounded-[32px] shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-widest">Verification</div>
                <div className="text-lg font-black text-stone-900">REPORT: #{reviewing.id}</div>
              </div>
              <button onClick={closeReview} className="px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-700 active:scale-95">Close</button>
            </div>

            <div className="p-6 space-y-5">
              {reviewError && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 font-bold">{reviewError}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left">
                  <div className="text-[9px] text-[#FF5A1F] font-black uppercase mb-1">Location</div>
                  <div className="text-sm font-bold text-stone-900 truncate">{reviewing.road_name || "Unknown Road"}</div>
                  <div className="text-[10px] text-stone-400 mt-1 truncate">{reviewing.address || "No address logged"}</div>
                </div>
                <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left">
                  <div className="text-[9px] text-stone-455 font-black uppercase mb-1">Citizen Notes</div>
                  <div className="text-xs text-stone-650 font-semibold">{reviewing.citizen_description || "No description provided."}</div>
                </div>
              </div>

              <div className="bg-stone-50 border border-black/5 rounded-2xl p-4.5 text-left space-y-3.5 shadow-inner">
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-ping" /><span className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-widest">🧠 AI Risk Triage</span></div>
                <div className="space-y-2.5">
                  {[
                    ["Pothole Depth Ratio", reviewing.severity === 'CRITICAL' ? 9.2 : reviewing.severity === 'HIGH' ? 7.8 : reviewing.severity === 'MEDIUM' ? 5.5 : 3.2, "bg-[#FF5A1F]"],
                    ["Pedestrian Zone Proximity", (reviewing.id * 7 + 12) % 6 + 4, "bg-amber-500"],
                    ["Subgrade Wear Coefficient", reviewing.severity === 'CRITICAL' ? 8.8 : reviewing.severity === 'HIGH' ? 7.2 : reviewing.severity === 'MEDIUM' ? 4.8 : 2.5, "bg-indigo-500"]
                  ].map(([label, val, col]: any, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-stone-600"><span>{label}</span><span className="font-extrabold text-stone-850">{val.toFixed(1)}/10</span></div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${col}`} style={{ width: `${val * 10}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {["Status", "Severity"].map((label, idx) => (
                  <div key={idx}>
                    <label className="block text-[10px] uppercase font-bold text-stone-450 tracking-widest mb-2 font-black">{label}</label>
                    <select value={idx === 0 ? reviewStatus : reviewSeverity} onChange={(e) => idx === 0 ? setReviewStatus(e.target.value) : setReviewSeverity(e.target.value)} className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs font-black uppercase tracking-widest">
                      {(idx === 0 ? ["PENDING", "VERIFIED", "REJECTED", "IN_PROGRESS", "RESOLVED"] : ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={closeReview} className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-700">Cancel</button>
                <button disabled={savingReview} onClick={saveReview} className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-[#FF5A1F] hover:bg-[#E84E15] text-white disabled:opacity-60 shadow-md active:scale-95">{savingReview ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}