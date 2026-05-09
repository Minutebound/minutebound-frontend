"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Calendar, TrendingUp, PenBoxIcon, Map, X, ArrowRightLeft, Users, ChevronDown, Plane, Car, Edit } from "lucide-react";
import LocationAutocomplete from "./LocationAutoComplete";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { travelApi } from "../../services/api";

const stateAbbreviations: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO",
  Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID",
  Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA",
  Maine: "ME", Maryland: "MD", Massachusetts: "MA", Michigan: "MI", Minnesota: "MN",
  Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR",
  Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};

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

  useEffect(() => {
    if (isOverlayOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOverlayOpen]);
  
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

  const handleSwapLocations = () => {
    const tempSrc = source;
    const tempSrcValid = sourceValid;
    setSource(destination);
    setSourceValid(destValid);
    setDestination(tempSrc);
    setDestValid(tempSrcValid);
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
    if (!dates.end) newErrors.end = "Required";

    if (dates.start && dates.end) {
      const startDate = new Date(dates.start + "T12:00:00");
      const endDate = new Date(dates.end + "T12:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) newErrors.start = "Past date";
      if (startDate >= endDate) newErrors.end = "Must be after start";
      else {
        const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) newErrors.end = "Max 30 days";
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
      endDate: dates.end,
      adults,
      children,
      travelMode,
      budget,
      radius,
      interests: [],
    };

    localStorage.setItem("search_state", JSON.stringify(params));
    
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
    <div className="relative w-full z-30 flex flex-col items-center justify-center">
      
      {/* COMPACT MODAL CLOSE BUTTON (INSIDE THE SEARCHBAR) */}
      {isCompact && (
        <button 
          onClick={() => setIsOverlayOpen(false)}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 sm:w-10 sm:h-10 bg-theme-bg/10 border border-theme-bg/20 text-theme-bg rounded-full flex items-center justify-center hover:bg-theme-bg/20 transition-all z-[100] active:scale-90 backdrop-blur-md cursor-pointer"
        >
          <X size={20} />
        </button>
      )}

      {/* BACKGROUND: h-full and rounded if compact, otherwise standard 60% height */}
      <div className={`absolute top-0 w-full bg-gradient-to-b from-theme-text to-theme-text/95 shadow-inner ${isCompact ? 'h-full rounded-[2.5rem]' : 'h-[69%]'}`}></div>

      {/* --- DOTTED/SPOTTED BACKGROUND TEXTURE --- */}
      <div 
        className={`absolute inset-0 z-0 pointer-events-none opacity-[0.1] ${isCompact ? 'rounded-[2.5rem] overflow-hidden' : ''}`} 
        style={{ 
          backgroundImage: 'radial-gradient(circle, currentColor 2px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          color: '#94a3b8' 
        }} 
      />

      {/* FOREGROUND COMPONENT */}
      <div className={`relative z-10 max-w-full mx-auto px-6 md:px-6 lg:px-8 py-8 lg:py-12 w-full ${isCompact ? 'pt-8 lg:pt-8' : ''}`}>
        
        {/* Travel Mode Pills */}
        <div className="mb-4 flex">
          <div className="flex bg-theme-text/20 p-1 rounded-full border border-theme-bg/10 backdrop-blur-md shadow-sm">
            <button 
              onClick={() => setTravelMode("fly")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 ${travelMode === "fly" ? "bg-theme-bg shadow-sm text-theme-text" : "text-theme-bg/80 hover:text-theme-bg hover:bg-theme-bg/10"}`}
            >
              <Plane size={16} /> Flights
            </button>
            <button 
              onClick={() => setTravelMode("drive")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-300 ${travelMode === "drive" ? "bg-theme-bg shadow-sm text-theme-text" : "text-theme-bg/80 hover:text-theme-bg hover:bg-theme-bg/10"}`}
            >
              <Car size={16} /> Drive
            </button>
          </div>
        </div>

        {/* MAIN WHITE CONTAINER */}
        <div className="bg-theme-bg rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-4 md:p-5 lg:p-6 flex flex-col gap-5 w-full relative z-30">
          
          {/* MAIN INPUT ROW: Labels are completely outside the input borders now */}
          <div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-3 overflow-visible relative z-20">
            
            {/* 1. Location Block Container */}
            <div className="flex flex-col flex-[1.2] w-full">
              {/* LABELS OUTSIDE */}
              <div className="flex w-full px-2 lg:px-4 mb-1.5">
                 <label className="flex-1 text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60">From?</label>
                 <label className="flex-1 text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60 pl-4 lg:pl-8">To?</label>
              </div>

              {/* CONNECTED BORDER PILL */}
              <div className="relative flex flex-row h-12 lg:h-14 bg-theme-bg rounded-[1rem] lg:rounded-l-[1rem] border-[1.5px] border-theme-secondary/30 focus-within:border-theme-primary/50 transition-colors shadow-sm group">
                
                {/* Origin */}
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

                {/* Destination */}
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

            {/* 2. Dates Block Container */}
            <div className="flex flex-col flex-[1] w-full relative z-10">
              {/* LABELS OUTSIDE */}
              <div className="flex w-full px-2 lg:px-4 mb-1.5">
                 <label className="flex-1 text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60">Depart</label>
                 <label className="flex-1 text-[10px] lg:text-[11px] uppercase font-black tracking-widest text-theme-text/60 pl-2 lg:pl-4">Return</label>
              </div>

              {/* CONNECTED BORDER PILL */}
              <div className="relative flex flex-row h-12 lg:h-14 bg-theme-bg rounded-[1rem] lg:rounded-l-[1rem] border-[1.5px] border-theme-secondary/30 focus-within:border-theme-primary/50 transition-colors shadow-sm">
                
                {/* Depart */}
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
                    className="w-full bg-transparent font-bold text-[13px] md:text-[15px] text-theme-text outline-none border-none cursor-pointer placeholder-theme-text/40"
                  />
                  {errors.start && <span className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-bold">{errors.start}</span>}
                </div>

                {/* Return */}
                <div className="flex-1 relative flex items-center px-3 md:px-5 lg:px-5 rounded-r-[1rem] lg:rounded-r-full hover:bg-theme-secondary/5 transition-colors">
                  <Calendar size={14} className="text-theme-primary/80 shrink-0 mr-1.5" />
                  <DatePicker
                    selected={dates.end ? new Date(dates.end + "T12:00:00") : null}
                    onChange={(date: Date | null) => {
                      if (!date) return;
                      setDates((d) => ({ ...d, end: formatDate(date) }));
                      if (errors.end) setErrors((prev) => ({ ...prev, end: "" }));
                    }}
                    minDate={minEndDate}
                    placeholderText="Add date"
                    className="w-full bg-transparent font-bold text-[13px] md:text-[15px] text-theme-text outline-none border-none cursor-pointer placeholder-theme-text/40"
                  />
                  {errors.end && <span className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-bold">{errors.end}</span>}
                </div>
              </div>
            </div>

            {/* 3. Search Button Component */}
            <div className="flex flex-col justify-end mt-2 lg:mt-0 lg:flex-shrink-0 relative z-10">
              <div className="hidden lg:block h-[18px] mb-1.5"></div> {/* Spacer aligns button with inputs */}
              {!isWorking ? (
                <button
                  className="w-full lg:w-auto h-12 lg:h-14 lg:min-w-[140px] rounded-[1rem] lg:rounded-full bg-theme-primary text-theme-bg text-[16px] font-black tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all px-8 shadow-lg active:scale-95 border-none"
                  onClick={handleSearchSubmit}
                >
                  <Search size={18} strokeWidth={3} /> Search
                </button>
              ) : (
                <div className="w-full lg:w-auto h-12 lg:h-14 lg:min-w-[140px] rounded-[1rem] lg:rounded-full bg-theme-primary/80 text-theme-bg/80 font-black flex items-center justify-center gap-2 px-8 shadow-inner cursor-not-allowed border-none">
                  <Loader2 size={20} className="animate-spin text-theme-bg" />
                </div>
              )}
            </div>
            
          </div>
          
          {/* BOTTOM ROW: Modifiers (Single line on Mobile) & Trending */}
          <div className="flex flex-col md:flex-row items-start lg:items-center justify-between gap-3 mt-1 px-1 relative z-50">
            
            {/* Buttons: Flexible Row on Mobile */}
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-1 sm:gap-2 w-full xl:w-auto overflow-visible relative z-50">
              
              {/* Traveller Dropdown */}
              <div className="relative z-50 shrink-0" ref={travellerRef}>
                <button 
                  onClick={() => setShowTravellerDropdown(!showTravellerDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 font-bold text-[12px] sm:text-[13px] text-theme-text hover:text-theme-primary transition-colors py-1 px-1.5 sm:px-2 rounded-lg hover:bg-theme-secondary/10 whitespace-nowrap"
                >
                  <Users size={16} className="text-theme-primary/80 shrink-0" />
                  <span>{totalTravellers} <span>Guest{totalTravellers !== 1 ? 's' : ''}</span></span>
                  <ChevronDown size={14} className="text-theme-text/60 shrink-0" />
                </button>
                
                {/* POPUP MENU */}
                {showTravellerDropdown && (
                  <div className="relative top-full left-0 mt-3 w-[260px] sm:w-72 bg-theme-bg text-theme-text rounded-2xl shadow-xl border border-theme-secondary/20 p-5 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-5">
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

              {/* Budget Dropdown */}
              <div className="relative group cursor-pointer flex items-center gap-1 sm:gap-1.5 py-1 px-1.5 sm:px-2 rounded-lg hover:bg-theme-secondary/10 transition-colors whitespace-nowrap shrink-0">
                <span className="text-base sm:text-lg">{budget === 'budget' ? '💰' : '✨'}</span>
                <select 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value as "budget" | "Premium")}
                  className="appearance-none bg-transparent font-bold text-[12px] sm:text-[13px] text-theme-text cursor-pointer outline-none pr-4 sm:pr-5 hover:text-theme-primary transition-colors border-none"
                >
                  <option value="budget">Budget</option>
                  <option value="Premium">Premium</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none text-theme-text/60" />
              </div>

              {/* Sleek Radius Input */}
              <div className="flex items-center gap-1 sm:gap-2 py-1 px-1 sm:px-2 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-theme-text/50 hidden sm:inline">Radius:</span>
                 <span className="text-[10px] font-black uppercase tracking-wider text-theme-text/50 sm:hidden">Rad:</span>
                 <input
                    type="number"
                    min={1} 
                    max={100}
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 1)}
                    className="w-[42px] sm:w-[52px] bg-theme-secondary/5 border border-theme-secondary/20 rounded-md px-1 py-1 text-[12px] sm:text-[13px] font-bold text-theme-text outline-none focus:border-theme-primary focus:ring-1 focus:ring-theme-primary transition-all text-center hide-arrows"
                  />
                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-theme-text/50">mi</span>
              </div>
            </div>

            {/* Trending Context: Sticky Icon + Scrollable Places List */}
            {topDestinations.length > 0 && (
              <div className="flex flex-row items-center w-full xl:w-auto relative z-10 py-1">
                {/* Sticky Label */}
                <div className="flex items-center gap-1.5 shrink-0 pr-3">
                   <TrendingUp size={16} className="text-theme-primary" />
                   <span className="text-[11px] font-black uppercase text-theme-text/60 tracking-wider">Trending:</span>
                </div>
                
                {/* Scrollable Places */}
                <div className="flex flex-row items-center gap-2 overflow-x-auto no-scrollbar w-full">
                  {topDestinations.map((dest, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDestination(dest.full_name); setDestValid(true);
                        if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
                      }}
                      className="px-4 py-1.5 rounded-full bg-theme-secondary/5 text-theme-text/80 text-[11px] font-bold hover:bg-theme-secondary/10 transition-all whitespace-nowrap border border-theme-secondary/10 shadow-sm shrink-0"
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
      
      {/* Utility CSS for Number Inputs and hiding scrollbars on mobile */}
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
      {/* 1. Summary Bar (Only displays when isCompact is true) */}
      {isCompact && (
        <div className="w-full bg-theme-bg/95 backdrop-blur-xl py-3 px-4 md:px-6 flex items-center justify-center border-b border-theme-secondary/20 z-20 sticky top-0 shadow-sm transition-all duration-300">
          
          <div className="flex items-center w-full max-w-[750px] mx-auto justify-center">
            
            {/* THE COMPACT PILL */}
            <button
              onClick={() => setIsOverlayOpen(true)}
              className="w-full bg-theme-bg border border-theme-secondary/20 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-full flex items-center p-1.5 sm:p-2 transition-all duration-300 cursor-pointer group"
            >
          {/* MOBILE: Stacked Text Content (Now on the left, taking full width) */}
              <div className="flex flex-col sm:hidden flex-1 text-left overflow-hidden pl-4 py-1">
                <span className="font-bold text-[13px] text-theme-text truncate">
                  {source || 'Anywhere'} {destination ? `to ${destination}` : ''}
                </span>
                <div className="flex items-center text-[11px] text-theme-text/60 gap-1 mt-[2px] truncate font-medium">
                  <span>{dates.start ? `${dates.start}` : 'Any dates'}</span>
                  <span>•</span>
                   <span>{dates.end ? `${dates.end}` : 'Any dates'}</span>
                   <span>•</span>
                  <span>{adults + children} Guest{adults + children !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{travelMode === 'fly' ? 'Flights' : 'Drive'}</span>
                </div>
              </div>

              {/* MOBILE: Right Edit Icon */}
              <div className="sm:hidden bg-theme-primary text-theme-bg p-2 rounded-full shadow-sm mr-1 shrink-0">
                <PenBoxIcon size={16} strokeWidth={2.5} />
              </div>

              {/* DESKTOP: Segmented Content */}
              <div className="hidden sm:flex items-center justify-between flex-1 pl-2 pr-1">
                <div className="flex items-center flex-1">
                  
                  {/* Location Segment */}
                  <div className="font-bold text-[14px] text-theme-text px-4 py-2 rounded-full hover:bg-theme-secondary/5 transition-colors truncate max-w-[200px] lg:max-w-[320px]">
                    {source || 'Anywhere'} {destination ? `→ ${destination}` : ''}
                  </div>
                  
                  <div className="w-[1px] h-6 bg-theme-secondary/20 mx-1 shrink-0"></div>
                  
                  {/* Dates Segment */}
                  <div className="font-medium text-[13px] text-theme-text/70 px-4 py-2 rounded-full hover:bg-theme-secondary/5 transition-colors whitespace-nowrap">
                    {dates.start ? `${dates.start} - ${dates.end || '?'}` : 'Any week'}
                  </div>

                  <div className="w-[1px] h-6 bg-theme-secondary/20 mx-1 shrink-0"></div>
                  
                  {/* Guests Segment */}
                  <div className="font-medium text-[13px] text-theme-text/70 px-4 py-2 rounded-full hover:bg-theme-secondary/5 transition-colors whitespace-nowrap">
                    {adults + children} Guest{adults + children !== 1 ? 's' : ''}
                  </div>

                  <div className="w-[1px] h-6 bg-theme-secondary/20 mx-1 shrink-0"></div>

                  {/* Mode Indicator */}
                  <div className="ml-2 flex items-center gap-1.5 uppercase tracking-widest rounded-full text-[10px] text-theme-primary font-black bg-theme-primary/10 px-2 py-1 rounded-md shrink-0">
                    {travelMode === 'fly' ? <Plane size={12}/> : <Car size={12}/>}
                    {travelMode === 'fly' ? 'Flights' : 'Drive'}
                  </div>

                </div>
                
                {/* DESKTOP: Right Edit Button */}
                <div className="bg-theme-primary text-theme-bg p-2.5 rounded-full shadow-sm group-hover:scale-105 transition-transform ml-2 shrink-0">
                  <PenBoxIcon size={16} strokeWidth={3} />
                </div>
              </div>
            </button>

            {/* Mobile Map Toggle */}
            {onMapToggle && (
              <button
                onClick={onMapToggle}
                className="ml-3 p-3 rounded-full bg-theme-bg text-theme-text border border-theme-secondary/30 hover:bg-theme-secondary/10 hover:border-theme-primary/40 transition-colors shadow-sm md:hidden flex-shrink-0 active:scale-95"
              >
                {mapOpen ? <X size={18} className="text-theme-primary" /> : <Map size={18} className="text-theme-primary" />}
              </button>
            )}

          </div>
        </div>
      )}

      {/* 2. Blurred Overlay Modal (Opens when pill is clicked) */}
      {isCompact && isOverlayOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsOverlayOpen(false)}></div>
          
          <div className="relative w-full max-w-6xl animate-in slide-in-from-top-4 fade-in duration-200 z-50">
            {/* The Expanded Searchbar - overflow-visible fixes the clipping issue! */}
            <div className="bg-transparent rounded-[2.5rem] shadow-2xl overflow-visible relative border-none">
              {renderFullSearchContent()}
            </div>
          </div>
        </div>
      )}

      {/* 3. Standard Inline View (When isCompact is false) */}
      {!isCompact && renderFullSearchContent()}
    </>
  );
}

// Modernized Counter for the Popover
function SbCounter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void; }) {
  return (
    <div className="flex items-center gap-3 bg-theme-secondary/5 rounded-full p-1 border border-theme-secondary/20">
      <button 
        type="button" 
        className="w-8 h-8 rounded-full bg-theme-bg shadow-sm text-theme-text hover:text-theme-primary flex items-center justify-center font-bold text-lg disabled:opacity-40 transition-all active:scale-90" 
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >−</button>
      <span className="font-black text-[15px] text-theme-text text-center w-4">{value}</span>
      <button 
        type="button" 
        className="w-8 h-8 rounded-full bg-theme-bg shadow-sm text-theme-text hover:text-theme-primary flex items-center justify-center font-bold text-lg disabled:opacity-40 transition-all active:scale-90" 
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >+</button>
    </div>
  );
}