'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { travelApi } from '@/services/api';
import { Calendar, MapPin, ChevronRight, Ticket } from 'lucide-react';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';

// Reuse the unified TripMap
const TripMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false });

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

  return (
    <div className="flex flex-col h-screen w-screen bg-theme-white overflow-hidden">
      <main className="flex-1 flex overflow-hidden min-w-0 bg-theme-white">
        
        {/* LEFT PANEL: Scrollable Results List */}
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
          <div className="w-full relative max-w-[1000px] mx-auto">
            
            {/* Sticky Header & Filter Pills */}
            <div className="sticky top-0 p-4 md:p-6 pb-4 border-b border-theme-secondary/10 z-50 bg-theme-white">
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
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all border ${
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
                {!loading && `${events.length} Upcoming Experiences`}
              </p>
            </div>

            {/* Scrollable Cards Container */}
            <div className="p-4 md:p-6">
              
              {/* MOBILE MAP BANNER (Hidden on Desktop) */}
              {!loading && events.length > 0 && (
                <div className="md:hidden w-full h-[250px] mb-6 rounded-[1.5rem] overflow-hidden shadow-md border border-theme-secondary/20 bg-theme-surface relative">
                  <TripMap mapData={{ events }} />
                </div>
              )}

              {loading ? (
                <Loader variant="compact" message="Scanning Radar..." />
              ) : events.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-40 bg-theme-surface rounded-[2rem] border border-theme-secondary/10">
                  <p className="text-theme-secondary/50 font-bold text-sm">No events found in this category.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="group flex flex-col sm:flex-row bg-theme-white border-[1px] border-theme-secondary/10 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-theme-primary/5 hover:border-theme-primary/50 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary text-left"
                    >
                      
                      {/* Image */}
                      <div className="w-full sm:w-[240px] h-48 sm:h-auto shrink-0 relative overflow-hidden bg-theme-secondary/5">
                        <img src={event.image_url} alt={event.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                        <div className="absolute top-3 left-3 z-20">
                          <span className="px-2.5 py-1 bg-theme-white/90 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-widest text-theme-primary shadow-sm border border-theme-white/20">
                            {event.category}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-theme-secondary/50 text-[10px] font-black uppercase tracking-widest mb-2">
                            <Calendar size={14} className="text-theme-primary" />
                            {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <h3 className="text-xl font-black text-theme-secondary leading-tight group-hover:text-theme-primary transition-colors">{event.title}</h3>
                          <p className="text-sm text-theme-secondary/60 font-medium mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
                        </div>
                        
                        <div className="pt-4 border-t border-theme-secondary/10 flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-theme-secondary/40">
                            <MapPin size={14} />
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
        </div>

        {/* RIGHT PANEL: Sticky Map (Desktop Only) */}
        {!loading && (
          <div className="hidden md:flex md:flex-none md:w-[45vw] lg:w-[40vw] h-full border-l border-theme-secondary/10 bg-theme-surface relative">
            <div className="w-full h-full relative">
              <TripMap mapData={{ events }} />            
            </div>
            
            {/* Map Overlay Badge */}
            <div className="absolute top-6 left-6 bg-theme-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-theme-white flex items-center gap-2 z-10 pointer-events-none">
              <Ticket size={16} className="text-theme-primary" />
              <span className="font-black text-sm text-theme-secondary">
                {`${events.length} Experiences`}
              </span>
            </div>
          </div>
        )}

      </main>

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
    <Suspense fallback={<Loader variant="screen" />}>
      <EventsContent />
    </Suspense>
  );
}