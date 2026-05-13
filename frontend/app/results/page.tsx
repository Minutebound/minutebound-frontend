"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SearchBar from "@/components/search/Searchbar";
import TripResults from "@/components/results/TripResults";
import ItineraryModal from "@/components/results/ItineraryModal";
import { TripSearchParams } from "@/services/api";
import { fetchTripData } from "@/services/tripSearch";

const DynamicMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
});

export default function Results() {
  const router = useRouter();
  
  // NEW: Authorization state to prevent flashing broken UI during redirect
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);

  const handleSearch = useCallback(async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);

    // Mobile specific: auto close header on search
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSearchOpen(false);
    }

    sessionStorage.removeItem("active_tab");
    sessionStorage.removeItem("drive_intermediates_open");
    sessionStorage.removeItem("stay_dropdown_state");
    // UPDATED: Clear the tab-isolated selections instead of localStorage
    sessionStorage.removeItem("selected_trip_state");

    try {
      const newTripData = await fetchTripData(params);
      setTripData(newTripData);
      sessionStorage.setItem("current_trip_results", JSON.stringify(newTripData));
    } catch (err) {
      setError("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      // 1. Strict Gateway Check: Does the base search state even exist?
      const savedState = localStorage.getItem("search_state");
      
      if (!savedState) {
        // Boot them to the landing page immediately
        router.push("/");
        return;
      }

      // If they passed the check, authorize the UI to render
      setIsAuthorized(true);

      // 2. Is this a fresh search passed from the landing page?
      const isPending = sessionStorage.getItem("pending_search");
      if (isPending) {
        sessionStorage.removeItem("pending_search");
        try {
          const params = JSON.parse(savedState);
          await handleSearch(params);
          return;
        } catch (err) {
          console.error("Failed to parse pending search state", err);
          router.push("/");
          return;
        }
      }

      // 3. Do we already have data loaded in this specific tab's session?
      const cachedTrip = sessionStorage.getItem("current_trip_results");
      if (cachedTrip) {
        try {
          setTripData(JSON.parse(cachedTrip));
          setLoading(false);
          return;
        } catch (err) {
          console.error("Failed to parse cached trip data", err);
        }
      } 
      
      // 4. Fallback: Page was refreshed, we have a search state, but no cached results.
      // Re-run the search automatically using the saved state!
      try {
         const params = JSON.parse(savedState);
         await handleSearch(params);
      } catch (err) {
         router.push("/");
      }
    };
    
    initializeData();
  }, [router, handleSearch]);

  // Prevent UI rendering until we confirm they have a valid search state
  if (!isAuthorized) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-theme-bg">
        <div className="w-10 h-10 border-4 border-theme-surface border-t-theme-primary rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary/50">
          Redirecting to home...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-theme-white overflow-hidden">
      <ItineraryModal
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        rawParams={tripData?.rawParams}
        weatherData={tripData?.weather}
      />

      <div className="w-full z-[60] flex-shrink-0 relative">
        <SearchBar
          onSearch={handleSearch}
          onSearchStart={() => {
            setTripData(null);
            setLoading(true);
          }}
          loading={loading}
          isCompact={true}
          mapOpen={mapOpen}
          onMapToggle={() => setMapOpen(!mapOpen)}
        />
      </div>

      <main className="flex-1 flex overflow-hidden min-w-0 bg-theme-white/20">
        <div className={`flex-1 h-full overflow-y-auto custom-scrollbar ${mapOpen && !loading ? "hidden md:block" : ""}`}>
          <div className="p-4 md:p-6 w-full relative max-w-[1200px] mx-auto">
            <TripResults 
              data={tripData} 
              loading={loading} 
              error={error} 
              onOpenItinerary={() => setIsItineraryOpen(true)} 
            />
          </div>
        </div>

        {!loading && tripData && (
          <div className={`h-full border-l border-theme-surface bg-theme-white ${mapOpen ? "flex-1 w-full" : "hidden"} md:flex md:flex-none md:w-[40vw] lg:w-[35vw]`}>
            <div className="w-full h-full relative">
              <DynamicMap mapData={tripData?.rawParams?.destination} tripData={tripData} />            
            </div>
          </div>
        )}
      </main>
    </div>
  );
}