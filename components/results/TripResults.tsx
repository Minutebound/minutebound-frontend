"use client";
import React, { useState, useEffect, useRef } from "react";
import { Compass, Plane, Car, Building2, Map, AlertCircle } from "lucide-react";
import FlightCard from "./FlightCard";
import StaysCard from "./StayCard";
import DrivingCard from "./DriveCard";
import ToursCard from "./TourCard";
import SummaryCard from "./SummaryCard";
import Loader from "@/components/Loader";

type TabOption = "summary" | "flights" | "drive" | "stays" | "tours";

export interface TripResultsProps {
  data: any;
  loading: boolean;
  error?: string | null;
  onOpenItinerary: () => void;
}

const getSearchFingerprint = (params: any) => {
  if (!params) return null;
  return JSON.stringify({
    src: params.source?.name || params.source?.city || params.source?.iata || "any",
    dst: params.destination?.name || params.destination?.city || params.destination?.iata || "any",
    start: params.startDate,
    end: params.endDate,
    mode: params.travelMode,
    adults: params.adults,
    children: params.children
  });
};

const TripResults: React.FC<TripResultsProps> = ({ data, loading, error, onOpenItinerary }) => {
  const isFlyMode = data?.rawParams?.travelMode === "fly";
  
  const [activeTab, setActiveTab] = useState<TabOption>("summary");
  const [searchId, setSearchId] = useState<string>("initial");
  const prevLoading = useRef(loading);

  const geoStr = typeof window !== 'undefined' ? sessionStorage.getItem('userGeo') : null;
  const isSOT = geoStr ? JSON.parse(geoStr).isSOT : false;

  const [selectionCounts, setSelectionCounts] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined" && data?.rawParams) {
      const currentFingerprint = getSearchFingerprint(data.rawParams);
      const savedFingerprint = sessionStorage.getItem("trip_search_fingerprint");

      if (savedFingerprint && savedFingerprint !== currentFingerprint) {
        sessionStorage.removeItem("selected_trip_state");
        sessionStorage.setItem("trip_search_fingerprint", currentFingerprint || "");
        return { flights: 0, drive: 0, stays: 0, tours: 0 };
      } else if (currentFingerprint) {
        sessionStorage.setItem("trip_search_fingerprint", currentFingerprint);
      }

      try {
        const state = JSON.parse(sessionStorage.getItem("selected_trip_state") || "{}");
        return {
          flights: state.flights?.length ? 1 : 0,
          drive: state.drive?.selected ? 1 : 0,
          stays: state.stays?.length ? 1 : 0,
          tours: state.tours?.length || 0,
        };
      } catch (e) {}
    }
    return { flights: 0, drive: 0, stays: 0, tours: 0 };
  });

  const totalSelections = selectionCounts.flights + selectionCounts.drive + selectionCounts.stays + selectionCounts.tours;
  const canGenerateItinerary = totalSelections > 0;

  useEffect(() => {
    if (prevLoading.current === false && loading === true) {
      setSearchId(Date.now().toString());
      sessionStorage.removeItem("selected_trip_state");
      setSelectionCounts({ flights: 0, drive: 0, stays: 0, tours: 0 });
      window.dispatchEvent(new Event("selected_trip_state_changed"));
    }
    prevLoading.current = loading;
  }, [loading]);

  useEffect(() => {
    if (data && data.rawParams && !loading) {
      const currentFingerprint = getSearchFingerprint(data.rawParams);
      const savedFingerprint = sessionStorage.getItem("trip_search_fingerprint");
      
      if (currentFingerprint && savedFingerprint !== currentFingerprint) {
        setSearchId(Date.now().toString());
        sessionStorage.removeItem("selected_trip_state");
        sessionStorage.setItem("trip_search_fingerprint", currentFingerprint);
        setSelectionCounts({ flights: 0, drive: 0, stays: 0, tours: 0 });
        window.dispatchEvent(new Event("selected_trip_state_changed"));
      }
    }
  }, [data, loading]);

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
    return () => window.removeEventListener("selected_trip_state_changed", updateBadges);
  }, []);

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

  const transportTab = isFlyMode
    ? { id: "flights", label: "Flights", icon: <Plane size={18} /> }
    : { id: "drive", label: "Drive", icon: <Car size={18} /> };

  const tabs = [
    { id: "summary", label: "Summary", icon: <Compass size={18} /> },
    transportTab,
    { id: "stays", label: "Stays", icon: <Building2 size={18} /> },
    { id: "tours", label: "Tours", icon: <Map size={18} /> },
  ];

  return (
    // Removed specific background colors here to inherit cleanly from parent
    <div className="w-full flex flex-col min-h-screen">      
      
      {/* Ensure top offset aligns perfectly under your compact SearchBar */}
      <div className="sticky top-[80px] z-[50] bg-theme-white transition-all">
        
        <div className="flex justify-between items-center m-2">
          <div>
            <h1 className=" text-[16px] lg:text-[24px] font-black text-theme-secondary uppercase">
              {loading ? "Planning..." : "Trip Planner"}
            </h1>
          </div>

          {data && !loading && (
            <button
              onClick={onOpenItinerary}
              disabled={!canGenerateItinerary}
              className={`flex items-center gap-2 px-5 py-2 mt-2 uppercase font-bold tracking-wider rounded-lg transition-all active:scale-95 ${
                canGenerateItinerary 
                  ? "bg-theme-primary hover:bg-theme-primary text-theme-white shadow-lg shadow-theme-secondary/20" 
                  : "bg-theme-surface text-theme-secondary/40 cursor-not-allowed border border-theme-secondary/10"
              }`}
            >
              {canGenerateItinerary ? "Generate Itinerary" : "Select Items"}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 border border-red-100 rounded-[16px] mb-2  font-bold shadow-sm">
            {error}
          </div>
        )}

        {isSOT && (
          <div className="bg-amber-50 text-amber-800 p-2.5 border border-amber-200 rounded-[16px] mb-2 text-[16px] font-bold shadow-sm flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600" />
            <span>Viewing Affiliate Results (Required by regional Seller of Travel conditions).</span>
          </div>
        )}

        {data && !loading && (
          <div className="flex items-end justify-between">
            <div className="flex flex-row overflow-x-auto no-scrollbar gap-6 md:gap-8 flex-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const badgeCount = selectionCounts[tab.id] || 0;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabOption)}
                    className={`relative flex items-center justify-center gap-2 pb-3 transition-colors whitespace-nowrap group outline-none
                      ${isActive ? "text-theme-primary" : "text-theme-secondary/60 hover:text-theme-secondary"}
                    `}
                  >
                    <span className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                      {tab.icon}
                    </span>
                    <span className=" font-bold tracking-wide flex items-center">
                      {tab.label}
                      {badgeCount > 0 && (
                        <span className="ml-1.5 bg-theme-primary text-theme-white text-[16px] font-black px-1.5 py-0.5 rounded-full leading-none translate-y-[-1px] shadow-sm">
                          {badgeCount}
                        </span>
                      )}
                    </span>
                    
                    {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-theme-primary rounded-t-full shadow-[0_-2px_16px_rgba(var(--theme-primary-rgb),0.3)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="w-full py-6 relative z-10" key={searchId}>
        {loading ? (
          <div className="mt-20">
            <Loader message="Curating your journey..." />
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-24 md:py-32 bg-theme-cool-white w-full rounded-[2rem] mt-4">
            <p className="text-[16px] font-black uppercase tracking-[0.15em] text-theme-secondary/70 text-center px-4">
              Awaiting your search details...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 border-b border-theme-secondary/10 pb-10">

            {activeTab === "summary" && (<SummaryCard data={data} onNavigateTab={handleTabChange} />)}

            {activeTab === "flights" && (
              <FlightCard flights={data?.flightData || data?.flights || []} searchParams={data?.rawParams} />
            )}
            
            {activeTab === "drive" && (
              <DrivingCard drivingData={data?.drivingData || data?.drive || {}} />
            )}
            
            {activeTab === "stays" && (
              <StaysCard stays={data?.stays || []} searchParams={data?.rawParams} />
            )}
            
            {activeTab === "tours" && (
              <ToursCard tours={data?.toursData || data?.tours || data?.attractions || []} />
            )}
          </div>
        )}
      </div>
      
    </div>
  );
};

export default TripResults;