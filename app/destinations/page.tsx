'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { travelApi } from '@/services/api';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';

// Reuse the unified TripMap
const TripMap = dynamic(() => import('@/components/map/TripMap'), { ssr: false });

const CATEGORIES = ['All', 'City Breaks', 'Coastal Escapes', 'Mountain Retreats', 'Hidden Gems'];

function DestinationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category') || 'All';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data whenever category changes
  useEffect(() => {
    const fetchDests = async () => {
      setLoading(true);
      try {
        const data =
          activeCategory === 'All'
            ? await travelApi.searchDestinations()
            : await travelApi.searchDestinations({ category: activeCategory });

        setDestinations(data ?? []);
      } catch (error) {
        console.error('Failed to fetch destinations', error);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDests();

    const newUrl =
      activeCategory === 'All'
        ? '/destinations'
        : `/destinations?category=${encodeURIComponent(activeCategory)}`;
    window.history.replaceState(null, '', newUrl);
  }, [activeCategory]);

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-theme-white overflow-hidden">
      <main className="flex-1 flex overflow-hidden min-w-0 bg-theme-white">
        
        {/* LEFT PANEL: Scrollable Results List */}
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
          <div className="w-full relative max-w-[1000px] mx-auto">
            
            {/* Sticky Header & Filter Pills (Your original UI) */}
            <div className="sticky top-0 p-4 md:p-6 pb-4 border-b border-theme-secondary/10 z-50 bg-theme-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-theme-primary/10 rounded-xl">
                  <Compass className="text-theme-primary w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-theme-secondary tracking-tight">Popular Destinations</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      activeCategory === cat
                        ? 'bg-theme-secondary text-theme-white border-theme-secondary'
                        : 'bg-theme-white text-theme-secondary border-theme-secondary/20 hover:border-theme-secondary hover:bg-theme-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <p className="text-sm text-theme-secondary/70 mt-2 font-bold">
                {!loading && `${destinations.length} places found`}
              </p>
            </div>

            {/* Scrollable Cards Container */}
            <div className="p-4 md:p-6">
              
              {/* MOBILE MAP BANNER (Hidden on Desktop) */}
              {!loading && destinations.length > 0 && (
                <div className="md:hidden w-full h-[250px] mb-6 rounded-[1.5rem] overflow-hidden shadow-md border border-theme-secondary/20 bg-theme-surface relative">
                  <TripMap mapData={{ destinations }} />
                </div>
              )}

              {loading ? (
                <Loader variant="compact" message="Loading destinations..." />
              ) : destinations.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-40 bg-theme-surface rounded-[2rem] border border-theme-secondary/10">
                  <p className="text-theme-secondary/50 font-bold">No destinations found.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {destinations.map((dest) => (
                    <div 
                      key={dest.id} 
                      onClick={() => router.push(`/destinations/${dest.id}`)}
                      className="group flex flex-col sm:flex-row bg-theme-white border border-theme-secondary/10 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-theme-primary/5 hover:border-theme-primary/30 transition-all cursor-pointer"
                    >
                      {/* Image */}
                      <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden shrink-0">
                        <img
                          src={dest.image_url}
                          alt={dest.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px]font-bold text-theme-primary uppercase tracking-wider mb-1 block">
                            {dest.category}
                          </span>
                          <h3 className="text-lg font-bold text-theme-secondary leading-tight">
                            {dest.name}
                          </h3>
                          <p className="text-sm text-theme-secondary/70 mt-2 line-clamp-2">
                            {dest.description}
                          </p>
                        </div>

                        {/* Pricing Footer */}
                        <div className="mt-4 pt-4 border-t border-theme-secondary/10 flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            {dest.avg_flight_price && (
                              <span className="text-sm text-theme-secondary/70">
                                Flights from{' '}
                                <span className="font-bold text-theme-secondary">${dest.avg_flight_price}</span>
                              </span>
                            )}
                            {dest.avg_hotel_price && (
                              <span className="text-sm text-theme-secondary/70">
                                Hotels from{' '}
                                <span className="font-bold text-theme-secondary">${dest.avg_hotel_price}</span>
                              </span>
                            )}
                          </div>
                          <div className="p-2.5 bg-theme-primary/10 rounded-xl group-hover:bg-theme-primary transition-colors">
                            <ArrowRight size={16} className='text-theme-primary group-hover:text-theme-white'/>
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

        {/* RIGHT PANEL: Sticky Map (Desktop Only - Matches Results Layout) */}
        {!loading && (
          <div className="hidden md:flex md:flex-none md:w-[45vw] lg:w-[40vw] h-full border-l border-theme-secondary/10 bg-theme-surface relative">
            <div className="w-full h-full relative">
              <TripMap mapData={{ destinations }} />            
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function DestinationsExplorer() {
  return (
    <Suspense fallback={<Loader variant="screen" />}>
      <DestinationsContent />
    </Suspense>
  );
}