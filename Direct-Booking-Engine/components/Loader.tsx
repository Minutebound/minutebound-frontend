"use client";

import React from "react";

interface LoaderProps {
  variant?: "screen" | "full" | "compact";
  message?: string;
}

export default function Loader({ variant = "full", message = "Curating your journey..." }: LoaderProps) {
  const isCompact = variant === "compact";

  // Determine container sizing based on variant
  const containerClass = 
    variant === "screen" ? "w-full h-screen flex flex-col items-center justify-center bg-theme-white animate-in fade-in duration-300" :
    variant === "full" ? "w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-theme-white animate-in fade-in duration-300" :
    "w-full py-12 flex flex-col items-center justify-center animate-in fade-in duration-300";

  return (
    <div className={containerClass}>
      
      {isCompact ? (
        /* FANCY COMPACT SPINNER (No Logo) */
        <div className="relative flex items-center justify-center w-12 h-12">
          {/* Subtle background track */}
          <div className="absolute inset-0 rounded-full border-4 border-theme-secondary/10"></div>
          {/* Fast gradient spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-theme-primary border-r-theme-primary/50 animate-spin"></div>
          {/* Inner pulse */}
          <div className="absolute inset-2 bg-theme-primary/10 rounded-full animate-pulse"></div>
        </div>
      ) : (
        /* FULL/SCREEN SPINNER (With Airplane Logo) */
        <div className="relative flex items-center justify-center w-28 h-28">
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-theme-secondary border-l-theme-secondary animate-[spin_1s_linear_infinite]"></div>
          <svg 
            viewBox="0 0 270 220" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-14 h-14 text-theme-primary drop-shadow-sm"
          >
            <g className="origin-[60px_116px] scale-[1.3]">
              <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />        
            </g>
          </svg>
        </div>
      )}
      
      {/* Loading Message */}
      <p className={`font-black uppercase tracking-[0.15em] text-theme-secondary/70 text-center ${isCompact ? "text-[10px] mt-4" : "text-[10px] mt-6"}`}>
        {message}
      </p>
    </div>
  );
}