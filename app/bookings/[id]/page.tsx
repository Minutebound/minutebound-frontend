"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Ticket, Download, Settings, ChevronRight, AlertTriangle, Briefcase, Luggage, Building2, Plus, Plane, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      axios.get(`${process.env.NEXT_PUBLIC_API_URL}/bookings/duffel-order/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then((res) => {
          setOrder(res.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-theme-primary" size={32} />
        <p className=" font-bold text-gray-500">Retrieving full itinerary details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="font-black  text-gray-800">Itinerary Not Found</p>
        <button onClick={() => router.push('/bookings')} className="mt-4 text-theme-primary font-bold">Return to Bookings</button>
      </div>
    );
  }

  // Formatting Helpers
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
  const formatFullDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  
  const formatDOB = (dateStr: string) => {
    if (!dateStr) return "Not provided";
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  };

  const formatDuration = (ptString: string) => {
    if (!ptString) return "";
    let str = ptString.toUpperCase().replace('PT', '');
    let h = 0, m = 0;
    if (str.includes('H')) { const parts = str.split('H'); h = parseInt(parts[0]); str = parts[1] || ''; }
    if (str.includes('M')) { m = parseInt(str.replace('M', '')); }
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
  };

  // Proper Title Capitalization (e.g., MR -> Mr)
  const formatTitle = (title?: string) => {
    if (!title) return "Mr";
    return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
  };

  const isTestMode = order.live_mode === false;
  const pnr = order.booking_reference;
  const destIata = order.slices?.[0]?.segments?.[order.slices[0].segments.length - 1]?.destination?.iata_code || "";
  
  // Policies & Status
  const changeCond = order.conditions?.change_before_departure;
  const refundCond = order.conditions?.refund_before_departure;
  const airlineOwner = order.owner?.name || order.slices?.[0]?.segments?.[0]?.operating_carrier?.name || "Airline";
  const primaryPassenger = order.passengers?.[0];
  const primaryName = primaryPassenger ? `${formatTitle(primaryPassenger.title)} ${primaryPassenger.given_name} ${primaryPassenger.family_name}` : "User";

  // Financials
  const baseAmount = parseFloat(order.base_amount || 0);
  const taxAmount = parseFloat(order.tax_amount || 0);
  const serviceFee = 0.00; 
  const totalAmount = parseFloat(order.total_amount || 0) + serviceFee;
  const currency = order.total_currency;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20">
      <div className="max-w-[24px] mx-auto px-4 pt-6 space-y-6 animate-in fade-in duration-300">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2  font-medium text-gray-500">
          <Link href="/" className="hover:text-theme-primary hover:underline">Home</Link>
          <ChevronRight size={18} />
          <Link href="/bookings" className="hover:text-theme-primary hover:underline">My Bookings</Link>
          <ChevronRight size={18} />
          <span className="text-gray-900 font-bold">{pnr || order.id}</span>
        </div>

        {/* Title & Actions Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
          <h1 className="text-[24px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            Flight PNR: {pnr} 
            {isTestMode && <span className="bg-yellow-100 text-yellow-800 text-[16px]font-bold px-2 py-1 rounded-md uppercase tracking-widest">Test</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg  font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Ticket size={18} /> Ticket numbers
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg  font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Download size={18} /> Export itinerary
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg  font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Settings size={18} /> Manage this order
            </button>
          </div>
        </div>

        {isTestMode && (
          <div className="bg-[#FFFBEB] border border-[#FEF3C7] p-4 rounded-[16px] flex items-center gap-3 text-[#B45309]">
            <AlertTriangle size={18} className="shrink-0" />
            <p className=" font-medium"><strong>You are in test mode:</strong> No live orders will be created, nor money change hands, while test mode is enabled</p>
          </div>
        )}

        {/* DUFFEL 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Journey, Policies, Passengers */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Journey Details */}
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className=" font-bold text-gray-900">Journey details</h2>
              </div>
              <div className="p-6 space-y-10">
                {order.slices?.map((slice: any, sIdx: number) => {
                  const firstSeg = slice.segments[0];
                  const lastSeg = slice.segments[slice.segments.length - 1];
                  const stops = slice.segments.length - 1;
                  const cabinClass = firstSeg.passengers[0]?.cabin_class || "Economy";
                  const carrier = firstSeg.operating_carrier;

                  return (
                    <div key={sIdx} className="space-y-6">
                      
                      {/* HIGHLIGHTED AIRLINE ROW */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3  font-medium text-gray-900 w-full">
                        <span className="font-bold">{formatTime(firstSeg.departing_at)} - {formatTime(lastSeg.arriving_at)}</span>
                        <span className="text-gray-500">{formatDuration(slice.duration)}</span>
                        <span className="text-gray-500">{stops === 0 ? "Non-stop" : `${stops} stop`}</span>
                        <span className="text-gray-500">{firstSeg.origin.iata_code}-{lastSeg.destination.iata_code}</span>
                        <span className="text-gray-500 capitalize">{cabinClass.replace('_', ' ')}</span>
                        
                        {/* Highlighted Airline Logo Pill */}
                        <div className="ml-auto flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                          {carrier.logo_symbol_url ? (
                            <img src={carrier.logo_symbol_url} alt={carrier.name} className="h-5 object-contain" />
                          ) : <Plane size={18} className="text-theme-primary" />}
                          <span className="font-black text-gray-900 text-[16px]tracking-wide">{carrier.name}</span>
                        </div>
                      </div>

                      <div className="relative pl-6 border-l-[3px] border-gray-200 space-y-6 ml-2">
                        <div className="relative">
                          <div className="absolute -left-[32px] top-1 w-4 h-4 bg-white border-[3px] border-gray-400 rounded-full"></div>
                          <p className=" font-bold text-gray-900">{formatFullDate(firstSeg.departing_at)}, {formatTime(firstSeg.departing_at)}</p>
                          <p className=" text-gray-600 mt-1">Depart from {firstSeg.origin.name} ({firstSeg.origin.iata_code}){firstSeg.origin_terminal ? `, Terminal ${firstSeg.origin_terminal}` : ''}</p>
                        </div>

                        <div className="py-2">
                          <p className=" text-gray-500 font-medium">Flight duration: {formatDuration(firstSeg.duration)}</p>
                          <p className=" text-gray-500 font-medium mt-1">
                            <span className="capitalize">{cabinClass.replace('_', ' ')}</span> • {carrier.name} {firstSeg.aircraft?.name} • {carrier.iata_code}{firstSeg.operating_carrier_flight_number}
                          </p>
                        </div>

                        <div className="relative">
                          <div className="absolute -left-[32px] top-1 w-4 h-4 bg-white border-[3px] border-gray-400 rounded-full"></div>
                          <p className=" font-bold text-gray-900">{formatFullDate(lastSeg.arriving_at)}, {formatTime(lastSeg.arriving_at)}</p>
                          <p className=" text-gray-600 mt-1">Arrive at {lastSeg.destination.name} ({lastSeg.destination.iata_code}){lastSeg.destination_terminal ? `, Terminal ${lastSeg.destination_terminal}` : ''}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HIGHLIGHTED POLICIES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className=" font-bold text-gray-900">Order change policy</h3>
                </div>
                <div className="p-6">
                  <div className={`flex items-start gap-3 p-4 rounded-[16px] border ${changeCond?.allowed ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {changeCond?.allowed ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <XCircle size={18} className="text-gray-400 shrink-0" />}
                    <p className=" font-bold leading-relaxed">
                      {changeCond?.allowed 
                        ? `This order is changeable${changeCond.penalty_amount ? ` (a penalty of ${currency} ${changeCond.penalty_amount} applies)` : ''}.` 
                        : "This order is not changeable."}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className=" font-bold text-gray-900">Order refund policy</h3>
                </div>
                <div className="p-6">
                   <div className={`flex items-start gap-3 p-4 rounded-[16px] border ${refundCond?.allowed ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {refundCond?.allowed ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <XCircle size={18} className="text-gray-400 shrink-0" />}
                    <p className=" font-bold leading-relaxed">
                      {refundCond?.allowed 
                        ? `This order is refundable up until the initial departure date${refundCond.penalty_amount ? ` (a penalty of ${currency} ${refundCond.penalty_amount} applies)` : ''}.` 
                        : "This order is not refundable."}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Passengers */}
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className=" font-bold text-gray-900">Passengers</h2>
              </div>
              <div className="p-6 space-y-8">
                {order.passengers?.map((p: any, idx: number) => {
                  let pCheckedBags = 0; let pCarryOnBags = 0;
                  const firstSeg = order.slices[0]?.segments[0];
                  const pData = firstSeg?.passengers?.find((segP: any) => segP.passenger_id === p.id || segP.id === p.id);
                  
                  pData?.baggages?.forEach((bag: any) => {
                    if (bag.type === 'checked') pCheckedBags += bag.quantity;
                    if (bag.type === 'carry_on') pCarryOnBags += bag.quantity;
                  });

                  return (
                    <div key={p.id} className={`${idx !== 0 ? 'pt-8 border-t border-gray-200' : ''}`}>
                      <h3 className="text-base font-bold text-gray-900 mb-4 capitalize">{p.type} {idx + 1}</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-6">
                        <div>
                          <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Name</p>
                          {/* Title is Capitalized Here */}
                          <p className=" font-medium text-gray-900">{formatTitle(p.title)} {p.given_name} {p.family_name}</p>
                        </div>
                        <div>
                          <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">E-mail</p>
                          <p className=" font-medium text-gray-900 break-words">{p.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Date of birth</p>
                          <p className=" font-medium text-gray-900">{formatDOB(p.born_on)}</p>
                        </div>
                        <div>
                          <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Gender</p>
                          <p className=" font-medium text-gray-900 capitalize">{p.gender === 'm' ? 'Male' : p.gender === 'f' ? 'Female' : p.gender}</p>
                        </div>
                        <div>
                          <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Contact number</p>
                          <p className=" font-medium text-gray-900">{p.phone_number}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[16px]font-bold text-gray-500 uppercase mb-2">Flight information</p>
                        <p className=" font-medium text-gray-900 mb-1">
                          {firstSeg?.origin?.iata_code} to {order.slices[0]?.segments[order.slices[0].segments.length-1]?.destination?.iata_code} on {formatFullDate(firstSeg?.departing_at)} at {formatTime(firstSeg?.departing_at)}
                        </p>
                        <div className="flex flex-col  text-gray-600 font-medium">
                          {pCheckedBags > 0 && <span>{pCheckedBags} checked bag{pCheckedBags !== 1 ? 's' : ''}</span>}
                          {pCarryOnBags > 0 && <span>{pCarryOnBags} carry on bag{pCarryOnBags !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Summary, Billing, Timeline */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className=" font-bold text-gray-900">Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Order ID</p>
                  <p className=" font-mono text-gray-900">{order.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[16px]font-bold bg-emerald-100 text-emerald-800">
                      Confirmed
                    </span>
                  </div>
                  <div>
                    <p className="text-[16px]font-bold text-gray-500 uppercase mb-1">Airline</p>
                    <p className=" font-medium text-gray-900">{airlineOwner}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className=" font-bold text-gray-900">Billing summary</h2>
              </div>
              <div className="p-0">
                <table className="w-full text-left  text-gray-900">
                  <thead className="bg-white border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold text-gray-500">Description</th>
                      <th className="px-6 py-3 font-bold text-gray-500 text-right">Price ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    <tr>
                      <td className="px-6 py-4">Fare</td>
                      <td className="px-6 py-4 text-right">{baseAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Fare taxes</td>
                      <td className="px-6 py-4 text-right">{taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-gray-500">Service fee</td>
                      <td className="px-6 py-4 text-right text-gray-500">{serviceFee.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 font-bold">Total ({currency})</td>
                      <td className="px-6 py-4 text-right font-black">{totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-[16px] shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className=" font-bold text-gray-900">Timeline</h2>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-theme-primary text-white flex items-center justify-center font-bold  shrink-0">
                      {primaryPassenger?.given_name?.charAt(0) || 'U'}
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  <div className="pb-6">
                    <p className=" font-medium text-gray-900">
                      <strong>{primaryName}</strong> created this order.
                    </p>
                    <p className="text-[16px]text-gray-500 mt-1">
                      {order.created_at ? formatFullDate(order.created_at) + ', ' + formatTime(order.created_at) : 'Just now'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[16px] p-6 border border-dashed border-gray-300 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Building2 size={18} className="text-blue-600"/> Accommodation</h3>
              <p className=" text-gray-500 mt-1">Need a place to stay in {destIata}? Add it to your itinerary.</p>
            </div>
            <Link href={`/?tab=stays&dest=${destIata}`} className="self-start px-4 py-2 bg-blue-50 text-blue-700 font-bold text-[16px]uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-colors">
              Add a Hotel
            </Link>
          </div>
          <div className="bg-white rounded-[16px] p-6 border border-dashed border-gray-300 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><Ticket size={18} className="text-amber-600"/> Tours & Experiences</h3>
              <p className=" text-gray-500 mt-1">Discover top-rated tours and attractions for your trip.</p>
            </div>
            <Link href={`/?tab=tours&dest=${destIata}`} className="self-start px-4 py-2 bg-amber-50 text-amber-700 font-bold text-[16px]uppercase tracking-widest rounded-lg hover:bg-amber-100 transition-colors">
              Browse Tours
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}