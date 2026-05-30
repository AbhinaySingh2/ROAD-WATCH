"use client";
import Link from "next/link";
import { Heart, Map, Trophy, Terminal, Monitor } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header({ crtEnabled = false, onCrtToggle, showCrtToggle = false, backToHome = false, rightElement }: any) {
  const p = usePathname();
  const nav = [
    { href: "/track", label: "Safety Map", icon: Map },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/dashboard", label: "Dashboard", icon: Terminal }
  ];

  return (
    <div className="w-full flex justify-center py-6 px-4 sticky top-0 z-50 pointer-events-none">
      <header className="w-full max-w-4xl bg-white/70 border border-black/5 backdrop-blur-xl rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] pointer-events-auto">
        <div className="flex items-center space-x-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white shadow-md"><Heart className="w-4 h-4 fill-white" /></Link>
          <span className="text-base font-black tracking-tight uppercase">Road<span className="text-[#FF5A1F]">Watch</span></span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-stone-500">
          {nav.map(n => {
            const Icon = n.icon;
            return <Link key={n.href} href={n.href} className={`hover:text-stone-900 transition-colors flex items-center gap-1 ${p === n.href ? "text-stone-950 font-bold" : ""}`}><Icon className="w-3.5 h-3.5" /> {n.label}</Link>
          })}
        </nav>

        <div className="flex items-center space-x-3.5">
          {rightElement || (
            <>
              {showCrtToggle && onCrtToggle && (
                <button onClick={onCrtToggle} className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${crtEnabled ? "bg-stone-900 border-stone-900 text-white" : "bg-stone-50 border-black/5 text-stone-500 hover:text-stone-900"}`}><Monitor className="w-3 h-3" /><span>Retro: {crtEnabled ? "ON" : "OFF"}</span></button>
              )}
              <Link href={backToHome ? "/" : "/report"} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 ${backToHome ? "bg-stone-100 hover:bg-stone-200 text-stone-700 shadow-sm" : "bg-[#FF5A1F] hover:bg-[#E84E15] text-white shadow-md shadow-orange-500/10"}`}>{backToHome ? "Back to Home" : "Report Hazard"}</Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
