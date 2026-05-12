'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { travelApi } from '@/services/api';
import { ArrowRight, Compass } from 'lucide-react';

const CATEGORIES = ['All', 'City Breaks', 'Coastal Escapes', 'Mountain Retreats', 'Hidden Gems'];

function DestinationsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // 1. Fetch Data whenever category changes
  useEffect(() => {
    const fetchDests = async () => {
      setLoading(true);
      try {
        // FIX: Pass undefined (no filter) for 'All' so the API returns every destination.
        // Passing {} could be interpreted as an active filter by some backends.
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

  // 2. Initialize Map & Handle Custom Markers
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

    if (!loading && destinations.length > 0) {
      destinations.forEach((dest) => {
        const el = document.createElement('div');
        const price = dest.avg_flight_price || dest.avg_hotel_price;
        el.className =
          'bg-theme-white border border-theme-secondary/20 shadow-md rounded-full px-3 py-1 text-sm font-bold text-theme-secondary cursor-pointer transition-transform hover:scale-110 hover:bg-theme-primary hover:text-theme-white hover:border-theme-primary';
        el.innerHTML = price ? `$${price}` : 'Visit';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([dest.longitude, dest.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });

      const bounds = new maplibregl.LngLatBounds();
      destinations.forEach((d) => bounds.extend([d.longitude, d.latitude]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, duration: 1000 });
      }
    }
  }, [destinations, loading]);

  const handleCategoryChange = (cat: string) => {
    if (cat === activeCategory) return; // No-op if already active
    setActiveCategory(cat);
  };

  return (
    <div className="w-full h-[calc(100vh)] relative bg-theme-white overflow-hidden flex flex-col md:flex-row">

      {/* LEFT PANEL: Results List */}
      <div className="w-full md:w-[60%] lg:w-[60%] flex flex-col h-full border-r border-theme-secondary/10">

        {/* Sticky Header & Filter Pills */}
        <div className="p-6 pb-4 border-b border-theme-secondary/10 z-10 bg-theme-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-theme-primary/10 rounded-xl">
              <Compass className="text-theme-primary w-6 h-6" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-theme-secondary tracking-tight">Popular Destinations</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

          <p className="text-sm text-theme-secondary/70 mt-2">
            {loading ? 'Loading…' : `${destinations.length} places found`}
          </p>
        </div>

        {/* Scrollable Cards Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-theme-white/50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary" />
            </div>
          ) : destinations.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-theme-secondary/50 text-sm">No destinations found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {destinations.map((dest) => (
                <div key={dest.id} className="group flex flex-col sm:flex-row bg-theme-white border border-theme-secondary/10 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-theme-primary/5 hover:border-theme-primary/30 transition-all cursor-pointer">
                  {/* Image */}
                  <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                    <img
                      src={dest.image_url}
                      alt={dest.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-1 block">
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
                    <div className="p-2.5 bg-theme-primary/60 rounded-xl group-hover:bg-theme-primary group-hover:text-white transition-colors">
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

      {/* RIGHT PANEL: Sticky Map */}
      <div className="hidden md:block w-full md:w-[40%] lg:w-[40%] bg-theme-white relative">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      </div>

    </div>
  );
}

export default function DestinationsExplorer() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-theme-secondary">Loading Explorer…</div>}>
      <DestinationsContent />
    </Suspense>
  );
}