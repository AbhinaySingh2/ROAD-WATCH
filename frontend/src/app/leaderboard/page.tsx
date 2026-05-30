"use client";

import { useState, useEffect } from "react";
import { Award, Trophy, Flame, Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";
import { useRoadIssues } from "@/lib/api";
import { Header } from "@/components/Navigation";

interface Contributor { id: number; name: string; avatar: string; points: number; reportsSubmitted: number; tier: string; tierColor: string; tierBg: string; progressPercent: number; }

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const { data } = useRoadIssues();

  const dbPoints = data ? data.reduce((acc, curr) => acc + (curr.impact_score || 0), 0) : 0;
  const totalCivicPoints = 1850 + dbPoints;
  const activeMembers = 32 + Math.ceil((data?.length || 0) / 2);

  useEffect(() => {
    const pts = 320 + dbPoints, isG = pts >= 800, isP = pts >= 600;
    const list = [
      ["Aarav Sharma", "👨‍💻", 820, 14, "Road Guardian", "rose-650", "bg-rose-50", 92],
      ["Priya Patel", "👩‍⚕️", 640, 10, "Platinum Helper", "indigo-655", "bg-indigo-50", 78],
      ["Abhinay Singh", "🦸‍♂️", pts, 4 + (data?.length || 0), isG ? "Road Guardian" : isP ? "Platinum Helper" : "Gold Contributor", isG ? "rose-650" : isP ? "indigo-655" : "amber-650", isG ? "bg-rose-50" : isP ? "bg-indigo-50" : "bg-amber-50", Math.ceil(isG ? Math.min(99, (pts - 800) / 4 + 80) : isP ? (pts - 600) / 2 + 70 : Math.min(99, (pts - 300) / 3 + 40))],
      ["Ananya Iyer", "👩‍🎨", 350, 6, "Silver Helper", "stone-500", "bg-stone-50", 45],
      ["Rohan Verma", "👨‍💼", 210, 4, "Bronze Contributor", "orange-655", "bg-orange-50", 28]
    ];
    setContributors(list.map(([n, av, pts, rep, t, tc, tb, p]: any, i) => ({
      id: i + 1, name: n, avatar: av, points: pts, reportsSubmitted: rep, tier: t, tierColor: `text-${tc} border-${tc.split("-")[0]}-200/50`, tierBg: tb, progressPercent: p
    })).sort((a, b) => b.points - a.points));
    if (data) setLoading(false);
  }, [data, dbPoints]);

  const devUser = contributors.find(c => c.name === "Abhinay Singh") || { reportsSubmitted: 4, points: 320 };
  if (loading) return <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center"><Sparkles className="w-8 h-8 animate-spin text-[#FF5A1F]" /></div>;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative overflow-hidden pb-12 font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-orange-100/20 blur-[130px] rounded-full pointer-events-none" />
      <Header backToHome={true} />
      <main className="max-w-2xl mx-auto p-6 w-full flex-1 z-10 flex flex-col">
        <div className="text-center py-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#FF5A1F] rounded-3xl flex items-center justify-center mb-4 border border-white shadow-md"><Trophy className="w-8 h-8 text-white" strokeWidth={2.5} /></div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-2">ROAD SAFETY CHAMPIONS</h1>
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-widest max-w-sm leading-relaxed">Report potholes, verify hazards, level up your ranking, and earn custom road safety badges!</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[{ label: "Total Civic Points", val: totalCivicPoints, color: "text-[#FF5A1F]", icon: Sparkles }, { label: "Active Volunteers", val: activeMembers, color: "text-purple-650", icon: Flame }].map((s, idx) => (
            <div key={idx} className="bg-white border border-black/5 p-5 rounded-3xl shadow-sm">
              <div className={`flex items-center gap-2 mb-1.5 ${s.color}`}><s.icon className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span></div>
              <h3 className="text-3xl font-black text-left">{s.val}</h3>
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/5 rounded-[36px] p-6 shadow-sm flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-4 border-b border-black/5"><h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2"><Award className="w-5 h-5 text-[#FF5A1F]" /> Top Contributors</h2><span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">SYNCED LIVE</span></div>
          <div className="space-y-3.5 flex-1">
            {contributors.map((c, index) => {
              const isDev = c.name === "Abhinay Singh", rank = index + 1;
              return (
                <div key={c.id} className={`flex flex-col p-4 rounded-2xl border transition-all relative overflow-hidden ${isDev ? 'bg-gradient-to-r from-orange-50/60 to-transparent border-orange-200 shadow-sm' : 'bg-stone-50/40 border-black/5 hover:border-orange-500/10'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${rank === 1 ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-md' : rank === 2 ? 'bg-stone-200 text-stone-700 font-black border border-stone-300/40 shadow-sm' : rank === 3 ? 'bg-amber-600/10 text-amber-655 border border-amber-200/50' : 'bg-stone-100 text-stone-550 border border-black/5'}`}>{rank}</div>
                      <div className="w-9 h-9 bg-white border border-black/5 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">{c.avatar}</div>
                      <div className="text-left"><h4 className="font-extrabold text-sm flex items-center gap-1.5">{c.name} {isDev && <span className="px-2.5 py-0.5 bg-[#FF5A1F] text-white font-black text-[8px] uppercase tracking-widest rounded-full">YOU</span>}</h4><p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{c.reportsSubmitted} hazards reported</p></div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1"><span className={`px-3 py-0.5 border text-[9px] uppercase font-black tracking-widest rounded-full ${c.tierBg} ${c.tierColor}`}>{c.tier}</span><span className="text-sm font-black text-[#FF5A1F]">+{c.points} pts</span></div>
                  </div>
                  <div className="w-full space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-stone-400"><span>Level Up Progress</span><span className="text-[#FF5A1F]">{c.progressPercent}%</span></div>
                    <div className="w-full bg-stone-100 border border-black/5 h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${c.progressPercent}%` }} className="bg-gradient-to-r from-orange-400 via-[#FF5A1F] to-amber-400 h-full rounded-full" /></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-4 bg-orange-500/[0.01] border border-black/5 rounded-2xl flex gap-3 items-center text-left">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A1F] flex-shrink-0"><User className="w-4 h-4" /></div>
            <div>
              <h5 className="font-extrabold text-xs uppercase tracking-wider">Verify Local Hazards</h5>
              <p className="text-[10px] text-stone-500 mt-1 leading-normal font-semibold">Submit road photos, verify active reports, upvote hazards, and help make your local neighborhood roads safer for everyone.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white border border-black/5 rounded-[36px] p-6 shadow-sm text-left flex flex-col gap-4">
          <div className="flex items-center justify-between pb-4 border-b border-black/5"><h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2"><Award className="w-5 h-5 text-[#FF5A1F]" /> Unlocked Credentials</h2><span className="text-[9px] px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-[#FF5A1F] font-black uppercase tracking-widest rounded-full">VOLUNTEER BADGES</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[["Pothole Patrol", "First report", "🎖️", devUser.reportsSubmitted >= 1], ["Verified Guardian", "Hazards verified", "🌟", devUser.reportsSubmitted >= 4], ["Surveyor", "6+ logged", "📍", devUser.reportsSubmitted >= 6], ["Commander", "Gold/Plat rank", "🛡️", devUser.points >= 600]].map(([lbl, desc, icon, act]: any, idx) => (
              <div key={idx} className={`p-4 border rounded-2xl flex flex-col items-center text-center relative overflow-hidden ${act ? 'bg-orange-50/50 border-orange-200 text-[#FF5A1F] shadow-sm' : 'bg-stone-50/50 border-stone-200/40 opacity-40 select-none'}`}><div className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 bg-stone-100">{icon}</div><h4 className="text-[11px] font-black uppercase tracking-wider leading-tight mb-1">{lbl}</h4><p className="text-[9px] text-stone-400 font-bold leading-normal uppercase">{desc}</p>{act && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
