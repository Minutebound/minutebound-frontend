"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plane, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ShieldCheck, 
  Gift, 
  Wifi, 
  Zap, 
  Utensils, 
  Briefcase,
  ArrowRight
} from 'lucide-react';

type SortOption = 'price_asc' | 'duration_asc';

export default function FlightCard({ flights, loading, searchParams }: { flights: any[], loading?: boolean, searchParams?: any }) {
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);
  const [expandedFlightKey, setExpandedFlightKey] = useState<string | null>(null);

  const travelerCount = (searchParams?.adults || 1) + (searchParams?.children || 0);

  useEffect(() => {
    const tripStateStr = localStorage.getItem('trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.flights && tripState.flights.length > 0) {
          setSelectedFlightKeys(tripState.flights.map((f: any) => f._selectionKey));
        } else {
          setSelectedFlightKeys([]);
        }
      } catch (e) {
        console.error("Error parsing trip_state localStorage:", e);
      }
    }
  }, [flights]);

  const toggleFlightSelection = (flight: any, uniqueKey: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const tripStateStr = localStorage.getItem('trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    const isSelected = selectedFlightKeys.includes(uniqueKey);

    if (isSelected) {
      tripState.flights = [];
      setSelectedFlightKeys([]);
    } else {
      const flightToSave = { ...flight, _selectionKey: uniqueKey };
      tripState.flights = [flightToSave];
      setSelectedFlightKeys([uniqueKey]);
    }

    localStorage.setItem('trip_state', JSON.stringify(tripState)); 
    window.dispatchEvent(new Event("trip_state_changed"));
  };

  const getPrice = (f: any) => {
    const rawPrice = f.price?.grandTotal || f.price?.total || f.price || 0;
    if (typeof rawPrice === 'number') return rawPrice;
    return parseFloat(String(rawPrice).replace(/[^\d.-]/g, '')) || 0;
  };

  const sortedFlights = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return [];
    return [...flights].sort((a, b) => {
      if (sortBy === 'price_asc') return getPrice(a) - getPrice(b);
      return 0;
    });
  }, [flights, sortBy]);

  if (loading) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary/50">
          {flights.length} Flight options available
        </span>
        
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 bg-theme-light-blue text-theme-secondary rounded-sm text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Sort: {sortBy === 'price_asc' ? 'Lowest Price' : 'Fastest'}
            <ChevronDown size={12} />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-theme-light-blue border border-theme-secondary/20 rounded-sm shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
            <button onClick={() => setSortBy('price_asc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-blue/10 text-theme-secondary border-b border-theme-secondary/5">
              Lowest Price (Average)
            </button>
            <button onClick={() => setSortBy('duration_asc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-blue/10 text-theme-secondary">
              Fastest (Average)
            </button>
          </div>
        </div>
      </div>

      {sortedFlights.map((flight, flightIndex) => {
        const uniqueKey = flight.id ? `${flight.id}-${flightIndex}` : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);
        const isExpanded = expandedFlightKey === uniqueKey;

        return (
          <div 
            key={uniqueKey} 
            onClick={() => setExpandedFlightKey(isExpanded ? null : uniqueKey)}
            className={`rounded-[1rem] border-[1px] cursor-pointer transition-all duration-300 overflow-hidden ${isSelected ? 'border-theme-blue bg-theme-blue/20' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-blue'}`}
          >
            {/* MAIN CARD VIEW - MOBILE OPTIMIZED */}
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 relative">
              
              {/* Airline Branding */}
              <div className="flex flex-row lg:flex-col items-center gap-3 lg:gap-1 shrink-0 w-full lg:w-auto">
                <div className="w-16 h-16 bg-white rounded-sm border border-theme-secondary/10 p-1.5 shadow-sm">
                  <img src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} className="w-full h-full object-contain" alt="airline" />
                </div>
                <span className="font-black text-theme-secondary/60 uppercase">{flight.airline_name || flight.airline_code}</span>
              </div>

              {/* ROUTE SUMMARY */}
              <div className="flex-1 w-full space-y-4 lg:space-y-6">
                {flight.itineraries?.slice(0, 2).map((itin, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-1 flex items-center gap-2 sm:gap-4">
                      <div className="text-right min-w-[40px] sm:min-w-[45px]">
                        <p className="text-[16px] font-black text-theme-secondary">{new Date(itin.segments[0].departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-[16px] font-bold text-theme-secondary/40">{itin.segments[0].departure_airport}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center gap-1 px-1 sm:px-2">
                         <div className="w-6 sm:w-8 text-[10px] align-center font-bold uppercase text-theme-secondary/50">{i === 0 ? 'DEPART' : 'RETURN'}</div>
                        <div className="w-full h-[2px] bg-theme-secondary/20 relative rounded-full overflow-hidden">
                           <div className="absolute inset-y-0 left-0 bg-theme-blue/20 w-full opacity-40" />
                        </div>
                        <span className={`text-[10px] font-black uppercase ${itin.stops === 0 ? 'text-theme-success' : 'text-theme-error'} tracking-tighter text-center line-clamp-1`}>
                          {itin.duration.replace('PT','').toLowerCase()} • {itin.stops === 0 ? 'Direct' : `${itin.stops} stop`}
                        </span>
                      </div>

                      <div className="min-w-[40px] sm:min-w-[45px]">
                        <p className="text-[16px] font-black text-theme-secondary">{new Date(itin.segments[itin.segments.length-1].arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-[16px] font-bold text-theme-secondary/40">{itin.segments[itin.segments.length-1].arrival_airport}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DETAILS TOGGLE (Centered flow, no absolute positioning for mobile) */}
              <div className="flex justify-center w-auto lg:w-auto py-2 ">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-theme-blue transition-colors">Details</span>
                  <ChevronDown size={14} className={`text-theme-secondary/30 group-hover:text-theme-blue transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* PRICE & ACTION (Stacks horizontally on mobile, vertically on desktop) */}
              <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-theme-secondary/10 pt-4 lg:pt-0 pl-0 lg:pl-6 w-full lg:w-auto">
                <div className="text-left lg:text-right">
                  <p className="text-[26px] font-black text-theme-secondary tracking-tighter leading-none"><>US$</>{getPrice(flight).toFixed(0)}</p>
                  <p className="text-[8px] sm:text-[10px] uppercase text-theme-secondary/30 tracking-widest mt-1">
                    Roundtrip / {travelerCount} {travelerCount > 1 ? 'persons' : 'person'}
                  </p>
                </div>
                <button 
                  onClick={(e) => toggleFlightSelection(flight, uniqueKey, e)}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-[100px] font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isSelected ? 'bg-theme-secondary text-theme-light-blue' : 'bg-theme-blue text-theme-light-blue hover:bg-theme-blue/90'}`}
                >
                  {isSelected ? <CheckCircle2 size={16} /> : null}
                  {isSelected ? 'Selected' : 'Select Flight'}
                </button>
              </div>
            </div>

            {/* EXPANDED DETAILS */}
            {isExpanded && (
  <div className="bg-theme-surface border-t border-theme-secondary/10 p-5 lg:p-8 animate-in slide-in-from-top-1 duration-300">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <div className="lg:col-span-8 space-y-8">
        {flight.itineraries?.map((itin, idx) => (
          <div key={idx} className="space-y-4">
            
            {/* Outbound / Inbound Header */}
            <div className="flex items-center gap-2">
               <div className="h-[2px] w-3 bg-theme-blue" />
               <span className="font-black uppercase tracking-widest text-theme-blue text-sm">
                 {idx === 0 ? 'Outbound' : 'Inbound'}
               </span>
            </div>
            
            {/* Simplified Vertical Timeline */}
            <div className="relative pl-5 border-l-2 border-theme-secondary/10 space-y-6 ml-1.5">
              {itin.segments.map((seg, sIdx) => (
                <div key={sIdx} className="relative">
                  
                  {/* Timeline Dot */}
                  <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-theme-white/50 border-2 border-theme-blue" />
                  
                  {/* Flight Segment Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 bg-theme-white p-3 rounded-lg border border-theme-secondary/5">
                    
                    {/* Departure */}
                    <div className="flex flex-col">
                      <span className="font-black text-theme-secondary">{seg.departure_airport_name || seg.departure_airport}</span>
                      <span className="font-bold text-theme-secondary/60">
                        {new Date(seg.departure_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Simple Directional Arrow */}
                    <ArrowRight size={16} className="text-theme-secondary/20 hidden sm:block shrink-0" />
                  
                    {/* Arrival */}
                    <div className="flex flex-col sm:text-right mt-1 sm:mt-0">
                      <span className="font-black text-theme-secondary">{seg.arrival_airport_name || seg.arrival_airport}</span>
                      <span className="font-bold text-theme-secondary/60">
                        {new Date(seg.arrival_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
            
          </div>
        ))}
      </div>
      
{/* POLICIES & AMENITIES*/}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-3">
                      <h5 className="font-black uppercase tracking-[0.2em] text-theme-blue flex items-center gap-2"><ShieldCheck size={12}/> Policies</h5>
                      <div className="space-y-1">
                        <div className="p-2.5 bg-theme-white rounded-sm border border-theme-secondary/5 flex justify-between items-center font-black uppercase">
                          <span className="text-theme-secondary/40 flex items-center gap-2"><Briefcase size={16}/> Baggage</span>
                          <span className="text-theme-secondary">Standard</span>
                        </div>
                        <div className="p-2.5 bg-theme-white rounded-sm border border-theme-secondary/5 flex justify-between items-center font-black uppercase">
                          <span className="text-theme-secondary/40">Changes</span>
                          <span className="text-emerald-500">Allowed</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-black uppercase tracking-[0.2em] text-theme-blue flex items-center gap-2"><Gift size={12}/> Amenities</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <BenefitIcon icon={<Wifi size={16} />} label="WiFi" />
                        <BenefitIcon icon={<Zap size={16} />} label="Power" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BenefitIcon({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-theme-white rounded-sm border border-theme-secondary/5">
      <div className="text-theme-blue">{icon}</div>
      <span className="font-black uppercase text-theme-secondary/50">{label}</span>
    </div>
  );
}