'use client';

import React, { useEffect, useState } from "react";
import { Compass, Calendar, ArrowRight, MapPin } from "lucide-react";
import { travelApi } from "@/services/api";
import Link from "next/link";

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
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 1.5px)', backgroundSize: '24px 24px', color: '#94a3b8' }} />

      <div className="relative z-10 max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-20 pb-32">
        
        {/* DESTINATIONS CAROUSEL */}
        <section className="bg-theme-white/20 backdrop-blur-xl rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-primary/10 rounded-xl">
                <Compass className="text-theme-primary w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-theme-secondary tracking-tight">Popular Destinations</h2>
            </div>
            <Link href="/destinations" className="text-sm font-bold text-theme-primary hover:text-theme-primary/80 flex items-center gap-1 transition-colors">
              See all <ArrowRight size={16} />
            </Link>
          </div>
          
          {loading ? (
             <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full" /></div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x">
              {destinations.map((dest) => (
                <Link href={`/destinations?category=${encodeURIComponent(dest.category)}`} key={dest.id} className="snap-start min-w-[280px] w-[280px] group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-theme-surface/20 border border-theme-secondary/5 shadow-sm hover:shadow-xl transition-all cursor-pointer flex-shrink-0">
                  <img src={dest.image_url} alt={dest.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <span className="text-theme-primary font-bold text-[10px] uppercase tracking-widest block mb-1">{dest.category}</span>
                      <h3 className="text-white font-black text-2xl leading-tight mb-1">{dest.name}</h3>
                      <p className="text-white/80 text-xs font-medium line-clamp-2">{dest.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* EVENTS CAROUSEL (Orange Theme) */}
        <section className="bg-theme-white/20 backdrop-blur-xl rounded-[2rem] shadow-sm border border-theme-surface p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-theme-orange/10 rounded-xl">
                <Calendar className="text-theme-orange w-6 h-6" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-theme-secondary tracking-tight">Upcoming Events</h2>
            </div>
            <Link href="/events" className="text-sm font-bold text-theme-orange hover:text-theme-orange/80 flex items-center gap-1 transition-colors">
              Explore events <ArrowRight size={16} />
            </Link>
          </div>
          
          {loading ? (
             <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-theme-orange border-t-transparent rounded-full" /></div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x">
              {events.map((event) => (
                <Link href={`/events?category=${encodeURIComponent(event.category)}`} key={event.id} className="snap-start min-w-[320px] w-[320px] flex flex-col bg-theme-surface/20 border border-theme-secondary/10 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-theme-orange/30 transition-all cursor-pointer group flex-shrink-0">
                  <div className="h-48 w-full relative overflow-hidden">
                     <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                     <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-theme-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-theme-orange shadow-sm">
                            {event.category}
                        </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[11px] font-black text-theme-orange uppercase tracking-wider mb-2">
                      {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <h3 className="font-black text-theme-secondary text-xl leading-tight mb-2 line-clamp-2">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-theme-muted text-xs font-bold mt-auto pt-4 border-t border-theme-secondary/5">
                      <MapPin size={14} />
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