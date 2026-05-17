"use client";
import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, ChevronDown, Image as ImageIcon, Info, ShieldAlert } from "lucide-react";

type SortOption = 'price_asc' | 'price_desc';

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

const formatDate = (dateString: string) => {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const StayRow = ({ stay, uniqueKey, isSelected, toggleStaySelection, searchParams }: any) => {
  const offer = stay.roomDetails;
  const isUnavailable = offer?.unavailable || !offer || (offer.rooms && offer.rooms.length === 0);
  const numNights = getNumNights(searchParams?.startDate, searchParams?.endDate);

  // Extract chain code if available
  const chainCode = stay.chainCode || stay.hotel?.chainCode || offer?.rooms?.[0]?.chain_code || null;

  return (
    <div className={`rounded-[1rem] border-[1px] transition-all duration-300 overflow-hidden cursor-pointer ${isSelected ? 'border-theme-primary bg-theme-primary/10 shadow-md' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-primary hover:shadow-sm'}`}
         onClick={() => { if (!isUnavailable) toggleStaySelection(stay, uniqueKey); }}>
      
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 relative">
        
        {/* Left Section: Image Placeholder & Info */}
        <div className="flex flex-row gap-4 flex-1 items-start lg:items-center">
          
          {/* Photo Placeholder (Ready for media API integration) */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-theme-secondary/5 rounded-xl border border-theme-secondary/10 flex flex-col items-center justify-center shrink-0 text-theme-secondary/30">
            <ImageIcon size={24} className="mb-1" />
            <span className="text-[8px] font-black uppercase tracking-widest text-center px-2">No Image Provided</span>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-black text-lg sm:text-xl text-theme-secondary leading-tight">
                {stay.name || stay.hotel?.name || "Hotel"}
              </h4>
              {chainCode && (
                <span className="bg-theme-secondary/10 text-theme-secondary/80 px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest border border-theme-secondary/10">
                  Chain: {chainCode}
                </span>
              )}
            </div>
            
            <p className="text-[10px] text-theme-secondary/50 font-bold uppercase tracking-widest line-clamp-2 mt-0.5">
              📍 {formatAddress(stay.address)}
            </p>

            {/* Global Amenities Preview (First Room) */}
            {offer?.rooms?.[0]?.amenities && offer.rooms[0].amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-md hidden sm:flex">
                {offer.rooms[0].amenities.slice(0, 4).map((amenity: string, idx: number) => (
                  <span key={idx} className="text-[8px] font-bold text-theme-secondary/60 bg-theme-secondary/5 px-2 py-1 rounded-[4px] capitalize border border-theme-secondary/5 whitespace-nowrap">
                    {amenity.replace(/_/g, ' ').toLowerCase()}
                  </span>
                ))}
                {offer.rooms[0].amenities.length > 4 && (
                  <span className="text-[8px] font-bold text-theme-secondary/40 px-1 py-1">
                    +{offer.rooms[0].amenities.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Pricing & Action */}
        <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-theme-secondary/10 pt-4 lg:pt-0 pl-0 lg:pl-6 w-full lg:w-auto">
            {!isUnavailable && offer ? (
              <div className="text-left lg:text-right">
                <p className="text-[26px] font-black text-theme-secondary tracking-tighter leading-none">
                  ${offer.price?.toFixed(0)}
                </p>
                <p className="text-[8px] sm:text-[9px] uppercase text-theme-secondary/40 font-bold tracking-widest mt-1.5">
                  Starting price ({numNights} {numNights > 1 ? 'nights' : 'night'})
                </p>
              </div>
            ) : (
              <div className="text-left lg:text-right">
                <span className="text-theme-error bg-theme-error/10 px-3 py-1.5 rounded-sm text-[8px] font-black uppercase tracking-widest border border-theme-error/20">
                  Sold Out
                </span>
              </div>
            )}
            
            <button 
              disabled={isUnavailable} 
              onClick={(e) => { e.stopPropagation(); if (!isUnavailable) toggleStaySelection(stay, uniqueKey); }} 
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-[100px] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap mt-1 ${isUnavailable ? "opacity-40 cursor-not-allowed bg-theme-surface text-theme-secondary/50 shadow-none" : isSelected ? "bg-theme-secondary text-theme-white" : "bg-theme-primary text-theme-white hover:bg-theme-primary/90"}`}
            >
              {isSelected && !isUnavailable ? <CheckCircle2 size={16} /> : null}
              {isUnavailable ? "Unavailable" : isSelected ? "Selected" : "Select Stay"}
            </button>
        </div>
      </div>

      {offer?.rooms && !isUnavailable && isSelected && (
        <div className="bg-theme-secondary/5 border-t border-theme-secondary/10 p-5 lg:p-8 animate-in slide-in-from-top-1 duration-300">
          <div className="flex items-center gap-2 mb-5">
             <div className="h-[2px] w-4 bg-theme-primary" />
             <span className="font-black uppercase tracking-[0.15em] text-theme-primary text-[10px]">
               Available Room Offers
             </span>
          </div>

          <div className="flex flex-col gap-4">
            {offer.rooms.map((room: any, i: number) => (
              <div key={i} className="flex flex-col lg:flex-row justify-between bg-theme-white p-5 rounded-xl border border-theme-secondary/10 gap-6 items-start shadow-sm hover:shadow-md transition-shadow">
                
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-theme-secondary text-[16px]">
                      {room.category === "ROOM" ? "Standard Room" : room.category || room.room_name || "Standard Room"}
                    </p>
                    
                    {/* Refundable Badge */}
                    {room.is_refundable ? (
                      <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={10} /> Refundable
                      </span>
                    ) : (
                      <span className="bg-theme-secondary/5 text-theme-secondary/50 border border-theme-secondary/10 px-2 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                         Non-Refundable
                      </span>
                    )}
                  </div>
                  
                  {room.description && (
                    <p className="text-[11px] font-medium text-theme-secondary/70 leading-relaxed max-w-3xl line-clamp-2 mt-1">
                      {room.description.replace(/\n/g, ' ')}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-1 rounded-[4px] text-[9px] font-black uppercase tracking-widest text-theme-primary flex items-center gap-1">
                      🛏️ {room.bed_type}
                    </span>
                    <span className="bg-theme-primary/10 border border-theme-primary/20 px-2.5 py-1 rounded-[4px] text-[9px] font-black uppercase tracking-widest text-theme-primary">
                      {room.beds_count || 1} Bed(s)
                    </span>
                  </div>

                  {/* Detailed Cancellation Policies Box */}
                  {room.cancellation_policies && room.cancellation_policies.length > 0 && (
                    <div className="mt-3 bg-red-50/50 border border-red-100 p-3 rounded-lg flex flex-col gap-1.5 max-w-lg">
                      <div className="flex items-center gap-1.5 text-red-600 mb-0.5">
                        <ShieldAlert size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Cancellation Terms</span>
                      </div>
                      {room.cancellation_policies.map((pol: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] font-medium text-red-800/80 bg-red-100/30 px-2 py-1 rounded">
                          <span>Deadline: {formatDate(pol.deadline)}</span>
                          <span className="font-bold">Fee: ${parseFloat(pol.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-left lg:text-right shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-theme-secondary/10 w-full lg:w-auto flex flex-row lg:flex-col justify-between items-end">
                    <div className="lg:text-right">
                      <p className="text-2xl font-black text-theme-secondary tracking-tight">
                        ${(room.price / numNights).toFixed(0)} 
                        <span className="text-[10px] text-theme-secondary/40 uppercase tracking-widest font-bold ml-1">/ night</span>
                      </p>
                      <p className="text-[10px] font-bold text-theme-secondary/50 mt-1 uppercase tracking-widest">
                        Total: ${room.price.toFixed(0)}
                      </p>
                    </div>
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
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  
  useEffect(() => { 
    const tripState = sessionStorage.getItem("selected_trip_state"); 
    if (tripState) { 
      try { 
        const parsed = JSON.parse(tripState); 
        if (parsed.stays) setSelectedStayKeys(parsed.stays.map((s: any) => s._selectionKey)); 
      } catch (e) {} 
    } 
  }, [stays]);

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

  const sortedStays = useMemo(() => {
    if (!stays || !Array.isArray(stays)) return [];
    return [...stays].sort((a, b) => {
      const priceA = a.roomDetails?.price || a.price || Infinity;
      const priceB = b.roomDetails?.price || b.price || Infinity;
      
      const aUnavail = a.roomDetails?.unavailable || !a.roomDetails || a.roomDetails.rooms?.length === 0;
      const bUnavail = b.roomDetails?.unavailable || !b.roomDetails || b.roomDetails.rooms?.length === 0;
      
      if (aUnavail && !bUnavail) return 1;
      if (!aUnavail && bUnavail) return -1;
      
      return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  }, [stays, sortBy]);

  if (!stays || stays.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-secondary/20 bg-theme-secondary/5 rounded-[1rem] text-center flex items-center justify-center min-h-[124px]">
        <span className="text-[10px] text-theme-secondary/40 font-black tracking-widest uppercase">
          No accommodations found for these dates.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="sticky top-[113px] z-[45] bg-theme-white py-3 border-b border-theme-secondary/10 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary/50">
          {stays.length} Properties available
        </span>

        <div className="relative group z-[50]">
          <button className="flex items-center gap-2 px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Sort: {sortBy === 'price_asc' ? 'Low to High (Price)' : 'High to Low (Price)'}
            <ChevronDown size={12} />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-theme-white border border-theme-secondary/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
            <button onClick={() => setSortBy('price_asc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 text-theme-secondary border-b border-theme-secondary/5">
              Price: Low to High (Price)
            </button>
            <button onClick={() => setSortBy('price_desc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 text-theme-secondary">
              Price: High to Low
            </button>
          </div>
        </div>
      </div>
      
      {sortedStays.slice(0, 12).map((stay, idx) => {
        const uniqueKey = stay.hotel_id || stay.hotelId || stay.hotel?.hotelId || stay.id || `stay-${idx}`;
        return <StayRow key={uniqueKey} stay={stay} uniqueKey={uniqueKey} isSelected={selectedStayKeys.includes(uniqueKey)} toggleStaySelection={toggleStaySelection} searchParams={searchParams} />;
      })}
    </div>
  );
}