"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SearchBar from "@/components/search/Searchbar";
import TripResults from "@/components/results/TripResults";
import ItineraryModal from "@/components/results/ItineraryModal";
import Loader from "@/components/Loader";
import { TripSearchParams } from "@/services/api";
import { fetchTripData } from "@/services/tripSearch";

const DynamicMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
});

export default function Results() {
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
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

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSearchOpen(false);
    }

    sessionStorage.removeItem("active_tab");
    sessionStorage.removeItem("drive_intermediates_open");
    sessionStorage.removeItem("stay_dropdown_state");
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
    setIsMounted(true); 

    const initializeData = async () => {
      const savedState = localStorage.getItem("search_state");
      if (!savedState) {
        router.push("/");
        return;
      }
      setIsAuthorized(true);

      const isPending = sessionStorage.getItem("pending_search");
      if (isPending) {
        sessionStorage.removeItem("pending_search");
        try {
          const params = JSON.parse(savedState);
          await handleSearch(params);
          return;
        } catch (err) {
          router.push("/");
          return;
        }
      }

      const cachedTrip = sessionStorage.getItem("current_trip_results");
      if (cachedTrip) {
        try {
          setTripData(JSON.parse(cachedTrip));
          setLoading(false);
          return;
        } catch (err) {}
      } 
      
      try {
         const params = JSON.parse(savedState);
         await handleSearch(params);
      } catch (err) {
         router.push("/");
      }
    };
    
    initializeData();
  }, [router, handleSearch]);

  if (!isMounted) return null; 

  if (!isAuthorized) {
    return <Loader variant="full" message="Redirecting to home..." />;
  }

  return (
    // Outer container gets a subtle background so the 85% white sheet pops out
    <div className="flex flex-col z-[100] min-h-screen bg-theme-white">
      <ItineraryModal
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        rawParams={tripData?.rawParams}
        weatherData={tripData?.weather}
      />

      {/* STICKY SEARCH BAR (Spans full width at top) */}
      <div className="sticky top-0 w-full z-[110]">
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

      {/* THE 85% MASTER WRAPPER (Holds both List and Map) */}
      <main className="flex-1 flex w-[100%] max-w-[1800px] mx-auto relative bg-theme-white shadow-[16px]">
        
        {/* LEFT PANEL: 60% of the 85% Wrapper */}
        <div className={`w-full md:w-[60%] ${mapOpen && !loading ? "hidden md:block" : ""}`}>
          {/* We don't need max-w-[1000px] here anymore because the parent restricts it! */}
          <div className="p-4 md:p-6 w-full relative mx-auto">
            <TripResults 
              data={tripData} 
              loading={loading} 
              error={error} 
              onOpenItinerary={() => setIsItineraryOpen(true)} 
            />
          </div>
        </div>

        {/* RIGHT PANEL: 40% of the 85% Wrapper (Sticky Map) */}
        {!loading && tripData && (
          <div className={`${mapOpen ? "block w-full" : "hidden"} md:block md:w-[40%]`}>
            {/* The top offset needs to match your search bar height */}
            <div className="sticky top-[76px] w-full h-[92vh] pt-8 px-4 pb-16">
              <DynamicMap mapData={tripData} tripData={tripData} />            
            </div>
          </div>
        )}
      </main>
    </div>
  );
}