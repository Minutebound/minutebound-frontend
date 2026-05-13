"use client";
import React, { useState, useEffect } from "react";
import { Sparkles, Plane, Car, BedDouble, Map as MapIcon } from "lucide-react";
import FlightCard from "./FlightCard";
import StaysCard from "./StayCard";
import DrivingCard from "./DriveCard";
import ToursCard from "./TourCard";
import SummaryCard from "./SummaryCard";

type TabOption = "summary" | "flights" | "drive" | "stays" | "tours";

export interface TripResultsProps {
  data: any;
  loading: boolean;
  error?: string | null;
  onOpenItinerary: () => void;
}

const LoadingState = () => {
  return (
    <div className="w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-theme-white animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center w-28 h-28">
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-theme-secondary border-l-theme-secondary animate-[spin_1s_linear_infinite]"></div>
        <svg viewBox="0 0 270 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 text-theme-primary drop-shadow-sm">
          <g className="origin-[60px_120px] scale-[1.3]">
            <path d="M 20 160 C 100 40, 90 40, 120 120" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 120 120 C 180 20, 180 20, 200 140" className="fill-current" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />        
          </g>
        </svg>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-secondary/70 text-center mt-6">
        Curating your journey...
      </p>
    </div>
  );
};

const TripResults: React.FC<TripResultsProps> = ({ data, loading, error, onOpenItinerary }) => {
  const [activeTab, setActiveTab] = useState<TabOption>("summary");
  
  const [selectionCounts, setSelectionCounts] = useState<Record<string, number>>({
    flights: 0, drive: 0, stays: 0, tours: 0
  });

  const showFlights = data?.rawParams?.travelMode === "fly";
  const hasFlights = data?.flightData && data.flightData.length > 0;

  // --- NEW: Calculate Total Selections ---
  const totalSelections = selectionCounts.flights + selectionCounts.drive + selectionCounts.stays + selectionCounts.tours;
  const canGenerateItinerary = totalSelections > 0;

  useEffect(() => {
    if (data && !loading) {
      const savedTab = sessionStorage.getItem("active_tab") as TabOption | null;
      if (savedTab) setActiveTab(savedTab);
      else setActiveTab("summary");
    }
  }, [data, loading]);

  useEffect(() => {
    const updateBadges = () => {
      try {
        const state = JSON.parse(sessionStorage.getItem("selected_trip_state") || "{}");
        setSelectionCounts({
          flights: state.flights?.length ? 1 : 0,
          drive: state.drive?.selected ? 1 : 0,
          stays: state.stays?.length ? 1 : 0,
          tours: state.tours?.length || 0,
        });
      } catch (e) {}
    };
    
    window.addEventListener("selected_trip_state_changed", updateBadges);
    updateBadges(); 
    
    return () => window.removeEventListener("selected_trip_state_changed", updateBadges);
  }, []);

  // --- NEW: Listen for commands from the Itinerary Modal to switch tabs ---
  useEffect(() => {
    const handleRemoteTabChange = () => {
      const savedTab = sessionStorage.getItem("active_tab") as TabOption | null;
      if (savedTab) {
        setActiveTab(savedTab);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("active_tab_changed", handleRemoteTabChange);
    return () => window.removeEventListener("active_tab_changed", handleRemoteTabChange);
  }, []);

  const handleTabChange = (tabId: TabOption) => {
    setActiveTab(tabId);
    sessionStorage.setItem("active_tab", tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const transportTab = showFlights && hasFlights
    ? { id: "flights", label: "Flights", icon: <Plane size={18} /> }
    : { id: "drive", label: "Drive", icon: <Car size={18} /> };

  const tabs = [
    { id: "summary", label: "Summary", icon: <Sparkles size={18} /> },
    transportTab,
    { id: "stays", label: "Stays", icon: <BedDouble size={18} /> },
    { id: "tours", label: "Tours", icon: <MapIcon size={18} /> },
  ];

  return (
    <div className="sticky top-0 z-30 bg-theme-white backdrop-blur-md pt-2">      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[20px] font-black text-theme-secondary tracking-tight">
          Trip Planner
        </h1>

        {data && !loading && (
          <button
            onClick={onOpenItinerary}
            disabled={!canGenerateItinerary}
            className={`flex items-center text-[16px] gap-2 px-5 py-3 text-xs font-bold rounded-[0.5rem] transition-all shadow-md active:scale-110 ${
              canGenerateItinerary 
                ? "bg-theme-secondary/90 hover:bg-theme-primary/90 text-theme-white" 
                : "bg-theme-surface text-theme-dark-gray cursor-not-allowed shadow-none"
            }`}
          >
            {canGenerateItinerary ? "Generate Itinerary" : "Select items to generate Itinerary"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 border border-red-100 rounded-xl mb-6 text-sm font-bold shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-24 md:py-32 border border-theme-secondary/10 bg-theme-white/50 w-full rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-theme-secondary/70 text-center px-4">
            Awaiting your search details...
          </p>
        </div>
      ) : (
        <>
          <div className="w-full relative z-20 mb-8 sticky top-0 bg-theme-white backdrop-blur-md pt-2">
            <div className="flex flex-row w-full border-b border-theme-secondary/20 overflow-x-auto no-scrollbar gap-6 md:gap-8 px-1 justify-around lg:justify-start">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const badgeCount = selectionCounts[tab.id] || 0;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabOption)}
                    className={`relative flex items-center justify-center gap-1.5 pb-3 pt-2 transition-colors whitespace-nowrap group outline-none
                      ${isActive ? "text-theme-primary" : "text-theme-secondary/70 hover:text-theme-secondary"}
                    `}
                  >
                    <span className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                      {tab.icon}
                    </span>
                    <span className="text-[12px] md:text-[14px] lg:text-[18px] font-bold tracking-wide flex items-center">
                      {tab.label}
                      {badgeCount > 0 && (
                        <span className="ml-1.5 bg-theme-primary text-theme-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none translate-y-[-1px]">
                          {badgeCount}
                        </span>
                      )}
                    </span>
                    
                    {isActive && (
                       <div className="absolute bottom-[0px] left-0 right-0 h-[3.5px] bg-theme-primary rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full pb-8">
            {activeTab === "summary" && (<SummaryCard data={data} onNavigateTab={handleTabChange} />)}
            {activeTab === "flights" && <FlightCard flights={data?.flightData || []} searchParams={data?.rawParams} />}
            {activeTab === "drive" && (
              <div className="flex flex-col gap-4">
                {showFlights && !hasFlights && (
                  <div className="p-4 bg-theme-white text-theme-primary rounded-[2rem] border border-theme-primary/20 shadow-sm flex items-center gap-3">
                    <span className="text-xl">ℹ️</span>
                    <p className="text-sm font-medium">We couldn't find any flights, so we're showing you the best driving route instead!</p>
                  </div>
                )}
                <DrivingCard drivingData={data?.drivingData || {}} />
              </div>
            )}
            {activeTab === "stays" && <StaysCard stays={data?.stays || []} searchParams={data?.rawParams} />}
            {activeTab === "tours" && <ToursCard tours={data?.toursData || []} />}
          </div>
        </>
      )}
    </div>
  );
};

export default TripResults;