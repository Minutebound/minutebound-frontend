"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { travelApi } from "@/services/api";
import { Loader2, Plane, Calendar, CreditCard, ExternalLink, ShieldCheck, Ticket, Building2, ChevronRight, CheckCircle2, X, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Helper to clean up "Denver International Airport" into just "Denver"
const formatCityName = (airportName: string) => {
  if (!airportName) return "Unknown Location";
  // Grab the first part before a comma if it exists
  let city = airportName.split(',')[0]; 
  // Strip out common airport suffixes for a clean city name
  city = city.replace(/\s*(International|Airport|Regional|Municipal|Metro|City|Air Base)\b/gi, "");
  return city.trim();
};

export default function BookingsPage() {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isLoggedIn) {
      router.push("/auth");
      return;
    }

    travelApi.getMyBookings()
      .then((data) => {
        const sorted = data.sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        setBookings(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoggedIn, isAuthLoading, router]);

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-theme-cool-white flex flex-col items-center justify-center gap-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-theme-primary" size={32} />
          <p className="text-[16px] font-black uppercase tracking-widest text-theme-secondary/50 mt-2">Loading your itineraries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-cool-white pb-20">
      <div className="max-w-[24px] mx-auto px-4 pt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2  font-medium text-gray-500">
          <Link href="/" className="hover:text-theme-primary transition-colors">Home</Link>
          <ChevronRight size={18} className="text-theme-soft-slate" />
          <span className="text-theme-secondary">My Bookings</span>
        </div>

        {/* Page Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-theme-primary rounded-[16px] flex items-center justify-center shadow-lg">
            <Ticket size={24} className="text-theme-white" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-theme-secondary tracking-tight">My Bookings</h1>
            <p className=" font-bold text-theme-secondary/70 mt-1">Manage your complete trip bookings and reservations.</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-theme-white border border-dashed border-theme-soft-slate p-12 rounded-[2rem] text-center shadow-sm">
            <Plane size={48} className="text-theme-secondary/20 mx-auto mb-4" />
            <h3 className=" font-black text-theme-secondary">No Bookings Yet</h3>
            <p className="text-theme-secondary/70 font-bold mt-2 mb-6">You haven't booked any complete itineraries with Minutebound yet.</p>
            <Link href="/" className="inline-block px-8 py-4 bg-theme-primary text-theme-white font-black text-[16px] uppercase tracking-widest rounded-[16px] hover:bg-theme-primary/90 transition-all shadow-md active:scale-95">
              Start Planning
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => {
              // Extract the new MinuteBound System ID & Duffel Order ID safely
              const sysRefMatch = booking.notes?.match(/System Ref:\s*(MB-[A-Z0-9]+)/i);
              const mbSystemId = sysRefMatch ? sysRefMatch[1] : `MB-${booking.id.toString().padStart(6, '0')}`;
              
              const orderIdMatch = booking.notes?.match(/Duffel Order(?: ID)?:\s*(ord_[a-zA-Z0-9]+)/i);
              const duffelOrderId = orderIdMatch ? orderIdMatch[1] : null;

              // Clean up airport names to beautiful city names
              const cleanOrigin = formatCityName(booking.origin);
              const cleanDestination = formatCityName(booking.destination);

              // Calculate metrics
              const startDate = new Date(booking.start_date);
              const endDate = new Date(booking.end_date || booking.start_date);
              const timeDiff = endDate.getTime() - startDate.getTime();
              const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

              // Determine inclusions
              const hasFlight = booking.booking_type === "FLIGHT";
              const hasHotel = booking.booking_type === "STAY"; 
              const hasTour = booking.booking_type === "TOUR";

              return (
                <div key={booking.id} className="bg-theme-white border border-theme-soft-slate rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-theme-primary/30 transition-colors group relative overflow-hidden">
                  
                  {/* Left Accent Strip */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
                  
                  <div className="flex-1 w-full space-y-4">
                    
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[16px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1 shadow-sm">
                        <ShieldCheck size={18} /> Confirmed
                      </span>
                      
                      {/* Highlighted MinuteBound System ID (Hides Airline PNR) */}
                      <span className="text-[16px] font-black uppercase tracking-widest text-theme-secondary bg-theme-cool-white px-2 py-1 rounded border border-theme-soft-slate flex items-center gap-1.5 shadow-sm">
                        Ref: {mbSystemId}
                      </span>
                    </div>
                    
                    {/* Destination-Focused Title */}
                    <div>
                      <h4 className=" font-black text-theme-secondary flex items-center gap-2 flex-wrap leading-tight">
                        {cleanDestination ? (
                          <>Trip to <span className="text-theme-primary">{cleanDestination}</span></>
                        ) : (
                          "Trip Itinerary Summary"
                        )}
                      </h4>
                      {cleanOrigin && cleanOrigin !== "Unknown Location" && (
                        <p className=" font-bold text-theme-secondary/60 mt-1 flex items-center gap-1.5">
                          <Plane size={18} className="text-theme-secondary/40" />
                          Departing from {cleanOrigin}
                        </p>
                      )}
                    </div>
                    
                    {/* Quick Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[16px] font-black uppercase tracking-widest text-theme-secondary/70">
                      <span className="flex items-center gap-1.5 bg-theme-cool-white px-2.5 py-1 rounded border border-theme-soft-slate">
                        <Calendar size={18} className="text-theme-secondary/50"/> 
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center bg-theme-cool-white px-2.5 py-1 rounded border border-theme-soft-slate">
                        {nights} Night{nights !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5 bg-theme-cool-white px-2.5 py-1 rounded border border-theme-soft-slate">
                        <CreditCard size={18} className="text-theme-secondary/50"/> 
                        ${booking.total_price.toFixed(2)} Total
                      </span>
                    </div>

                    {/* Included Components Checklist */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-theme-soft-slate/50">
                      <span className="text-[16px] font-black uppercase tracking-widest text-theme-secondary/40 mr-1">Included:</span>
                      <ComponentBadge active={hasFlight} icon={<Plane size={18}/>} label="Flight" />
                      <ComponentBadge active={hasHotel} icon={<Building2 size={18}/>} label="Hotel" />
                      <ComponentBadge active={hasTour} icon={<Ticket size={18}/>} label="Tours" />
                    </div>
                  </div>

                  {/* Call to Action Button */}
                  <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-3 pt-4 md:pt-0 z-10 relative">
                    {duffelOrderId ? (
                      <Link 
                        href={`/bookings/${duffelOrderId}`}
                        className="w-full sm:w-auto text-center px-8 py-4 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-theme-white font-black text-[16px] uppercase tracking-widest rounded-[16px] transition-all flex items-center justify-center gap-2 border border-theme-primary/20 hover:border-theme-primary shadow-sm"
                      >
                        View Full Itinerary <ExternalLink size={18} />
                      </Link>
                    ) : (
                      <button disabled className="w-full sm:w-auto px-8 py-4 bg-theme-cool-white text-theme-secondary/40 font-black text-[16px] uppercase tracking-widest rounded-[16px] border border-theme-soft-slate cursor-not-allowed">
                        Processing...
                      </button>
                    )}
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// UI Standards compliant Badge Component
function ComponentBadge({ active, icon, label }: { active: boolean, icon: React.ReactNode, label: string }) {
  if (active) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-theme-primary/10 text-theme-primary border border-theme-primary/20 rounded shadow-sm text-[16px] font-black uppercase tracking-widest">
        {icon} {label} <CheckCircle2 size={18} className="ml-0.5 opacity-70"/>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-theme-white text-theme-secondary/40 border border-theme-soft-slate rounded text-[16px] font-black uppercase tracking-widest">
      {icon} {label} <X size={18} className="ml-0.5 opacity-50"/>
    </div>
  );
}