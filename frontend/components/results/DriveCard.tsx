"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronDown, ArrowRight, Car } from "lucide-react";

export default function DrivingCard({ drivingData }: { drivingData?: any }) {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [showIntermediates, setShowIntermediates] = useState<boolean>(false);

  useEffect(() => {
    const savedState = sessionStorage.getItem("drive_intermediates_open");
    if (savedState === "true") {
      setShowIntermediates(true);
    }
  }, []);

  // UPDATED: Read from sessionStorage
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

  // UPDATED: Write to sessionStorage and dispatch new event
  const toggleDriveSelection = () => {
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
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2">
        <span className="font-black uppercase tracking-[0.2em] text-theme-secondary/50">
          Road Trip Details
        </span>
      </div>

      <div 
        onClick={toggleDriveSelection}
        className={`rounded-[1rem] border-[1px] transition-all duration-300 overflow-hidden cursor-pointer ${
          isSelected ? 'border-theme-primary bg-theme-primary/10' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-primary'
        }`}
      >
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 relative">
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-2 shrink-0 w-full lg:w-auto">
            <div className="w-12 h-12 bg-theme-light-blue rounded-sm p-2 flex items-center justify-center shadow-sm text-theme-secondary">
              <Car size={24} />
            </div>
            <div className="flex flex-col lg:hidden">
               <h4 className="font-black text-lg text-theme-secondary leading-tight">Drive</h4>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
             <div className="flex items-center gap-3">
               <span className="font-black text-theme-secondary text-[16px] ">{sName}</span>
               <ArrowRight size={14} className="text-theme-secondary/30" />
               <span className="font-black text-theme-secondary text-[16px] ">{dName}</span>
             </div>

             <div className="flex flex-wrap lg:flex-nowrap gap-4 sm:gap-8">
               <div className="flex flex-col">
                  <span className=" uppercase font-black text-theme-secondary/40 tracking-widest">Distance</span>
                  <span className="text-[16px] font-black text-theme-secondary leading-tight">{fuel.miles} mi</span>
                  <span className="font-bold text-theme-secondary/40">{drivingData.distance_km} km</span>
               </div>
               
               <div className="w-px h-8 bg-theme-secondary/10 hidden sm:block"></div>

               <div className="flex flex-col">
                  <span className=" uppercase font-black text-theme-secondary/40 tracking-widest">Drive Time</span>
                  <span className="text-[16px] font-black text-theme-secondary leading-tight">
                    {Math.floor(drivingData.duration_mins / 60)}h {Math.round(drivingData.duration_mins % 60)}m
                  </span>
               </div>

               <div className="w-px h-8 bg-theme-secondary/10 hidden sm:block"></div>

               <div className="flex flex-col">
                  <span className=" uppercase font-black text-theme-primary tracking-widest">Fuel Estimate</span>
                  <span className="text-[16px] font-black text-theme-primary leading-tight">${fuel.cost}</span>
                  <span className=" font-bold text-theme-primary/60">{fuel.gallons} Gal</span>
               </div>
             </div>
          </div>

          <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-theme-secondary/10 pt-4 lg:pt-0 pl-0 lg:pl-6 w-full lg:w-auto">
             <div className="text-left lg:text-right">
                <p className="text-[26px] font-black text-theme-secondary tracking-tighter leading-none">${fuel.cost}</p>
                <p className="text-[8px] sm:text-[10px] uppercase text-theme-secondary/30 tracking-widest mt-1">Est. Gas Total</p>
             </div>
             <button 
                onClick={(e) => { e.stopPropagation(); toggleDriveSelection(); }}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-[100px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isSelected ? "bg-theme-secondary text-theme-light-blue" : "bg-theme-primary text-theme-light-blue hover:bg-theme-primary/90"}`}
             >
                {isSelected ? <CheckCircle2 size={20} /> : null}
                {isSelected ? "Selected" : "Select Route"}
             </button>
          </div>
        </div>

        <div 
           className="flex justify-center w-full py-2 border-t border-theme-secondary/5 hover:bg-theme-secondary/[0.02] transition-colors"
           onClick={(e) => { e.stopPropagation(); toggleIntermediates(); }}
        >
          <div className="flex flex-col items-center gap-1 group">
             <span className="text-[10px] font-bold uppercase tracking-widest text-theme-primary transition-colors">
               Route Details
             </span>
             <ChevronDown size={14} className={`text-theme-secondary/30 group-hover:text-theme-primary transition-transform ${showIntermediates ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {showIntermediates && (
          <div className="bg-theme-surface/80 border-t border-theme-secondary/10 p-5 lg:p-8 animate-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-2 mb-6">
               <div className="h-[2px] w-3 bg-theme-primary" />
               <span className="font-black uppercase tracking-widest text-theme-primary">
                 Route list
               </span>
            </div>

            <div className="relative ml-2">
              <div className="relative pl-6 border-l-2 border-theme-secondary/20 pb-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-theme-light-blue border-4 border-theme-primary flex items-center justify-center shadow-sm" />
                <div className="flex flex-col -mt-1">
                  <span className="text-[16px] font-black text-theme-secondary leading-tight">{sName}</span>
                  <span className="font-bold text-theme-secondary/40 uppercase tracking-widest mt-0.5">Source</span>
                </div>
              </div>

              {passedCities.map((city: string, idx: number) => (
                <div key={idx} className="relative pl-6 border-l-2 border-theme-secondary/20 pb-6">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-theme-white border-2 border-theme-secondary/30" />
                  <span className="font-bold text-theme-secondary/70">{city}</span>
                </div>
              ))}

              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-theme-secondary border-[3px] border-theme-light-blue flex items-center justify-center shadow-sm" />
                <div className="flex flex-col -mt-1">
                  <span className="text-[16px] font-black text-theme-secondary leading-tight">{dName}</span>
                  <span className="font-bold text-theme-secondary/40 uppercase tracking-widest mt-0.5">Destination</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}