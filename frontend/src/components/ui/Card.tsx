import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-black/5 shadow-sm rounded-[32px] ${className}`}>{children}</div>;
}
