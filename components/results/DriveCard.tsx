"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronDown, ArrowRight, Car, CarFront, Key, TrainFront } from "lucide-react";

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
  const milesNum = parseFloat(fuel.miles);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-center px-2">
        <span className="font-black uppercase tracking-[0.2em] text-theme-secondary/50">
          Road Trip Details
        </span>
      </div>

      <div 
        className={`rounded-[1rem] border-[1px] transition-all duration-300 overflow-hidden ${
          isSelected ? 'border-theme-secondary bg-theme-surface/60 shadow-md shadow-theme-primary/5' : 'border-theme-secondary/20 bg-theme-white hover:border-theme-secondary/40'
        }`}
      >
        {/* --- MAIN CARD --- */}
        <div 
          onClick={toggleDriveSelection}
          className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 relative cursor-pointer"
        >
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-3 lg:gap-2 shrink-0 w-full lg:w-auto">
            <div className="w-12 h-12 bg-theme-primary/10 rounded-xl flex items-center justify-center shadow-sm text-theme-primary">
              <Car size={24} />
            </div>
            <div className="flex flex-col lg:hidden">
               <h4 className="font-black text-lg text-theme-secondary leading-tight">Drive</h4>
            </div>
          </div>

          <div className="flex-1 w-full space-y-4">
             <div className="flex items-center gap-3">
               <span className="font-black text-theme-secondary">{sName}</span>
               <ArrowRight size={16} className="text-theme-secondary/30" />
               <span className="font-black text-theme-secondary">{dName}</span>
             </div>

             <div className="flex flex-wrap lg:flex-nowrap gap-4 sm:gap-8">
               <div className="flex flex-col">
                  <span className="uppercase font-black text-theme-secondary/40 tracking-widest text-[10px]">Distance</span>
                  <span className="font-black text-theme-secondary leading-tight">{fuel.miles} mi</span>
                  <span className="font-bold text-[10px] text-theme-secondary/40 uppercase tracking-wider">{drivingData.distance_km} km</span>
               </div>
               
               <div className="w-px h-8 bg-theme-secondary/10 hidden sm:block"></div>

               <div className="flex flex-col">
                  <span className="uppercase font-black text-theme-secondary/40 tracking-widest text-[10px]">Drive Time</span>
                  <span className="font-black text-theme-secondary leading-tight">
                    {Math.floor(drivingData.duration_mins / 60)}h {Math.round(drivingData.duration_mins % 60)}m
                  </span>
               </div>

               <div className="w-px h-8 bg-theme-secondary/10 hidden sm:block"></div>

               <div className="flex flex-col">
                  <span className="uppercase font-black text-theme-primary tracking-widest text-[10px]">Fuel Estimate</span>
                  <span className="font-black text-theme-primary leading-tight">${fuel.cost}</span>
                  <span className="font-bold text-[10px] text-theme-primary/60 uppercase tracking-wider">{fuel.gallons} Gal</span>
               </div>
             </div>
          </div>

          <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-theme-secondary/10 pt-4 lg:pt-0 pl-0 lg:pl-6 w-full lg:w-auto">
             <div className="text-left lg:text-right">
                <p className="text-[24px] font-black text-theme-secondary tracking-tighter leading-none">${fuel.cost}</p>
                <p className="text-[10px] sm:text-[10px] uppercase text-theme-secondary/40 tracking-widest mt-1">Est. Gas Total</p>
             </div>
             <button 
                onClick={(e) => { e.stopPropagation(); toggleDriveSelection(); }}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-[100px] font-black text-[10px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isSelected ? 'bg-theme-secondary text-theme-white' : 'bg-theme-primary text-theme-white hover:bg-theme-primary/90'}`}             
             >
                {isSelected ? <CheckCircle2 size={18} /> : null}
                {isSelected ? "Selected" : "Select Route"}
             </button>
          </div>
        </div>

        {/* --- ALTERNATIVE TRANSPORT SECTION ---
        <div className="border-t border-theme-secondary/5 bg-theme-surface/50 p-4 lg:px-6">
           <h5 className="text-[10px] uppercase tracking-widest font-black text-theme-secondary/50 mb-3">Alternative Transport Options</h5>
           <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
              
              Rental Car Option
              <div className="flex items-center gap-3 p-3 rounded-xl border border-theme-secondary/20 bg-theme-white hover:border-theme-primary transition-colors min-w-[160px] cursor-pointer group">
                <div className="p-2 rounded-lg bg-theme-primary/10 text-theme-primary group-hover:bg-theme-primary group-hover:text-theme-white transition-colors">
                  <Key size={18}/>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-theme-secondary leading-tight">Rental Car</span>
                  <span className="font-bold text-[10px] uppercase tracking-wider text-theme-secondary/50">From $45/day</span>
                </div>
              </div>

              Rideshare Option
              <div className="flex items-center gap-3 p-3 rounded-xl border border-theme-secondary/20 bg-theme-white hover:border-theme-primary transition-colors min-w-[160px] cursor-pointer group">
                <div className="p-2 rounded-lg bg-theme-primary/10 text-theme-primary group-hover:bg-theme-primary group-hover:text-theme-white transition-colors">
                  <CarFront size={18}/>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-theme-secondary leading-tight">Rideshare</span>
                  <span className="font-bold text-[10px] uppercase tracking-wider text-theme-secondary/50">
                    {milesNum > 100 ? "Not Recommended" : `Est. $${Math.round(milesNum * 2.5 + 5)}`}
                  </span>
                </div>
              </div>

              Public Transit Option
              <div className="flex items-center gap-3 p-3 rounded-xl border border-theme-secondary/10 bg-theme-secondary/5 opacity-70 cursor-not-allowed min-w-[160px]">
                <div className="p-2 rounded-lg bg-theme-secondary/10 text-theme-secondary/60">
                  <TrainFront size={18}/>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-theme-secondary/60 leading-tight">Transit</span>
                  <span className="font-bold text-[10px] uppercase tracking-wider text-theme-secondary/40">Coming Soon</span>
                </div>
              </div>

           </div>
        </div> */}

        {/* --- ROUTE DETAILS TOGGLE --- */}
        <div 
           className="flex justify-center w-full py-2 border-t border-theme-secondary/10 hover:bg-theme-secondary/5 transition-colors cursor-pointer"
           onClick={(e) => { e.stopPropagation(); toggleIntermediates(); }}
        >
          <div className="flex flex-col items-center gap-1 group">
             <span className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary/60 group-hover:text-theme-primary transition-colors">
               Route Map Details
             </span>
             <ChevronDown size={16} className={`text-theme-secondary/40 group-hover:text-theme-primary transition-transform ${showIntermediates ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* --- EXPANDED ROUTE DETAILS --- */}
        {showIntermediates && (
          <div className="bg-theme-surface/40 border-t border-theme-secondary/10 p-5 lg:p-8 animate-in slide-in-from-top-1 duration-300">
            <div className="flex items-center gap-2 mb-6">
               <div className="h-[2px] w-3 bg-theme-primary" />
               <span className="font-black uppercase tracking-widest text-theme-primary">
                 Route list
               </span>
            </div>

            <div className="relative ml-2">
              <div className="relative pl-6 border-l-2 border-theme-secondary/20 pb-6">
                <div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-theme-surface border-4 border-theme-primary flex items-center justify-center shadow-sm" />
                <div className="flex flex-col -mt-1">
                  <span className="font-black text-theme-secondary leading-tight">{sName}</span>
                  <span className="font-bold text-[10px] text-theme-secondary/40 uppercase tracking-widest mt-0.5">Source</span>
                </div>
              </div>

              {passedCities.map((city: string, idx: number) => (
                <div key={idx} className="relative pl-6 border-l-2 border-theme-secondary/20 pb-6">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-theme-white border-2 border-theme-secondary/30" />
                  <span className="font-bold text-theme-secondary/70">{city}</span>
                </div>
              ))}

              <div className="relative pl-6">
                <div className="absolute -left-[10px] top-0 w-4 h-4 rounded-full bg-theme-secondary border-[3px] border-theme-primary/30 flex items-center justify-center shadow-sm" />
                <div className="flex flex-col -mt-1">
                  <span className="font-black text-theme-secondary leading-tight">{dName}</span>
                  <span className="font-bold text-[10px] text-theme-secondary/40 uppercase tracking-widest mt-0.5">Destination</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}