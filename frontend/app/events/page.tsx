'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { travelApi } from '@/services/api';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

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
        el.className = 'bg-theme-white border border-theme-secondary/10 shadow-lg rounded-full px-3 py-1.5 text-[11px] font-black text-theme-secondary cursor-pointer transition-all hover:scale-110 hover:bg-theme-orange hover:text-white hover:border-theme-orange whitespace-nowrap';
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
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 1.5px)', backgroundSize: '24px 24px', color: '#94a3b8' }} />

      <div className="relative z-10 w-full md:w-[60%] lg:w-[60%] flex flex-col h-full border-r border-theme-surface bg-theme-white/50 backdrop-blur-md">
        <div className="p-6 pb-4 border-b border-theme-secondary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-theme-orange/10 rounded-xl">
              <Calendar className="text-theme-orange w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-theme-secondary tracking-tight">Discover Events</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all border ${
                  activeCategory === cat
                    ? 'bg-theme-orange text-white border-theme-orange shadow-md'
                    : 'bg-theme-white text-theme-secondary/70 border-theme-secondary/10 hover:border-theme-orange/40 hover:text-theme-orange'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-secondary/70 mt-4">
            {loading ? 'Scanning Radar...' : `${events.length} Upcoming Experiences`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-theme-white/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-theme-orange/20 border-t-theme-orange rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-theme-secondary/50 font-bold text-sm">No events found in this category.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {events.map((event) => (
                <div key={event.id} className="group flex flex-col sm:flex-row bg-theme-white border border-theme-secondary/5 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-theme-orange/5 hover:border-theme-orange/30 transition-all duration-500 cursor-pointer">
                  
                  {/* Left Side: Image */}
                  <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1 bg-theme-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-theme-orange shadow-sm">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Right Side: Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-theme-orange text-[10px] font-black uppercase tracking-widest mb-3">
                        <Calendar size={14} />
                        {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h3 className="text-xl font-black text-theme-secondary mb-2 tracking-tight leading-tight">{event.title}</h3>
                      <p className="text-sm text-theme-secondary/60 font-medium leading-relaxed line-clamp-2 mb-4">{event.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-theme-secondary/5 mt-auto">
                      <div className="flex items-center gap-2 text-theme-secondary/70">
                        <MapPin size={14} />
                        <span className="text-xs font-bold">{event.venue_name}</span>
                      </div>
                      <div className="p-2.5 bg-theme-orange/60 rounded-xl group-hover:bg-theme-orange group-hover:text-white transition-colors">
                        <ArrowRight size={18} className='text-theme-white'/>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:block w-full md:w-[40%] lg:w-[40%] bg-theme-white relative z-10">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>
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