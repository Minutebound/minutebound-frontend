"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Twitter, Instagram, Server, Globe } from 'lucide-react';

// --- LOGO COMPONENT ---
const MinuteBoundLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
  <>
    {/* Mobile & Tablet Logo */}
    <svg viewBox="0 20 1600 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} lg:hidden`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
          .logo-text {
            font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont;
            font-size: 170px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <text x="320" y="150" className="logo-text" textAnchor="start">
        <tspan className="font-bold fill-[#012C23]">Minute</tspan>
        <tspan className="font-bold fill-[#012C23]">Bound</tspan>
        <tspan className="font-bold fill-[#F97316]">USA</tspan>
      </text>
      <rect x="0" y="0" width="300" height="350" fill="" rx="20" ry="20" transform="rotate(-10 70 140)" />
      <g transform="translate(20,-30) scale(1)">
        <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-[#012C23]" />
        <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-[#012C23]" />  
      </g>
      <g transform="translate(-310,10) scale(0.8)"> 
        <path d="M 420 170 Q 550 240 680 170" className="text-[#012C23]" stroke="currentColor" fill="none" strokeWidth="14" strokeLinecap="round" />
      </g>
    </svg>

     {/* Desktop Logo */}
    <svg viewBox="10 20 1600 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} hidden lg:block`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
          .logo-text {
            font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont;
            font-size: 150px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <text x="350" y="160" className="logo-text" textAnchor="start">
        <tspan className="font-bold fill-[#FFFFFF]">Minute</tspan>
        <tspan className="font-bold fill-[#FFFFFF]">Bound</tspan>
      </text>
      <rect x="0" y="0" width="300" height="300" fill="" rx="20" ry="20" transform="rotate(-10 70 140)" />
      <g transform="translate(10,-30) scale(1.2)">
        <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-[#FFFFFF]" />
        <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-[#FFFFFF]" />  
      </g>
      <g transform="translate(-410,10)"> 
        <path d="M 420 170 Q 550 240 680 170" className="text-[#FFFFFF]" stroke="currentColor" fill="none" strokeWidth="14" strokeLinecap="round" />
      </g>
    </svg>
  </>
);

export default function Footer() {
  const pathname = usePathname();
  
  // 📍 Add endpoints here where you want the Footer to be a compact single line!
  const compactEndpoints = [
    //'/results',
    '/auth',
  ];

  // Checks if the current path matches or is a sub-path of any in the array
  const isCompactMode = compactEndpoints.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const [statusSummary, setStatusSummary] = useState<{
    state: 'loading' | 'operational' | 'degraded' | 'outage';
    internal: boolean;
    extUp: number;
    extTotal: number;
  }>({ state: 'loading', internal: true, extUp: 0, extTotal: 0 });

  // 1. Health Check Polling (Only runs if we are showing the full footer)
  useEffect(() => {
    if (isCompactMode) return; // Save network requests if UI isn't visible

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
  }, [isCompactMode]);

  // --- COMPACT FOOTER RENDER ---
  if (isCompactMode) {
    return (
      <footer className="bg-gradient-to-r from-theme-dark-slate to-theme-dark-blue text-theme-white py-4 border-t-[3px] border-theme-primary z-50 mt-auto w-full shadow-inner">
        <div className="w-[95%] max-w-[1800px] mx-auto px-2 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <MinuteBoundLogo className="h-6 w-auto" />
            <span className="hidden sm:inline-block w-[1px] h-4 bg-theme-white/20"></span>
            <p className="text-theme-white/50 text-[11px] font-bold tracking-widest uppercase text-center sm:text-left mt-0.5">
              © {new Date().getFullYear()} LLC.
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-[11px] text-theme-white/50 font-bold tracking-widest uppercase">
            <Link href="/status" className="hover:text-theme-primary transition-colors">Status</Link>
            <Link href="#" className="hover:text-theme-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-theme-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    );
  }

  // --- FULL FOOTER RENDER ---
  return (
    <footer className="bg-gradient-to-br from-theme-dark-slate via-theme-dark-blue to-theme-black text-theme-white pt-12 pb-8 border-t-4 border-theme-primary shadow-[0_-4px_26px_rgba(0,0,0,0.05)] z-50 mt-auto w-full relative overflow-hidden">      
      
      {/* Optional abstract background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-theme-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

      <div className="w-[85%] max-w-[1800px] items-center justify-center mx-auto px-2 md:px-0 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 mb-12">
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center">
              <MinuteBoundLogo className="h-8 md:h-10 w-auto" />
            </div>
            
            <p className="text-theme-white/70 text-sm leading-relaxed max-w-sm font-medium">
              Your intelligent travel companion. Plan flights, accommodations, road trips, and adventures in minutes.
            </p>

            <Link href="/status" className="flex flex-col gap-2 p-3.5 rounded-xl bg-theme-white/5 border border-theme-white/10 hover:bg-theme-white/10 hover:border-theme-white/30 transition-all group w-fit cursor-pointer shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex h-2.5 w-2.5">
                  {statusSummary.state !== 'loading' && (
                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                      statusSummary.state === 'operational' ? 'bg-theme-success' : 
                      statusSummary.state === 'degraded' ? 'bg-theme-gold' : 'bg-theme-error'
                    }`}></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    statusSummary.state === 'loading' ? 'bg-theme-white/30' :
                    statusSummary.state === 'operational' ? 'bg-theme-success' : 
                    statusSummary.state === 'degraded' ? 'bg-theme-gold' : 'bg-theme-error'
                  }`}></span>
                </div>
                <span className="text-xs font-bold tracking-wider text-theme-white/90 uppercase">
                  {statusSummary.state === 'loading' ? 'Checking Status...' : 
                   statusSummary.state === 'operational' ? 'All Systems Operational' : 
                   statusSummary.state === 'degraded' ? 'Partial Degradation' : 'System Outage'}
                </span>
              </div>
              
              {statusSummary.state !== 'loading' && (
                <div className="flex items-center gap-4 text-[12px] font-mono text-theme-white/60 pl-5.5">
                  <span className={`flex items-center gap-1.5 ${statusSummary.internal ? 'text-theme-success' : 'text-theme-error'}`}>
                    <Server size={18} /> Core: {statusSummary.internal ? 'UP' : 'DOWN'}
                  </span>
                  <span className="text-theme-white/20">•</span>
                  <span className={`flex items-center gap-1.5 ${statusSummary.extUp === statusSummary.extTotal ? 'text-theme-success' : statusSummary.extUp > 0 ? 'text-theme-gold' : 'text-theme-error'}`}>
                    <Globe size={18} /> Dependents: {statusSummary.extUp}/{statusSummary.extTotal}
                  </span>
                </div>
              )}
            </Link>

            <div className="flex items-center gap-4 mt-1">
              <SocialLink href="#" icon={<Facebook size={18} />} />
              <SocialLink href="#" icon={<Twitter size={18} />} />
              <SocialLink href="#" icon={<Instagram size={18} />} />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:pl-12">
            <h4 className="font-bold text-theme-white tracking-widest text-sm mb-2 uppercase opacity-90">Explore</h4>
            <FooterLink href="/" text="Home" />
            <FooterLink href="/" text="Trip Planner" />
            <FooterLink href="/savedItineraries" text="Saved Itineraries" />
            <FooterLink href="/profile" text="Your Account" />
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-theme-white tracking-widest text-sm mb-2 uppercase opacity-90">Support</h4>
            <FooterLink href="#" text="Help Center & FAQ" />
            <FooterLink href="/status" text="System Status" />
            <FooterLink href="#" text="Privacy Policy" />
            <FooterLink href="#" text="Terms of Service" />
            <FooterLink href="#" text="Contact Us" />
          </div>
          
          <div className="flex flex-col gap-4">
             <h4 className="font-bold text-theme-white tracking-widest text-sm mb-2 uppercase opacity-90">Company</h4>
             <FooterLink href="#" text="About Us" />
             <FooterLink href="#" text="Careers" />
             <FooterLink href="#" text="Press" />
             <FooterLink href="#" text="Partnerships" />
          </div>
        </div>

        <div className="pt-8 border-t border-theme-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-theme-white/50 font-bold tracking-widest uppercase">
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
      className="text-sm font-semibold text-theme-white/60 hover:text-theme-primary transition-colors w-fit relative group"
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
      className="w-10 h-10 rounded-full bg-theme-white/5 border border-theme-white/10 flex items-center justify-center text-theme-white/80 hover:bg-theme-primary hover:text-theme-white hover:border-theme-primary transition-all shadow-sm active:scale-95"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}