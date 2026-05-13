"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X, Plane, Hotel, MapPin, Calendar, Users, DollarSign, Download, Share2, 
  Loader2, Send, Car, Ticket, Sun, Camera, Save, Plus, CheckCircle2, Receipt
} from "lucide-react";
import { travelApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import FlightCheckout from "./FlightCheckOut";
import { useRouter } from "next/navigation";

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawParams: any;
  weatherData?: any;
}

export default function ItineraryModal({
  isOpen,
  onClose,
  rawParams,
  weatherData,
}: ItineraryModalProps) {
  const { user, isLoggedIn } = useAuth();
  const checkoutRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // --- States ---
  const [selections, setSelections] = useState<any>({});
  const [defaultAttractions, setDefaultAttractions] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  
  // Save States
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);

  // Booking & Pricing States
  const [isBooked, setIsBooked] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [updatedFlightPrice, setUpdatedFlightPrice] = useState<number | null>(null);
  const [updatedFlightTaxes, setUpdatedFlightTaxes] = useState<number | null>(null);
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedSelections = sessionStorage.getItem("selected_trip_state");
      if (savedSelections) {
        try { setSelections(JSON.parse(savedSelections)); } 
        catch (e) { setSelections({}); }
      } else {
        setSelections({});
      }

      const cachedTrip = sessionStorage.getItem("current_trip_results");
      if (cachedTrip) {
        try {
          const parsedTrip = JSON.parse(cachedTrip);
          setDefaultAttractions(parsedTrip.attractions || parsedTrip.attractionsData || []);
        } catch (e) {
          setDefaultAttractions([]);
        }
      } else {
        setDefaultAttractions([]);
      }

      setShowEmailInput(false);
      setEmail("");
      setIsSaved(false);
      setIsAlreadySaved(false);
      setIsBooked(false);
      setBookingRef(null);
      setUpdatedFlightPrice(null);
      setUpdatedFlightTaxes(null);
      setIsCheckoutExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNavigateToTab = (tabId: string) => {
    sessionStorage.setItem("active_tab", tabId);
    window.dispatchEvent(new Event("active_tab_changed"));
    onClose();
  };


  // --- Data Extraction ---
  const flight = Array.isArray(selections?.flights) ? selections.flights[0] : selections?.flights;
  
  let rawDrive = selections?.drive || selections?.driving;
  let drive = null;
  if (rawDrive) {
    if (Array.isArray(rawDrive)) drive = rawDrive[0];
    else if (rawDrive.data) drive = rawDrive.data;
    else drive = rawDrive;
  }

  const stay = Array.isArray(selections?.stays) ? selections.stays[0] : selections?.stays;
  const tours = selections?.tours || selections?.activities || [];
  const activeAttractions = selections?.attractions?.length > 0 ? selections.attractions : defaultAttractions;
  
  const isWeatherSelected = weatherData && weatherData.days && weatherData.days.length > 0;
  const isOneWay = !rawParams?.endDate || rawParams?.tripType === "one-way";
  let firstDayWeather = isWeatherSelected ? weatherData.days[0] : null;

  // --- Detailed Cost Calculations ---
  let chargeableSubtotal = 0;
  let taxesAndFees = 0;
  let estimatedFuel = 0; // Tracked separately for info only

  if (flight) {
    const total = updatedFlightPrice !== null ? updatedFlightPrice : Number(flight.price?.total || flight.price || 0);
    const explicitTaxes = updatedFlightTaxes !== null ? updatedFlightTaxes : (flight.price?.totalTaxes ? Number(flight.price.totalTaxes) : total * 0.15);
    chargeableSubtotal += (total - explicitTaxes);
    taxesAndFees += explicitTaxes;
  } else if (drive) {
    if (drive.distance_km) {
      estimatedFuel = ((drive.distance_km * 0.621371) / 25) * 3.35;
    } else {
      estimatedFuel = Number((drive.fuelEstimate || drive.price || "0").toString().replace(/[^0-9.-]+/g, ""));
    }
  }

  if (stay) {
    const total = Number(stay.offerDetails?.price || stay.price || 0);
    const explicitTaxes = Number(stay.offerDetails?.taxes || 0);
    const estTax = explicitTaxes > 0 ? explicitTaxes : total * 0.12; 
    chargeableSubtotal += (total - estTax);
    taxesAndFees += estTax;
  }

  tours.forEach((t: any) => {
    if (t.price && t.price.amount) chargeableSubtotal += parseFloat(t.price.amount);
  });

  const grandTotal = chargeableSubtotal + taxesAndFees;

  // --- Formatting Helpers ---
  let displayDriveDuration = "N/A";
  let displayDriveDistance = "N/A";
  if (drive?.duration_mins) displayDriveDuration = `${Math.floor(drive.duration_mins / 60)}h ${Math.round(drive.duration_mins % 60)}m`;
  else if (drive?.duration?.text) displayDriveDuration = drive.duration.text;
  
  if (drive?.distance_km) displayDriveDistance = `${(drive.distance_km * 0.621371).toFixed(0)} Mi`;
  else if (drive?.distance?.text) displayDriveDistance = drive.distance.text;

  const passedCities = drive?.passedCities || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const formatShortDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  
  const getLayoverTime = (arrStr: string, depStr: string) => {
    if (!arrStr || !depStr) return null;
    const diffMs = new Date(depStr).getTime() - new Date(arrStr).getTime();
    if (diffMs <= 0) return null;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  };

  // NEW: Dynamic Route Formatter
  const formatRoute = (cities: string[]) => {
    if (!cities || cities.length === 0) return null;
    // Strip state strings by splitting at the comma
    const formattedCities = cities.map(c => c.split(',')[0].trim());
    
    if (formattedCities.length <= 4) {
      return formattedCities.join(" - ");
    }
    
    // Grab first two and last two cities, separated by dots
    const start = formattedCities.slice(0, 2).join(" - ");
    const end = formattedCities.slice(-2).join(" - ");
    return `${start} ...... ${end}`;
  };

  const getFullTripTitle = () => {
    const src = rawParams?.source?.name?.split(",")[0] || rawParams?.source?.city;
    const dst = rawParams?.destination?.name?.split(",")[0] || rawParams?.destination?.city || "Trip";
    return src ? `${src} to ${dst}` : dst;
  };
  const destCityName = rawParams?.destination?.name?.split(",")[0] || "Destination";
  const originCityName = rawParams?.source?.name?.split(",")[0] || "Origin";

  const cityImageUrl = `https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80`;

  // --- Handlers ---
  const handleBookingSuccess = (pnrCode?: string) => {
    setIsBooked(true);
    setIsCheckoutExpanded(false); 
    if (pnrCode) setBookingRef(pnrCode);
    if (!isSaved && !isAlreadySaved) handleSaveTrip();
  };

  const handleSaveTrip = async () => {
   if (!isLoggedIn) {router.push("/auth"); 
      return;
    }
    setIsSaving(true); setIsAlreadySaved(false);
    try {
      const res = await travelApi.saveTrip({
        destination: rawParams?.destination?.city || rawParams?.destination?.name || "Trip",
        check_in_date: rawParams?.startDate, check_out_date: rawParams?.endDate, booking_ref: bookingRef,
        flight: flight ? { airline_name: flight.airline_name, price: flight.price?.total || flight.price } : null,
        drive: drive ? { distance: displayDriveDistance, duration: displayDriveDuration, estimatedFuel } : null,
        hotel: stay ? { name: stay.name, price: stay.offerDetails?.price || stay.price } : null,
        attractions: activeAttractions ? activeAttractions.map((a: any) => ({ name: a.name })) : [],
        activities: tours ? tours.map((t: any) => ({ name: t.name || t.title })) : [],
        rawParams: { source: { name: originCityName }, startDate: rawParams?.startDate, endDate: rawParams?.endDate },
      });
      if (res && res.message === "Trip already saved!") setIsAlreadySaved(true);
      else setIsSaved(true);
    } catch (e) { alert("Failed to save the trip."); } 
    finally { setIsSaving(false); }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const pdfBlob = await travelApi.exportPdf({
        destination: getFullTripTitle(), username: user || "Traveler",
        check_in_date: rawParams?.startDate, check_out_date: rawParams?.endDate,
        weather: isWeatherSelected ? weatherData : null,
        flight, drive, hotel: stay, attractions: activeAttractions, activities: tours,
      });
      if (pdfBlob) {
        const url = window.URL.createObjectURL(new Blob([pdfBlob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${getFullTripTitle().replace(/\s+/g, "_")}.pdf`);
        document.body.appendChild(link); link.click();
      }
    } catch (e) { alert("Failed to generate PDF Itinerary."); } 
    finally { setIsExporting(false); }
  };

  const handleSharePdf = async () => {
    if (!email || !email.includes("@")) return alert("Invalid email address.");
    setIsSharing(true);
    try {
      await travelApi.sharePdf({
        destination: getFullTripTitle(), username: user || "Traveler",
        check_in_date: rawParams?.startDate, check_out_date: rawParams?.endDate,
        weather: isWeatherSelected ? weatherData : null,
        flight, drive, hotel: stay, attractions: activeAttractions, activities: tours,
      }, email);
      alert("Itinerary sent successfully!");
      setShowEmailInput(false); setEmail("");
    } catch (e) { alert("Failed to send itinerary to email."); } 
    finally { setIsSharing(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-theme-secondary/90 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-theme-white w-full h-full md:h-[90vh] max-w-[1200px] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Universal Top Header */}
        <div className="px-6 py-5 flex justify-between items-center bg-theme-white border-b border-theme-soft-slate shrink-0 z-20 relative">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center shadow-md">
               <Plane size={14} className="text-theme-white" />
             </div>
             <h2 className="text-xl font-black text-theme-secondary tracking-tight hidden sm:block">Checkout & Itinerary</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-theme-cool-white hover:bg-theme-soft-slate/50 rounded-full transition-colors border border-theme-soft-slate shadow-sm shrink-0 active:scale-95 flex items-center gap-2">
            <span className="text-xs font-bold px-2 hidden sm:block text-theme-secondary">Close</span>
            <X size={18} className="text-theme-secondary" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden relative custom-scrollbar">
          
          {/* =========================================================
              LEFT COLUMN: STATIC SUMMARY 
              ========================================================= */}
          <div className="w-full lg:w-[320px] xl:w-[360px] flex flex-col border-b lg:border-b-0 lg:border-r border-theme-soft-slate bg-theme-cool-white shrink-0 relative lg:h-full lg:min-h-0">
            
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar pb-6 lg:pb-0 lg:min-h-0">
              
              <div className="w-full h-48 relative border-b border-theme-soft-slate">
                <img src={cityImageUrl} alt={destCityName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-theme-secondary/95 via-theme-secondary/40 to-transparent"></div>
                <div className="absolute bottom-4 left-6 right-6">
                  <p className="text-theme-white/80 text-[10px] font-black uppercase tracking-widest mb-1">{originCityName} to</p>
                  <h3 className="text-3xl font-black text-theme-white tracking-tight leading-none truncate">{destCityName}</h3>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <SummaryCard icon={<Calendar size={14} />} label="Dates" value={isOneWay ? "One Way" : `${formatDate(rawParams?.startDate)} - ${formatDate(rawParams?.endDate)}`} />
                  <SummaryCard icon={<Users size={14} />} label="Guests" value={`${rawParams?.adults || 0} Adults, ${rawParams?.children || 0} Children`} />
                </div>

                {isWeatherSelected && firstDayWeather && (
                  <div className="p-4 rounded-2xl bg-theme-white border border-theme-soft-slate shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-theme-light-gray">Arrival Weather</span>
                      <Sun size={16} className="text-theme-primary" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-theme-secondary leading-none">{Math.round(firstDayWeather.max_temp ?? 0)}°</span>
                      <span className="text-xs font-bold text-theme-light-gray mb-1">/ {Math.round(firstDayWeather.min_temp ?? 0)}° F</span>
                    </div>
                    <p className="text-[11px] font-black text-theme-secondary/80 mt-1 uppercase tracking-widest">{firstDayWeather.weather ?? "Clear skies"}</p>
                  </div>
                )}

                <div className="rounded-2xl bg-theme-white border border-theme-soft-slate shadow-sm overflow-hidden mt-2 transition-all">
                   <div className="p-4 bg-theme-secondary flex items-center gap-2">
                     <Receipt size={14} className="text-theme-white" />
                     <span className="font-black uppercase tracking-widest text-[10px] text-theme-white">Price Breakdown</span>
                   </div>
                   <div className="p-4 flex flex-col gap-3">
                     <div className="flex justify-between items-center text-[13px] font-bold text-theme-secondary">
                       <span>Base Fares & Rates</span>
                       <span>${chargeableSubtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-[13px] font-bold text-theme-secondary border-b border-theme-soft-slate pb-3">
                       <span>Est. Taxes & Fees</span>
                       <span>${taxesAndFees.toFixed(2)}</span>
                     </div>
                     {drive && (
                        <div className="flex justify-between items-center text-[11px] font-bold text-theme-light-gray border-b border-theme-soft-slate pb-3">
                          <span className="flex items-center gap-1.5">Est. Fuel <span className="text-[9px] uppercase tracking-widest text-theme-primary">(Not Charged)</span></span>
                          <span>~${estimatedFuel.toFixed(2)}</span>
                        </div>
                     )}
                     <div className="flex justify-between items-end pt-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-theme-light-gray">Total Due Now</span>
                       <span className="font-black text-2xl tracking-tight text-theme-primary transition-all">${grandTotal.toFixed(2)}</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>

{/* Left Sticky Footer: Save Draft */}
<div className="w-full p-5 bg-theme-cool-white/95 border-t border-theme-soft-slate lg:absolute lg:bottom-0">
  <button
    onClick={handleSaveTrip}
    // Button is now ENABLED if not logged in (to allow the redirect)
    disabled={isSaving || isSaved || isAlreadySaved} 
    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98] ${
      (isSaving || isSaved || isAlreadySaved)
        ? "bg-theme-white text-theme-light-gray cursor-not-allowed shadow-none border border-theme-soft-slate"
        : "bg-theme-secondary text-theme-white shadow-lg hover:bg-theme-secondary/90"
    }`}
  >
    {isSaving ? (
      <Loader2 size={16} className="animate-spin" />
    ) : isAlreadySaved ? (
      <Save size={16} className="text-theme-primary" />
    ) : isSaved ? (
      <Save size={16} className="text-theme-success" />
    ) : (
      <Save size={16} />
    )}
    
    {!isLoggedIn 
      ? "Log in to Save" 
      : isSaving 
        ? "Saving..." 
        : isAlreadySaved 
          ? "Draft Saved" 
          : isSaved 
            ? "Saved!" 
            : "Save Draft"
    }
  </button>
</div>
          </div>

          {/* =========================================================
              RIGHT COLUMN: SCROLLABLE INVENTORY & STICKY CHECKOUT
              ========================================================= */}
          <div className="flex-1 flex flex-col bg-theme-white relative lg:h-full lg:min-h-0">
            
            <div className="flex-1 lg:overflow-y-auto lg:overscroll-contain custom-scrollbar pb-10 lg:min-h-0">
              <div className="p-6 sm:p-10 flex flex-col gap-10 max-w-4xl mx-auto w-full">
                
                <section>
                  <SectionTitle icon={flight ? <Plane size={16} /> : <Car size={16} />} title="Transportation" />
                  {flight ? (
                     <div className="bg-theme-white rounded-2xl p-6 border border-theme-soft-slate shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
                       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
                         <div>
                            <span className="font-black text-xl text-theme-secondary">{flight.airline_name}</span>
                            <p className="text-xs text-theme-light-gray mt-1 font-bold">
                               {flight.travel_class || "Economy"} Class • {flight.itineraries?.[0]?.segments?.length > 1 ? "Connecting" : "Direct"} Flight
                            </p>
                         </div>
                         <span className="text-theme-primary font-black text-lg bg-theme-primary/10 px-3 py-1 rounded-lg inline-block w-fit">
                           ${Number(flight.price?.total || flight.price || 0).toFixed(2)}
                         </span>
                       </div>
                       
                       <div className="flex flex-col gap-4">
                         {(flight.itineraries || []).map((itin: any, idx: number) => {
                           const stops = itin.segments?.length ? itin.segments.length - 1 : 0;
                           const boundDate = itin.segments?.[0]?.departure_time ? formatShortDate(itin.segments[0].departure_time) : "";
                           return (
                             <div key={idx} className="bg-theme-cool-white p-4 rounded-xl border border-theme-soft-slate">
                               <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-soft-slate">
                                 <span className="text-[10px] uppercase font-black text-theme-secondary/80 tracking-widest">
                                   {idx === 0 ? "🛫 Outbound" : "🛬 Return"} {boundDate && `• ${boundDate}`}
                                 </span>
                                 <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${stops === 0 ? "bg-theme-primary/10 text-theme-primary" : "bg-theme-secondary/10 text-theme-secondary"}`}>
                                   {stops === 0 ? "Direct" : `${stops} Stop(s)`}
                                 </span>
                               </div>
                               <div className="flex flex-col gap-2">
                                 {(itin.segments || []).map((seg: any, sIdx: number) => {
                                   let layoverStr = null;
                                   if (sIdx > 0) layoverStr = getLayoverTime(itin.segments[sIdx - 1].arrival_time, seg.departure_time);
                                   return (
                                     <React.Fragment key={sIdx}>
                                       {layoverStr && (
                                         <div className="flex items-center justify-center my-1">
                                           <span className="text-[9px] font-black uppercase tracking-widest text-theme-light-gray bg-theme-white px-3 py-1 rounded-full border border-theme-soft-slate">⏱ Layover: {layoverStr}</span>
                                         </div>
                                       )}
                                       <div className="flex flex-col gap-3 bg-theme-white p-4 rounded-lg border border-theme-soft-slate shadow-sm">
                                         <div className="flex items-center gap-4 text-theme-secondary">
                                           <div className="flex-1">
                                             <p className="font-black text-xl text-theme-secondary">{formatTime(seg.departure_time)}</p>
                                             <p className="text-[10px] font-black text-theme-light-gray uppercase tracking-widest mt-0.5">{seg.departure_airport}</p>
                                           </div>
                                           <div className="h-[2px] flex-1 bg-theme-soft-slate relative"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-theme-white px-2 text-[10px]">✈️</div></div>
                                           <div className="flex-1 text-right">
                                             <p className="font-black text-xl text-theme-secondary">{formatTime(seg.arrival_time)}</p>
                                             <p className="text-[10px] font-black text-theme-light-gray uppercase tracking-widest mt-0.5">{seg.arrival_airport}</p>
                                           </div>
                                         </div>
                                         <div className="flex flex-wrap gap-2 mt-1 pt-3 border-t border-theme-soft-slate/50">
                                            <span className="text-[9px] bg-theme-cool-white px-2 py-1 rounded-md text-theme-light-gray font-black uppercase tracking-widest">
                                              Flight {seg.carrierCode || seg.airline_code}{seg.flightNumber || seg.number}
                                            </span>
                                            {seg.aircraft && (
                                              <span className="text-[9px] bg-theme-cool-white px-2 py-1 rounded-md text-theme-light-gray font-black uppercase tracking-widest">
                                                {typeof seg.aircraft === 'string' ? seg.aircraft : seg.aircraft.code || "Aircraft"}
                                              </span>
                                            )}
                                            {(flight.travel_class || seg.cabin) && (
                                              <span className="text-[9px] bg-theme-cool-white px-2 py-1 rounded-md text-theme-light-gray font-black uppercase tracking-widest">
                                                {flight.travel_class || seg.cabin}
                                              </span>
                                            )}
                                         </div>
                                       </div>
                                     </React.Fragment>
                                   );
                                 })}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                  ) : drive ? (
                     <div className="bg-theme-white rounded-xl p-5 border border-theme-soft-slate shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
                       <div className="flex justify-between items-center mb-4">
                         <span className="font-black text-lg text-theme-secondary flex items-center gap-2"><Car size={18} /> Road Trip</span>
                         <span className="text-theme-primary font-black text-sm bg-theme-primary/10 px-3 py-1 rounded-lg">{displayDriveDuration}</span>
                       </div>
                       <div className="flex flex-col gap-3 bg-theme-cool-white p-4 rounded-xl border border-theme-soft-slate">
                         <div className="flex justify-between items-end">
                           <div>
                             <p className="font-black text-sm text-theme-secondary flex items-center gap-2">
                               <span>{drive?.sourceName?.split(',')[0] || originCityName}</span>
                               <span className="text-theme-light-gray text-xs">➔</span>
                               <span>{drive?.destinationName?.split(',')[0] || destCityName}</span>
                             </p>
                             <p className="text-[10px] text-theme-light-gray font-black mt-1 uppercase tracking-widest">Distance: {displayDriveDistance}</p>
                           </div>
                           <div className="text-right flex flex-col items-end">
                             <p className="text-theme-primary font-black text-lg">~${estimatedFuel.toFixed(2)}</p>
                             <p className="text-[8px] text-theme-light-gray font-black uppercase tracking-widest mt-0.5">Est. Fuel</p>
                           </div>
                         </div>
                         {passedCities.length > 0 && (
                            <div className="mt-1 pt-3 border-t border-theme-soft-slate/50">
                              <p className="text-xs font-bold text-theme-secondary/80 leading-relaxed truncate">
                                {formatRoute(passedCities)}
                              </p>
                            </div>
                         )}
                       </div>
                     </div>
                  ) : (
                    <EmptyStateCard title="Transportation" message={`No ${rawParams?.travelMode === 'fly' ? 'flights' : 'drive route'} selected.`} buttonText={`Add ${rawParams?.travelMode === 'fly' ? 'Flights' : 'Drive'}`} onAdd={() => handleNavigateToTab(rawParams?.travelMode === 'fly' ? 'flights' : 'drive')} />
                  )}
                </section>

                <section>
                  <SectionTitle icon={<Hotel size={16} />} title="Accommodation" />
                  {stay ? (
                    <div className="bg-theme-white rounded-2xl p-6 border border-theme-soft-slate shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-theme-secondary"></div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                             <h4 className="font-black text-lg text-theme-secondary leading-tight">{stay.name}</h4>
                             {(stay.rating || stay.hotel?.rating) && (
                                <span className="bg-theme-accent/10 text-theme-accent text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                  ★ {stay.rating || stay.hotel?.rating} Star
                                </span>
                             )}
                          </div>
                          <p className="text-[10px] text-theme-secondary/80 font-black uppercase tracking-widest flex items-center gap-1.5">
                             <MapPin size={12} className="text-theme-light-gray" /> 
                             <span className="line-clamp-1">{stay.address?.lines?.join(", ")}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0 bg-theme-cool-white px-4 py-3 rounded-xl border border-theme-soft-slate">
                          <p className="text-theme-secondary font-black text-xl">${Number(stay.offerDetails?.price || stay.price || 0).toFixed(2)}</p>
                          <p className="text-[9px] text-theme-light-gray font-black uppercase tracking-widest mt-1">Total Stay</p>
                        </div>
                      </div>

                      <div className="bg-theme-cool-white rounded-xl p-4 border border-theme-soft-slate flex flex-col gap-3">
                         <div className="flex justify-between items-center text-xs font-bold text-theme-secondary border-b border-theme-soft-slate/50 pb-2">
                           <span className="flex items-center gap-1.5 text-theme-light-gray"><Calendar size={12}/> Check In</span>
                           <span>{formatShortDate(rawParams?.startDate)}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs font-bold text-theme-secondary border-b border-theme-soft-slate/50 pb-2">
                           <span className="flex items-center gap-1.5 text-theme-light-gray"><Calendar size={12}/> Check Out</span>
                           <span>{formatShortDate(rawParams?.endDate)}</span>
                         </div>
                         
                         <div className="flex flex-wrap gap-2 pt-1">
                           <span className="text-[9px] bg-theme-white px-2 py-1 rounded-md border border-theme-soft-slate/50 text-theme-secondary font-black uppercase tracking-widest">
                             {stay.offerDetails?.rooms?.[0]?.category || stay.room?.type || "Standard Room"}
                           </span>
                           <span className="text-[9px] bg-theme-white px-2 py-1 rounded-md border border-theme-soft-slate/50 text-theme-secondary font-black uppercase tracking-widest">
                             {stay.offerDetails?.rooms?.[0]?.bed_type || stay.room?.bedType || "Standard Bed"}
                           </span>
                           {stay.offerDetails?.boardType && (
                              <span className="text-[9px] bg-theme-white px-2 py-1 rounded-md border border-theme-soft-slate/50 text-theme-primary font-black uppercase tracking-widest">
                                {stay.offerDetails.boardType.replace(/_/g, " ")}
                              </span>
                           )}
                         </div>
                      </div>

                    </div>
                  ) : (
                    <EmptyStateCard title="Accommodation" message="Where are you staying?" buttonText="Add Hotel" onAdd={() => handleNavigateToTab("stays")} />
                  )}
                </section>

                <section>
                  <SectionTitle icon={<Ticket size={16} />} title="Tours & Activities" />
                  {tours.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {tours.map((tour: any, idx: number) => (
                        <div key={idx} className="bg-theme-white rounded-2xl p-5 border border-theme-soft-slate shadow-sm flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-base text-theme-secondary leading-snug">{tour.name || tour.title}</h5>
                              <p className="text-xs text-theme-light-gray mt-1.5 line-clamp-2 leading-relaxed">
                                {tour.short_description || tour.description || "Experience the best of the local culture and sights with this highly-rated guided tour."}
                              </p>
                            </div>
                            {tour.price && tour.price.amount && (
                              <div className="text-left sm:text-right shrink-0">
                                <p className="text-theme-primary font-black text-xl">${parseFloat(tour.price.amount).toFixed(2)}</p>
                                <p className="text-[9px] text-theme-light-gray font-black uppercase tracking-widest mt-1">Per Person</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-theme-soft-slate/50">
                             {tour.duration && (
                                <span className="text-[9px] bg-theme-cool-white border border-theme-soft-slate px-2 py-1 rounded-md text-theme-secondary font-black uppercase tracking-widest flex items-center gap-1">
                                  ⏱ {tour.duration}
                                </span>
                             )}
                             <span className="text-[9px] bg-theme-cool-white border border-theme-soft-slate px-2 py-1 rounded-md text-theme-success font-black uppercase tracking-widest">
                               ✓ Free Cancellation
                             </span>
                             {tour.rating && (
                                <span className="text-[9px] bg-theme-accent/10 border border-theme-accent/20 px-2 py-1 rounded-md text-theme-accent font-black uppercase tracking-widest">
                                  ★ {tour.rating} Rating
                                </span>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard title="Activities" message="No experiences booked yet." buttonText="Add Tours" onAdd={() => handleNavigateToTab("tours")} />
                  )}
                </section>

                <section>
                  <SectionTitle icon={<Camera size={16} />} title="Planned Attractions" />
                  {activeAttractions.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar">
                      {activeAttractions.map((attr: any, idx: number) => (
                        <div key={idx} className="min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px] snap-start bg-theme-white rounded-2xl p-4 border border-theme-soft-slate shadow-sm flex flex-col gap-3 group hover:border-theme-primary/30 transition-colors">
                          <div className="w-full h-28 sm:h-32 bg-theme-cool-white rounded-xl flex items-center justify-center group-hover:bg-theme-primary/10 transition-colors overflow-hidden">
                            {attr.image || attr.photo ? (
                                <img src={attr.image || attr.photo} alt={attr.name} className="w-full h-full object-cover" />
                            ) : (
                                <MapPin size={32} className="text-theme-light-gray group-hover:text-theme-primary transition-colors" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-theme-secondary truncate">{attr.name}</h5>
                            <p className="text-[10px] text-theme-light-gray font-black uppercase tracking-widest mt-1 truncate">
                              {attr.category || attr.kinds?.split(",")[0]?.replace(/_/g, " ") || "Point of Interest"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard title="Attractions" message="No places to visit selected." buttonText="Add Attractions" onAdd={() => handleNavigateToTab("attractions")} />
                  )}
                </section>
              </div>
            </div>

            {/* STICKY RIGHT FOOTER: Dynamic Checkout Container */}
            <div className={`w-full z-30 shrink-0 mt-auto transition-all duration-300 bg-theme-white ${
              isCheckoutExpanded
                ? "absolute inset-0 h-full flex flex-col"
                : "sticky bottom-0 border-t border-theme-soft-slate shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] p-5 lg:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar"
            }`}>
               {!isBooked ? (
                  flight ? (
                     <FlightCheckout 
                        flightOffer={flight} 
                        grandTotal={grandTotal}
                        onPriceConfirmed={(total: number, taxes: number) => {
                           setUpdatedFlightPrice(total);
                           setUpdatedFlightTaxes(taxes);
                        }}
                        onExpandedChange={setIsCheckoutExpanded}
                        onSuccess={(pnr: string) => handleBookingSuccess(pnr)} 
                     />
                  ) : (
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                       <div className="text-center sm:text-left flex flex-col">
                         <span className="text-[10px] uppercase tracking-widest text-theme-light-gray font-black mb-0.5">Total Due Now</span>
                         <span className="text-3xl font-black text-theme-secondary leading-none">${grandTotal.toFixed(2)}</span>
                       </div>
                       <button onClick={() => handleBookingSuccess("TRIP-1234")} className="px-8 py-4 bg-theme-primary text-theme-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-lg active:scale-95 w-full sm:w-auto">
                         {grandTotal > 0 ? "Confirm & Pay" : "Confirm Trip"}
                       </button>
                     </div>
                  )
               ) : (
                  <div className="w-full py-4 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={40} className="text-theme-success" />
                      <div className="text-left">
                        <h4 className="font-black text-2xl text-theme-secondary tracking-tight">Booking Confirmed!</h4>
                        {bookingRef && <p className="text-xs font-bold text-theme-success mt-1">Ref: {bookingRef}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full gap-3 mt-2">
                      <button onClick={handleExportPdf} disabled={isExporting || isSharing} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm bg-theme-primary text-theme-white shadow-lg hover:bg-theme-primary/90 transition-all active:scale-95 disabled:opacity-50">
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
                      </button>
                      <button onClick={() => setShowEmailInput(!showEmailInput)} disabled={isExporting || isSharing} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm bg-theme-white border border-theme-soft-slate text-theme-secondary shadow-sm hover:border-theme-primary hover:text-theme-primary transition-all active:scale-95 disabled:opacity-50">
                        <Share2 size={16} /> Share Itinerary
                      </button>
                    </div>

                    {showEmailInput && (
                      <div className="flex w-full gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-theme-soft-slate bg-theme-white text-theme-secondary focus:outline-none focus:border-theme-primary text-sm font-bold shadow-inner" />
                        <button onClick={handleSharePdf} disabled={isSharing || !email} className="px-6 py-3 bg-theme-secondary text-theme-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all hover:bg-theme-secondary/90 active:scale-95">
                          {isSharing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
                        </button>
                      </div>
                    )}
                  </div>
               )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// SLEEK UI SUB-COMPONENTS
// ---------------------------

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-1.5 bg-theme-secondary text-theme-white rounded-lg shadow-sm">{icon}</div>
      <h3 className="font-black text-theme-secondary uppercase tracking-widest text-[12px]">{title}</h3>
    </div>
  );
}

function SummaryCard({ icon, label, value }: any) {
  return (
    <div className="p-3.5 rounded-xl bg-theme-white border border-theme-soft-slate shadow-sm flex flex-col justify-center">
      <div className="flex items-center gap-1.5 text-theme-light-gray mb-1">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-black text-[12px] leading-tight text-theme-secondary truncate">{value}</p>
    </div>
  );
}

function EmptyStateCard({ title, message, buttonText, onAdd }: { title: string, message: string, buttonText: string, onAdd: () => void }) {
  return (
    <div className="relative rounded-2xl p-6 border border-dashed border-theme-light-gray/50 bg-theme-cool-white overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
      <div className="relative z-10 flex flex-col gap-1">
        <span className="font-black text-theme-light-gray uppercase tracking-widest text-[10px]">{title}</span>
        <span className="font-bold text-theme-secondary text-sm">{message}</span>
      </div>
      <button onClick={onAdd} className="relative z-10 flex items-center gap-1.5 px-4 py-2.5 bg-theme-white border border-theme-soft-slate text-theme-secondary font-black text-[10px] uppercase tracking-widest rounded-xl hover:border-theme-primary hover:text-theme-primary transition-all shadow-sm active:scale-95 shrink-0">
        <Plus size={14} /> {buttonText}
      </button>
    </div>
  );
}