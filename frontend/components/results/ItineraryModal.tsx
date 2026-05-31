"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X, PlaneTakeoff,Plane, Building2, MapPin, Calendar, Users, DollarSign, Download, Share2, 
  Loader2, Send, Car, Ticket, Sun, Camera, Save, Plus, CheckCircle2, Receipt, ShieldCheck, Clock, Leaf, Info,
  CreditCard, Luggage, Wifi, BatteryCharging, Utensils, RefreshCcw, Briefcase
} from "lucide-react";
import { travelApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TripCheckout from "./TripCheckOut";
import { useRouter } from "next/navigation";

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawParams: any;
  weatherData?: any;
  isSavedView?: boolean;
  preloadedData?: {
    flight?: any;
    stay?: any;
    tours?: any[];
    attractions?: any[];
    drive?: any;
    bookingRef?: string | null;
  };
}

export default function ItineraryModal({
  isOpen,
  onClose,
  rawParams,
  weatherData,
  isSavedView = false,
  preloadedData
}: ItineraryModalProps) {
  const { user, isLoggedIn } = useAuth();
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
  const [checkoutStep, setCheckoutStep] = useState<string>("IDLE");

  useEffect(() => {
    if (isOpen) {
      if (preloadedData) {
        setSelections({
          flights: preloadedData.flight ? [preloadedData.flight] : [],
          stays: preloadedData.stay ? [preloadedData.stay] : [],
          tours: preloadedData.tours || [],
          attractions: preloadedData.attractions || [],
          drive: preloadedData.drive || null,
        });
        setDefaultAttractions(preloadedData.attractions || []);
        setIsBooked(!!preloadedData.bookingRef);
        setBookingRef(preloadedData.bookingRef || null);
      } else {
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
        setIsBooked(false);
        setBookingRef(null);
      }

      setShowEmailInput(false);
      setEmail("");
      setIsSaved(false);
      setIsAlreadySaved(false);
      setUpdatedFlightPrice(null);
      setUpdatedFlightTaxes(null);
      setIsCheckoutExpanded(false);
      setCheckoutStep("IDLE");
    }
  }, [isOpen, preloadedData]);

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

  // --- Formatting Helpers ---
  const safeFloat = (val: any) => {
    if (!val) return 0;
    if (typeof val === "string") return parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
    return parseFloat(val) || 0;
  };

  // --- Detailed Cost Calculations ---
  let chargeableSubtotal = 0;
  let taxesAndFees = 0;
  let estimatedFuel = 0; 

  if (flight) {
    const total = updatedFlightPrice !== null ? updatedFlightPrice : safeFloat(flight.price?.total || flight.price);
    const explicitTaxes = updatedFlightTaxes !== null ? updatedFlightTaxes : (flight.price?.totalTaxes ? safeFloat(flight.price.totalTaxes) : total * 0.15);
    chargeableSubtotal += (total - explicitTaxes);
    taxesAndFees += explicitTaxes;
  } else if (drive) {
    if (drive.distance_km) {
      estimatedFuel = ((drive.distance_km * 0.621371) / 25) * 3.35;
    } else {
      estimatedFuel = safeFloat(drive.fuelEstimate || drive.price);
    }
  }

  if (stay) {
    const total = safeFloat(stay.offerDetails?.price || stay.price);
    const explicitTaxes = safeFloat(stay.offerDetails?.taxes);
    const estTax = explicitTaxes > 0 ? explicitTaxes : total * 0.12; 
    chargeableSubtotal += (total - estTax);
    taxesAndFees += estTax;
  }

  tours.forEach((t: any) => {
    if (t.price && (t.price.amount || t.price)) {
      chargeableSubtotal += safeFloat(t.price.amount || t.price);
    }
  });

  const grandTotal = chargeableSubtotal + taxesAndFees;

  let displayDriveDuration = "N/A";
  let displayDriveDistance = "N/A";
  if (drive?.duration_mins) displayDriveDuration = `${Math.floor(drive.duration_mins / 60)}h ${Math.round(drive.duration_mins % 60)}m`;
  else if (drive?.duration?.text) displayDriveDuration = drive.duration.text;
  else if (drive?.duration) displayDriveDuration = drive.duration;
  
  if (drive?.distance_km) displayDriveDistance = `${(drive.distance_km * 0.621371).toFixed(0)} Mi`;
  else if (drive?.distance?.text) displayDriveDistance = drive.distance.text;
  else if (drive?.distance) displayDriveDistance = drive.distance;

  const passedCities = drive?.passedCities || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const formatTime = (d: string) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const formatShortDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "";
  
  const getLayoverTime = (arrStr: string, depStr: string) => {
    if (!arrStr || !depStr) return null;
    const diffMs = new Date(depStr).getTime() - new Date(arrStr).getTime();
    if (diffMs <= 0) return null;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  };

  const destCityName = rawParams?.destination?.name?.split(",")[0] || rawParams?.destination?.city || "Destination";
  const originCityName = rawParams?.source?.name?.split(",")[0] || "Origin";
  const getFullTripTitle = () => originCityName ? `${originCityName} to ${destCityName}` : destCityName;
  const cityImageUrl = `https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=800&q=80`;

  // --- Handlers ---
  const handleBookingSuccess = (pnrCode?: string) => {
    setIsBooked(true);
    setIsCheckoutExpanded(false); 
    if (pnrCode) setBookingRef(pnrCode);
    if (!isSavedView && !isSaved && !isAlreadySaved) handleSaveTrip();
  };

  const handleSaveTrip = async () => {
   if (!isLoggedIn) {router.push("/auth"); return;}
    setIsSaving(true); setIsAlreadySaved(false);
    try {
      const res = await travelApi.saveTrip({
        destination: rawParams?.destination?.city || rawParams?.destination?.name || "Trip",
        check_in_date: rawParams?.startDate, check_out_date: rawParams?.endDate, booking_ref: bookingRef,
        flight: flight ? { airline_name: flight.airline_name, price: flight.price?.total || flight.price, itineraries: flight.itineraries, travel_class: flight.travel_class, carbon_emissions_kg: flight.carbon_emissions_kg } : null,
        drive: drive ? { distance: displayDriveDistance, duration: displayDriveDuration, fuelEstimate: estimatedFuel } : null,
        hotel: stay ? { name: stay.name, price: stay.offerDetails?.price || stay.price, address: stay.address, rating: stay.rating || stay.hotel?.rating, offerDetails: stay.offerDetails } : null,
        attractions: activeAttractions ? activeAttractions.map((a: any) => ({ name: a.name, image: a.image || a.photo, category: a.category })) : [],
        activities: tours ? tours.map((t: any) => ({ name: t.name || t.title, price: t.price, duration: t.duration, rating: t.rating, short_description: t.short_description })) : [],
        rawParams: { source: { name: originCityName }, destination: { name: destCityName }, startDate: rawParams?.startDate, endDate: rawParams?.endDate },
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

  // --- Pre-Calculate Duffel Flight Details ---
  let totalCheckedBags = 0;
  let totalCarryOnBags = 0;
  let hasWifi = false;
  let hasPower = false;
  let foodOption = null;

  if (flight && flight.itineraries) {
    flight.itineraries.forEach((itin: any) => {
      itin.segments?.forEach((seg: any) => {
        if (seg.baggages && Array.isArray(seg.baggages)) {
          const checked = seg.baggages.find((b:any) => b.type === 'checked')?.quantity || 0;
          const carryOn = seg.baggages.find((b:any) => b.type === 'carry_on')?.quantity || 0;
          if (checked > totalCheckedBags) totalCheckedBags = checked;
          if (carryOn > totalCarryOnBags) totalCarryOnBags = carryOn;
        } else {
          if (seg.checked_bags > totalCheckedBags) totalCheckedBags = seg.checked_bags;
          if (seg.carry_on_bags > totalCarryOnBags) totalCarryOnBags = seg.carry_on_bags;
        }
        if (seg.amenities?.wifi) hasWifi = true;
        if (seg.amenities?.power_usb) hasPower = true;
        if (seg.amenities?.food) foodOption = seg.amenities.food;
      });
    });
  }

  const isRefundable = flight?.refund_policy?.is_refundable ?? false;
  const penaltyAmount = flight?.refund_policy?.penalty_amount;
  const penaltyCurrency = flight?.refund_policy?.currency || flight?.currency;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-3 lg:p-3 overflow-hidden">
      <div className="absolute inset-0 bg-theme-secondary/90 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-theme-white w-full h-full md:h-[90vh] max-w-[1200px] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 flex justify-between items-center bg-theme-white border-b border-theme-soft-slate shrink-0 z-20 relative">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-theme-primary flex items-center justify-center shadow-md">
               <CreditCard size={14} className="text-theme-white" />
             </div>
             <h2 className="text-xl font-black text-theme-secondary tracking-tight hidden sm:block">
               {isSavedView ? "Saved Itinerary" : "Checkout & Itinerary"}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-theme-cool-white hover:bg-theme-soft-slate/50 rounded-full transition-colors border border-theme-soft-slate shadow-sm shrink-0 active:scale-95 flex items-center gap-2">
            <span className="text-sm font-bold px-2 hidden sm:block text-theme-secondary">Close</span>
            <X size={16} className="text-theme-secondary" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden relative custom-scrollbar min-h-0">
          
          {/* LEFT COLUMN: STATIC SUMMARY */}
          <div className="w-full lg:w-[320px] xl:w-[340px] flex flex-col border-b lg:border-b-0 lg:border-r border-theme-soft-slate bg-theme-cool-white shrink-0 relative lg:h-full lg:min-h-0">
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar pb-3 lg:pb-0 lg:min-h-0">
              
              <div className="w-full h-40 sm:h-48 relative border-b border-theme-soft-slate">
                <img src={cityImageUrl} alt={destCityName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-theme-secondary/95 via-theme-secondary/40 to-transparent"></div>
                <div className="absolute bottom-4 left-5 right-5">
                  <p className="text-theme-white/80 text-xs font-black uppercase tracking-widest mb-1">{originCityName} to</p>
                  <h3 className="text-2xl sm:text-3xl font-black text-theme-white tracking-tight leading-none truncate">{destCityName}</h3>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <SummaryCard icon={<Calendar size={16} />} label="Dates" value={isOneWay ? `${formatShortDate(rawParams?.startDate)} (One Way)` : `${formatShortDate(rawParams?.startDate)} - ${formatShortDate(rawParams?.endDate)}`} />
                  <SummaryCard icon={<Users size={16} />} label="Guests" value={`${rawParams?.adults || 1} Adults, ${rawParams?.children || 0} Children`} />
                </div>

                {isWeatherSelected && firstDayWeather && (
                  <div className="p-4 rounded-2xl bg-theme-white border border-theme-soft-slate shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-black uppercase tracking-widest text-theme-light-gray">Destination Weather Estimate</span>
                      <Sun size={16} className="text-theme-primary" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-theme-secondary leading-none">{Math.round(firstDayWeather.max_temp ?? 0)}°</span>
                      <span className="text-sm font-bold text-theme-light-gray mb-1">/ {Math.round(firstDayWeather.min_temp ?? 0)}° F</span>
                    </div>
                    <p className="text-sm font-bold text-theme-secondary/80 mt-1 capitalize">{firstDayWeather.weather ?? "Clear skies"}</p>
                  </div>
                )}

                <div className="rounded-2xl bg-theme-white border border-theme-soft-slate shadow-sm overflow-hidden mt-1 transition-all">
                   <div className="p-4 bg-theme-secondary flex items-center justify-between transition-all duration-300">
                     <div className="flex items-center gap-2">
                       <Receipt size={14} className="text-theme-white" />
                       <span className="font-black uppercase tracking-widest text-[12px] text-theme-white">Fare Breakdown</span>
                     </div>
                     {checkoutStep === "READY" && (
                       <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-300">
                         <ShieldCheck size={12} className="text-theme-primary" />
                         <span className="font-black uppercase tracking-widest text-[8px] text-theme-primary">
                           Fares Confirmed
                         </span>
                       </div>
                     )}
                   </div>

                   <div className="p-4 flex flex-col gap-2">
                     <div className="flex justify-between items-center text-sm font-bold text-theme-secondary">
                       <span>Base Fares & Rates</span>
                       <span>${chargeableSubtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-bold text-theme-secondary border-b border-theme-soft-slate pb-3">
                       <span>Est. Taxes & Fees</span>
                       <span>${taxesAndFees.toFixed(2)}</span>
                     </div>
                     {drive && (
                        <div className="flex justify-between items-center text-xs font-bold text-theme-light-gray border-b border-theme-soft-slate pb-3">
                          <span className="flex items-center gap-1.5">Est. Fuel <span className="text-[12px] uppercase tracking-widest text-theme-primary">(Not Charged)</span></span>
                          <span>~${estimatedFuel.toFixed(2)}</span>
                        </div>
                     )}
                     <div className="flex justify-between items-end pt-1">
                       <span className="text-[12px] font-black uppercase tracking-widest text-theme-light-gray">Total Estimate</span>
                       <span className="font-black text-2xl tracking-tight text-theme-primary transition-all">${grandTotal.toFixed(2)}</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {!isSavedView && (
              <div className="w-full p-4 bg-theme-cool-white border-t border-theme-soft-slate shrink-0">
                <button
                  onClick={handleSaveTrip}
                  disabled={isSaving || isSaved || isAlreadySaved} 
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all active:scale-[0.98] ${
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
                        ? "Already Saved!" 
                        : isSaved 
                          ? "Saved!" 
                          : "Save Draft"
                  }
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SCROLLABLE INVENTORY DETAILS */}
          <div className="flex-1 flex flex-col bg-theme-white relative lg:h-full min-w-0 lg:min-h-0">
            <div className="flex-1 lg:overflow-y-auto custom-scrollbar pb-6 lg:min-h-0">
              <div className="p-5 sm:p-8 flex flex-col gap-8 max-w-4xl mx-auto w-full min-w-0">
                
                {/* 1. TRANSPORTATION */}
                <section className="min-w-0">
                  <SectionTitle icon={flight ? <Plane size={16} /> : <Car size={16} />} title="Transportation" />
                  {flight ? (
                     <div className="bg-theme-white rounded-2xl p-5 border border-theme-soft-slate shadow-sm relative overflow-hidden min-w-0">
                       <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
                       <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-5 gap-4 min-w-0">
                         <div className="min-w-0 flex-1">
                            <span className="font-black text-lg sm:text-xl text-theme-secondary block truncate">{flight.airline_name}</span>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                               <span className="text-xs font-bold text-theme-secondary/80 bg-theme-cool-white px-2 py-1 rounded border border-theme-soft-slate">
                                 {flight.travel_class || "Economy"} Class
                               </span>
                               <span className="text-xs font-bold text-theme-secondary/80 bg-theme-cool-white px-2 py-1 rounded border border-theme-soft-slate">
                                 {flight.itineraries?.[0]?.segments?.length > 1 ? "Connecting" : "Direct"}
                               </span>
                               
                               {/* DUFFEL BADGES */}
                               {flight.carbon_emissions_kg && (
                                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1">
                                   <Leaf size={12} /> {flight.carbon_emissions_kg} kg CO₂
                                 </span>
                               )}
                               {(totalCheckedBags > 0 || totalCarryOnBags > 0) && (
                                 <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                                   <Luggage size={12} /> Bags Included
                                 </span>
                               )}
                               {isRefundable ? (
                                 <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                                   <RefreshCcw size={12} /> {penaltyAmount ? `Fee: ${penaltyCurrency || '$'}${penaltyAmount}` : 'Refundable'}
                                 </span>
                               ) : (
                                 <span className="text-[10px] font-black uppercase tracking-widest text-theme-error bg-theme-error/10 px-2 py-1 rounded border border-theme-error/20 flex items-center gap-1">
                                   <X size={12} /> Non-Refundable
                                 </span>
                               )}
                            </div>

                            {/* AMENITIES BADGES */}
                            {(hasWifi || hasPower || foodOption) && (
                               <div className="flex flex-wrap items-center gap-2 mt-2">
                                 {hasWifi && <span className="text-[9px] font-black uppercase tracking-widest text-theme-secondary/60 flex items-center gap-1"><Wifi size={10}/> WiFi</span>}
                                 {hasPower && <span className="text-[9px] font-black uppercase tracking-widest text-theme-secondary/60 flex items-center gap-1"><BatteryCharging size={10}/> Power</span>}
                                 {foodOption && <span className="text-[9px] font-black uppercase tracking-widest text-theme-secondary/60 flex items-center gap-1"><Utensils size={10}/> Food</span>}
                               </div>
                            )}

                         </div>
                         <span className="text-theme-primary font-black text-lg bg-theme-primary/10 px-3 py-1.5 rounded-lg inline-block w-fit shrink-0 mt-2 sm:mt-0">
                           ${safeFloat(flight.price?.total || flight.price || 0).toFixed(2)}
                         </span>
                       </div>
                       
                       <div className="flex flex-col gap-4">
                         {(flight.itineraries || []).map((itin: any, idx: number) => {
                           const stops = itin.segments?.length ? itin.segments.length - 1 : 0;
                           const boundDate = itin.segments?.[0]?.departure_time ? formatShortDate(itin.segments[0].departure_time) : "";
                           return (
                             <div key={idx} className="bg-theme-cool-white p-4 rounded-xl border border-theme-soft-slate">
                               <div className="flex flex-wrap justify-between items-center mb-3 pb-3 border-b border-theme-soft-slate gap-2">
                                 <span className="text-[12px] uppercase font-black text-theme-secondary/80 tracking-widest flex items-center gap-2">
                                
                                   {idx === 0 ? "Outbound" : "Return"} <span className="text-theme-secondary/40">•</span> {boundDate}
                                 </span>
                                 <div className="flex items-center gap-2">
                                   {itin.duration && (
                                     <span className="text-xs font-bold text-theme-secondary/60 flex items-center gap-1">
                                       <Clock size={12} /> {(itin.duration || '').replace('PT', '').toLowerCase()}
                                     </span>
                                   )}
                                   <span className={`text-[12px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${stops === 0 ? "bg-theme-primary/10 text-theme-primary" : "bg-theme-secondary/10 text-theme-secondary"}`}>
                                     {stops === 0 ? "Direct" : `${stops} Stop(s)`}
                                   </span>
                                 </div>
                               </div>
                               
                               <div className="flex flex-col">
                                 {(itin.segments || []).map((seg: any, sIdx: number) => {
                                   let layoverStr = null;
                                   if (sIdx > 0) layoverStr = getLayoverTime(itin.segments[sIdx - 1].arrival_time, seg.departure_time);
                                   
                                   // SAFE AIRCRAFT PARSING
                                   let aircraftName = null;
                                   if (seg.aircraft && String(seg.aircraft).toLowerCase() !== 'undefined' && String(seg.aircraft).toLowerCase() !== 'null') {
                                     aircraftName = typeof seg.aircraft === 'object' ? seg.aircraft.name : seg.aircraft;
                                   }

                                   return (
                                     <React.Fragment key={sIdx}>
                                       {layoverStr && (
                                         <div className="flex items-center justify-center my-2">
                                            <span className="text-xs font-bold text-theme-secondary/60 bg-theme-white px-3 py-1 rounded-full border border-theme-soft-slate shadow-sm">
                                              ⏱ Layover: {layoverStr}
                                            </span>
                                         </div>
                                       )}
                                       <div className="flex flex-col justify-center bg-theme-white p-4 rounded-xl border border-theme-soft-slate shadow-sm min-w-0">
                                         <div className="flex items-center gap-4 text-theme-secondary min-w-0">
                                           <div className="flex-1 min-w-0">
                                             <p className="font-black text-xl text-theme-secondary">{formatTime(seg.departure_time)}</p>
                                             <p className="text-xs font-bold text-theme-light-gray mt-1 truncate">{seg.departure_airport_name || seg.departure_airport}</p>
                                           </div>
                                           
                                           <div className="flex-1 flex flex-col items-center relative min-w-[60px] shrink-0 pt-1">
                                             <div className="w-full flex items-center relative">
                                               <div className="w-full h-[2px] bg-theme-soft-slate absolute z-0"></div>
                                               <div className="mx-auto bg-theme-white px-2 z-10 text-theme-secondary/40">
                                                  <PlaneTakeoff size={14} />
                                               </div>
                                             </div>
                                             {aircraftName && (
                                               <span className="text-[9px] font-black uppercase tracking-widest text-theme-primary whitespace-nowrap mt-2 text-center bg-theme-primary/5 px-2 py-0.5 rounded border border-theme-primary/10 max-w-full truncate">
                                                  {aircraftName}
                                               </span>
                                             )}
                                           </div>
                                           
                                           <div className="flex-1 text-right min-w-0">
                                             <p className="font-black text-xl text-theme-secondary">{formatTime(seg.arrival_time)}</p>
                                             <p className="text-xs font-bold text-theme-light-gray mt-1 truncate">{seg.arrival_airport_name || seg.arrival_airport}</p>
                                           </div>
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
                     <div className="bg-theme-white rounded-2xl p-6 border border-theme-soft-slate shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
                       <div className="flex justify-between items-center mb-5">
                         <span className="font-black text-xl text-theme-secondary flex items-center gap-2"><Car size={20} /> Road Trip</span>
                         <span className="text-theme-primary font-black text-base bg-theme-primary/10 px-4 py-2 rounded-xl">{displayDriveDuration}</span>
                       </div>
                       <div className="flex flex-col gap-4 bg-theme-cool-white p-5 rounded-xl border border-theme-soft-slate">
                         <div className="flex justify-between items-end gap-2">
                           <div className="flex flex-col gap-1 min-w-0">
                             <p className="font-black text-base text-theme-secondary flex items-center gap-2 flex-wrap">
                               <span className="truncate">{originCityName}</span>
                               <span className="text-theme-light-gray text-sm">➔</span>
                               <span className="truncate">{destCityName}</span>
                             </p>
                             <p className="text-xs text-theme-secondary/60 font-bold">Total Distance: {displayDriveDistance}</p>
                           </div>
                           <div className="text-right flex flex-col items-end gap-1">
                             <p className="text-theme-primary font-black text-xl">~${estimatedFuel.toFixed(2)}</p>
                             <p className="text-[12px] uppercase tracking-widest text-theme-secondary/60 font-black">Est. Fuel</p>
                           </div>
                         </div>
                       </div>
                     </div>
                  ) : (
                    <div className="relative rounded-2xl p-5 border border-dashed border-theme-light-gray/50 bg-theme-cool-white flex items-center justify-between">
                      <span className="font-bold text-theme-secondary text-sm">No transportation selected.</span>
                    </div>
                  )}
                </section>

                {/* 2. ACCOMMODATION */}
                <section className="min-w-0">
                  <SectionTitle icon={<Building2 size={16} />} title="Accommodation" />
                  {stay ? (
                    <div className="bg-theme-white rounded-2xl p-5 border border-theme-soft-slate shadow-sm relative overflow-hidden min-w-0">
                      <div className="absolute top-0 left-0 w-1 h-full bg-theme-secondary"></div>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                             <h4 className="font-black text-lg sm:text-xl text-theme-secondary leading-tight break-words">{stay.name}</h4>
                             {(stay.rating || stay.hotel?.rating) && (
                                <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[12px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 shadow-sm shrink-0">
                                  ★ {stay.rating || stay.hotel?.rating} Star
                                </span>
                             )}
                          </div>
                          <p className="text-xs sm:text-sm text-theme-secondary/70 font-medium flex items-start gap-1.5 min-w-0">
                             <MapPin size={14} className="shrink-0 mt-0.5 text-theme-secondary/40" /> 
                             <span className="truncate">{stay.address?.lines?.join(", ") || stay.address || "Address unavailable"}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0 bg-theme-cool-white px-4 py-3 rounded-xl border border-theme-soft-slate shadow-sm">
                          <p className="text-theme-secondary font-black text-xl">${safeFloat(stay.offerDetails?.price || stay.price || 0).toFixed(2)}</p>
                          <p className="text-[12px] font-black uppercase tracking-widest text-theme-secondary/60 mt-0.5">Total Stay</p>
                        </div>
                      </div>

                      <div className="bg-theme-cool-white rounded-xl p-4 border border-theme-soft-slate flex flex-col gap-3">
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-theme-secondary border-b border-theme-soft-slate/50 pb-2">
                           <span className="flex items-center gap-2 text-theme-secondary/60"><Calendar size={14}/> Check In</span>
                           <span className="text-theme-secondary">{formatDate(rawParams?.startDate)}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-theme-secondary border-b border-theme-soft-slate/50 pb-2">
                           <span className="flex items-center gap-2 text-theme-secondary/60"><Calendar size={14}/> Check Out</span>
                           <span className="text-theme-secondary">{formatDate(rawParams?.endDate)}</span>
                         </div>
                         
                         {stay.offerDetails && (
                           <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold text-theme-secondary">
                             {stay.offerDetails?.rooms?.[0]?.category && (
                               <span className="bg-theme-white px-2.5 py-1 rounded border border-theme-soft-slate shadow-sm">
                                 {stay.offerDetails.rooms[0].category.replace(/_/g, " ")}
                               </span>
                             )}
                             {stay.offerDetails?.rooms?.[0]?.bed_type && (
                               <span className="bg-theme-white px-2.5 py-1 rounded border border-theme-soft-slate shadow-sm">
                                 {stay.offerDetails.rooms[0].bed_type.replace(/_/g, " ")} Bed
                               </span>
                             )}
                             {stay.offerDetails?.boardType && (
                               <span className="bg-theme-primary/10 px-2.5 py-1 rounded border border-theme-primary/20 text-theme-primary shadow-sm">
                                 {stay.offerDetails.boardType.replace(/_/g, " ")} Included
                               </span>
                             )}
                           </div>
                         )}
                      </div>

                    </div>
                  ) : (
                    <EmptyStateCard title="Accommodation" message="Where are you staying?" buttonText="Add Hotel" onAdd={() => handleNavigateToTab("stays")} />
                  )}
                </section>

                {/* 3. TOURS */}
                <section className="min-w-0">
                  <SectionTitle icon={<Ticket size={16} />} title="Tours & Activities" />
                  {tours.length > 0 ? (
                    <div className="flex flex-col gap-4 min-w-0">
                      {tours.map((tour: any, idx: number) => (
                        <div key={idx} className="bg-theme-white rounded-2xl p-5 border border-theme-soft-slate shadow-sm flex flex-col gap-3 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 min-w-0">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-black text-base sm:text-lg text-theme-secondary leading-snug break-words">{tour.name || tour.title}</h5>
                              <p className="text-xs sm:text-sm text-theme-secondary/70 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                                {tour.short_description || tour.description || "Experience the best of the local culture and sights with this highly-rated guided tour."}
                              </p>
                            </div>
                            {tour.price && (tour.price.amount || tour.price) && (
                              <div className="text-left sm:text-right shrink-0 bg-theme-cool-white p-3 rounded-xl border border-theme-soft-slate">
                                <p className="text-theme-primary font-black text-lg">${safeFloat(tour.price.amount || tour.price).toFixed(2)}</p>
                                <p className="text-[12px] font-black uppercase tracking-widest text-theme-secondary/60 mt-0.5">Per Person</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-theme-soft-slate/50 text-xs font-bold">
                             {tour.duration && (
                                <span className="bg-theme-cool-white border border-theme-soft-slate px-2.5 py-1 rounded text-theme-secondary flex items-center gap-1 shadow-sm">
                                  <Clock size={12} className="text-theme-secondary/50"/> {tour.duration}
                                </span>
                             )}
                             {tour.rating && (
                               <span className="bg-amber-50 border border-amber-100 px-2.5 py-1 rounded text-amber-600 flex items-center gap-1 shadow-sm">
                                 ★ {tour.rating}
                               </span>
                             )}
                             <span className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded text-emerald-700 flex items-center gap-1 shadow-sm">
                               <CheckCircle2 size={12} className="text-emerald-500" /> Free Cancellation
                             </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard title="Activities" message="No experiences booked yet." buttonText="Add Tours" onAdd={() => handleNavigateToTab("tours")} />
                  )}
                </section>

                {/* 4. ATTRACTIONS */}
                <section className="min-w-0">
                  <SectionTitle icon={<Camera size={16} />} title="Suggested Attractions" />
                  {activeAttractions.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory custom-scrollbar">
                      {activeAttractions.map((attr: any, idx: number) => (
                        <div key={idx} className="min-w-[200px] w-[200px] sm:min-w-[240px] sm:w-[240px] snap-start bg-theme-white rounded-2xl border border-theme-soft-slate shadow-sm flex flex-col group hover:border-theme-primary/30 transition-colors overflow-hidden">
                          <div className="w-full h-32 sm:h-36 bg-theme-cool-white flex items-center justify-center overflow-hidden relative">
                            {attr.image || attr.photo ? (
                                <img src={attr.image || attr.photo} alt={attr.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <MapPin size={32} className="text-theme-light-gray" />
                            )}
                          </div>
                          <div className="p-4 flex flex-col gap-1.5 bg-theme-white">
                            <h5 className="font-black text-sm sm:text-base text-theme-secondary truncate">{attr.name}</h5>
                            <p className="text-[12px] text-theme-secondary/50 font-black uppercase tracking-widest truncate">
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

            {/* CHECKOUT OR SAVED VIEW FOOTER */}
            <div className={`w-full z-30 shrink-0 bg-theme-white ${
              isCheckoutExpanded
                ? "absolute inset-0 h-full flex flex-col"
                : "border-t border-theme-soft-slate shadow-[0_-16px_30px_-16px_rgba(0,0,0,0.1)] p-4 lg:p-5"
            }`}>
               {!isBooked ? (
                   grandTotal > 0 ? (
                     <TripCheckout 
                        flightOffer={flight} 
                        stay={stay}
                        tours={tours}
                        rawParams={rawParams}
                        grandTotal={grandTotal}
                        onPriceConfirmed={(total: number, taxes: number) => {
                           setUpdatedFlightPrice(total);
                           setUpdatedFlightTaxes(taxes);
                        }}
                        onExpandedChange={setIsCheckoutExpanded}
                        onStepChange={setCheckoutStep}
                        onSuccess={(pnr: string) => handleBookingSuccess(pnr)} 
                     />
                   ) : (
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                       <div className="text-center sm:text-left flex flex-col">
                         <span className="text-[12px] uppercase tracking-widest text-theme-light-gray font-black mb-0.5">Total Due Now</span>
                         <span className="text-2xl sm:text-3xl font-black text-theme-secondary leading-none">${grandTotal.toFixed(2)}</span>
                       </div>
                       <button onClick={() => handleBookingSuccess("TRIP-1234")} className="px-6 py-3.5 bg-theme-primary text-theme-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-lg active:scale-95 w-full sm:w-auto">
                         Finish Trip Plan
                       </button>
                     </div>
                   )
               ) : (
                  <div className="w-full py-2 sm:py-4 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={32} className="text-theme-success" />
                      <div className="text-left">
                        <h4 className="font-black text-xl sm:text-2xl text-theme-secondary tracking-tight">Booking Confirmed!</h4>
                        {bookingRef && <p className="text-xs font-bold text-theme-success mt-0.5">Ref: {bookingRef}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row w-full gap-3 mt-2">
                      <button onClick={handleExportPdf} disabled={isExporting || isSharing} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs sm:text-sm bg-theme-primary text-theme-white shadow-lg hover:bg-theme-primary/90 transition-all active:scale-95 disabled:opacity-50">
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
                      </button>
                      <button onClick={() => setShowEmailInput(!showEmailInput)} disabled={isExporting || isSharing} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-xs sm:text-sm bg-theme-white border border-theme-soft-slate text-theme-secondary shadow-sm hover:border-theme-primary hover:text-theme-primary transition-all active:scale-95 disabled:opacity-50">
                        <Share2 size={16} /> Share Itinerary
                      </button>
                    </div>

                    {showEmailInput && (
                      <div className="flex w-full gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-theme-soft-slate bg-theme-white text-theme-secondary focus:outline-none focus:border-theme-primary text-sm font-bold shadow-inner min-w-0" />
                        <button onClick={handleSharePdf} disabled={isSharing || !email} className="px-6 py-3 bg-theme-secondary text-theme-white font-black text-xs uppercase tracking-widest rounded-xl disabled:opacity-50 flex items-center gap-2 transition-all hover:bg-theme-secondary/90 active:scale-95 shrink-0">
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

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-1.5 bg-theme-secondary text-theme-white rounded-lg shadow-sm">{icon}</div>
      <h3 className="font-black text-theme-secondary uppercase tracking-[0.2em] text-[12px]">{title}</h3>
    </div>
  );
}

function SummaryCard({ icon, label, value }: any) {
  return (
    <div className="p-4 rounded-xl bg-theme-white border border-theme-soft-slate shadow-sm flex flex-col justify-center min-w-0">
      <div className="flex items-center gap-1.5 text-theme-secondary/50 mb-1.5">
        {icon}
        <span className="text-[12px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-black text-sm sm:text-base leading-tight text-theme-secondary truncate">{value}</p>
    </div>
  );
}

function EmptyStateCard({ title, message, buttonText, onAdd }: { title: string, message: string, buttonText: string, onAdd: () => void }) {
  return (
    <div className="relative rounded-2xl p-6 border border-dashed border-theme-secondary/20 bg-theme-cool-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-black text-theme-secondary/40 uppercase tracking-widest text-[12px]">{title}</span>
        <span className="font-bold text-theme-secondary text-sm truncate">{message}</span>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-5 py-3 bg-theme-white border border-theme-soft-slate text-theme-secondary font-black text-[12px] uppercase tracking-widest rounded-xl hover:border-theme-primary hover:text-theme-primary transition-all shadow-sm active:scale-95 shrink-0">
        <Plus size={14} /> {buttonText}
      </button>
    </div>
  );
}