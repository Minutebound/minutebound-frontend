"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plane, Clock, CheckCircle2, ChevronDown, ShieldCheck, Gift, Wifi, Zap, Utensils, Briefcase, ArrowRight, Leaf, Luggage, BatteryCharging
} from 'lucide-react';

type SortOption = 'price_asc' | 'duration_asc';

export default function FlightCard({ flights, loading, searchParams }: { flights: any[], loading?: boolean, searchParams?: any }) {
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);
  const [expandedFlightKey, setExpandedFlightKey] = useState<string | null>(null);

  const travelerCount = (searchParams?.adults || 1) + (searchParams?.children || 0);
  const isRoundTrip = flights?.some(f => f.itineraries?.length > 1) || false;

  useEffect(() => {
    const tripStateStr = sessionStorage.getItem('selected_trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.flights && tripState.flights.length > 0) {
          setSelectedFlightKeys(tripState.flights.map((f: any) => f._selectionKey));
        } else {
          setSelectedFlightKeys([]);
        }
      } catch (e) {
        console.error("Error parsing selected_trip_state sessionStorage:", e);
      }
    }
  }, [flights]);

  const toggleFlightSelection = (flight: any, uniqueKey: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const tripStateStr = sessionStorage.getItem('selected_trip_state');
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

    sessionStorage.setItem('selected_trip_state', JSON.stringify(tripState)); 
    window.dispatchEvent(new Event("selected_trip_state_changed"));
  };

  const getPrice = (f: any) => {
    const rawPrice = f.price?.grandTotal || f.price?.total || f.price || 0;
    return typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^\d.-]/g, '')) || 0;
  };

  const getSortPrice = (f: any) => {
    const total = getPrice(f);
    return f.itineraries?.length ? total / f.itineraries.length : total;
  };

  const getTotalDurationMins = (flight: any) => {
    let totalMins = 0;
    flight.itineraries?.forEach((itin: any) => {
      let str = (itin.duration || '').toUpperCase().replace('PT', '').replace(/\s/g, '');
      let hours = 0;
      let minutes = 0;
      
      if (str.includes('H')) {
        const parts = str.split('H');
        hours = parseInt(parts[0]) || 0;
        str = parts[1] || '';
      }
      if (str.includes('M')) {
        minutes = parseInt(str.replace('M', '')) || 0;
      }
      totalMins += (hours * 60) + minutes;
    });
    
    return flight.itineraries?.length ? totalMins / flight.itineraries.length : totalMins;
  };

  const getLayoverDuration = (arrivalTime: string, nextDepartureTime: string) => {
    if (!arrivalTime || !nextDepartureTime) return '';
    const arr = new Date(arrivalTime).getTime();
    const dep = new Date(nextDepartureTime).getTime();
    const diffMins = Math.floor((dep - arr) / (1000 * 60));
    if (diffMins <= 0) return '';
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const sortedFlights = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return [];
    return [...flights].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return getSortPrice(a) - getSortPrice(b);
      }
      if (sortBy === 'duration_asc') {
        return getTotalDurationMins(a) - getTotalDurationMins(b);
      }
      return 0;
    });
  }, [flights, sortBy]);

  if (loading) return null;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      
{/* STICKY FLIGHT HEADER */}
      <div className=" bg-theme-white py-3 border-b border-theme-secondary/10 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary/50">
          {flights.length} Flight options available
        </span>
        
        <div className="relative group z-[50]">
          <button className="flex items-center gap-2 px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Sort: {sortBy === 'price_asc' ? 'Lowest Price' : 'Fastest Duration'}
            <ChevronDown size={12} />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-theme-white border border-theme-secondary/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
            <button onClick={() => setSortBy('price_asc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 text-theme-secondary border-b border-theme-secondary/5">
              Lowest Price {isRoundTrip && '(Average)'}
            </button>
            <button onClick={() => setSortBy('duration_asc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 text-theme-secondary">
              Fastest {isRoundTrip && '(Average)'}
            </button>
          </div>
        </div>
      </div>

      {sortedFlights.map((flight, flightIndex) => {
        const uniqueKey = flight.id ? `${flight.id}-${flightIndex}` : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);
        const isExpanded = expandedFlightKey === uniqueKey;

        let totalCheckedBags = 0;
        let hasWifi = false;
        let hasPower = false;
        let foodOption = null;

        flight.itineraries?.forEach((itin: any) => {
          itin.segments?.forEach((seg: any) => {
            if (seg.checked_bags > totalCheckedBags) totalCheckedBags = seg.checked_bags;
            if (seg.amenities?.wifi) hasWifi = true;
            if (seg.amenities?.power_usb) hasPower = true;
            if (seg.amenities?.food) foodOption = seg.amenities.food;
          });
        });

        return (
          <div 
            key={uniqueKey} 
            onClick={() => setExpandedFlightKey(isExpanded ? null : uniqueKey)}
            className={`rounded-[1rem] border-[1px] cursor-pointer transition-all duration-300 overflow-hidden ${isSelected ? 'border-theme-primary bg-theme-primary/10' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-primary'}`}
          >
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 relative">
              <div className="flex flex-row lg:flex-col items-center gap-3 lg:gap-2 shrink-0 w-full lg:w-auto">
                <div className="w-16 h-16 bg-white rounded-sm border border-theme-secondary/10 p-1.5 shadow-sm">
                  <img src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} className="w-full h-full object-contain" alt="airline" />
                </div>
                <div className="flex flex-col items-start lg:items-center text-left lg:text-center gap-1.5">
                  <span className="font-bold text-theme-secondary">{flight.airline_name || flight.airline_code}</span>
                  {flight.carbon_emissions_kg && (
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                      <Leaf size={10} /> {flight.carbon_emissions_kg} kg CO₂
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full space-y-4 lg:space-y-6">
                {flight.itineraries?.slice(0, 2).map((itin: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-4">
                    <div className="flex-1 flex items-center gap-2 sm:gap-4">
                      <div className="text-right min-w-[40px] sm:min-w-[45px]">
                        <p className="text-[16px] font-black text-theme-secondary">{new Date(itin.segments[0].departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        <p className="text-[16px] font-bold text-theme-secondary/40">{itin.segments[0].departure_airport}</p>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center gap-1 px-1 sm:px-2">
                         <div className="w-10 text-[12px] align-center font-bold text-theme-secondary/50">{i === 0 ? 'DEPART' : 'RETURN'}</div>
                        <div className="w-full h-[2px] bg-theme-secondary/20 relative rounded-full overflow-hidden">
                           <div className="absolute inset-y-0 left-0 bg-theme-primary/20 w-full opacity-40" />
                        </div>
                        <span className={`text-[12px] font-bold ${itin.stops === 0 ? 'text-theme-success' : 'text-theme-light-gray'} tracking-tighter text-center line-clamp-1`}>
                          {(itin.duration || '').replace('PT','').toLowerCase()} • {itin.stops === 0 ? 'Direct' : `${itin.stops} stop`}
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

              <div className="flex justify-center w-auto lg:w-auto py-2">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-theme-primary transition-colors">Details</span>
                  <ChevronDown size={16} className={`text-theme-secondary/30 group-hover:text-theme-primary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 border-t lg:border-t-0 lg:border-l border-theme-secondary/10 pt-4 lg:pt-0 pl-0 lg:pl-6 w-full lg:w-auto">
                <div className="text-left lg:text-right">
                  <p className="text-[26px] font-black text-theme-secondary tracking-tighter leading-none"><span className="text-[20px] font-black pr-1 font-normal">USD</span>{getPrice(flight).toFixed(0)}</p>
                  <p className="text-[8px] sm:text-[8px] uppercase text-theme-secondary/30 tracking-widest mt-1">
                    {isRoundTrip ? 'Roundtrip' : 'One Way'} / {travelerCount} {travelerCount > 1 ? 'persons' : 'person'}
                  </p>
                </div>
                <button 
                  onClick={(e) => toggleFlightSelection(flight, uniqueKey, e)}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-[100px] font-black text-[8px] sm:text-[8px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isSelected ? 'bg-theme-secondary text-theme-white' : 'bg-theme-primary text-theme-white hover:bg-theme-primary/90'}`}
                >
                  {isSelected ? <CheckCircle2 size={16} /> : null}
                  {isSelected ? 'Selected' : 'Select Flight'}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="bg-theme-surface/60 border-t border-theme-secondary/10 p-5 lg:p-8 animate-in slide-in-from-top-1 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    {flight.itineraries?.map((itin: any, idx: number) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2">
                           <div className="h-[2px] w-3 bg-theme-primary" />
                           <span className="font-black uppercase tracking-widest text-theme-primary text-sm">
                             {idx === 0 ? 'Outbound' : 'Inbound'}
                           </span>
                        </div>
                        
                        <div className="relative pl-5 border-l-2 border-theme-secondary/10 space-y-6 ml-1.5">
                          {itin.segments.map((seg: any, sIdx: number) => {
                            const nextSeg = itin.segments[sIdx + 1];

                            return (
                              <React.Fragment key={sIdx}>
                                <div className="relative">
                                  <div className="absolute -left-[25px] top-1.5 w-2 h-2 rounded-full bg-theme-white/50 border-2 border-theme-primary" />
                                  <div className="flex flex-col bg-theme-white p-4 rounded-lg border border-theme-secondary/5 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex flex-col">
                                        <span className="font-black text-theme-secondary text-[16px]">
                                          {seg.departure_airport_name || seg.departure_airport}
                                          {seg.departure_terminal && <span className="text-theme-light-gray ml-1.5 bg-theme-primary/10 px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-widest">TERMINAL-{seg.departure_terminal}</span>}
                                        </span>
                                        <span className="font-bold text-theme-secondary/60 text-[12px] mt-0.5">
                                          {new Date(seg.departure_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <ArrowRight size={16} className="text-theme-secondary/20 hidden sm:block shrink-0" />
                                      <div className="flex flex-col sm:text-right">
                                        <span className="font-black text-theme-secondary text-[16px]">
                                          {seg.arrival_airport_name || seg.arrival_airport}
                                          {seg.arrival_terminal && <span className="text-theme-light-gray ml-1.5 bg-theme-primary/10 px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-widest">TERMINAL-{seg.arrival_terminal}</span>}
                                        </span>
                                        <span className="font-bold text-theme-secondary/60 text-[8px] mt-0.5">
                                          {new Date(seg.arrival_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                    {(seg.aircraft || seg.duration) && (
                                      <div className="mt-4 pt-3 border-t border-theme-secondary/5 flex flex-wrap gap-4 text-[8px] font-black uppercase tracking-widest text-theme-secondary/40">
                                        {seg.carrier_code && <span className="text-theme-secondary/50">{seg.carrier_code} {seg.flight_number}</span>}
                                        {seg.aircraft && <span className="flex items-center gap-1.5"><Plane size={10} className="text-theme-secondary/30"/> {seg.aircraft}</span>}
                                        {seg.duration && <span className="flex items-center gap-1.5"><Clock size={10} className="text-theme-secondary/30"/> {(seg.duration || '').toLowerCase().replace('pt','').replace('h','h ').replace('m','m')}</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {nextSeg && (
                                  <div className="relative py-2 pl-2">
                                    <div className="flex items-center gap-3 text-theme-secondary/50 font-black text-[8px] uppercase tracking-widest bg-theme-secondary/5 w-fit px-4 py-2 rounded-md border border-theme-secondary/10">
                                      <Clock size={16} className="text-theme-primary" />
                                      Layover in {seg.arrival_airport_name || seg.arrival_airport}: <span className="text-theme-secondary">{getLayoverDuration(seg.arrival_time, nextSeg.departure_time)}</span>
                                    </div>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-3">
                      <h5 className="font-black uppercase tracking-[0.2em] text-theme-primary flex items-center gap-2"><ShieldCheck size={16}/> Policies</h5>
                      <div className="space-y-1">
                        <div className="p-3 bg-theme-white rounded-sm border border-theme-secondary/5 flex justify-between items-center font-black uppercase text-[8px] tracking-widest">
                          <span className="text-theme-secondary/40 flex items-center gap-2"><Luggage size={16}/> Baggage</span>
                          <span className={totalCheckedBags > 0 ? "text-theme-secondary" : "text-theme-secondary/40"}>
                            {totalCheckedBags > 0 ? `${totalCheckedBags} Included` : 'Not Included'}
                          </span>
                        </div>
                        <div className="p-3 bg-theme-white rounded-sm border border-theme-secondary/5 flex justify-between items-center font-black uppercase text-[8px] tracking-widest">
                          <span className="text-theme-secondary/40 flex items-center gap-2"><Briefcase size={16}/> Changes</span>
                          <span className="text-emerald-500">Allowed</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-black uppercase tracking-[0.2em] text-theme-primary flex items-center gap-2"><Gift size={16}/> Amenities</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {hasWifi && <BenefitIcon icon={<Wifi size={16} />} label="WiFi" />}
                        {hasPower && <BenefitIcon icon={<BatteryCharging size={16} />} label="Power" />}
                        {foodOption && <BenefitIcon icon={<Utensils size={16} />} label="Food" />}
                        {!hasWifi && !hasPower && !foodOption && (
                          <div className="col-span-2 p-3 bg-theme-white rounded-sm border border-theme-secondary/5">
                            <span className="font-black text-[8px] uppercase tracking-widest text-theme-secondary/40">Standard Amenities</span>
                          </div>
                        )}
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
    <div className="flex items-center gap-2 p-3 bg-theme-white rounded-sm border border-theme-secondary/5">
      <div className="text-theme-primary">{icon}</div>
      <span className="font-black uppercase text-[8px] tracking-widest text-theme-secondary/60">{label}</span>
    </div>
  );
}