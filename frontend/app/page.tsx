"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/search/Searchbar";
import Navbar from "@/components/Navbar";
import LandingPage from "@/components/landing/LandingPage";
import { TripSearchParams } from "@/services/api";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(true);

  useEffect(() => {
    sessionStorage.removeItem("current_trip_results");
    sessionStorage.removeItem("current_trip_data");
    sessionStorage.removeItem("route_data_Origin_Destination");
  }, []);

  const handleSearch = (params: TripSearchParams) => {
    setLoading(true);
    
    // Clear previous UI states
    sessionStorage.removeItem("active_tab");
    sessionStorage.removeItem("drive_intermediates_open");
    sessionStorage.removeItem("stay_dropdown_state");
    localStorage.removeItem("trip_state");

    // Set flag so the results page knows to trigger a search
    sessionStorage.setItem("pending_search", "true");
    
    // Route instantly!
    router.push("/results");
  };

  return (
    // Removed h-screen, w-screen, and overflow-hidden to allow natural page scrolling
    <div className="flex flex-col flex-1 w-full bg-theme-bg">
      <Navbar
        onMenuClick={() => setSearchOpen(!searchOpen)}
        menuOpen={searchOpen}
        mapOpen={false}
        onMapToggle={() => {}}
      />

      <div 
        className={`w-full z-20 flex-shrink-0 static transition-all duration-300 ease-in-out lg:max-h-[1200px] lg:opacity-100 lg:overflow-visible lg:border-b lg:border-theme-surface ${
          searchOpen ? 'max-h-[800px] opacity-100 border-b border-theme-surface' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <SearchBar
          onSearch={handleSearch}
          onSearchStart={() => setLoading(true)}
          loading={loading}
          isCompact={false} 
        />
      </div>

      {/* Removed overflow-hidden from main and its child div */}
      <main className="flex-1 flex flex-col relative w-full">
        <div className="flex-1 w-full">
          <LandingPage />
        </div>
      </main>
    </div>
  );
}