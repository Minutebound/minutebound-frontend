"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

// UPDATED: Added rigorous checks to default to 1 night for One-Way trips
const getNumNights = (start?: string, end?: string) => {
  if (!start || !end || end.trim() === "") return 1;
  return Math.max(1, Math.ceil(Math.abs(new Date(end).getTime() - new Date(start).getTime()) / 86400000));
};

const formatAddress = (address: any) => {
  if (!address) return "Location unavailable";
  if (typeof address === "string") return address;
  const parts = [address.lines?.join(", "), address.cityName, address.stateCode, address.countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
};

const StayRow = ({ stay, uniqueKey, isSelected, toggleStaySelection, searchParams }: any) => {
  const offer = stay.roomDetails;
  const isUnavailable = offer?.unavailable || !offer || (offer.rooms && offer.rooms.length === 0);
  const numNights = getNumNights(searchParams?.startDate, searchParams?.endDate);

  return (
    <div className={`rounded-[1rem] border-[1px] transition-all duration-300 overflow-hidden cursor-pointer ${isSelected ? 'border-theme-violet bg-theme-violet/20' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-violet'}`}
         onClick={() => { if (!isUnavailable) toggleStaySelection(stay, uniqueKey); }}>
      
      <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 relative">
        <div className="flex flex-col flex-1 gap-1.5">
          <h4 className="font-black text-lg sm:text-xl text-theme-secondary leading-tight">
            {stay.name || stay.hotel?.name || "Hotel"}
          </h4>
          <p className="text-[10px] text-theme-secondary/50 font-bold uppercase tracking-widest line-clamp-2">
            📍 {formatAddress(stay.address)}
          </p>
        </div>

        <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-theme-secondary/10 pt-4 lg:pt-0 pl-0 lg:pl-6 w-full lg:w-auto">
            {!isUnavailable && offer ? (
              <div className="text-left lg:text-right">
                <p className="text-[26px] font-black text-theme-secondary tracking-tighter leading-none">
                  ${offer.price?.toFixed(0)}
                </p>
                <p className="text-[8px] sm:text-[10px] uppercase text-theme-secondary/30 tracking-widest mt-1">
                  Total for {numNights} {numNights > 1 ? 'nights' : 'night'}
                </p>
              </div>
            ) : (
              <div className="text-left lg:text-right">
                <span className="text-theme-error bg-theme-error/10 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-theme-error/20">
                  Sold Out
                </span>
              </div>
            )}
            
            <button 
              disabled={isUnavailable} 
              onClick={(e) => { e.stopPropagation(); if (!isUnavailable) toggleStaySelection(stay, uniqueKey); }} 
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-[100px] font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isUnavailable ? "opacity-40 cursor-not-allowed bg-theme-surface text-theme-secondary/50 shadow-none" : isSelected ? "bg-theme-secondary text-theme-light-blue" : "bg-theme-violet text-theme-light-blue hover:bg-theme-violet/90"}`}
            >
              {isSelected && !isUnavailable ? <CheckCircle2 size={16} /> : null}
              {isUnavailable ? "Unavailable" : isSelected ? "Selected" : "Select Stay"}
            </button>
        </div>
      </div>

      {offer?.rooms && !isUnavailable && isSelected && (
        <div className="bg-theme-surface/80 border-t border-theme-secondary/10 p-5 lg:p-8 animate-in slide-in-from-top-1 duration-300">
          <div className="flex items-center gap-2 mb-4">
             <div className="h-[2px] w-3 bg-theme-violet" />
             <span className="font-black uppercase tracking-widest text-theme-violet text-[10px]">
               Available Rooms
             </span>
          </div>

          <div className="flex flex-col gap-3">
            {offer.rooms.map((room: any, i: number) => (
              <div key={i} className="flex flex-col sm:flex-row justify-between bg-theme-white/50 p-4 rounded-lg border border-theme-secondary/5 gap-4 items-start sm:items-center">
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-black text-theme-secondary">
                    {room.category || "Standard Room"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-theme-light-blue border border-theme-secondary/10 px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest text-theme-secondary/60">{room.bed_type || "Standard Bed"}</span>
                    <span className="bg-theme-light-blue border border-theme-secondary/10 px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest text-theme-secondary/60">{room.beds_count || 1} Bed(s)</span>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                    <p className="text-lg font-black text-theme-secondary tracking-tight">
                      ${(room.price / numNights).toFixed(0)} <span className="text-[10px] text-theme-secondary/40 uppercase tracking-widest font-bold">/ night</span>
                    </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function StaysCard({ stays, searchParams }: { stays: any[]; searchParams?: any; }) {
  const [selectedStayKeys, setSelectedStayKeys] = useState<string[]>([]);
  
  // UPDATED: Read from sessionStorage
  useEffect(() => { 
    const tripState = sessionStorage.getItem("selected_trip_state"); 
    if (tripState) { 
      try { 
        const parsed = JSON.parse(tripState); 
        if (parsed.stays) setSelectedStayKeys(parsed.stays.map((s: any) => s._selectionKey)); 
      } catch (e) {} 
    } 
  }, [stays]);

  // UPDATED: Write to sessionStorage and dispatch new event
  const toggleStaySelection = (stay: any, uniqueKey: string) => { 
    const tripStateStr = sessionStorage.getItem("selected_trip_state"); 
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {}; 
    const isSelected = selectedStayKeys.includes(uniqueKey); 
    if (isSelected) { 
      tripState.stays = []; 
      setSelectedStayKeys([]); 
    } else { 
      tripState.stays = [ { ...stay, _selectionKey: uniqueKey, offerDetails: stay.roomDetails } ]; 
      setSelectedStayKeys([uniqueKey]); 
    } 
    sessionStorage.setItem("selected_trip_state", JSON.stringify(tripState)); 
    window.dispatchEvent(new Event("selected_trip_state_changed"));
  };

  if (!stays || stays.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-secondary/20 bg-theme-secondary/5 rounded-[1rem] text-center flex items-center justify-center min-h-[120px]">
        <span className="text-[10px] text-theme-secondary/40 font-black tracking-widest uppercase">
          No accommodations found for these dates.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary/50">
          {stays.length} Properties available
        </span>
      </div>
      
      {stays.slice(0, 12).map((stay, idx) => {
        const uniqueKey = stay.hotel_id || stay.hotelId || stay.hotel?.hotelId || stay.id || `stay-${idx}`;
        return <StayRow key={uniqueKey} stay={stay} uniqueKey={uniqueKey} isSelected={selectedStayKeys.includes(uniqueKey)} toggleStaySelection={toggleStaySelection} searchParams={searchParams} />;
      })}
    </div>
  );
}