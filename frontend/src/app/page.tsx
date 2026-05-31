"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Map, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useRoadIssues } from "@/lib/api";
import { Header } from "@/components/Navigation";
import RadarScanner from "@/components/RadarScanner";
import ClaimGenerator from "@/components/ClaimGenerator";

export default function Home() {
  const [healthIndex, setHealthIndex] = useState<number | null>(null);
  const [activeReports, setActiveReports] = useState(0);

  const { data } = useRoadIssues();

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) {
      setHealthIndex(data ? 100 : 84);
      setActiveReports(data ? 0 : 14);
      return;
    }
    setActiveReports(data.length);
    const crit = data.filter((r: any) => r.severity === "CRITICAL" && r.status !== "RESOLVED").length,
      high = data.filter((r: any) => r.severity === "HIGH" && r.status !== "RESOLVED").length;
    setHealthIndex(Math.max(10, 100 - (crit * 12 + high * 4)));
  }, [data]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-orange-200/20 blur-[130px] rounded-full pointer-events-none" />
      <Header showCrtToggle={false} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-16 sm:pt-28 pb-12 flex flex-col justify-center z-10 space-y-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto flex flex-col items-center"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-black/5 text-stone-600 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
            <span className="relative flex w-1.5 h-1.5 mr-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A1F] opacity-75"></span>
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#FF5A1F]"></span>
            </span>
            AI CIVIC NETWORK
          </div>
          <h1 className="text-5xl sm:text-7xl font-light tracking-tight mb-6 leading-[1.05]">
            Making Streets <br />
            <span className="text-[#FF5A1F] font-extrabold">Safer, Together.</span>
          </h1>
          <p className="text-stone-500 text-sm sm:text-base max-w-2xl leading-relaxed font-semibold">
            Report road hazards instantly. Our Gemini AI automatically measures physical damage depth, tags geographic
            coordinates, and maps civic priority levels to expedite municipal repairs.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 justify-center">
            <Link
              href="/report"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#FF5A1F] hover:bg-[#E84E15] text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center transition-all shadow-lg active:scale-95"
            >
              <Camera className="mr-2 w-4 h-4 fill-white" /> Report Hazard <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/track"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-stone-50 border border-black/5 text-stone-750 rounded-full font-bold text-xs uppercase tracking-widest flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <Map className="mr-2 w-4 h-4 text-[#FF5A1F]" /> View Safety Map
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
          <RadarScanner />
          <ClaimGenerator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            [
              Camera,
              "1. Upload An Incident",
              "Snap a photo of the road damage in your community. Gemini AI automatically measures physical damage depth, severity, and GPS coordinates within seconds.",
            ],
            [
              Sparkles,
              "2. Verify Hazards",
              "Review and upvote reports submitted by others in your neighborhood. Level up your ranking and unlock special road guardian achievement badges.",
            ],
            [
              ShieldCheck,
              "3. Smart Allocation",
              "Verified hazards and civic points sync onto municipal ledgers instantly, allowing local agencies to direct budget and schedule repairs efficiently.",
            ],
          ].map(([Icon, title, desc]: any, idx) => (
            <div
              key={idx}
              className="border border-black/5 bg-white hover:border-orange-500/20 shadow-sm p-8 rounded-[32px] transition-all text-left relative group"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/[0.01] blur-2xl rounded-full" />
              <div className="w-12 h-12 bg-stone-50 rounded-2xl border border-black/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="w-5.5 h-5.5 text-[#FF5A1F]" />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stone-900 mb-2">{title}</h3>
              <p className="text-stone-500 text-xs font-semibold leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
