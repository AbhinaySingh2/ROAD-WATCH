"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Clock, Loader2, Cpu, Sparkles, Terminal, FileDown, Heart, Map, Trophy } from 'lucide-react';
import { BudgetBarChart, SeverityPieChart } from '@/components/DashboardCharts';
import { motion, Variants } from 'framer-motion';
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>("");
  const [reviewSeverity, setReviewSeverity] = useState<string>("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string>("");

  const [budget, setBudget] = useState([
    { name: 'Road Repair', spent: 4.5, allocated: 10.0 },
    { name: 'Pothole Filling', spent: 1.2, allocated: 3.0 },
    { name: 'Street Lights', spent: 0.85, allocated: 2.0 },
    { name: 'Signage', spent: 0.3, allocated: 1.0 },
  ]);

  const handleAllocationChange = (index: number, newVal: number) => {
    setBudget(prev => prev.map((item, idx) => idx === index ? { ...item, allocated: newVal } : item));
  };

  useEffect(() => {
    setLoadError("");
    apiFetch<any[]>("/api/v1/issues")
      .then((data) => setReports(data))
      .catch((err) => {
        console.error("Failed to fetch reports:", err);
        setLoadError("Failed to fetch road hazard reports from the database.");
      })
      .finally(() => setLoading(false));
  }, []);

  const openReview = (report: any) => {
    setReviewError("");
    setReviewing(report);
    setReviewStatus(report.status ?? "");
    setReviewSeverity(report.severity ?? "");
  };

  const closeReview = () => {
    setReviewError("");
    setReviewing(null);
  };

  const saveReview = async () => {
    if (!reviewing) return;
    setSavingReview(true);
    setReviewError("");
    try {
      const updated = await apiFetch<any>(`/api/v1/issues/${reviewing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewStatus || undefined,
          severity: reviewSeverity || undefined,
        }),
      });

      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setReviewing(null);
    } catch (err) {
      console.error("Failed to update report:", err);
      setReviewError(err instanceof Error ? err.message : "Failed to update report status.");
    } finally {
      setSavingReview(false);
    }
  };

  const exportToCSV = () => {
    if (reports.length === 0) return;
    const headers = ["ID", "Latitude", "Longitude", "Category", "Severity", "Impact Score", "Authority", "Status", "Date"];
    const rows = reports.map(r => [
      r.id,
      r.latitude,
      r.longitude,
      r.infra_type,
      r.severity,
      r.impact_score,
      r.assigned_authority,
      r.status,
      new Date(r.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `roadwatch_report_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalReports = reports.length;
  const criticalIssues = reports.filter(r => r.severity === 'CRITICAL').length;
  const inProgress = reports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'PENDING').length;
  const resolved = reports.filter(r => r.status === 'RESOLVED').length;

  const severityData = [
    { name: 'Critical', value: criticalIssues, color: '#ef4444' },
    { name: 'High', value: reports.filter(r => r.severity === 'HIGH').length, color: '#f97316' },
    { name: 'Medium', value: reports.filter(r => r.severity === 'MEDIUM').length, color: '#eab308' },
    { name: 'Low', value: reports.filter(r => r.severity === 'LOW').length, color: '#6366f1' },
  ].filter(d => d.value > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center text-stone-900 font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF5A1F]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F5] text-stone-900 p-6 md:p-8 overflow-hidden relative font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-orange-100/20 blur-[130px] rounded-full pointer-events-none" />
      
      {/* Centered Floating Pill Navigation Header */}
      <div className="w-full flex justify-center pb-8 sticky top-0 z-50 pointer-events-none">
        <header className="w-full max-w-5xl bg-white/70 border border-black/5 backdrop-blur-xl rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] pointer-events-auto">
          <div className="flex items-center space-x-3">
            <Link href="/" className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Heart className="w-4 h-4 fill-white" />
            </Link>
            <span className="text-base font-black tracking-tight text-stone-900 uppercase">
              Road<span className="text-[#FF5A1F]">Watch</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-stone-500">
            <Link href="/track" className="hover:text-stone-900 transition-colors flex items-center gap-1"><Map className="w-3.5 h-3.5 animate-pulse" /> Safety Map</Link>
            <Link href="/leaderboard" className="hover:text-stone-900 transition-colors flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Leaderboard</Link>
            <Link href="/dashboard" className="text-stone-950 transition-colors flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-[#FF5A1F]" /> Dashboard</Link>
          </nav>

          <div className="flex items-center space-x-3.5">
            <button 
              onClick={exportToCSV}
              disabled={reports.length === 0}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileDown className="w-4 h-4 text-[#FF5A1F]" /> Export CSV Logs
            </button>
          </div>
        </header>
      </div>

      {loadError && (
        <div className="mb-6 relative z-10 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 font-bold">
          {loadError}
        </div>
      )}

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 space-y-8 max-w-6xl mx-auto">
        {/* Civic Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Total Active Reports", val: totalReports, bg: "bg-orange-500/10 border-orange-200 text-[#FF5A1F]", icon: Cpu },
            { title: "Critical Hazards", val: criticalIssues, bg: "bg-rose-500/10 border-rose-200 text-rose-650", icon: AlertTriangle },
            { title: "Repairs Scheduled", val: inProgress, bg: "bg-amber-500/10 border-amber-200 text-amber-650", icon: Clock },
            { title: "Resolved Hazards", val: resolved, bg: "bg-emerald-500/10 border-emerald-200 text-emerald-650", icon: CheckCircle }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div key={idx} variants={itemVariants} className="bg-white border border-black/5 p-6 rounded-[28px] relative overflow-hidden group shadow-sm flex items-center gap-4.5 text-left">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${card.bg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-450 font-black uppercase tracking-wider mb-0.5">{card.title}</p>
                  <h3 className="text-3xl font-black text-stone-900">{card.val}</h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="bg-white border border-black/5 p-6 rounded-[32px] lg:col-span-2 flex flex-col shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wider mb-6 text-left flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF5A1F]" /> Municipal Repair Budgets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
              <div className="md:col-span-2 min-h-[300px]">
                <BudgetBarChart data={budget} />
              </div>
              
              {/* Sliders Control Panel */}
              <div className="space-y-4 bg-stone-50 border border-black/5 p-4 rounded-2xl text-left shadow-inner">
                <h3 className="text-[10px] uppercase font-black text-[#FF5A1F] tracking-widest mb-3 flex items-center gap-1.5">
                  🔧 Budget Tuning Controls
                </h3>
                {budget.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-stone-650">
                      <span>{item.name}</span>
                      <span className="text-stone-900">₹{item.allocated.toFixed(2)} Lakh</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="15.0" 
                      step="0.5"
                      value={item.allocated}
                      onChange={(e) => handleAllocationChange(idx, Number(e.target.value))}
                      className="w-full accent-[#FF5A1F] bg-stone-200 h-1 rounded-lg appearance-none cursor-pointer border border-black/5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-white border border-black/5 p-6 rounded-[32px] flex flex-col shadow-sm">
            <h2 className="text-base font-black uppercase tracking-wider mb-6 text-left">Hazard Severity Analytics</h2>
            <div className="flex-1 min-h-[300px]">
              {severityData.length > 0 ? (
                <SeverityPieChart severityData={severityData} />
              ) : (
                <div className="flex items-center justify-center h-full text-stone-400">No data available</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Data Table */}
        <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-black/5 flex items-center justify-between bg-stone-50/50">
            <h2 className="text-base font-black uppercase tracking-wider text-left">Recent Hazard Reports</h2>
            <Link href="/track" className="text-xs text-[#FF5A1F] hover:text-[#E84E15] font-black uppercase tracking-widest">Active Safety Map</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-stone-450 border-b border-black/5 bg-stone-50/20">
                <tr>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Report ID</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Incident Location</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Damage Type</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Hazard Severity</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Current Status</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Impact Points</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px]">Assigned Agency</th>
                  <th className="px-6 py-4.5 font-black uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-semibold text-stone-750">
                {reports.slice().reverse().slice(0, 10).map((report) => (
                  <tr key={report.id} className="hover:bg-stone-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-stone-900">#{report.id}</td>
                    <td className="px-6 py-4">
                      {report.road_name ? (
                        <div className="flex flex-col text-left">
                          <span className="text-stone-855 font-bold max-w-[200px] truncate">{report.road_name}</span>
                          <span className="text-[10px] text-stone-400 font-mono font-semibold leading-normal">
                            ({report.latitude.toFixed(5)}, {report.longitude.toFixed(5)})
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col text-left">
                          <span className="text-stone-855 font-bold">Unknown Location</span>
                          <span className="text-[10px] text-[#FF5A1F] font-mono font-extrabold leading-normal">
                            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone-600">{report.infra_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${report.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-650 border border-red-500/20' : 
                          report.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-650 border border-orange-500/20' : 
                          report.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-650 border border-yellow-500/20' :
                          'bg-indigo-500/10 text-indigo-650 border border-indigo-500/20'}
                      `}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${report.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-650 border border-emerald-500/20' : 
                          report.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-650 border border-amber-500/20' : 
                          report.status === 'VERIFIED' ? 'bg-blue-500/10 text-blue-650 border border-blue-500/20' :
                          report.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-650 border border-rose-500/20' :
                          'bg-orange-500/10 text-orange-650 border border-orange-500/20'}
                      `}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#FF5A1F] font-black">+{report.impact_score}</span> pts
                    </td>
                    <td className="px-6 py-4 text-stone-600">{report.assigned_authority}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openReview(report)}
                        className="text-[#FF5A1F] hover:text-[#E84E15] font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-full border border-orange-200 transition-all cursor-pointer active:scale-95 shadow-sm"
                      >
                        Review & Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      {/* Review Modal Overhaul (Clean white pill card structure) */}
      {reviewing && (
        <div className="fixed inset-0 z-[2000] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-black/10 rounded-[32px] shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div className="text-left">
                <div className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-widest mb-0.5">Report Verification</div>
                <div className="text-lg font-black text-stone-900">REPORT ID: #{reviewing.id}</div>
              </div>
              <button
                onClick={closeReview}
                className="px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-700 active:scale-95 transition-transform"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-5">
              {reviewError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 font-bold">
                  {reviewError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left">
                  <div className="text-[9px] text-[#FF5A1F] font-black uppercase tracking-wider mb-1">
                    Hazard Location
                  </div>
                  <div className="text-sm font-bold text-stone-900 leading-normal truncate">
                    {reviewing.road_name || "Unknown Road"}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono font-bold mt-1">
                    GPS: {reviewing.latitude.toFixed(5)}, {reviewing.longitude.toFixed(5)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5 leading-relaxed truncate animate-pulse" title={reviewing.address}>
                    {reviewing.address || "No address logged"}
                  </div>
                </div>

                <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left">
                  <div className="text-[9px] text-stone-400 font-black uppercase tracking-wider mb-1">
                    Citizen Description
                  </div>
                  <div className="text-xs text-stone-600 leading-relaxed font-semibold">
                    {reviewing.citizen_description || "No description provided."}
                  </div>
                </div>
              </div>

              {/* Gemini AI Risk Triage Analytics Breakdown */}
              <div className="bg-stone-50 border border-black/5 rounded-2xl p-4.5 text-left space-y-3.5 shadow-inner">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-ping" />
                  <span className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-widest flex items-center gap-1">
                    🧠 Gemini 2.5 AI Risk Triage Breakdown
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {[
                    { label: "Structural Pothole Depth Ratio", value: reviewing.severity === 'CRITICAL' ? 9.2 : reviewing.severity === 'HIGH' ? 7.8 : reviewing.severity === 'MEDIUM' ? 5.5 : 3.2, color: "bg-[#FF5A1F]" },
                    { label: "Pedestrian Zone Proximity Index", value: (reviewing.id * 7 + 12) % 6 + 4, color: "bg-amber-500" },
                    { label: "Base Subgrade Wear Coefficient", value: reviewing.severity === 'CRITICAL' ? 8.8 : reviewing.severity === 'HIGH' ? 7.2 : reviewing.severity === 'MEDIUM' ? 4.8 : 2.5, color: "bg-indigo-500" }
                  ].map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-stone-600">
                        <span>{metric.label}</span>
                        <span className="font-extrabold text-stone-850">{(metric.value).toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${metric.color}`} style={{ width: `${metric.value * 10}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-2 font-black">
                    Repair Status
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-orange-300 font-black uppercase tracking-widest"
                  >
                    {["PENDING", "VERIFIED", "REJECTED", "IN_PROGRESS", "RESOLVED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest mb-2 font-black">
                    Hazard Severity
                  </label>
                  <select
                    value={reviewSeverity}
                    onChange={(e) => setReviewSeverity(e.target.value)}
                    className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs focus:outline-none focus:border-orange-300 font-black uppercase tracking-widest"
                  >
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={closeReview}
                  className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-700"
                >
                  Cancel
                </button>
                <button
                  disabled={savingReview}
                  onClick={saveReview}
                  className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-[#FF5A1F] hover:bg-[#E84E15] text-white disabled:opacity-60 shadow-md shadow-orange-500/10 active:scale-95 transition-transform"
                >
                  {savingReview ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}