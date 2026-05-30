"use client";
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-neutral-900/40 border border-white/5 backdrop-blur-2xl p-8 rounded-[32px] shadow-2xl relative z-10 text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-lg mb-4"><Shield className="w-8 h-8" /></div>
        <h1 className="text-2xl font-black tracking-tight">Authority Portal</h1>
        <p className="text-sm text-neutral-450 mt-1 mb-8">Hackathon demo mode. No credential verification required.</p>
        <Link href="/dashboard" className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg">Enter Dashboard <ArrowRight className="w-4 h-4" /></Link>
        <div className="mt-6"><Link href="/" className="text-xs text-neutral-500 hover:text-neutral-400">Return to Public Home</Link></div>
      </motion.div>
    </main>
  );
}
