"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronDown, ArrowRight, Car, MapPin } from "lucide-react";

export default function DrivingCard({ drivingData }: { drivingData?: any }) {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [showIntermediates, setShowIntermediates] = useState<boolean>(false);

  useEffect(() => {
    const savedState = sessionStorage.getItem("drive_intermediates_open");
    if (savedState === "true") {
      setShowIntermediates(true);
    }
  }, []);

  useEffect(() => {
    const tripStateStr = sessionStorage.getItem("selected_trip_state");
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.drive && tripState.drive.selected) {
          setIsSelected(true);
        }
      } catch (e) {
        console.error("Error parsing selected_trip_state:", e);
      }
    }
  }, []);

  const calculateFuel = (km: number) => {
    const miles = km * 0.621371;
    const gallons = miles / 25;
    return {
      gallons: gallons.toFixed(1),
      cost: (gallons * 3.35).toFixed(2),
      miles: miles.toFixed(0),
    };
  };

  const toggleDriveSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tripStateStr = sessionStorage.getItem("selected_trip_state");
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    const newSelected = !isSelected;
    setIsSelected(newSelected);

    tripState.drive = newSelected
      ? { selected: true, data: drivingData }
      : null;
    sessionStorage.setItem("selected_trip_state", JSON.stringify(tripState));
    window.dispatchEvent(new Event("selected_trip_state_changed"));
  };

  const toggleIntermediates = () => {
    const newState = !showIntermediates;
    setShowIntermediates(newState);
    sessionStorage.setItem("drive_intermediates_open", String(newState));
  };

  if (!drivingData || !drivingData.geometry) return null;

  const fuel = calculateFuel(drivingData.distance_km);
  const passedCities = drivingData.passedCities || [];
  const sName = drivingData.sourceName || "Origin";
  const dName = drivingData.destinationName || "Destination";

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300 w-full">
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[12px] font-semibold uppercase text-theme-secondary/50 tracking-wide">
          Road Trip Details
        </span>
      </div>

      {/* ── CARD CONTAINER ── */}
      <div 
        onClick={toggleIntermediates}
        className={`relative flex flex-col rounded-lg border-2 bg-theme-white cursor-pointer transition-all duration-150 overflow-hidden ${
          isSelected 
            ? 'border-theme-primary shadow-[0_4px_26px_rgba(249,115,22,0.10)]' 
            : 'border-theme-secondary/10 hover:border-theme-secondary/30 hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]'
        }`}
      >

        {/* ── CARD BODY ── */}
        <div className="pl-4 pr-4 sm:pr-5 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center gap-5">
          
          {/* Icon */}
          <div className="flex lg:flex-col items-center gap-3 lg:gap-1.5 shrink-0 lg:w-[72px]">
            <div className="w-12 h-12 bg-theme-white rounded-lg border-2 border-theme-secondary/10 flex items-center justify-center text-theme-secondary/50 shrink-0">
              <Car size={24} strokeWidth={1.5} />
            </div>
            <span className="hidden lg:block text-[12px] font-semibold text-theme-secondary/70 leading-tight text-center">
              Drive
            </span>
          </div>

          {/* Route & Stats */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
             <div className="flex items-center gap-2.5 text-[24px]">
               <span className="font-bold text-theme-secondary truncate max-w-[200px] sm:max-w-none">{sName}</span>
               <ArrowRight size={16} className="text-theme-secondary/30 shrink-0" />
               <span className="font-bold text-theme-secondary truncate max-w-[200px] sm:max-w-none">{dName}</span>
             </div>

             <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
               <div className="flex flex-col">
                  <span className="uppercase font-semibold text-theme-secondary/40 text-[12px] mb-0.5">Distance</span>
                  <span className="font-bold text-sm text-theme-secondary leading-none">{fuel.miles} mi</span>
               </div>
               
               <div className="w-px h-6 bg-theme-secondary/15 hidden sm:block"></div>

               <div className="flex flex-col">
                  <span className="uppercase font-semibold text-theme-secondary/40 text-[12px] mb-0.5">Drive Time</span>
                  <span className="font-bold text-sm text-theme-secondary leading-none">
                    {Math.floor(drivingData.duration_mins / 60)}h {Math.round(drivingData.duration_mins % 60)}m
                  </span>
               </div>

               <div className="w-px h-6 bg-theme-secondary/15 hidden sm:block"></div>

               <div className="flex flex-col">
                  <span className="uppercase font-semibold text-theme-primary/70 text-[12px] mb-0.5">Est. Fuel</span>
                  <span className="font-bold text-sm text-theme-primary leading-none">{fuel.gallons} Gal</span>
               </div>
             </div>

             {/* Desktop Expand Toggle */}
             <div className="hidden lg:flex items-center pt-2">
                <button
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-theme-secondary/50 hover:text-theme-primary transition-colors duration-150 px-2 py-1 -ml-2 rounded hover:bg-theme-primary/[0.06]"
                >
                  {showIntermediates ? 'Hide details' : 'View details'}
                  <ChevronDown size={18} className={`transition-transform duration-200 ${showIntermediates ? 'rotate-180' : ''}`} />
                </button>
             </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 pt-4 border-t lg:border-t-0 lg:border-l border-theme-secondary/[0.08] lg:pl-6 lg:min-w-[148px]">
             <div className="text-left lg:text-right">
                <p className="text-[12px] font-semibold text-theme-secondary/40 uppercase mb-0.5">Est. Gas Total</p>
                <p className="text-[24px] font-bold text-theme-secondary leading-none tabular-nums tracking-tight">
                  ${fuel.cost}
                </p>
             </div>
             <button 
                onClick={toggleDriveSelection}
                className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold transition-colors duration-150 border whitespace-nowrap ${
                  isSelected
                    ? 'bg-theme-primary border-theme-primary text-white'
                    : 'bg-theme-cool-white border-theme-secondary/20 text-theme-black hover:bg-theme-primary hover:text-theme-white hover:border-theme-primary'
                }`}
             >
                {isSelected && <CheckCircle2 size={18} />}
                {isSelected ? 'Selected' : 'Select Route'}
             </button>

             {/* Mobile Expand Toggle */}
             <button
               className="lg:hidden flex items-center gap-1 text-[12px] font-semibold text-theme-secondary/50 hover:text-theme-primary transition-colors"
             >
               {showIntermediates ? 'Hide' : 'Details'}
               <ChevronDown size={18} className={`transition-transform duration-200 ${showIntermediates ? 'rotate-180' : ''}`} />
             </button>
          </div>
        </div>

        {/* ── EXPANDED PANEL ── */}
        {showIntermediates && (
          <div 
            className="border-t border-theme-secondary/10 p-5 lg:p-7 animate-in slide-in-from-top-1 fade-in duration-200"
            style={{ background: 'rgba(248,250,252,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
               <div className="h-[3px] w-4 rounded-full bg-theme-secondary" />
               <span className="text-[12px] font-semibold uppercase text-theme-secondary">
                 Route Waypoints
               </span>
            </div>

            <div className="relative pl-5 border-l-2 border-theme-secondary/[0.10] space-y-6 ml-2">
              
              {/* Origin */}
              <div className="relative">
                <div className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full bg-theme-white border-2 border-theme-primary shadow-sm" />
                <div className="flex flex-col -mt-1.5 bg-theme-white border-2 border-theme-secondary/[0.08] p-3 rounded-lg w-full max-w-sm">
                  <span className="font-bold text-sm text-theme-secondary leading-tight">{sName}</span>
                  <span className="font-semibold text-[12px] text-theme-secondary/50 uppercase tracking-wide mt-1">Origin</span>
                </div>
              </div>

              {/* Passed Cities */}
              {passedCities.map((city: string, idx: number) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full bg-theme-white border-2 border-theme-secondary/30" />
                  <div className="flex flex-col -mt-1.5 px-3">
                    <span className="font-medium text-sm text-theme-secondary/70 leading-tight">{city}</span>
                  </div>
                </div>
              ))}

              {/* Destination */}
              <div className="relative">
                <div className="absolute -left-[24px] top-1 w-2.5 h-2.5 rounded-full bg-theme-white border-2 border-theme-primary shadow-sm" />
                <div className="flex flex-col -mt-1.5 bg-theme-white border-2 border-theme-secondary/[0.08] p-3 rounded-lg w-full max-w-sm">
                  <span className="font-bold text-sm text-theme-secondary leading-tight">{dName}</span>
                  <span className="font-semibold text-[12px] text-theme-secondary/50 uppercase tracking-wide mt-1">Destination</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}