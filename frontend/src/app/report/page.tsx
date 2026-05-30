"use client";
import { useState, useRef, useEffect } from "react";
import { Camera, MapPin, CheckCircle, RefreshCw, Cpu } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";

export default function ReportPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [impactScore, setImpactScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSubmitting) return setScanLogs([]);
    const logs = ["Connecting to Gemini...", "Analyzing surface...", "Measuring depth...", "Running filters...", "Triage complete!", "Logging to DB..."];
    setScanLogs([`[AI] ${logs[0]}`]);
    let idx = 1;
    const interval = setInterval(() => {
      if (idx < logs.length) setScanLogs(p => [...p, `[AI] ${logs[idx++]}`]);
      else clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setSubmitError("Use JPEG/PNG/WebP.");
      if (f.size > 8 * 1024 * 1024) return setSubmitError("Image exceeds 8 MB.");
      setSubmitError(""); setFile(f);
      const r = new FileReader(); r.onload = (ev) => ev.target?.result && setImageSrc(ev.target.result as string);
      r.readAsDataURL(f);
    }
  };

  const getLocation = () => {
    setLocationLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocationLoading(false); },
        () => { setSubmitError("Enable GPS."); setLocationLoading(false); },
        { enableHighAccuracy: true }
      );
    } else { setSubmitError("GPS not supported."); setLocationLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!file || !location) return;
    setIsSubmitting(true); setSubmitError("");
    const fd = new FormData(); fd.append("image", file);
    fd.append("latitude", location.lat.toString()); fd.append("longitude", location.lng.toString());
    fd.append("description", description);
    try {
      const [data] = await Promise.all([apiFetch<any>("/api/v1/issues/submit", { method: "POST", body: fd }), new Promise(r => setTimeout(r, 2500))]);
      setReportId(data.id); setImpactScore(data.impact_score); setSuccess(true);
    } catch (err: any) { setSubmitError(err.message || "Submit failed."); }
    finally { setIsSubmitting(false); }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex items-center justify-center p-6 relative font-sans">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 w-full max-w-lg bg-white border border-black/5 p-8 rounded-[36px] shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-10 h-10" /></div>
          <h1 className="text-3xl font-black mb-2 uppercase">Report Logged!</h1>
          <p className="text-sm text-stone-500 text-center max-w-sm mb-8 font-semibold">Gemini AI triaged the photo and mapped the coordinates.</p>
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            {[
              ["Report ID", `#${reportId}`, "text-lg font-mono font-extrabold text-stone-850", ""],
              ["Status", "PENDING", "", "", true],
              ["Coordinates", location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "N/A", "text-[10px] font-mono text-stone-700", ""],
              ["Impact Points", `+${impactScore}`, "text-xl font-black text-[#FF5A1F]", "bg-orange-500/5 border-orange-500/20"]
            ].map(([lbl, val, cls, col, badge]: any, idx) => (
              <div key={idx} className={`border rounded-2xl p-4 text-center flex flex-col justify-center min-h-[92px] shadow-sm ${col || 'bg-stone-50 border-black/5'}`}>
                <p className="text-[10px] text-stone-400 mb-1.5 font-bold uppercase tracking-widest">{lbl}</p>
                {badge ? <div className="inline-block mx-auto px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-[#FF5A1F] text-[9px] font-black tracking-widest rounded-full">PENDING</div> : <p className={cls}>{val}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-4 w-full">
            <Link href="/track" className="w-full px-6 py-4 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-center text-xs font-bold uppercase tracking-widest text-stone-750">Map</Link>
            <button onClick={() => window.location.reload()} className="w-full px-6 py-4 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full text-center text-xs font-bold uppercase tracking-widest shadow-md">Another</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative pb-12 font-sans">
      <Header backToHome={true} />
      <main className="max-w-xl mx-auto p-6 w-full flex-1 flex flex-col justify-center z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-black/5 p-8 rounded-[36px] shadow-sm relative overflow-hidden">
          <AnimatePresence>
            {isSubmitting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                <div className="flex items-center gap-2 mb-2 text-[#FF5A1F]"><RefreshCw className="w-4 h-4 animate-spin" /><span className="text-xs font-black uppercase tracking-widest">Gemini AI Image Triage</span></div>
                <h3 className="text-xl font-extrabold mb-2">Analyzing Hazard Photo...</h3>
                {imageSrc && (
                  <div className="relative w-56 aspect-video bg-stone-50 border border-orange-500/20 rounded-2xl overflow-hidden shadow-inner mb-6 mx-auto">
                    <img src={imageSrc} alt="Pothole Scanning" className="w-full h-full object-cover opacity-80" />
                    <div className="absolute left-0 right-0 h-1 bg-[#FF5A1F] scanning-line" />
                  </div>
                )}
                <div className="w-full max-w-xs bg-stone-50 border border-black/5 rounded-2xl p-4 font-mono text-[9px] text-stone-750 text-left max-h-[110px] overflow-y-auto space-y-1.5 shadow-inner mx-auto">
                  {scanLogs.map((log, idx) => (<div key={idx} className="flex items-start gap-1"><span className="text-[#FF5A1F]">&gt;</span><span>{log}</span></div>))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-8 border-b border-black/5 pb-5 text-left">
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1">File a New Report</h1>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Upload a hazard image snapshot and register GPS coordinates.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 font-bold flex gap-2 items-center"><Cpu className="w-4 h-4" /><span>{submitError}</span></div>}
            
            <div className="space-y-2 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest">UPLOAD HAZARD PHOTO</label>
              <input type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" ref={fileInputRef} />
              {imageSrc ? (
                <div className="relative rounded-2xl overflow-hidden bg-stone-50 border border-orange-500/20 aspect-video flex items-center justify-center shadow-inner group">
                  <img src={imageSrc} alt="Pothole Damage Scan" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 h-0.5 bg-[#FF5A1F] animate-bounce" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-[#FF5A1F] hover:bg-[#E84E15] text-white font-bold text-xs uppercase tracking-widest py-2.5 px-6 rounded-full cursor-pointer shadow-md">Reselect Photo</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border border-dashed border-stone-200 hover:border-orange-500/40 hover:bg-orange-500/[0.01] rounded-2xl flex flex-col items-center justify-center text-stone-400 transition-all cursor-pointer group p-6 shadow-inner relative" >
                  <div className="w-14 h-14 bg-stone-50 border border-black/5 rounded-2xl flex items-center justify-center mb-4"><Camera className="w-5 h-5 text-[#FF5A1F]" /></div>
                  <span className="font-extrabold text-xs uppercase tracking-wider text-stone-700">UPLOAD PHOTO / TAKE PICTURE</span>
                </button>
              )}
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest">LOCATION DETAILS</label>
              <div className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex items-center justify-between shadow-inner">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${location ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-stone-100 border-black/5'}`}><MapPin className="w-5 h-5" /></div>
                  <div className="ml-3">
                    <p className="text-xs font-extrabold uppercase">Coordinates</p>
                    <p className="text-[11px] text-stone-400 mt-1 font-mono">{location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "ACQUIRING GPS..."}</p>
                  </div>
                </div>
                <button type="button" onClick={getLocation} disabled={locationLoading} className="px-4 py-2.5 bg-white border border-black/5 text-stone-750 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm">
                  {locationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF5A1F]" /> : null}
                  {location ? "Refresh GPS" : "Acquire GPS"}
                </button>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-455 tracking-widest">Details (Optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mention landmarks, traffic, or other hazard details..." className="w-full bg-stone-50 border border-black/5 rounded-2xl p-4 text-sm text-stone-850 placeholder:text-stone-400 focus:outline-none transition-all min-h-[100px] resize-none" />
            </div>

            <button type="submit" disabled={!file || !location || isSubmitting} className="w-full py-4.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer">SUBMIT REPORT</button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}