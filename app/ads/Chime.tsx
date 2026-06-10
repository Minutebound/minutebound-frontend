"use client";

import React from "react";
import { CreditCard, Smartphone, Globe, ArrowRight, Zap } from "lucide-react";

export default function ChimeAdMini() {
  // Pulls from env, falls back to default if not set
  const affiliateUrl = `${process.env.NEXT_PUBLIC_CHIME_AFFILIATE_URL}`;

  return (
    <div 
      className="w-fullmx-auto relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl group cursor-pointer transition-all duration-500 hover:shadow-[0_16px_50px_rgba(37,200,126,0.25)]"
      onClick={() => window.open(affiliateUrl, "_blank")} 
    >
      {/* BACKGROUND GRADIENT & EFFECTS */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#25C87E] to-[#128a53] z-0"></div>
      
      {/* Abstract Graphical Overlay Effects */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
      <div className="absolute -top-32 -right-10 w-72 h-72 bg-white opacity-20 rounded-full blur-[80px] z-0 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
      <div className="absolute -bottom-12 -left-10 w-64 h-64 bg-black opacity-10 rounded-full blur-[60px] z-0 pointer-events-none"></div>

      {/* CONTENT CONTAINER */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 md:p-8 lg:p-10 gap-6 md:gap-10">

        {/* LEFT SECTION: Badge, Description, & CTA */}
        <div className="flex flex-col items-start gap-3 md:gap-4 flex-1 text-white w-full">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-sm">
            <Zap size={12} className="text-[#DCF86E] fill-[#DCF86E]" />
            <span className="font-black text-[10px] uppercase tracking-widest text-white">Partner Travel Offer</span>
          </div>

          <p className="text-white font-bold text-base md:text-lg lg:text-xl max-w-2xl leading-snug">
            No overdraft fees. No minimum balances. Zero foreign transaction fees on your next adventure. Sign up for Chime today and get a <strong className="text-[#DCF86E]">$100 bonus</strong> when you set up qualifying direct deposit.
          </p>

          <button className="mt-1 bg-white text-[#128a53] font-black uppercase tracking-widest text-[10px] md:text-[16px] px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md group/btn">
            Claim Your $100 
            <ArrowRight size={16} className="transform group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* RIGHT SECTION: Scaled-Down CSS-Drawn 3D Cards */}
        <div className="flex-1 md:flex-none flex justify-center md:justify-end relative w-full md:w-auto mt-4 md:mt-0">
          <div className="relative w-[240px] h-[140px] md:w-[280px] md:h-[160px] perspective-1000">
            
            {/* Dark Back Card */}
            <div className="absolute top-0 right-0 w-[190px] md:w-[216px] h-[16px] md:h-[130px] bg-gradient-to-br from-slate-800 to-black rounded-xl shadow-xl border border-white/10 rotate-[8deg] transform transition-transform group-hover:rotate-[14deg] group-hover:translate-x-4 duration-500 p-4 flex flex-col justify-between">
              <Globe className="text-white/20" size={24} strokeWidth={1.5} />
              <div className="w-full flex justify-end">
                <div className="text-white/40 font-mono tracking-widest text-[10px] font-bold">•••• 4321</div>
              </div>
            </div>

            {/* Front White Chime Card */}
            <div className="absolute bottom-0 left-0 w-[190px] md:w-[216px] h-[16px] md:h-[130px] bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl border border-white/40 -rotate-[4deg] transform transition-transform group-hover:rotate-0 group-hover:-translate-x-2 duration-500 p-4 flex flex-col justify-between z-10">
              <div className="flex justify-between items-start">
                <div className="font-black text-2xl text-[#25C87E] tracking-tighter lowercase leading-none">chime</div>
                <CreditCard className="text-[#25C87E]/30" size={24} strokeWidth={1.5} />
              </div>
              <div className="flex justify-between items-end">
                 <div className="flex flex-col">
                    <div className="text-slate-400 font-mono font-bold tracking-widest text-[10px]">•••• 8899</div>
                    <div className="text-slate-800 font-black uppercase tracking-widest text-[10px]">Visa Debit</div>
                 </div>
                 <Smartphone className="text-slate-300" size={18} />
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}