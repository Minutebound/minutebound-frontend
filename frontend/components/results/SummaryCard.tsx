"use client";

import React from "react";
import { Calendar, Users, MapPin, Plane, Car, Building2, Map as MapIcon, ChevronRight, Sparkles } from "lucide-react";

export interface SummaryCardProps {
  data: any;
  onNavigateTab?: (tabId: "flights" | "drive" | "stays" | "tours") => void;
}

export default function SummaryCard({ data, onNavigateTab }: SummaryCardProps) {
  if (!data) return null;

  const p = data.rawParams || {};
  const isFlight = p.travelMode === "fly";
  const rawDest = p.destination;
  const destination = typeof rawDest === 'object' ? rawDest?.name : rawDest || "Your Destination";
  const source = typeof p.source === 'object' ? p.source?.name : p.source || "";
  
  const destInfo = data?.destinationInfo || {};
  const description = destInfo.description || "Get ready for an unforgettable journey. Here is a quick snapshot of the local atmosphere, top sights, and weather.";
  const heroImage = destInfo.image || destInfo.imageUrl || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop";

  const travelers = (p.adults || 1) + (p.children || 0);
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Flexible Dates";
    const d = new Date(dateString + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const flightCount = data.flightData?.length || 0;
  const staysCount = data.stays?.length || 0;
  const toursCount = data.toursData?.length || 0;
  const attractionsList = data.attractionsData || data.attractions || [];

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
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full w-max border border-white/20">
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
              <Calendar size={16} className="text-white" />
              <span className="text-sm font-bold text-white tracking-wide">
                {formatDate(p.startDate)} <span className="text-white/40 mx-1">-</span> {formatDate(p.endDate)}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-[1rem] w-max">
              <Users size={16} className="text-white" />
              <span className="text-sm font-bold text-white tracking-wide">
                {travelers} Traveler{travelers !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ABOUT & ATMOSPHERE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Atmosphere Section (Now on the left, white bg) */}
        <div className="flex flex-col w-full gap-1.5 md:col-span-1">
          <label className="text-[8px] lg:text-[8px] uppercase font-black tracking-widest text-theme-secondary/60 px-4">Atmosphere</label>
          <div className="relative overflow-hidden rounded-[2rem] bg-theme-white border-[1px] border-theme-secondary/10 p-6 md:p-8 shadow-sm h-full flex flex-col justify-between group hover:border-theme-primary transition-all duration-300">
            <div className="absolute -top-10 -right-10 p-4 opacity-[0.08] pointer-events-none transition-transform duration-500 group-hover:scale-110">
              <span className="text-[150px]">{getWeatherEmoji(condition)}</span>
            </div>
            <div className="flex items-end gap-3 relative z-10 mb-6 mt-4 md:mt-0">
              <div className="text-5xl md:text-6xl font-black text-theme-secondary tracking-tighter">
                {typeof temp === "number" ? Math.round(temp) : temp}°
              </div>
              <div className="pb-1 text-theme-secondary/60 font-bold text-sm md:text-base capitalize">{condition}</div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] bg-theme-primary/5 text-theme-primary text-[8px] font-black border border-theme-primary/10 backdrop-blur-md uppercase tracking-widest w-fit">
              Best Month: {idealMonth}
            </div>
          </div>
        </div>

        {/* About Section (Now on the right) */}
        <div className="flex flex-col w-full gap-1.5 md:col-span-2">
          <label className="text-[8px] lg:text-[8px] uppercase font-black tracking-widest text-theme-secondary/60 px-4">About {destination.split(',')[0]}</label>
          <div className="relative overflow-hidden rounded-[2rem] bg-theme-white border-[1px] border-theme-secondary/10 p-6 md:p-8 shadow-sm h-full flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
             <p className="text-sm text-theme-secondary/80 font-medium leading-relaxed line-clamp-4 relative z-10">
               {description}
             </p>
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="flex justify-between items-center px-2 mt-2">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-secondary/50">
         Booking Options
        </span>
      </div>

      {/* 3. INVENTORY SHORTCUT CARDS (HIGHLY ACCESSIBLE LIST UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
         
         <button 
           onClick={() => onNavigateTab?.(isFlight ? "flights" : "drive")}
           aria-label={`View ${isFlight ? "Flights" : "Drive"} options. ${isFlight ? flightCount : "Route"} available.`}
           className="group w-full rounded-[1rem] border-[1px] border-theme-secondary/10 bg-theme-white p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:border-theme-primary hover:bg-theme-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 transition-all duration-300 shadow-sm"
         >
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-theme-secondary/5 rounded-full flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-colors shrink-0">
               {isFlight ? <Plane size={24} /> : <Car size={24} />}
             </div>
             <div className="text-left flex flex-col justify-center">
               <h4 className="font-black text-sm sm:text-base text-theme-secondary group-hover:text-theme-primary transition-colors">
                 {isFlight ? "Flights" : "Drive"}
               </h4>
               <p className="text-[8px] sm:text-[8px] font-bold text-theme-secondary/50 mt-0.5">
                 {isFlight ? `${flightCount} Options Available` : "Route Details Available"}
               </p>
             </div>
           </div>
           <div className="w-8 h-8 rounded-full bg-theme-white border border-theme-secondary/10 flex items-center justify-center text-theme-secondary/40 group-hover:text-theme-primary group-hover:border-theme-primary/30 group-hover:translate-x-1 transition-all shrink-0 shadow-sm">
             <ChevronRight size={16} />
           </div>
         </button>

         <button 
           onClick={() => onNavigateTab?.("stays")}
           aria-label={`View Accommodation options. ${staysCount} properties available.`}
           className="group w-full rounded-[1rem] border-[1px] border-theme-secondary/10 bg-theme-white p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:border-theme-primary hover:bg-theme-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 transition-all duration-300 shadow-sm"
         >
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-theme-secondary/5 rounded-full flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-colors shrink-0">
               <Building2 size={24} />
             </div>
             <div className="text-left flex flex-col justify-center">
               <h4 className="font-black text-sm sm:text-base text-theme-secondary group-hover:text-theme-primary transition-colors">
                 Accommodations
               </h4>
               <p className="text-[8px] sm:text-[8px] font-bold text-theme-secondary/50 mt-0.5">
                 {staysCount} Properties Available
               </p>
             </div>
           </div>
           <div className="w-8 h-8 rounded-full bg-theme-white border border-theme-secondary/10 flex items-center justify-center text-theme-secondary/40 group-hover:text-theme-primary group-hover:border-theme-primary/30 group-hover:translate-x-1 transition-all shrink-0 shadow-sm">
             <ChevronRight size={16} />
           </div>
         </button>

         <button 
           onClick={() => onNavigateTab?.("tours")}
           aria-label={`View Tours and Activities. ${toursCount} experiences available.`}
           className="group w-full rounded-[1rem] border-[1px] border-theme-secondary/10 bg-theme-white p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:border-theme-primary hover:bg-theme-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 transition-all duration-300 shadow-sm"
         >
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-theme-secondary/5 rounded-full flex items-center justify-center text-theme-primary group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-colors shrink-0">
               <MapIcon size={24} />
             </div>
             <div className="text-left flex flex-col justify-center">
               <h4 className="font-black text-sm sm:text-base text-theme-secondary group-hover:text-theme-primary transition-colors">
                 Tours & Activities
               </h4>
               <p className="text-[8px] sm:text-[8px] font-bold text-theme-secondary/50 mt-0.5">
                 {toursCount} Experiences Available
               </p>
             </div>
           </div>
           <div className="w-8 h-8 rounded-full bg-theme-white border border-theme-secondary/10 flex items-center justify-center text-theme-secondary/40 group-hover:text-theme-primary group-hover:border-theme-primary/30 group-hover:translate-x-1 transition-all shrink-0 shadow-sm">
             <ChevronRight size={16} />
           </div>
         </button>

      </div>

      {/* 4. ATTRACTIONS MAXIMUM-WIDTH CAROUSEL */}
      {attractionsList.length > 0 && (
         <div className="mt-4 flex flex-col">
           <div className="flex justify-between items-center px-2 mb-4">
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-secondary/50">
               Top Sights to See
             </span>
             <button 
                onClick={() => onNavigateTab?.("tours")}
                aria-label="Navigate to Tours tab to book activities"
                className="flex items-center gap-1 text-[8px] font-black text-theme-secondary/40 hover:text-theme-primary uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary rounded-md px-2 py-1"
             >
                Book Tours <ChevronRight size={16} />
             </button>
           </div>

           <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-1 px-1 -mx-1 no-scrollbar snap-x">
             {attractionsList.map((attr: any, idx: number) => {
                const imgSrc = attr.image || attr.photo || attr.thumbnailUrl || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=300&fit=crop";
                let categoryLabel = attr.category || attr.kinds?.split(",")[0]?.replace(/_/g, " ") || "Point of Interest";

                return (
                  <button 
                    key={idx} 
                    onClick={() => attr.url || attr.website ? window.open(attr.url || attr.website, "_blank") : null}
                    aria-label={`View details for ${attr.name || "Attraction"}`}
                    className="snap-start shrink-0 w-[280px] sm:w-[324px] group rounded-[1rem] border-[1px] border-theme-secondary/10 bg-theme-white overflow-hidden cursor-pointer hover:border-theme-primary transition-all duration-300 shadow-sm flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary text-left"
                  >
                    <div className="w-full h-40 sm:h-48 overflow-hidden bg-theme-secondary/5 relative">
                      {imgSrc ? (
                         <img 
                           src={imgSrc} 
                           alt={attr.name || "Attraction"}
                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=300&h=300&fit=crop'; }}
                         />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center"><Sparkles size={24} className="text-theme-secondary/20" /></div>
                      )}
                      {attr.rating && (
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-md text-[8px] font-bold text-white flex items-center gap-1.5">
                          ⭐ {attr.rating}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1 justify-between gap-3">
                       <span className=" font-bold text-theme-secondary line-clamp-2 leading-tight group-hover:text-theme-primary transition-colors">
                         {attr.name || attr.title || "Local Experience"}
                       </span>
                       <span className="text-[8px] font-black text-theme-secondary/40 uppercase tracking-widest line-clamp-1">
                         {categoryLabel}
                       </span>
                    </div>
                  </button>
                );
             })}
           </div>
         </div>
      )}

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