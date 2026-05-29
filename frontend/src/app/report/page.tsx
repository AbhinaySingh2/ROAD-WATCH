"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, MapPin, UploadCloud, CheckCircle, AlertCircle, Loader2, Award, ArrowLeft, RefreshCw, Cpu, ShieldAlert, Heart, Monitor, Map, Trophy, Terminal } from "lucide-react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";

export default function ReportPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [impactScore, setImpactScore] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Scanning Console logs
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Sync scrolling of scanning console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scanLogs]);

  // Feed simulated diagnostic logs while uploading/submitting
  useEffect(() => {
    if (!isSubmitting) {
      setScanLogs([]);
      return;
    }
    const logs = [
      "Connecting to Gemini 2.5 Vision Engine...",
      "Analyzing image textures and surface contour wear...",
      "Measuring hazard diameter and estimating depth ratios...",
      "Running false-positive civic detection filters...",
      "Calculating community safety impact points (+150 pts)...",
      "Synchronizing verified report with municipal database..."
    ];
    
    setScanLogs([`[AI] ${logs[0]}`]);
    let idx = 1;
    const interval = setInterval(() => {
      if (idx < logs.length) {
        setScanLogs(prev => [...prev, `[AI] ${logs[idx]}`]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 450); // step logs rapidly for snappy response
    
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(selectedFile.type)) {
        setSubmitError("Only JPEG, PNG, or WebP images are allowed.");
        return;
      }
      if (selectedFile.size > 8 * 1024 * 1024) {
        setSubmitError("Image size exceeds maximum size limit (Max 8 MB).");
        return;
      }
      setSubmitError("");
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error(error);
          setLocationError("Location acquisition failed. Please enable GPS permissions.");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError("GPS coordinates not supported by this browser.");
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !location) return;

    setIsSubmitting(true);
    setSubmitError("");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("latitude", location.lat.toString());
    formData.append("longitude", location.lng.toString());
    formData.append("description", description);

    // Enforce a minimum display time of 2.6s for scanning animation (elite UX)
    const minAnimationDelay = new Promise(resolve => setTimeout(resolve, 2600));

    try {
      const apiCall = apiFetch<any>("/api/v1/issues/submit", {
        method: "POST",
        body: formData,
        timeoutMs: 30000,
      });

      // Wait for BOTH the API response and the scanning animation delay
      const [data] = await Promise.all([apiCall, minAnimationDelay]);

      setReportId(data.id);
      setImpactScore(data.impact_score);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Failed to submit report. Please check your internet connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-100/30 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-100/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative z-10 w-full max-w-lg bg-white border border-black/5 p-8 rounded-[36px] shadow-[0_10px_40px_rgba(0,0,0,0.015)] flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 150 }}
            className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-500/10"
          >
            <CheckCircle className="w-10 h-10" />
          </motion.div>
          
          <h1 className="text-3xl font-black mb-2 text-center tracking-tight text-stone-900 uppercase">Report Logged!</h1>
          <p className="text-sm text-stone-500 text-center max-w-sm mb-8 leading-relaxed font-semibold">
            Our Gemini AI has successfully analyzed the photo, estimated the safety risk level, and mapped the hazard.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            {/* Report ID */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-center flex flex-col justify-center min-h-[92px] shadow-sm shadow-black/[0.01]"
            >
              <p className="text-[10px] text-stone-400 mb-1.5 font-bold uppercase tracking-widest">Report ID</p>
              <p className="text-lg font-mono text-stone-800 font-extrabold">#{reportId}</p>
            </motion.div>

            {/* Current Status */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              className="bg-orange-50/40 border border-orange-200/50 rounded-2xl p-4 text-center flex flex-col justify-center min-h-[92px] shadow-sm shadow-orange-500/[0.01]"
            >
              <p className="text-[10px] text-[#FF5A1F]/80 mb-1.5 font-bold uppercase tracking-widest">Current Status</p>
              <div className="inline-block mx-auto px-2.5 py-0.5 bg-orange-50 border border-orange-200/80 text-[#FF5A1F] text-[9px] font-black tracking-widest rounded-full uppercase">
                PENDING
              </div>
            </motion.div>

            {/* Coordinates */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-center flex flex-col justify-center min-h-[92px] shadow-sm shadow-black/[0.01]"
            >
              <p className="text-[10px] text-stone-400 mb-1.5 font-bold uppercase tracking-widest">Coordinates</p>
              <p className="text-[10px] font-mono text-stone-700 font-bold leading-tight">
                {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "N/A"}
              </p>
            </motion.div>

            {/* Impact Points */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center relative overflow-hidden group flex flex-col justify-center min-h-[92px] shadow-sm shadow-orange-500/[0.01]"
            >
              <div className="absolute -top-2 -right-2 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Award className="w-10 h-10 text-[#FF5A1F]" />
              </div>
              <p className="text-[10px] text-[#FF5A1F] mb-1.5 font-bold uppercase tracking-widest">Impact Points</p>
              <p className="text-xl font-black text-[#FF5A1F]">
                +{impactScore}
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 w-full"
          >
            <Link href="/track" className="w-full px-6 py-4 bg-stone-100 hover:bg-stone-200 border border-black/5 rounded-full text-center text-xs font-bold uppercase tracking-widest transition-all text-stone-700">
              View Safety Map
            </Link>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-6 py-4 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full text-center text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer"
            >
              Report Another
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative overflow-hidden pb-12 font-sans">
      <style jsx>{`
        @keyframes scan-up-down {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanning-line {
          animation: scan-up-down 3s ease-in-out infinite;
        }
      `}</style>

      {/* Background Lighting Blooms */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100/25 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-100/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Centered Floating Pill Navigation Header */}
      <div className="w-full flex justify-center py-6 px-4 z-50 sticky top-0 pointer-events-none">
        <header className="w-full max-w-4xl bg-white/70 border border-black/5 backdrop-blur-xl rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] pointer-events-auto">
          <div className="flex items-center space-x-3">
            <Link href="/" className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Heart className="w-4 h-4 fill-white" />
            </Link>
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
            <Link href="/" className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95">
              Back to Home
            </Link>
          </div>
        </header>
      </div>
      
      <main className="max-w-xl mx-auto p-6 w-full flex-1 flex flex-col justify-center z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-black/5 p-8 rounded-[36px] shadow-[0_10px_40px_rgba(0,0,0,0.015)] relative overflow-hidden"
        >
          {/* Visual AI Scanning & Analysis Overlay */}
          <AnimatePresence>
            {isSubmitting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="flex items-center gap-2 mb-2 text-[#FF5A1F]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-widest">Gemini AI Image Triage</span>
                </div>
                
                <h3 className="text-xl font-extrabold text-stone-900 mb-2">Analyzing Hazard Photo...</h3>
                <p className="text-stone-400 text-[11px] font-bold uppercase tracking-wide max-w-sm mb-6">Measuring road wear contours and depth indices in real time.</p>

                {/* Pulsing Photo Frame with Sweeping Scanning Line */}
                {imageSrc && (
                  <div className="relative w-56 aspect-video bg-stone-50 border border-orange-500/20 rounded-2xl overflow-hidden shadow-inner mb-6 flex items-center justify-center">
                    <img src={imageSrc} alt="Pothole Scanning Analysis" className="w-full h-full object-cover opacity-80" />
                    
                    {/* Glowing orange scanning bar sweeps vertically */}
                    <div className="absolute left-0 right-0 h-1 bg-[#FF5A1F] shadow-[0_0_12px_rgba(255,90,31,0.9)] opacity-90 scanning-line" />
                  </div>
                )}

                {/* Real-time Monospace Processing Logs console */}
                <div className="w-full max-w-xs bg-stone-50 border border-black/5 rounded-2xl p-4 font-mono text-[9px] text-stone-750 text-left max-h-[110px] overflow-y-auto space-y-1.5 shadow-inner">
                  {scanLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="text-[#FF5A1F] select-none">&gt;</span>
                      <span className="break-all">{log}</span>
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>

                {/* Pulsing clean loading dots */}
                <div className="flex items-center gap-1 mt-6">
                  <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-ping" />
                  <span className="text-[10px] text-stone-400 font-extrabold uppercase tracking-widest">Engaging Neural Network</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Header */}
          <div className="mb-8 text-center sm:text-left border-b border-black/5 pb-5">
            <h1 className="text-2xl font-black uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-2.5">
              File a New Report
            </h1>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Upload a hazard image snapshot and register GPS coordinates.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-600 font-bold flex gap-2 items-center">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            
            {/* Image Upload/Capture Section */}
            <div className="space-y-2 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest">UPLOAD HAZARD PHOTO</label>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleCapture}
                className="hidden"
                ref={fileInputRef}
              />
              {imageSrc ? (
                <div className="relative rounded-2xl overflow-hidden bg-stone-50 border border-orange-500/20 aspect-video flex items-center justify-center shadow-inner group">
                  <img src={imageSrc} alt="Pothole Damage Scan" className="w-full h-full object-cover" />
                  
                  {/* Subtle orange bounce line (AI scanning effect) */}
                  <div className="absolute inset-x-0 h-0.5 bg-[#FF5A1F] shadow-[0_0_10px_rgba(255,90,31,0.6)] opacity-70 animate-bounce" style={{ animationDuration: '3s' }} />
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#FF5A1F] hover:bg-[#E84E15] text-white font-bold text-xs uppercase tracking-widest py-2.5 px-6 rounded-full transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      Reselect Photo
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video border border-dashed border-stone-200 hover:border-orange-500/40 hover:bg-orange-500/[0.01] rounded-2xl flex flex-col items-center justify-center text-stone-400 transition-all cursor-pointer group p-6 shadow-inner relative"
                >
                  <div className="w-14 h-14 bg-stone-50 border border-black/5 rounded-2xl flex items-center justify-center mb-4 text-stone-400 group-hover:text-[#FF5A1F] group-hover:border-orange-500/25 group-hover:scale-105 transition-all">
                    <Camera className="w-5 h-5 text-[#FF5A1F]" />
                  </div>
                  <span className="font-extrabold text-xs uppercase tracking-wider text-stone-700">UPLOAD PHOTO / TAKE PICTURE</span>
                  <span className="text-[10px] text-stone-400 mt-1.5 font-bold uppercase tracking-wider">Supports camera uploads or file selection</span>
                </button>
              )}
            </div>

            {/* GPS Location Telemetry Readout */}
            <div className="space-y-2 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest">LOCATION DETAILS</label>
              <div className="p-4 bg-stone-50 border border-black/5 rounded-2xl flex items-center justify-between shadow-inner">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    location 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-sm shadow-emerald-500/5' 
                      : 'bg-stone-100 border-black/5 text-stone-400'
                  }`}>
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-stone-900">Location Coordinates</p>
                    <p className="text-[11px] text-stone-400 mt-1 font-mono">
                      {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : "ACQUIRING GPS DETAILS..."}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="px-4 py-2.5 bg-white hover:bg-stone-50 border border-black/5 text-stone-700 rounded-full text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  {locationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF5A1F]" /> : null}
                  {location ? "Refresh GPS" : "Acquire GPS"}
                </button>
              </div>
            </div>

            {/* Description details */}
            <div className="space-y-2 text-left">
              <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-widest">Additional Details (Optional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention any local landmarks, traffic levels, or additional hazard details..."
                className="w-full bg-stone-50 border border-black/5 rounded-2xl p-4 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all min-h-[100px] resize-none font-medium"
              />
            </div>

            {/* Submit button */}
            <button 
              type="submit" 
              disabled={!file || !location || isSubmitting}
              className="w-full py-4.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-md shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer border border-white/10"
            >
              <UploadCloud className="w-4 h-4" /> 
              <span>SUBMIT REPORT</span>
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}