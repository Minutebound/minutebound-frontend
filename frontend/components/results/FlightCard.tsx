"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Plane, ArrowRight, Clock, Info, CheckCircle2, ChevronDown } from 'lucide-react';

type SortOption = 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc';

export default function FlightCard({ flights, loading }: { flights: any[], loading?: boolean }) {
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);

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

  const toggleFlightSelection = (flight: any, uniqueKey: string) => {
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

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBA';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timeString: string) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDuration = (durationString?: string) => {
    if (!durationString) return '';
    return durationString.toLowerCase().replace('h', 'h ').replace('m', 'm');
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

  const getPrice = (f: any) => {
    const rawPrice = f.price?.grandTotal || f.price?.total || f.price || 0;
    if (typeof rawPrice === 'number') return rawPrice;
    return parseFloat(String(rawPrice).replace(/[^\d.-]/g, '')) || 0;
  };

  const getDuration = (f: any) => {
    if (!f.itineraries) return 0;
    return f.itineraries.reduce((sum: number, itin: any) => {
      const cleanStr = (itin.duration || '').toUpperCase().replace('PT', '');
      let hours = 0, minutes = 0;
      const hMatch = cleanStr.match(/(\d+)H/);
      const mMatch = cleanStr.match(/(\d+)M/);
      if (hMatch) hours = parseInt(hMatch[1], 10);
      if (mMatch) minutes = parseInt(mMatch[1], 10);
      return sum + (hours * 60) + minutes;
    }, 0);
  };

  const sortedFlights = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return [];
    return [...flights].sort((a, b) => {
      const priceA = getPrice(a);
      const priceB = getPrice(b);
      const durA = getDuration(a);
      const durB = getDuration(b);
      switch (sortBy) {
        case 'price_asc': return priceA - priceB;
        case 'price_desc': return priceB - priceA;
        case 'duration_asc': return durA - durB;
        case 'duration_desc': return durB - durA;
        default: return 0;
      }
    });
  }, [flights, sortBy]);

  if (loading) return null; 

  if (!flights || !Array.isArray(flights) || flights.length === 0) {
    return (
      <div className="p-12 text-center bg-theme-bg border border-dashed border-theme-secondary/30 rounded-[2rem] text-theme-text/70 animate-in fade-in">
        <div className="w-16 h-16 bg-theme-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plane size={32} className="text-theme-text/30" />
        </div>
        <h3 className="text-lg font-black text-theme-text uppercase tracking-widest">No flights found</h3>
        <p className="text-sm font-medium opacity-60">Try adjusting your search dates or locations.</p>
      </div>
    );
  }

  const SortBtn = ({ id, label }: { id: SortOption, label: string }) => {
    const isActive = sortBy === id;
    return (
      <button
        onClick={() => setSortBy(id)}
        className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border ${
          isActive ? 'bg-theme-text text-theme-bg border-theme-text shadow-md' : 'bg-theme-bg text-theme-text/60 border-theme-secondary/20 hover:border-theme-primary/40 hover:text-theme-text'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* FILTER/SORT HEADER */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-theme-secondary/5 p-4 rounded-[1.5rem] border border-theme-secondary/10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-text/40">Results</span>
          <p className="text-sm font-bold text-theme-text">
            {Math.min(flights.length, 12)} of {flights.length} options found
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SortBtn id="price_asc" label="Lowest Price" />
          <SortBtn id="duration_asc" label="Shortest" />
          <SortBtn id="price_desc" label="Premium" />
        </div>
      </div>
      
      {sortedFlights.slice(0, 12).map((flight, flightIndex) => {
        const uniqueKey = flight.id ? `${flight.id}-${flightIndex}` : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);

        return (
          <div 
            key={uniqueKey} 
            className={`rounded-[2rem] overflow-hidden transition-all duration-300 border-[1.5px] ${
              isSelected ? 'border-theme-primary bg-theme-primary/[0.02] shadow-xl' : 'border-theme-secondary/20 bg-theme-bg hover:border-theme-primary/40 hover:shadow-lg'
            }`}
          >
            {/* TOP INFO BAR */}
            <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isSelected ? 'bg-theme-primary/5 border-theme-primary/20' : 'bg-transparent border-theme-secondary/10'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl border border-theme-secondary/10 flex items-center justify-center p-2 shadow-sm">
                  <img src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`} alt={flight.airline_code} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-theme-text leading-tight">{flight.airline_name || flight.airline_code}</h4>
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded-md">
                    {flight.cabin_class}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-8">
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-black text-theme-text tracking-tighter">
                    ${getPrice(flight).toFixed(2)} 
                  </p>
                  <span className="text-[10px] text-theme-text/40 font-black uppercase tracking-widest">{flight.currency} total</span>
                </div>

                <button 
                  onClick={() => toggleFlightSelection(flight, uniqueKey)} 
                  className={`flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                    isSelected 
                      ? 'bg-theme-primary text-theme-bg' 
                      : 'bg-theme-text text-theme-bg hover:opacity-90'
                  }`}
                >
                  {isSelected ? <CheckCircle2 size={16} /> : null}
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>

            {/* ITINERARIES */}
            <div className="flex flex-col lg:flex-row w-full divide-y lg:divide-y-0 lg:divide-x divide-theme-secondary/10">
              {flight.itineraries?.map((itinerary: any, itinIndex: number) => {
                const isOutbound = itinIndex === 0;
                const departureDate = itinerary.segments?.[0]?.departure_time;

                return (
                  <div key={itinIndex} className="flex-1 p-6 md:p-8 bg-transparent">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isOutbound ? 'text-theme-primary' : 'text-theme-secondary'}`}>
                          {isOutbound ? 'Departure' : 'Return'}
                        </span>
                        <span className="text-sm font-bold text-theme-text opacity-70">{formatDate(departureDate)}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-theme-text font-black text-xs">
                          <Clock size={14} /> {formatDuration(itinerary.duration)}
                        </div>
                        <span className={`text-[10px] uppercase font-black tracking-widest mt-1 ${itinerary.stops === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {itinerary.stops === 0 ? 'Non-stop' : `${itinerary.stops} Stop(s)`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 relative">
                      {itinerary.segments?.map((seg: any, segIndex: number) => {
                        const isLast = segIndex === itinerary.segments.length - 1;
                        const nextSeg = itinerary.segments[segIndex + 1];

                        return (
                          <React.Fragment key={segIndex}>
                            <div className="relative z-10 bg-theme-secondary/5 rounded-[1.5rem] border border-theme-secondary/10 p-5 group/seg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-2xl font-black text-theme-text tracking-tighter">{formatTime(seg.departure_time)}</p>
                                  <p className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest mt-1">
                                    {seg.departure_airport}
                                  </p>
                                </div>
                                
                                <div className="flex flex-col items-center flex-1 px-4">
                                  <span className="text-[9px] text-theme-text/30 font-black tracking-[0.2em] uppercase mb-2">
                                    {seg.carrier_code} {seg.flight_number}
                                  </span>
                                  <div className="w-full max-w-[100px] h-[2px] bg-theme-secondary/20 relative">
                                    <Plane size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-theme-secondary" />
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p className="text-2xl font-black text-theme-text tracking-tighter">{formatTime(seg.arrival_time)}</p>
                                  <p className="text-[11px] font-black text-theme-text/50 uppercase tracking-widest mt-1">
                                    {seg.arrival_airport}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* LAYOVER INDICATOR */}
                            {!isLast && nextSeg && (
                              <div className="flex items-center justify-center -my-2 relative z-20">
                                <div className="bg-theme-text text-theme-bg text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-sm border border-theme-text/10">
                                   Layover: {getLayoverDuration(seg.arrival_time, nextSeg.departure_time)}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}