"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Map, Trophy, Terminal, Monitor, Home, Camera } from "lucide-react";

export function Header({
  crtEnabled = false,
  onCrtToggle,
  showCrtToggle = false,
  backToHome = false,
  rightElement,
}: any) {
  const p = usePathname();
  return (
    <div className="w-full flex justify-center py-6 px-4 sticky top-0 z-50 pointer-events-none">
      <header className="w-full max-w-4xl bg-white/70 border border-black/5 backdrop-blur-xl rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.03)] pointer-events-auto">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white shadow-md"
          >
            <Heart className="w-4 h-4 fill-white" />
          </Link>
          <span className="text-base font-black tracking-tight uppercase">
            Road<span className="text-[#FF5A1F]">Watch</span>
          </span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-stone-500">
          {[
            [Map, "/track", "Safety Map"],
            [Trophy, "/leaderboard", "Leaderboard"],
            [Terminal, "/dashboard", "Dashboard"],
          ].map(([Icon, href, label]: any) => (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => {
                if (href === "/track") import("@/components/Map");
              }}
              className={`hover:text-stone-900 transition-colors flex items-center gap-1 ${p === href ? "text-stone-950 font-bold" : ""}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-3.5">
          {rightElement || (
            <>
              {showCrtToggle && onCrtToggle && (
                <button
                  onClick={onCrtToggle}
                  className={`px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${crtEnabled ? "bg-stone-900 border-stone-900 text-white" : "bg-stone-50 border-black/5 text-stone-500"}`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Retro: {crtEnabled ? "ON" : "OFF"}</span>
                </button>
              )}
              <Link
                href={backToHome ? "/" : "/report"}
                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95 ${backToHome ? "bg-stone-100 hover:bg-stone-200 text-stone-700 shadow-sm" : "bg-[#FF5A1F] hover:bg-[#E84E15] text-white shadow-md"}`}
              >
                {backToHome ? "Back to Home" : "Report Hazard"}
              </Link>
            </>
          )}
        </div>
      </header>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-[999] bg-white/85 border border-black/5 backdrop-blur-xl rounded-[28px] py-2.5 px-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-center justify-between">
      {[
        [Home, "/", "Home"],
        [Map, "/track", "Map"],
        [Camera, "/report", "Report", true],
        [Trophy, "/leaderboard", "Leaderboard"],
        [Terminal, "/dashboard", "Dashboard"],
      ].map(([Icon, href, label, isCenter]: any, idx) =>
        isCenter ? (
          <Link key={idx} href={href} className="flex flex-col items-center -translate-y-5">
            <div className="w-13 h-13 bg-gradient-to-br from-[#FF6B35] to-[#FF5A1F] rounded-full flex items-center justify-center text-white border-4 border-[#FAF9F5] shadow-lg active:scale-95 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[9px] text-[#FF5A1F] font-extrabold uppercase tracking-widest mt-1">{label}</span>
          </Link>
        ) : (
          <Link
            key={idx}
            href={href}
            onMouseEnter={() => {
              if (href === "/track") import("@/components/Map");
            }}
            className={`flex flex-col items-center gap-1 transition-all py-1 ${pathname === href ? "text-[#FF5A1F] font-bold scale-105" : "text-stone-400"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="tracking-wide font-extrabold uppercase text-[8px]">{label}</span>
          </Link>
        ),
      )}
    </div>
  );
}
