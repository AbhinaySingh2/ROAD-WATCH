"use client";
 
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Camera, LayoutDashboard, Trophy } from "lucide-react";
 
export default function BottomNav() {
  const pathname = usePathname();
 
  // Hide bottom nav on login page
  if (pathname === "/dashboard/login") return null;
 
  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Map", href: "/track", icon: Map },
    { label: "Report", href: "/report", icon: Camera, isCenter: true },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];
 
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-[999] bg-white/85 border border-black/5 backdrop-blur-xl rounded-[28px] py-2.5 px-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex items-center justify-between">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
 
        if (item.isCenter) {
          return (
            <Link 
              key={idx} 
              href={item.href} 
              className="flex flex-col items-center -translate-y-5"
            >
              <div className="w-13 h-13 bg-gradient-to-br from-[#FF6B35] to-[#FF5A1F] rounded-full flex items-center justify-center text-white border-4 border-[#FAF9F5] shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-[#FF5A1F] font-extrabold uppercase tracking-widest mt-1">{item.label}</span>
            </Link>
          );
        }
 
        return (
          <Link 
            key={idx} 
            href={item.href} 
            className={`flex flex-col items-center gap-1 transition-all py-1 ${
              isActive ? "text-[#FF5A1F] font-bold scale-105" : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] tracking-wide font-extrabold uppercase text-[8px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
