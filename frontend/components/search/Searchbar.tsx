"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Calendar, TrendingUp, PenBoxIcon, Map, X, Users, ChevronDown, Plane, Car } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { travelApi } from "../../services/api";

interface SearchBarProps {
  onSearch: (params: any) => void;
  onSearchStart?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  isCompact?: boolean; 
  mapOpen?: boolean;           
  onMapToggle?: () => void;    
}

export default function SearchBar({
  onSearch,
  onSearchStart,
  onCancel,
  loading,
  isCompact = false,
  mapOpen,
  onMapToggle,
}: SearchBarProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [sourceValid, setSourceValid] = useState(false);
  const [destValid, setDestValid] = useState(false);
  const [dates, setDates] = useState({ start: "", end: "" });
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelMode, setTravelMode] = useState<"fly" | "drive">("fly");
  const [tripType, setTripType] = useState<"round-trip" | "one-way">("round-trip");
  const [budget, setBudget] = useState<"budget" | "Premium">("budget");
  const [radius, setRadius] = useState(10);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topDestinations, setTopDestinations] = useState<any[]>([]);
  
  const [showTravellerDropdown, setShowTravellerDropdown] = useState(false);
  const travellerRef = useRef<HTMLDivElement>(null);

  const refreshTrending = async () => {
    const data = await travelApi.getTopDestinations();
    if (data && data.length > 0) {
      setTopDestinations(data);
    }
  };

  useEffect(() => {
    refreshTrending();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("search_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSource(parsed.source?.name || "");
        if (parsed.source?.name) setSourceValid(true);
        setDestination(parsed.destination?.name || "");
        if (parsed.destination?.name) setDestValid(true);
        setDates({ start: parsed.startDate || "", end: parsed.endDate || "" });
        setAdults(parsed.adults || 1);
        setChildren(parsed.children || 0);
        setTravelMode(parsed.travelMode || "fly");
        setTripType(parsed.tripType || "round-trip");
        setBudget(parsed.budget || "budget");
        setRadius(parsed.radius || 10);
      } catch (e) {
        console.error("Failed to parse existing search state", e);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (travellerRef.current && !travellerRef.current.contains(event.target as Node)) {
        setShowTravellerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCoordinates = async (locationName: string, isDestination: boolean = false) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${baseUrl}/locations/geocode?keyword=${encodeURIComponent(
        locationName
      )}${isDestination ? "&is_destination=true" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) return { lat: parseFloat(data.lat), lon: parseFloat(data.lon) };
      }
    } catch (err) {
      console.error(`Failed to fetch coordinates for ${locationName}:`, err);
    }
    return null;
  };

  const handleSearchSubmit = async () => {
    let finalSource = source;
    let finalDest = destination;
    let finalSourceValid = sourceValid;
    let finalDestValid = destValid;

    const savedStr = localStorage.getItem("search_state");
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr);
        const savedSource = parsed.source?.name || "";
        const savedDest = parsed.destination?.name || "";
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");

        if (!finalSourceValid && finalSource.trim() && savedSource && normalize(savedSource).startsWith(normalize(finalSource))) {
          finalSource = savedSource; setSource(savedSource); finalSourceValid = true; setSourceValid(true);
        }
        if (!finalDestValid && finalDest.trim() && savedDest && normalize(savedDest).startsWith(normalize(finalDest))) {
          finalDest = savedDest; setDestination(savedDest); finalDestValid = true; setDestValid(true);
        }
      } catch (e) {}
    }

    const newErrors: Record<string, string> = {};
    if (!finalSource.trim()) newErrors.source = "Required";
    else if (!finalSourceValid) newErrors.source = "Invalid city";

    if (!finalDest.trim()) newErrors.destination = "Required";
    else if (!finalDestValid) newErrors.destination = "Invalid city";

    if (finalSourceValid && finalDestValid && finalSource.toLowerCase().trim() === finalDest.toLowerCase().trim()) {
      newErrors.destination = "Must differ from origin";
    }

    if (!dates.start) newErrors.start = "Required";
    
    if (tripType === "round-trip" && !dates.end) newErrors.end = "Required";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dates.start) {
      const startDate = new Date(dates.start + "T12:00:00");
      if (startDate < today) newErrors.start = "Past date";
      
      if (tripType === "round-trip" && dates.end) {
        const endDate = new Date(dates.end + "T12:00:00");
        if (startDate >= endDate) newErrors.end = "Must be after start";
        else {
          const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 30) newErrors.end = "Max 30 days";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (onSearchStart) onSearchStart();

    setIsGeocoding(true);
    const [srcCoords, dstCoords] = await Promise.all([
      getCoordinates(finalSource),
      getCoordinates(finalDest, true),
    ]);
    setIsGeocoding(false);

    refreshTrending();

    if (!srcCoords) {
      setErrors({ source: "Coordinates not found" });
      return;
    }
    if (!dstCoords) {
      setErrors({ destination: "Coordinates not found" });
      return;
    }

    const params = {
      source: { name: finalSource, ...srcCoords },
      destination: { name: finalDest, ...dstCoords },
      startDate: dates.start,
      endDate: tripType === "one-way" ? "" : dates.end,
      adults,
      children,
      travelMode,
      tripType,
      budget,
      radius,
      interests: [],
    };

    localStorage.setItem("search_state", JSON.stringify(params));
    
    // Sanitize selected_trip_state to prevent transport conflicts
    const tripStateStr = sessionStorage.getItem("selected_trip_state");
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (travelMode === "drive") {
          tripState.flights = []; 
        } else if (travelMode === "fly") {
          tripState.drive = null; 
        }
        sessionStorage.setItem("selected_trip_state", JSON.stringify(tripState));
        window.dispatchEvent(new Event("selected_trip_state_changed")); 
      } catch (e) {
        console.error("Error sanitizing selected_trip_state:", e);
      }
    }

    setIsOverlayOpen(false); 
    onSearch(params);
  };

  const isWorking = loading || isGeocoding;
  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const minEndDate = dates.start ? new Date(new Date(dates.start + "T12:00:00").getTime() + 86400000) : new Date();
  const totalTravellers = adults + children;

  const renderFullSearchContent = () => (
    <div className="relative w-full z-30 flex flex-col items-center justify-center ">
      {isCompact && (
        <button 
          onClick={() => setIsOverlayOpen(false)}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 sm:w-10 sm:h-10 bg-theme-white/10 border border-theme-white/20 text-theme-white rounded-full flex items-center justify-center hover:bg-theme-white/20 transition-all z-[100] active:scale-90 backdrop-blur-md cursor-pointer"
        >
          <X size={20} />
        </button>
      )}

      <div className={`absolute top-0 w-full bg-gradient-to-b from-theme-secondary to-theme-secondary/95 shadow-inner ${isCompact ? 'w-full max-w-[100%] h-full rounded-[2.5rem]' : 'h-[69%]'}`}></div>

      <div 
        className={`absolute inset-0 z-0 pointer-events-none opacity-[0.1] ${isCompact ? 'rounded-[2.5rem] overflow-hidden' : ''}`} 
        style={{ 
          backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          color: '#94a3b8' 
        }} 
      />

      <div className={`relative z-10 mx-auto px-6 md:px-6 lg:px-8 py-8 lg:py-12 ${isCompact ? 'w-full max-w-[100%] pt-8 lg:pt-8' : 'w-full max-w-full md:max-w-[90%] lg:max-w-[80%]'}`}>        
        
        {/* Travel Mode Pills (Outside the main input) */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex bg-theme-secondary/20 p-1 rounded-full border border-theme-white/10 backdrop-blur-md shadow-sm">
            <button 
              onClick={() => setTravelMode("fly")}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 ${travelMode === "fly" ? "bg-theme-primary shadow-sm text-theme-white" : "text-theme-white/80 hover:text-theme-white hover:bg-theme-white/10"}`}
            >
              <Plane size={16} /> Flights
            </button>
            <button 
              onClick={() => setTravelMode("drive")}
              className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all duration-300 ${travelMode === "drive" ? "bg-theme-primary shadow-sm text-theme-white" : "text-theme-white/80 hover:text-theme-white hover:bg-theme-white/10"}`}
            >
              <Car size={16} /> Drive
            </button>
          </div>
        </div>

        {/* MAIN INPUT BOX */}
        <div className="bg-theme-white w-full rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 md:p-5 lg:p-6 flex flex-col gap-4 w-full relative z-30">
          
          {/* NEW: Trip Type Dropdown (Inside the box, above the inputs, always visible) */}
          <div className="flex p-1">
            <div className="relative group cursor-pointer flex items-center">
              <select
                value={tripType}
                onChange={(e) => {
                  setTripType(e.target.value as "round-trip" | "one-way");
                  if (e.target.value === "one-way") setDates((d) => ({ ...d, end: "" }));
                }}
                className="appearance-none bg-theme-primary/10 text-theme-primary uppercase tracking-widest cursor-pointer outline-none py-1.5 pl-3 pr-8 rounded-lg border border-theme-primary/20 hover:bg-theme-primary/20 transition-all"
              >
                <option value="round-trip">Round Trip</option>
                <option value="one-way">One Way</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-theme-primary" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-3 overflow-visible relative z-20">
            
            {/* Origin & Destination */}
            <div className="flex flex-col flex-[1.2] w-full">
              
              {/* Labels */}
              <div className="flex w-full px-2 lg:px-4 mb-1.5 items-center">
                 <div className="flex-1 flex items-center gap-3">
                     <label className="uppercase font-bold tracking-widest text-theme-secondary/60">From?</label>
                 </div>
                 <label className="flex-1 uppercase font-bold tracking-widest text-theme-secondary/60 pl-4 lg:pl-8">To?</label>
              </div>

              <div className="relative flex flex-row h-12 lg:h-14 bg-theme-white rounded-[1rem] lg:rounded-l-[1rem] border-[1.5px] border-theme-secondary/30 focus-within:border-theme-primary/50 transition-colors shadow-sm group">
                <div className="flex-1 relative flex items-center px-3 md:px-5 lg:px-5 rounded-l-[1rem] lg:rounded-l-[1rem] hover:bg-theme-secondary/5 transition-colors border-r border-theme-secondary/20">
                  <LocationAutocomplete
                    id="source-input"
                    placeholder="Origin City"
                    value={source}
                    onChange={(val, isValid) => {
                      setSource(val); setSourceValid(isValid);
                      if (errors.source) setErrors((prev) => ({ ...prev, source: "" }));
                    }}
                    isDark={false}
                    showGPS={true}
                  />
                  {errors.source && <span className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-bold">{errors.source}</span>}
                </div>

                <div className="flex-1 relative flex items-center px-3 md:px-5 lg:px-6 lg:pl-5 rounded-r-[1rem] lg:rounded-r-[1rem] hover:bg-theme-secondary/5 transition-colors">
                  <LocationAutocomplete
                    placeholder="Destination City"
                    value={destination}
                    onChange={(val, isValid) => {
                      setDestination(val); setDestValid(isValid);
                      if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
                    }}
                    isDark={false}
                    showGPS={false}
                  />
                  {errors.destination && <span className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-bold">{errors.destination}</span>}
                </div>
              </div>
            </div>

            {/* Dates Container */}
            <div className="flex flex-col flex-[1] w-full relative z-10">
              <div className="flex w-full px-2 lg:px-4 mb-1.5 items-center">
                 <label className="flex-1 uppercase font-bold tracking-widest text-theme-secondary/60">Depart</label>
                 <label className={`flex-1 uppercase font-bold tracking-widest text-theme-secondary/60 pl-2 lg:pl-4 ${tripType === 'one-way' ? 'opacity-30' : ''}`}>Return</label>
              </div>

              <div className="relative flex flex-row h-12 lg:h-14 bg-theme-white rounded-[1rem] lg:rounded-l-[1rem] border-[1.5px] border-theme-secondary/30 focus-within:border-theme-primary/50 transition-colors shadow-sm">
                
                <div className="flex-1 relative flex items-center px-3 md:px-5 lg:px-5 rounded-l-[1rem] lg:rounded-l-[1rem] hover:bg-theme-secondary/5 transition-colors border-r border-theme-secondary/20">
                  <Calendar size={14} className="text-theme-primary/80 shrink-0 mr-1.5" />
                  <DatePicker
                    selected={dates.start ? new Date(dates.start + "T12:00:00") : null}
                    onChange={(date: Date | null): void => {
                      if (!date) return;
                      const formatted = formatDate(date);
                      setDates((d) => ({ ...d, start: formatted }));
                      if (errors.start) setErrors((prev) => ({ ...prev, start: "" }));
                      if (dates.end && date >= new Date(dates.end + "T12:00:00")) {
                        setDates((d) => ({ ...d, start: formatted, end: "" }));
                      }
                    }}
                    minDate={new Date()}
                    placeholderText="Add date"
                    className="w-full bg-transparent font-bold text-[13px] md:text-[15px] text-theme-secondary outline-none border-none cursor-pointer placeholder-theme-secondary/40"
                  />
                  {errors.start && <span className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-bold">{errors.start}</span>}
                </div>

                <div className={`flex-1 relative flex items-center px-3 md:px-5 lg:px-5 rounded-r-[1rem] lg:rounded-r-[1rem] transition-colors ${tripType === 'one-way' ? 'bg-theme-secondary/5 cursor-not-allowed' : 'hover:bg-theme-secondary/5'}`}>
                  <Calendar size={14} className={`shrink-0 mr-1.5 ${tripType === 'one-way' ? 'text-theme-secondary/30' : 'text-theme-primary/80'}`} />
                  <DatePicker
                    selected={dates.end ? new Date(dates.end + "T12:00:00") : null}
                    onChange={(date: Date | null) => {
                      if (tripType === 'one-way' || !date) return;
                      setDates((d) => ({ ...d, end: formatDate(date) }));
                      if (errors.end) setErrors((prev) => ({ ...prev, end: "" }));
                    }}
                    minDate={minEndDate}
                    disabled={tripType === 'one-way'}
                    placeholderText={tripType === 'one-way' ? 'One Way' : 'Add date'}
                    className="w-full bg-transparent font-bold text-[13px] md:text-[15px] text-theme-secondary outline-none border-none cursor-pointer placeholder-theme-secondary/40 disabled:cursor-not-allowed disabled:text-theme-secondary/40"
                  />
                  {errors.end && <span className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-bold">{errors.end}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end mt-2 lg:mt-0 lg:flex-shrink-0 relative z-10">
              <div className="hidden lg:block h-[18px] mb-1.5"></div>
              {!isWorking ? (
                <button
                  className="w-full lg:w-auto h-12 lg:h-14 lg:min-w-[140px] rounded-[1rem] lg:rounded-full bg-theme-primary text-theme-white text-[16px] font-black tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all px-8 shadow-lg active:scale-95 border-none"
                  onClick={handleSearchSubmit}
                >
                  <Search size={18} strokeWidth={3} /> Search
                </button>
              ) : (
                <div className="w-full lg:w-auto h-12 lg:h-14 lg:min-w-[140px] rounded-[1rem] lg:rounded-full bg-theme-primary/80 text-theme-white/80 font-black flex items-center justify-center gap-2 px-8 shadow-inner cursor-not-allowed border-none">
                  <Loader2 size={20} className="animate-spin text-theme-white" />
                </div>
              )}
            </div>
            
          </div>
          
          <div className="flex flex-col md:flex-row items-start lg:items-center justify-between gap-3 mt-1 px-1 relative z-50">
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-1 sm:gap-2 w-full xl:w-auto overflow-visible relative z-50">
              
              <div className="relative z-50 shrink-0" ref={travellerRef}>
                <button 
                  onClick={() => setShowTravellerDropdown(!showTravellerDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 font-bold text-[12px] sm:text-[13px] text-theme-secondary hover:text-theme-primary transition-colors py-1 px-1.5 sm:px-2 rounded-lg hover:bg-theme-secondary/10 whitespace-nowrap"
                >
                  <Users size={16} className="text-theme-primary/80 shrink-0" />
                  <span>{totalTravellers} <span>Guest{totalTravellers !== 1 ? 's' : ''}</span></span>
                  <ChevronDown size={16} className="text-theme-secondary/60 shrink-0" />
                </button>
                
                {showTravellerDropdown && (
                  <div className="absolute top-full left-0 mt-3 w-[260px] sm:w-72 bg-theme-white text-theme-secondary rounded-2xl shadow-xl border border-theme-secondary/20 p-5 z-[100] animate-in fade-in zoom-in-95 duration-200">                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="font-bold text-[15px]">Adults</div>
                        <div className="text-[11px] text-theme-muted uppercase tracking-wider">Ages 12+</div>
                      </div>
                      <SbCounter value={adults} min={1} max={9} onChange={setAdults} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[15px]">Children</div>
                        <div className="text-[11px] text-theme-muted uppercase tracking-wider">Ages 0-11</div>
                      </div>
                      <SbCounter value={children} min={0} max={9} onChange={setChildren} />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative group cursor-pointer flex items-center gap-1 sm:gap-1.5 py-1 px-1.5 sm:px-2 rounded-lg hover:bg-theme-secondary/10 transition-colors whitespace-nowrap shrink-0">
                <span className="text-base sm:text-lg">{budget === 'budget' ? '💰' : '✨'}</span>
                <select 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value as "budget" | "Premium")}
                  className="appearance-none bg-transparent font-bold text-[12px] sm:text-[13px] text-theme-secondary cursor-pointer outline-none pr-4 sm:pr-5 hover:text-theme-primary transition-colors border-none"
                >
                  <option value="budget">Budget</option>
                  <option value="Premium">Premium</option>
                </select>
                <ChevronDown size={16} className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none text-theme-secondary/60" />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 py-1 px-1 sm:px-2 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-theme-secondary/50 hidden sm:inline">Radius:</span>
                 <span className="text-[10px] font-black uppercase tracking-wider text-theme-secondary/50 sm:hidden">Rad:</span>
                 <input
                    type="number"
                    min={1} 
                    max={100}
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 1)}
                    className="w-[42px] sm:w-[52px] bg-theme-secondary/5 border border-theme-secondary/20 rounded-md px-1 py-1 text-[12px] sm:text-[13px] font-bold text-theme-secondary outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all text-center hide-arrows"
                  />
                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-theme-secondary/50">mi</span>
              </div>
            </div>

            {topDestinations.length > 0 && (
              <div className="flex flex-row items-center w-full xl:w-auto relative z-10 py-1">
                <div className="flex items-center gap-1.5 shrink-0 pr-3">
                   <TrendingUp size={16} className="text-theme-primary" />
                   <span className="text-[11px] font-black uppercase text-theme-secondary/60 tracking-wider">Trending:</span>
                </div>
                <div className="flex flex-row items-center gap-2 overflow-x-auto no-scrollbar w-full">
                  {topDestinations.map((dest, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestination(dest.full_name); setDestValid(true);
                        if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
                      }}
                      className="px-4 py-1.5 rounded-full bg-theme-secondary/5 text-theme-secondary/80 text-[11px] font-bold hover:bg-theme-secondary/10 transition-all whitespace-nowrap border border-theme-secondary/10 shadow-sm shrink-0"
                    >
                      {dest.city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-arrows::-webkit-outer-spin-button,
        .hide-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hide-arrows {
          -moz-appearance: textfield;
        }
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

 return (
    <>
      {isCompact && (
        <div className="w-full bg-theme-white/50 backdrop-blur-xl py-3 px-4 md:px-6 flex items-center justify-center border-b border-theme-secondary/20 z-20 sticky top-0 shadow-sm transition-all duration-300">
          
          <div className="flex items-center max-w-[700px] md:max-w-[800px] mx-auto">
            
            <button
              onClick={() => setIsOverlayOpen(true)}
              className="w-full bg-theme-white border border-theme-secondary/20 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-full flex items-center p-1.5 sm:p-2 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col sm:hidden flex-1 text-left overflow-hidden pl-4 py-1">
                <span className="font-bold text-[13px] text-theme-secondary truncate">
                  {source || 'Anywhere'} {destination ? `to ${destination}` : ''}
                </span>
                <div className="flex items-center text-[11px] text-theme-secondary/60 gap-1 mt-[2px] truncate font-medium">
                  <span>{dates.start ? `${dates.start}` : 'Any dates'}</span>
                  {tripType === "round-trip" && dates.end && (
                    <><span>•</span><span>{dates.end}</span></>
                  )}
                  <span>•</span>
                  <span>{adults + children} Guest{adults + children !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{travelMode === 'fly' ? 'Flights' : 'Drive'}</span>
                </div>
              </div>

              <div className="sm:hidden bg-theme-primary text-theme-white p-2 rounded-full shadow-sm mr-1 shrink-0">
                <PenBoxIcon size={16} strokeWidth={2.5} />
              </div>

              <div className="hidden sm:flex items-center justify-between flex-1 pl-2 pr-1">
                <div className="flex items-center flex-1">
                  
                  <div className="font-bold text-[14px] text-theme-secondary px-4 py-2 rounded-full hover:bg-theme-secondary/5 transition-colors truncate max-w-[200px] lg:max-w-[320px]">
                    {source || 'Anywhere'} {destination ? `→ ${destination}` : ''}
                  </div>
                  
                  <div className="w-[1px] h-6 bg-theme-secondary/20 mx-1 shrink-0"></div>
                  
                  <div className="font-medium text-[13px] text-theme-secondary/70 px-4 py-2 rounded-full hover:bg-theme-secondary/5 transition-colors whitespace-nowrap">
                    {dates.start ? `${dates.start} ${tripType === "round-trip" ? `- ${dates.end || '?'}` : '(One Way)'}` : 'Any week'}
                  </div>

                  <div className="w-[1px] h-6 bg-theme-secondary/20 mx-1 shrink-0"></div>
                  
                  <div className="font-medium text-[13px] text-theme-secondary/70 px-4 py-2 rounded-full hover:bg-theme-secondary/5 transition-colors whitespace-nowrap">
                    {adults + children} Guest{adults + children !== 1 ? 's' : ''}
                  </div>

                  <div className="w-[1px] h-6 bg-theme-secondary/20 mx-1 shrink-0"></div>

                  <div className="ml-2 flex items-center gap-1.5 uppercase tracking-widest rounded-full text-[10px] text-theme-secondary font-black bg-theme-primary/10 px-2 py-1 rounded-md shrink-0">
                    {travelMode === 'fly' ? <Plane size={12}/> : <Car size={12}/>}
                    {travelMode === 'fly' ? 'Flights' : 'Drive'}
                  </div>

                </div>
                
                <div className="bg-theme-white text-theme-secondary p-2.5 rounded-full shadow-sm group-hover:scale-105 transition-transform ml-2 shrink-0">
                  <PenBoxIcon size={16} strokeWidth={3} />
                </div>
              </div>
            </button>

            {onMapToggle && (
              <button
                onClick={onMapToggle}
                className="ml-3 p-3 rounded-full bg-theme-white text-theme-secondary border border-theme-secondary/30 hover:bg-theme-secondary/10 hover:border-theme-primary/40 transition-colors shadow-sm md:hidden flex-shrink-0 active:scale-95"
              >
                {mapOpen ? <X size={18} className="text-theme-secondary" /> : <Map size={18} className="text-theme-secondary" />}
              </button>
            )}

          </div>
        </div>
      )}

      {isCompact && isOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsOverlayOpen(false)}></div>
          
          <div className="relative max-w-full lg:max-w-[70%] animate-in slide-in-from-top-4 fade-in duration-200 z-50">
            <div className="max-w-full  bg-transparent rounded-[2.5rem] shadow-2xl overflow-visible relative border-none">
              {renderFullSearchContent()}
            </div>
          </div>
        </div>
      )}

      {!isCompact && renderFullSearchContent()}
    </>
  );
}

function SbCounter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void; }) {
  return (
    <div className="flex items-center gap-3 bg-theme-secondary/5 rounded-full p-1 border border-theme-secondary/20">
      <button 
        type="button" 
        className="w-8 h-8 rounded-full bg-theme-white shadow-sm text-theme-secondary hover:text-theme-primary flex items-center justify-center font-bold text-lg disabled:opacity-40 transition-all active:scale-90" 
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >−</button>
      <span className="font-black text-[15px] text-theme-secondary text-center w-4">{value}</span>
      <button 
        type="button" 
        className="w-8 h-8 rounded-full bg-theme-white shadow-sm text-theme-secondary hover:text-theme-primary flex items-center justify-center font-bold text-lg disabled:opacity-40 transition-all active:scale-90" 
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >+</button>
    </div>
  );
}