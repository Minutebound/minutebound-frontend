'use client';

import React, { useEffect, useState } from "react";
import { Compass, Calendar, ArrowRight, MapPin } from "lucide-react";
import { travelApi } from "@/services/api";
import Link from "next/link";
import ChimeAd from "@/app/ads/Chime";
import Loader from "@/components/Loader"; // <-- ADDED LOADER

export default function LandingPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      setLoading(true);
      try {
        const [destsData, eventsData] = await Promise.all([
          travelApi.searchDestinations(), // Fallback if no specific /top endpoint exists yet
          travelApi.getTopEvents()
        ]);
        
        // Ensure max 12 items for the carousels
        setDestinations((destsData || []).slice(0, 12));
        setEvents((eventsData || []).slice(0, 12));
      } catch (error) {
        console.error("Failed to load landing data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  return (
    <div className="w-full min-h-screen relative bg-theme-white overflow-x-hidden">
      {/* Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.1]" />

      <div className="relative z-10 w-[85%] max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-20 pb-32">
        <ChimeAd />
        {/* DESTINATIONS CAROUSEL */}
        <section className="bg-theme-white/20 backdrop-blur-[16px] rounded-[2rem] shadow-sm border border-theme-surface p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-primary/10 rounded-[16px]">
                <Compass className="text-theme-primary w-6 h-6" />
              </div>
              <h2 className=" md:text-[24px] font-black text-theme-secondary tracking-tight">Popular Destinations</h2>
            </div>
            <Link href="/destinations" className=" font-bold text-theme-primary hover:text-theme-primary/80 flex items-center gap-1 transition-colors">
              See all <ArrowRight size={18} />
            </Link>
          </div>
          
          {loading ? (
             <div className="h-64 flex items-center justify-center">
               <Loader variant="compact" message="Loading destinations..." />
             </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x">
              {destinations.map((dest) => (
                <Link href={`/destinations?category=${encodeURIComponent(dest.category)}`} key={dest.id} className="snap-start min-w-[280px] w-[280px] group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-theme-surface/20 border border-theme-secondary/5 shadow-sm hover:shadow-[16px] transition-all cursor-pointer flex-shrink-0">
                  <img src={dest.image_url} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <h3 className="text-theme-golden-yellow  font-bold leading-tight mb-1">{dest.category}</h3>
                       <span className="text-theme-white font-black uppercase tracking-widest block mb-1">{dest.name}</span>
                      <p className="text-white/80 font-medium line-clamp-2">{dest.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* EVENTS CAROUSEL (Orange Theme) */}
        <section className="bg-theme-white/20 backdrop-blur-[16px] rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-orange/10 rounded-[16px]">
                <Calendar className="text-theme-orange w-6 h-6" />
              </div>
              <h2 className=" md:text-[24px] font-black text-theme-secondary tracking-tight">Upcoming Events</h2>
            </div>
            <Link href="/events" className=" font-bold text-theme-orange hover:text-theme-orange/80 flex items-center gap-1 transition-colors">
              Explore events <ArrowRight size={18} />
            </Link>
          </div>
          
          {loading ? (
             <div className="h-64 flex items-center justify-center">
               <Loader variant="compact" message="Loading events..." />
             </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x">
              {events.map((event) => (
                <Link href={`/events?category=${encodeURIComponent(event.category)}`} key={event.id} className="snap-start min-w-[326px] w-[326px] flex flex-col bg-theme-surface/20 border border-theme-secondary/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[16px] hover:border-theme-orange/30 transition-all cursor-pointer group flex-shrink-0">
                  <div className="h-48 w-full relative overflow-hidden">
                     <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                     <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-theme-white/90 backdrop-blur-md rounded-full text-[16px] font-black uppercase tracking-widest text-theme-orange shadow-sm">
                            {event.category}
                        </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[16px] font-black text-theme-orange uppercase tracking-wider mb-2">
                      {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="font-black text-theme-secondary  leading-tight mb-2 line-clamp-2">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-theme-muted text-[16px]font-bold mt-auto pt-4 border-t border-theme-secondary/5">
                      <MapPin size={18} />
                      <span className="truncate">{event.venue_name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}