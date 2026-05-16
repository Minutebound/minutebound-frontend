'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { travelApi } from '@/services/api';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  'All', 
  'Festival', 
  'Concert & Live Music', 
  'Professional Sports', 
  'Community & Culture', 
  'Theatre & Visual Arts',
  'Conference & Trade Show'
];

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const filter = activeCategory === 'All' ? {} : { category: activeCategory };
        const data = await travelApi.searchEvents(filter);
        setEvents(data ?? []);
      } catch (error) {
        console.error('Failed to fetch events', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();

    const newUrl = activeCategory === 'All' ? '/events' : `/events?category=${encodeURIComponent(activeCategory)}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeCategory]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.protomaps.com/styles/v5/light/en.json?key=${process.env.NEXT_PUBLIC_PROTOMAPS_KEY}`,
        center: [-98.5795, 39.8283],
        zoom: 3.5,
        attributionControl: false,
      });
    }

    const map = mapRef.current;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!loading && events.length > 0) {
      events.forEach((event) => {
        const el = document.createElement('div');
        el.className = 'bg-theme-white border border-theme-secondary/10 shadow-md rounded-full px-3 py-1.5 text-[12px] font-black text-theme-secondary cursor-pointer transition-all hover:scale-110 hover:bg-theme-primary hover:text-white hover:border-theme-primary whitespace-nowrap uppercase tracking-widest';
        el.innerHTML = event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([event.longitude, event.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });

      const bounds = new maplibregl.LngLatBounds();
      events.forEach((e) => bounds.extend([e.longitude, e.latitude]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, duration: 1000 });
      }
    }
  }, [events, loading]);

  return (
    <div className="w-full h-[calc(100vh)] relative bg-theme-white overflow-hidden flex flex-col md:flex-row">

      {/* LEFT PANEL: Results List */}
      <div className="relative w-full md:w-[60%] lg:w-[60%] flex flex-col h-full border-r border-theme-secondary/10 z-10">
        
        {/* Sticky Header & Filter Pills */}
        <div className="p-6 pb-4 border-b border-theme-secondary/10 z-10 bg-theme-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-theme-primary/10 rounded-xl">
              <Calendar className="text-theme-primary w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-theme-secondary tracking-tight">Discover Events</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-[1rem] text-[12px] font-black uppercase tracking-widest transition-all border ${
                  activeCategory === cat
                    ? 'bg-theme-primary text-theme-white border-theme-primary shadow-md'
                    : 'bg-theme-white text-theme-secondary/60 border-theme-secondary/20 hover:border-theme-primary/40 hover:text-theme-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[12px] font-black uppercase tracking-[0.15em] text-theme-secondary/50 mt-4">
            {loading ? 'Scanning Radar...' : `${events.length} Upcoming Experiences`}
          </p>
        </div>

        {/* Scrollable Cards Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-theme-cool-white/30 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-theme-secondary/50 font-bold text-sm">No events found in this category.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {events.map((event) => (
                <div key={event.id} className="group flex flex-col sm:flex-row bg-theme-white border-[1px] border-theme-secondary/10 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-theme-primary/5 hover:border-theme-primary/50 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary text-left">
                  
                  {/* Image */}
                  <div className="w-full sm:w-[240px] h-48 sm:h-auto shrink-0 relative overflow-hidden bg-theme-secondary/5">
                    <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute top-3 left-3 z-20">
                      <span className="px-2.5 py-1 bg-theme-white/90 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-theme-primary shadow-sm border border-theme-white/20">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-theme-secondary/50 text-[12px] font-black uppercase tracking-widest mb-2">
                        <Calendar size={16} className="text-theme-primary" />
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h3 className="text-xl font-black text-theme-secondary leading-tight group-hover:text-theme-primary transition-colors">{event.title}</h3>
                      <p className="text-sm text-theme-secondary/60 font-medium mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
                    </div>
                    
                    <div className="pt-4 border-t border-theme-secondary/10 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest text-theme-secondary/40">
                        <MapPin size={16} />
                        <span className="truncate max-w-[200px]">{event.venue_name}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-theme-secondary/5 flex items-center justify-center text-theme-secondary/50 group-hover:bg-theme-primary group-hover:text-theme-white group-hover:translate-x-1 transition-all shrink-0">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Sticky Map */}
      <div className="hidden md:block w-full md:w-[40%] lg:w-[40%] bg-theme-white relative z-0">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>

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

export default function EventsExplorer() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-theme-white">Loading Explorer...</div>}>
      <EventsContent />
    </Suspense>
  );
}