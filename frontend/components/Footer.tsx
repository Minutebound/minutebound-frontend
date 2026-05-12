"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Server, Globe } from 'lucide-react';

export default function Footer() {
  const [statusSummary, setStatusSummary] = useState<{
    state: 'loading' | 'operational' | 'degraded' | 'outage';
    internal: boolean;
    extUp: number;
    extTotal: number;
  }>({ state: 'loading', internal: true, extUp: 0, extTotal: 0 });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        const backendUp = data.internal_system?.backend_api?.status === 'UP';
        const frontendUp = data.internal_system?.frontend_app?.status === 'UP';
        const internalUp = backendUp && frontendUp;

        const externalApis = data.external_apis || [];
        const extTotal = externalApis.length;
        const extUp = externalApis.filter((a: any) => a.status === 'UP').length;

        let state: 'operational' | 'degraded' | 'outage' = 'operational';
        if (!internalUp || (extTotal > 0 && extUp === 0)) state = 'outage';
        else if (extUp < extTotal) state = 'degraded';

        setStatusSummary({ state, internal: internalUp, extUp, extTotal });
      } catch (e) {
        setStatusSummary({ state: 'outage', internal: false, extUp: 0, extTotal: 0 });
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-theme-dark-blue text-theme-white pt-8 pb-8 border-t-4 border-theme-primary shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 relative mt-auto">      
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mb-12">
          
          <div className="flex flex-col gap-5">


            <p className="text-sm text-theme-white/70 leading-relaxed max-w-sm font-medium">
              Your intelligent travel companion. Plan flights, accommodations, road trips, and adventures in minutes.
            </p>

            <Link href="/status" className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-theme-white/10 hover:bg-white/10 hover:border-theme-white/30 transition-all group w-fit cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-2.5 w-2.5">
                  {statusSummary.state !== 'loading' && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                      statusSummary.state === 'operational' ? 'bg-green-400' : 
                      statusSummary.state === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    statusSummary.state === 'loading' ? 'bg-theme-white/30' :
                    statusSummary.state === 'operational' ? 'bg-green-500' : 
                    statusSummary.state === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-theme-white/90">
                  {statusSummary.state === 'loading' ? 'Checking Status...' : 
                   statusSummary.state === 'operational' ? 'All Systems Operational' : 
                   statusSummary.state === 'degraded' ? 'Partial Degradation' : 'System Outage'}
                </span>
              </div>
              
              {statusSummary.state !== 'loading' && (
                <div className="flex items-center gap-4 text-[10px] font-mono text-theme-white/60 pl-5">
                  <span className={`flex items-center gap-1 ${statusSummary.internal ? 'text-green-400/80' : 'text-red-400/80'}`}>
                    <Server size={11} /> Core: {statusSummary.internal ? 'UP' : 'DOWN'}
                  </span>
                  <span className="text-theme-white/20">•</span>
                  <span className={`flex items-center gap-1 ${statusSummary.extUp === statusSummary.extTotal ? 'text-green-400/80' : statusSummary.extUp > 0 ? 'text-yellow-400/80' : 'text-red-400/80'}`}>
                    <Globe size={11} /> APIs: {statusSummary.extUp}/{statusSummary.extTotal}
                  </span>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-4 mt-2">
              <SocialLink href="#" icon={<Facebook size={18} />} />
              <SocialLink href="#" icon={<Twitter size={18} />} />
              <SocialLink href="#" icon={<Instagram size={18} />} />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:pl-8">
            <h4 className="font-black text-lg text-theme-white tracking-wide mb-2 uppercase text-[13px]">Explore</h4>
            <FooterLink href="/" text="Home" />
            <FooterLink href="/" text="Trip Planner" />
            <FooterLink href="/savedtrips" text="Saved Itineraries" />
            <FooterLink href="/profile" text="Your Account" />
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-black text-lg text-theme-white tracking-wide mb-2 uppercase text-[13px]">Support</h4>
            <FooterLink href="#" text="Help Center & FAQ" />
            <FooterLink href="/status" text="System Status" />
            <FooterLink href="#" text="Privacy Policy" />
            <FooterLink href="#" text="Terms of Service" />
            <FooterLink href="#" text="Contact Us" />
          </div>
        </div>

        <div className="pt-8 border-t border-theme-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-theme-white/50 font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} MinuteBound Travel LLC. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

function FooterLink({ href, text }: { href: string; text: string }) {
  return (
    <Link 
      href={href} 
      className="text-sm font-bold text-theme-white/60 hover:text-theme-primary transition-colors w-fit relative group"
    >
      {text}
      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-theme-primary transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-xl bg-theme-white/5 border border-theme-white/10 flex items-center justify-center text-theme-white/80 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-all shadow-sm active:scale-95"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}