"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Trophy, Flame, Sparkles, User, ShieldAlert, Cpu, Heart, Map, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";

interface Contributor {
  id: number;
  name: string;
  avatar: string;
  points: number;
  reportsSubmitted: number;
  tier: string;
  tierColor: string;
  tierBg: string;
  progressPercent: number; // progress to next tier
}

export default function LeaderboardPage() {
  const [totalCivicPoints, setTotalCivicPoints] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Overhauled contributors list with friendly civic ranks
  const [contributors, setContributors] = useState<Contributor[]>([
    { id: 1, name: "Aarav Sharma", avatar: "👨‍💻", points: 820, reportsSubmitted: 14, tier: "Road Guardian", tierColor: "text-rose-600 border-rose-200/50", tierBg: "bg-rose-50 shadow-sm", progressPercent: 92 },
    { id: 2, name: "Priya Patel", avatar: "👩‍⚕️", points: 640, reportsSubmitted: 10, tier: "Platinum Helper", tierColor: "text-indigo-650 border-indigo-200/50", tierBg: "bg-indigo-50 shadow-sm", progressPercent: 78 },
    { id: 3, name: "Abhinay Singh", avatar: "🦸‍♂️", points: 490, reportsSubmitted: 8, tier: "Gold Contributor", tierColor: "text-amber-650 border-amber-200/50", tierBg: "bg-amber-50 shadow-sm", progressPercent: 62 },
    { id: 4, name: "Ananya Iyer", avatar: "👩‍🎨", points: 350, reportsSubmitted: 6, tier: "Silver Helper", tierColor: "text-stone-500 border-stone-200/50", tierBg: "bg-stone-50 shadow-sm", progressPercent: 45 },
    { id: 5, name: "Rohan Verma", avatar: "👨‍💼", points: 210, reportsSubmitted: 4, tier: "Bronze Contributor", tierColor: "text-orange-650 border-orange-200/50", tierBg: "bg-orange-50 shadow-sm", progressPercent: 28 },
  ]);

  useEffect(() => {
    apiFetch<any[]>("/api/v1/issues")
      .then((data) => {
        if (data.length > 0) {
          const dbPoints = data.reduce((acc, curr) => acc + (curr.impact_score || 0), 0);
          setTotalCivicPoints(1850 + dbPoints);
          setActiveMembers(32 + Math.ceil(data.length / 2));
          
          const liveDeveloperSubmissions = data.length;
          const liveDeveloperPoints = dbPoints;

          setContributors(prev => 
            prev.map(c => {
              if (c.name === "Abhinay Singh") {
                const totalPoints = 320 + liveDeveloperPoints;
                // Calculate progress dynamically
                let tierName = "Gold Contributor";
                let color = "text-amber-650 border-amber-200/50";
                let bg = "bg-amber-50 shadow-sm";
                let progress = 62;

                if (totalPoints >= 800) {
                  tierName = "Road Guardian";
                  color = "text-rose-655 border-rose-200/50";
                  bg = "bg-rose-50 shadow-sm";
                  progress = Math.min(99, ((totalPoints - 800) / 4) + 80);
                } else if (totalPoints >= 600) {
                  tierName = "Platinum Helper";
                  color = "text-indigo-655 border-indigo-200/50";
                  bg = "bg-indigo-50 shadow-sm";
                  progress = ((totalPoints - 600) / 2) + 70;
                } else {
                  progress = Math.min(99, ((totalPoints - 300) / 3) + 40);
                }

                return { 
                  ...c, 
                  points: totalPoints, 
                  reportsSubmitted: 4 + liveDeveloperSubmissions,
                  tier: tierName,
                  tierColor: color,
                  tierBg: bg,
                  progressPercent: Math.ceil(progress)
                };
              }
              return c;
            }).sort((a, b) => b.points - a.points)
          );
        } else {
          setTotalCivicPoints(1850);
          setActiveMembers(32);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch statistics for leaderboard:", err);
        setTotalCivicPoints(1850);
        setActiveMembers(32);
      })
      .finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col relative overflow-hidden pb-12 font-sans">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-orange-100/20 blur-[130px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />

      {/* Centered Floating Pill Navigation Header */}
      <div className="w-full flex justify-center py-6 px-4 sticky top-0 z-50 pointer-events-none">
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
            <Link href="/leaderboard" className="text-stone-950 transition-colors flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-[#FF5A1F]" /> Leaderboard</Link>
            <Link href="/dashboard" className="hover:text-stone-900 transition-colors flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Dashboard</Link>
          </nav>

          <div className="flex items-center space-x-3.5">
            <Link href="/" className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95">
              Back to Home
            </Link>
          </div>
        </header>
      </div>

      <main className="max-w-2xl mx-auto p-6 w-full flex-1 z-10 flex flex-col">
        {/* Main Title Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-[#FF5A1F] rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20 border border-white">
            <Trophy className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-stone-900">ROAD SAFETY CHAMPIONS</h1>
          <p className="text-stone-500 text-xs font-semibold uppercase tracking-widest max-w-sm leading-relaxed">Report potholes, verify hazards, level up your ranking, and earn custom road safety badges!</p>
        </motion.div>

        {/* Global Stats Dashboard */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <motion.div variants={itemVariants} className="bg-white border border-black/5 p-5 rounded-3xl relative overflow-hidden group shadow-sm text-left">
            <div className="flex items-center gap-2 mb-1.5 text-[#FF5A1F]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Civic Points</span>
            </div>
            <h3 className="text-3xl font-black text-stone-900">{totalCivicPoints}</h3>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white border border-black/5 p-5 rounded-3xl relative overflow-hidden group shadow-sm text-left">
            <div className="flex items-center gap-2 mb-1.5 text-purple-650">
              <Flame className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active Volunteers</span>
            </div>
            <h3 className="text-3xl font-black text-stone-900">{activeMembers}</h3>
          </motion.div>
        </motion.div>

        {/* Leaderboard Cards list */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-black/5 rounded-[36px] p-6 shadow-sm flex-1 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-4 border-b border-black/5">
            <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF5A1F] animate-bounce" style={{ animationDuration: '3s' }} /> Top Community Contributors
            </h2>
            <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">SYNCED LIVE</span>
          </div>

          <div className="space-y-3.5 flex-1">
            {contributors.map((c, index) => {
              const isDevUser = c.name === "Abhinay Singh";
              const rank = index + 1;
              
              return (
                <motion.div 
                  key={c.id}
                  variants={itemVariants}
                  className={`flex flex-col p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    isDevUser 
                      ? 'bg-gradient-to-r from-orange-50/60 to-transparent border-orange-200 shadow-sm' 
                      : 'bg-stone-50/40 border-black/5 hover:border-orange-500/10'
                  }`}
                >
                  {/* Top line info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3.5">
                      {/* Rank Badge */}
                      <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center flex-shrink-0 ${
                        rank === 1 ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white font-black shadow-md shadow-amber-500/20' :
                        rank === 2 ? 'bg-stone-200 text-stone-700 font-black border border-stone-300/40 shadow-sm' :
                        rank === 3 ? 'bg-amber-600/10 text-amber-650 border border-amber-200/50' :
                        'bg-stone-100 text-stone-550 border border-black/5'
                      }`}>
                        {rank}
                      </div>

                      {/* Avatar & Name */}
                      <div className="w-9 h-9 bg-white border border-black/5 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                        {c.avatar}
                      </div>

                      <div className="text-left">
                        <h4 className="font-extrabold text-sm flex items-center gap-1.5 text-stone-900">
                          {c.name} 
                          {isDevUser && (
                            <span className="px-2.5 py-0.5 bg-[#FF5A1F] text-white font-black text-[8px] uppercase tracking-widest rounded-full shadow-md shadow-orange-500/20">
                              YOU
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          {c.reportsSubmitted} hazards reported
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      {/* Tier Bracket Badge */}
                      <span className={`px-3 py-0.5 border text-[9px] uppercase font-black tracking-widest rounded-full ${c.tierBg} ${c.tierColor}`}>
                        {c.tier}
                      </span>
                      {/* Points */}
                      <span className="text-sm font-black text-[#FF5A1F]">
                        +{c.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Level progress bar */}
                  <div className="w-full space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-stone-400">
                      <span>Level Up Progress</span>
                      <span className="text-[#FF5A1F]">{c.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-stone-100 border border-black/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${c.progressPercent}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="bg-gradient-to-r from-orange-400 via-[#FF5A1F] to-amber-400 h-full rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick tips */}
          <div className="mt-4 p-4 bg-orange-500/[0.01] border border-black/5 rounded-2xl flex gap-3 items-center text-left">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A1F] flex-shrink-0">
              <User className="w-4 h-4 text-[#FF5A1F]" />
            </div>
            <div>
              <h5 className="font-extrabold text-xs uppercase tracking-wider text-stone-900">Verify Local Hazards</h5>
              <p className="text-[10px] text-stone-500 mt-1 leading-normal font-semibold">
                Submit road photos, verify active reports, upvote hazards, and help make your local neighborhood roads safer for everyone.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Civic Achievement Badges Shelf */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mt-6 bg-white border border-black/5 rounded-[36px] p-6 shadow-sm text-left flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-4 border-b border-black/5">
            <h2 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF5A1F]" /> Unlocked Civic Credentials
            </h2>
            <span className="text-[9px] px-2.5 py-0.5 bg-orange-50 border border-orange-200 text-[#FF5A1F] font-black uppercase tracking-widest rounded-full">
              VOLUNTEER BADGES
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                title: "Pothole Patrol",
                desc: "Submitted first road hazard report",
                icon: "🎖️",
                unlocked: contributors.find(c => c.name === "Abhinay Singh")?.reportsSubmitted ? contributors.find(c => c.name === "Abhinay Singh")!.reportsSubmitted >= 1 : true,
                color: "from-orange-500/10 to-orange-500/5 border-orange-200 text-orange-600"
              },
              {
                title: "Verified Guardian",
                desc: "Reports verified by local authority",
                icon: "🌟",
                unlocked: contributors.find(c => c.name === "Abhinay Singh")?.reportsSubmitted ? contributors.find(c => c.name === "Abhinay Singh")!.reportsSubmitted >= 4 : true,
                color: "from-amber-500/10 to-amber-500/5 border-amber-200 text-amber-600"
              },
              {
                title: "Precision Surveyor",
                desc: "Logged 6+ precise GPS locations",
                icon: "📍",
                unlocked: contributors.find(c => c.name === "Abhinay Singh")?.reportsSubmitted ? contributors.find(c => c.name === "Abhinay Singh")!.reportsSubmitted >= 6 : false,
                color: "from-indigo-500/10 to-indigo-500/5 border-indigo-200 text-indigo-600"
              },
              {
                title: "Civic Commander",
                desc: "Achieved Gold or Platinum rank",
                icon: "🛡️",
                unlocked: contributors.find(c => c.name === "Abhinay Singh")?.points ? contributors.find(c => c.name === "Abhinay Singh")!.points >= 600 : false,
                color: "from-rose-500/10 to-rose-500/5 border-rose-200 text-rose-600"
              }
            ].map((badge, idx) => (
              <div 
                key={idx}
                className={`p-4 border rounded-2xl flex flex-col items-center text-center transition-all relative overflow-hidden ${
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.color} shadow-sm cursor-default hover:scale-[1.03]` 
                    : 'bg-stone-50/50 border-stone-200/40 opacity-40 cursor-not-allowed select-none'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-3 ${
                  badge.unlocked ? 'bg-white/80 shadow-inner' : 'bg-stone-100'
                }`}>
                  {badge.icon}
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-900 leading-tight mb-1">{badge.title}</h4>
                <p className="text-[9px] text-stone-450 font-bold leading-normal uppercase">{badge.desc}</p>
                
                {/* Glow ring indicator on unlocked badges */}
                {badge.unlocked && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
