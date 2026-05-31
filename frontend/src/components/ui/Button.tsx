import React from "react";

export function Button({ children, className = "", variant = "primary", ...props }: any) {
  const base =
    "px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full cursor-pointer active:scale-95 shadow-sm transition-all";
  const variants: any = {
    primary: "bg-[#FF5A1F] hover:bg-[#E84E15] text-white disabled:opacity-60",
    secondary: "bg-white hover:bg-stone-50 border border-black/5 text-stone-700",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
