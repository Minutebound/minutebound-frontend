"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SearchBar from "@/components/search/Searchbar";
import TripResults from "@/components/results/TripResults";
import Navbar from "@/components/Navbar";
import ItineraryModal from "@/components/results/ItineraryModal";
import { TripSearchParams } from "@/services/api";
import { fetchTripData } from "@/services/tripSearch";

const DynamicMap = dynamic(() => import("@/components/map/TripMap"), {
  ssr: false,
});

export default function Results() {
  const router = useRouter();
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
    localStorage.removeItem("trip_state");

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
      // 1. Check if we just navigated from the home page with a pending search
      const isPending = sessionStorage.getItem("pending_search");
      if (isPending) {
        sessionStorage.removeItem("pending_search");
        const savedState = localStorage.getItem("search_state");
        if (savedState) {
          try {
            const params = JSON.parse(savedState);
            await handleSearch(params);
            return; // handleSearch handles removing the loading state
          } catch (err) {
            console.error("Failed to parse pending search state", err);
          }
        }
      }

      // 2. Otherwise, check if we have an existing session loaded
      const cachedTrip = sessionStorage.getItem("current_trip_results");
      if (cachedTrip) {
        try {
          setTripData(JSON.parse(cachedTrip));
        } catch (err) {
          console.error("Failed to parse cached trip data", err);
        }
        setLoading(false);
      } else {
        // No pending search and no cached data, return to home
        router.push("/results");
      }
    };
    

    initializeData();
  }, [router, handleSearch]);

  
  return (
    <div className="flex flex-col h-screen w-screen bg-theme-bg overflow-hidden">
      <ItineraryModal
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        rawParams={tripData?.rawParams}
        weatherData={tripData?.weather}
      />

      <Navbar
        onMenuClick={() => setSearchOpen(!searchOpen)}
        menuOpen={searchOpen}
        mapOpen={mapOpen}
        onMapToggle={() => setMapOpen(!mapOpen)}
      />

      {/* Permanently visible Compact Summary Bar wrapper */}
      <div className="w-full z-[60] flex-shrink-0 relative">
        <SearchBar
          onSearch={handleSearch}
          onSearchStart={() => {
            setTripData(null);
            setLoading(true);
          }}
          loading={loading}
          isCompact={true}
        />
      </div>

      <main className="flex-1 flex overflow-hidden min-w-0 bg-theme-bg/20">
        
        {/* Left Side: Results Stream */}
        <div className={`flex-1 h-full overflow-y-auto custom-scrollbar ${mapOpen && !loading ? "hidden md:block" : ""}`}>
          <div className="p-4 md:p-6 w-full relative max-w-[1200px] mx-auto">
            {/* The entire UI is now elegantly encapsulated here */}
            <TripResults 
              data={tripData} 
              loading={loading} 
              error={error} 
              onOpenItinerary={() => setIsItineraryOpen(true)} 
            />
          </div>
        </div>

        {/* Right Side: Map */}
        {!loading && tripData && (
          <div className={`h-full border-l border-theme-surface bg-theme-bg ${mapOpen ? "flex-1 w-full" : "hidden"} md:flex md:flex-none md:w-[40vw] lg:w-[35vw]`}>
            <div className="w-full h-full relative">
              <DynamicMap mapData={tripData?.rawParams?.destination} tripData={tripData} />            
            </div>
          </div>
        )}
      </main>
    </div>
  );
}