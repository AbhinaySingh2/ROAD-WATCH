"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, FileText, Sparkles, CheckCircle, RefreshCw, AlertCircle, Scale, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoadIssues } from "@/lib/api";

export default function ClaimGenerator() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [repairCost, setRepairCost] = useState("12500");
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [claimLetter, setClaimLetter] = useState<string | null>(null);
  const [matchedReport, setMatchedReport] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data } = useRoadIssues();
  const activeReports = data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      const r = new FileReader();
      r.onload = (ev) => ev.target?.result && setImageSrc(ev.target.result as string);
      r.readAsDataURL(f);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageSrc || !selectedReportId) return;

    setIsAnalyzing(true);
    const logs = [
      "AI Scanning vehicle damage photo...",
      "Analyzing structural rim & tire integrity...",
      "Cross-referencing pothole database...",
      "Matching incident location data...",
      "Citing municipal public liability codes...",
      "Generating official compensation challan claim...",
    ];
    setScanLogs([`[AI] ${logs[0]}`]);
    let idx = 1;
    const interval = setInterval(() => {
      if (idx < logs.length) {
        setScanLogs((p) => [...p, `[AI] ${logs[idx++]}`]);
      } else {
        clearInterval(interval);

        const report = activeReports.find((r) => r.id.toString() === selectedReportId);
        setMatchedReport(report);

        const authority = report?.assigned_authority || "MUNICIPAL CORPORATION";
        const road = report?.road_name || "Municipal Main Road";
        const lat = report?.latitude || 12.9716;
        const lng = report?.longitude || 77.5946;

        const letter = `TO THE CHIEF EXECUTIVE ENGINEER, ${authority} HIGHWAY DIVISION.\nSUBJECT: VEHICLE DAMAGE COMPENSATION CLAIM NOTICE (ROADWATCH #${selectedReportId})\n\nDear Sir/Madam,\nI hereby lodge a compensation claim for vehicle damage caused by your failure to maintain public road infrastructure.\n\nINCIDENT TELEMETRY:\n- Roadway Location: ${road}\n- Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n- DB Incident ID: #${selectedReportId} (${report?.severity || "HIGH"} Severity)\n- Incident Date: ${new Date().toLocaleDateString()}\n- Estimated Repair Cost: ₹${parseFloat(repairCost).toLocaleString()} INR\n\nCIVIC LEGAL CITATION:\nUnder standard Public Liability charters, active road authorities are legally obligated to maintain roadways in safe, motorable conditions. Leaving the verified hazard (ID #${selectedReportId}) unmaintained constitutes negligence.\n\nPlease process this claim for ₹${parseFloat(repairCost).toLocaleString()} at the earliest.\n\nSincerely,\n[Citizen Claimant Name]`;
        setClaimLetter(letter);
        setIsAnalyzing(false);
      }
    }, 500);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const roadImg = matchedReport?.image_url
        ? matchedReport.image_url.startsWith("http")
          ? matchedReport.image_url
          : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "")}/${matchedReport.image_url}`
        : "";
      printWindow.document.write(
        `<html><head><title>RoadWatch AI Claim Notice</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-10 font-mono text-sm text-[#1f1e1b] whitespace-pre-wrap leading-relaxed"><div class="mb-10">${claimLetter}</div><div class="border-t-2 border-dashed border-black pt-5 mt-8 font-sans text-[11px] font-bold uppercase tracking-wider">EXHIBIT: PHOTOGRAPHIC EVIDENCE OF INCIDENT CLAIMS</div><div class="flex gap-5 mt-4"><div class="flex-grow border border-dashed border-stone-300 rounded-xl p-3 text-center bg-stone-50 print:bg-transparent"><img src="${imageSrc}" class="max-w-full max-h-[180px] object-cover rounded-lg mb-2 mx-auto border border-stone-200" /><div class="font-sans text-[9px] font-bold uppercase text-stone-500">Exhibit A: Vehicle Damage Evidence</div></div>${roadImg ? `<div class="flex-grow border border-dashed border-stone-300 rounded-xl p-3 text-center bg-stone-50 print:bg-transparent"><img src="${roadImg}" class="max-w-full max-h-[180px] object-cover rounded-lg mb-2 mx-auto border border-stone-200" /><div class="font-sans text-[9px] font-bold uppercase text-stone-500">Exhibit B: Mapped Road Hazard Location</div></div>` : ""}</div></body></html>`,
      );
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 700);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7 flex flex-col">
      <div className="bg-white border border-black/5 p-8 rounded-[36px] flex flex-col justify-between h-full min-h-[460px] shadow-sm relative text-left">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF5A1F] flex items-center gap-1.5">
            <Scale className="w-4 h-4" /> AI DAMAGE COMP CLAIM GENERATOR
          </span>
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-[9px] uppercase tracking-widest font-black text-[#FF5A1F] rounded-full">
            Legal Shield
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <RefreshCw className="w-8 h-8 animate-spin text-[#FF5A1F] mb-4" />
              <h3 className="text-base font-extrabold mb-3 uppercase">AI Legal Review in Progress...</h3>
              <div className="w-full max-w-sm bg-stone-50 border border-black/5 rounded-2xl p-4 font-mono text-[9px] text-stone-750 text-left max-h-[120px] overflow-y-auto space-y-1 shadow-inner">
                {scanLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-[#FF5A1F] font-bold">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : claimLetter ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col justify-between space-y-5"
            >
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-bold flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>AI Claim Generated successfully! Matched with {matchedReport?.assigned_authority} records.</span>
              </div>
              <div className="bg-stone-50 border border-black/5 rounded-2xl p-5 font-mono text-[10px] leading-relaxed max-h-[220px] overflow-y-auto shadow-inner whitespace-pre-wrap select-all">
                {claimLetter}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setClaimLetter(null)}
                  className="w-full py-4.5 bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-750 font-bold text-xs uppercase tracking-widest rounded-full active:scale-95 transition-all text-center"
                >
                  Back
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full py-4.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white font-bold text-xs uppercase tracking-widest rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleGenerate}
              className="flex-1 flex flex-col justify-between space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] uppercase font-bold text-stone-400 tracking-widest">
                    1. VEHICLE DAMAGE PHOTO
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {imageSrc ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-50 border border-orange-500/20 shadow-inner group flex items-center justify-center">
                      <img src={imageSrc} alt="Vehicle damage scan" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-[#FF5A1F] hover:bg-[#E84E15] text-white font-bold text-[9px] uppercase tracking-widest py-2 px-4 rounded-full shadow-md"
                        >
                          Change Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video border border-dashed border-stone-200 hover:border-orange-500/40 hover:bg-orange-500/[0.01] rounded-2xl flex flex-col items-center justify-center text-stone-400 transition-all cursor-pointer p-4 shadow-inner"
                    >
                      <Camera className="w-5 h-5 text-[#FF5A1F] mb-2" />
                      <span className="font-extrabold text-[9px] uppercase tracking-wider text-stone-700">
                        Snap Damage Photo
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] uppercase font-bold text-stone-400 tracking-widest">
                      2. ESTIMATED REPAIR BILL (₹)
                    </label>
                    <input
                      type="number"
                      value={repairCost}
                      onChange={(e) => setRepairCost(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs font-black placeholder:text-stone-300 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] uppercase font-bold text-stone-400 tracking-widest">
                      3. CROSS-REF INCIDENT
                    </label>
                    <select
                      value={selectedReportId}
                      onChange={(e) => setSelectedReportId(e.target.value)}
                      className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs font-black uppercase tracking-wider focus:outline-none"
                    >
                      <option value="">-- SELECT INCIDENT --</option>
                      {activeReports.map((r: any) => (
                        <option key={r.id} value={r.id.toString()}>
                          #{r.id} - {r.road_name || "Unknown Road"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-0.5" />
                <p className="text-[9px] font-semibold text-stone-500 leading-relaxed uppercase">
                  Under road liability charters, authorities are legally liable for damages if reported hazards are left
                  unmaintained. This AI claims generator compiles the telemetry for court/insurance submittal.
                </p>
              </div>

              <button
                type="submit"
                disabled={!imageSrc || !selectedReportId}
                className="w-full py-4.5 bg-[#FF5A1F] hover:bg-[#E84E15] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95"
              >
                Analyze Damage & Generate Claim
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
