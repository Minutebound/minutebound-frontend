"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { travelApi } from "@/services/api";
import { Loader2, Plane, Calendar, CreditCard, ExternalLink, ShieldCheck, Ticket, Building2, ChevronRight, CheckCircle2, XCircle, MapPin } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-theme-primary" size={32} />
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mt-2">Loading your itineraries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-theme-primary hover:underline">Home</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-bold">My Bookings</span>
        </div>

        {/* Page Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-theme-primary rounded-xl flex items-center justify-center shadow-lg">
            <Ticket size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Bookings</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">Manage your complete trip bookings and reservations.</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white border border-gray-200 p-12 rounded-[2rem] text-center shadow-sm">
            <Plane size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900">No Bookings Yet</h3>
            <p className="text-gray-500 font-medium mt-2 mb-6">You haven't booked any complete itineraries with Minutebound yet.</p>
            <Link href="/" className="px-6 py-3 bg-theme-primary text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-md">
              Start Planning
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => {
              const orderIdMatch = booking.notes?.match(/Duffel Order ID: (ord_[a-zA-Z0-9]+)/);
              const duffelOrderId = orderIdMatch ? orderIdMatch[1] : null;

              const origin = booking.origin;
              const destination = booking.destination;

              const startDate = new Date(booking.start_date);
              const endDate = new Date(booking.end_date || booking.start_date);
              const timeDiff = endDate.getTime() - startDate.getTime();
              const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

              const hasFlight = booking.booking_type === "FLIGHT";
              const hasHotel = booking.booking_type === "STAY"; 
              const hasTour = booking.booking_type === "TOUR";

              return (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:border-theme-primary/50 transition-colors group">
                  
                  <div className="flex-1 w-full space-y-4">
                    
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                        <ShieldCheck size={12} /> Confirmed
                      </span>
                      
                      {/* Highlighted Airline / Provider Pill */}
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 flex items-center gap-1.5">
                        <Plane size={12} className="text-theme-primary" />
                        {booking.airline_provider || booking.provider_name}
                      </span>

                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-auto md:ml-0">
                        Order #{booking.id}
                      </span>
                    </div>
                    
                    {/* Destination-Focused Title */}
                    <div>
                      <h4 className="text-2xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
                        {destination ? (
                          <>Trip to <span className="text-theme-primary">{destination}</span></>
                        ) : (
                          "Trip Itinerary Summary"
                        )}
                      </h4>
                      {origin && (
                        <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400" />
                          Departing from {origin}
                        </p>
                      )}
                    </div>
                    
                    {/* Quick Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-gray-400"/> 
                        {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs tracking-wide">
                        {nights} Night{nights !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CreditCard size={16} className="text-gray-400"/> 
                        ${booking.total_price.toFixed(2)} Grand Total
                      </span>
                    </div>

                    {/* Included Components Checklist */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400 mr-2">Included:</span>
                      <ComponentBadge active={hasFlight} icon={<Plane size={14}/>} label="Flight" />
                      <ComponentBadge active={hasHotel} icon={<Building2 size={14}/>} label="Hotel" />
                      <ComponentBadge active={hasTour} icon={<Ticket size={14}/>} label="Tours" />
                    </div>
                  </div>

                  {/* Call to Action Button */}
                  <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-3 pt-4 md:pt-0">
                    {duffelOrderId ? (
                      <Link 
                        href={`/bookings/${duffelOrderId}`}
                        className="w-full sm:w-auto text-center px-8 py-4 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        View Full Itinerary <ExternalLink size={14} />
                      </Link>
                    ) : (
                      <button disabled className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest rounded-xl border border-gray-200 cursor-not-allowed">
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

function ComponentBadge({ active, icon, label }: { active: boolean, icon: React.ReactNode, label: string }) {
  if (active) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold">
        {icon} {label} <CheckCircle2 size={12} className="ml-1 opacity-70"/>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg text-xs font-bold opacity-70">
      {icon} {label} <XCircle size={12} className="ml-1 opacity-50"/>
    </div>
  );
}