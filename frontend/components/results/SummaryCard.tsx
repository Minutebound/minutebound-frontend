"use client";

import React from "react";
import { Sparkles, Calendar, Users, MapPin, Plane, Car, BedDouble, Map as MapIcon, ChevronRight } from "lucide-react";

export interface SummaryCardProps {
  data: any;
  onNavigateTab?: (tabId: "flights" | "drive" | "stays" | "tours") => void;
}

export default function SummaryCard({ data, onNavigateTab }: SummaryCardProps) {
  if (!data) return null;

  // 1. Extract exact params
  const p = data.rawParams || {};
  const isFlight = p.travelMode === "fly";
  const rawDest = p.destination;
  const destination = typeof rawDest === 'object' ? rawDest?.name : rawDest || "Your Destination";
  const source = typeof p.source === 'object' ? p.source?.name : p.source || "";
  
  // 2. Extract Destination Info
  const destInfo = data?.destinationInfo || {};
  const description = destInfo.description || "Get ready for an unforgettable journey. Here is a quick snapshot of the local atmosphere, top sights, and weather.";
  const heroImage = destInfo.image || destInfo.imageUrl || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop";

  // Formatter for traveler count & dates
  const travelers = (p.adults || 1) + (p.children || 0);
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Flexible Dates";
    const d = new Date(dateString + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Record Counts
  const flightCount = data.flightData?.length || 0;
  const staysCount = data.stays?.length || 0;
  const toursCount = data.toursData?.length || 0;

  // Weather Extraction
  const weather = data?.weather;
  const firstDay = weather?.days?.[0];
  const temp = firstDay?.max_temp ?? weather?.current?.temp_f ?? weather?.main?.temp ?? weather?.currentConditions?.temp ?? weather?.temperature ?? weather?.temp ?? "--";
  const condition = firstDay?.weather ?? weather?.current?.condition?.text ?? weather?.weather?.[0]?.description ?? weather?.currentConditions?.conditions ?? weather?.condition ?? "Awaiting Forecast";
  const idealMonth = weather?.ideal_month ?? data?.destinationInfo?.ideal_month ?? "September";

  const getWeatherEmoji = (cond: string) => {
    const lower = cond.toLowerCase();
    if (lower.includes('sun') || lower.includes('clear')) return '☀️';
    if (lower.includes('rain') || lower.includes('drizzle')) return '🌧️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('cloud') || lower.includes('overcast')) return '☁️';
    return '⛅';
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HERO BANNER */}
      <div className="relative w-full min-h-[280px] md:min-h-[340px] overflow-hidden rounded-[2rem] shadow-sm flex items-end group border border-theme-secondary/20">
        <img 
          src={heroImage} 
          alt={destination} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="relative z-10 w-full p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full w-max border border-white/20">
              Trip Overview
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
              {destination}
            </h2>
            {source && (
              <div className="flex items-center gap-2 text-white/80 mt-1 font-bold text-sm md:text-base drop-shadow-sm">
                <MapPin size={16} className="text-white" />
                <span>Traveling from {source}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap md:flex-col gap-3 md:gap-4 md:items-end w-full md:w-auto">
            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-[1rem]">
              <Calendar size={18} className="text-white" />
              <span className="text-sm font-bold text-white tracking-wide">
                {formatDate(p.startDate)} <span className="text-white/40 mx-1">-</span> {formatDate(p.endDate)}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-[1rem] w-max">
              <Users size={18} className="text-white" />
              <span className="text-sm font-bold text-white tracking-wide">
                {travelers} Traveler{travelers !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ABOUT & ATMOSPHERE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* About Section */}
        <div className="flex flex-col w-full gap-1.5 md:col-span-2">
          <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-secondary/60 px-4">About {destination}</label>
          <div className="relative overflow-hidden rounded-[2rem] bg-theme-white border-[1.5px] border-theme-secondary/20 p-6 md:p-8 shadow-sm h-full flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
             <p className="text-sm text-theme-secondary/80 font-medium leading-relaxed line-clamp-4 relative z-10">
               {description}
             </p>
          </div>
        </div>

        {/* Atmosphere Section (Using user-provided gradient design) */}
        <div className="flex flex-col w-full gap-1.5 md:col-span-1">
          <label className="text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-secondary/60 px-4">Atmosphere</label>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-theme-secondary to-theme-secondary border-[1.5px] border-theme-surface p-6 md:p-8 shadow-xl h-full flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none">
              <span className="text-[150px]">{getWeatherEmoji(condition)}</span>
            </div>
            <div className="flex items-end gap-3 relative z-10 mb-6 mt-4 md:mt-0">
              <div className="text-5xl md:text-6xl font-black text-theme-white tracking-tighter">
                {typeof temp === "number" ? Math.round(temp) : temp}°
              </div>
              <div className="pb-1 text-theme-white/70 font-bold text-sm md:text-base capitalize">{condition}</div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] bg-theme-white/10 text-theme-white text-[11px] font-black border border-theme-white/20 backdrop-blur-md uppercase tracking-widest w-fit">
              Best Month: {idealMonth}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ATTRACTIONS CAROUSEL */}
      {data.toursData && data.toursData.length > 0 && (
        <div className="w-full bg-theme-secondary/5 rounded-[2rem] border border-theme-secondary/20 shadow-sm p-6 md:p-8 mt-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-theme-primary" />
              <h3 className="text-xl font-black text-theme-secondary tracking-tight">
                Top Attractions
              </h3>
            </div>
            <button 
              onClick={() => onNavigateTab?.("tours")}
              className="flex items-center gap-1 text-[11px] font-bold text-theme-primary uppercase tracking-wider hover:opacity-80"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>
          
          {/* Scrollable Snap Track */}
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
            {data.toursData.map((tour: any, idx: number) => {
              const imgSrc = tour.image || tour.thumbnailUrl || tour.thumbnail || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=300&fit=crop";
              let categoryLabel = "Local Highlight";
              if (tour.categories && tour.categories.length > 0) {
                 categoryLabel = tour.categories[0].split('.')[0].replace(/_/g, ' ');
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => window.open(tour.url || tour.website, "_blank")}
                  className="snap-start shrink-0 w-[240px] bg-theme-white rounded-[1.5rem] border border-theme-secondary/20 shadow-sm overflow-hidden group cursor-pointer hover:border-theme-primary/40 transition-all flex flex-col"
                >
                  <div className="w-full h-[140px] overflow-hidden relative bg-theme-secondary/20">
                    <img 
                      src={imgSrc} 
                      alt={tour.name || "Attraction"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=300&fit=crop'; }}
                    />
                    {tour.rating && (
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                        ⭐ {tour.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[14px] font-bold text-theme-secondary line-clamp-2 leading-snug mb-2">
                      {tour.name || tour.title || "Local Experience"}
                    </span>
                    <span className="text-[10px] font-black text-theme-secondary/40 uppercase tracking-widest line-clamp-1 mt-auto">
                      {categoryLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

{/* 4. MINI TABS NAVIGATOR */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-2">
        
        <button 
          onClick={() => onNavigateTab?.(isFlight ? "flights" : "drive")}
          className="bg-theme-white rounded-[1.5rem] border-[1.5px] border-theme-secondary/20 shadow-sm p-4 flex flex-col items-center justify-center text-center hover:border-theme-primary/40 hover:bg-theme-secondary/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary mb-2 group-hover:scale-110 transition-transform">
            {isFlight ? <Plane size={18} /> : <Car size={18} />}
          </div>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-theme-secondary">
            {isFlight ? "Flights" : "Drive"}
          </span>
          <span className="text-[11px] font-bold text-theme-secondary/50 mt-1">
            {isFlight ? `${flightCount} Options` : "Route Found"}
          </span>
        </button>

        <button 
          onClick={() => onNavigateTab?.("stays")}
          className="bg-theme-white rounded-[1.5rem] border-[1.5px] border-theme-secondary/20 shadow-sm p-4 flex flex-col items-center justify-center text-center hover:border-theme-primary/40 hover:bg-theme-secondary/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary mb-2 group-hover:scale-110 transition-transform">
            <BedDouble size={18} />
          </div>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-theme-secondary">
            Stays
          </span>
          <span className="text-[11px] font-bold text-theme-secondary/50 mt-1">
            {staysCount} Places
          </span>
        </button>

        <button 
          onClick={() => onNavigateTab?.("tours")}
          className="bg-theme-white rounded-[1.5rem] border-[1.5px] border-theme-secondary/20 shadow-sm p-4 flex flex-col items-center justify-center text-center hover:border-theme-primary/40 hover:bg-theme-secondary/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary mb-2 group-hover:scale-110 transition-transform">
            <MapIcon size={18} />
          </div>
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-theme-secondary">
            Tours
          </span>
          <span className="text-[11px] font-bold text-theme-secondary/50 mt-1">
            {toursCount} Exps
          </span>
        </button>
      </div>

      {/* Utility to hide standard scrollbars for the carousel */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}