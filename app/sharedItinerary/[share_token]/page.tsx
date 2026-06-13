"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { travelApi } from "../../../services/api";
import Link from "next/link";
import {
  Plane,
  Hotel,
  MapPin,
  Calendar,
  Map,
  Ticket,
  Car,
  DollarSign,
  Loader2,
  AlertCircle,
  Globe,
  PlaneTakeoff,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface SharedItinerary {
  id: string;
  destination: string;
  data: any;
  owner_name?: string; // If your backend expands to return owner name, else we leave generic
}

export default function SharedItineraryPage() {
  const params = useParams();
  const shareToken = params.share_token as string;

  const [trip, setTrip] = useState<SharedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedItinerary = async () => {
      if (!shareToken) return;
      try {
        const data = await travelApi.getSharedItinerary(shareToken);
        setTrip(data);
      } catch (err: any) {
        console.error("Failed to fetch shared itinerary:", err);
        setError(
          err.response?.data?.detail ||
            "This itinerary is private, invalid, or no longer exists."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSharedItinerary();
  }, [shareToken]);

  // --- FORMATTING HELPERS ---
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const localDate = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    return localDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const safeFloat = (val: any) => {
    if (!val) return 0;
    if (typeof val === "string")
      return parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
    return parseFloat(val) || 0;
  };

  const getLayoverTime = (arrivalStr: string, departureStr: string) => {
    if (!arrivalStr || !departureStr) return null;
    const arr = new Date(arrivalStr).getTime();
    const dep = new Date(departureStr).getTime();
    const diffMs = dep - arr;
    if (diffMs <= 0) return null;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
  };

  const calculateTotal = (tripData: any) => {
    let total = 0;
    if (tripData.flight) total += safeFloat(tripData.flight.price);
    else if (tripData.drive) total += safeFloat(tripData.drive.fuelEstimate);
    if (tripData.hotel) total += safeFloat(tripData.hotel.price);
    return total;
  };

  const getTripTitle = () => {
    if (!trip) return "";
    const source =
      trip.data.rawParams?.source?.name?.split(",")[0] ||
      trip.data.rawParams?.source?.city;
    return source ? `${source} to ${trip.destination}` : trip.destination;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-white flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-theme-primary animate-spin mb-4" />
        <p className="text-theme-secondary font-bold animate-pulse">
          Loading itinerary...
        </p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-theme-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 text-red-500 p-6 rounded-full mb-6 border border-red-100">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-[24px] font-black text-theme-secondary mb-2">
          Trip Unavailable
        </h1>
        <p className="text-theme-muted font-medium mb-8 max-w-md">{error}</p>
        <Link
          href="/"
          className="bg-theme-primary text-theme-white px-8 py-3 rounded-[16px] font-bold hover:bg-theme-secondary transition-all shadow-lg active:scale-95"
        >
          Plan Your Own Trip
        </Link>
      </div>
    );
  }

  const tData = trip.data;

  return (
    <div className="min-h-screen bg-theme-white pb-20">
      {/* Minimal Public Navbar */}
    <Navbar/>
      <main className="max-w-[24px] mx-auto p-6 mt-8">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-[24px] md:text-[24px] font-black text-theme-secondary tracking-tight mb-4">
            {getTripTitle()}
          </h1>
          <p className="inline-flex items-center gap-2 text-sm font-bold text-theme-secondary/80 bg-theme-surface px-4 py-2 rounded-[16px] border border-theme-muted/20 shadow-sm">
            <Calendar size={16} className="text-theme-primary" />
            {formatDate(
              tData.check_in_date ||
                tData.rawParams?.startDate ||
                tData.startDate ||
                ""
            )}
            {" — "}
            {formatDate(
              tData.check_out_date ||
                tData.rawParams?.endDate ||
                tData.endDate ||
                ""
            )}
          </p>
        </div>

        <div className="bg-theme-surface/60 border border-theme-surface rounded-[2rem] p-6 md:p-10 shadow-[16px] space-y-8">
          {/* Total Cost */}
          <div className="bg-theme-secondary/10 border border-theme-secondary/20 rounded-[16px] p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-theme-secondary">
              <DollarSign size={24} />
              <span className="font-black uppercase tracking-widest text-sm">
                Total Estimated Cost
              </span>
            </div>
            <span className="font-black text-[24px] text-theme-secondary">
              ${calculateTotal(tData).toFixed(2)}
            </span>
          </div>

          {/* Transportation */}
          {(tData.flight || tData.drive) && (
            <section>
              <h3 className="text-[16px] font-black text-theme-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                {tData.flight ? (
                  <Plane size={24} className="text-theme-primary" />
                ) : (
                  <Car size={24} className="text-theme-primary" />
                )}
                Transportation
              </h3>

              {tData.flight ? (
                <div className="bg-theme-white border border-theme-surface rounded-[16px] p-5 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-black text-[16px] text-theme-secondary">
                      {tData.flight.airline_name}
                    </p>
                    <span className="font-black text-theme-primary">
                      ${safeFloat(tData.flight.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    {(tData.flight.itineraries || []).map(
                      (itin: any, idx: number) => {
                        const stops = itin.segments?.length
                          ? itin.segments.length - 1
                          : 0;
                        return (
                          <div
                            key={idx}
                            className="bg-theme-surface/40 p-4 rounded-[16px] border border-theme-muted/10"
                          >
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-theme-muted/20">
                              <span className="text-[16px]uppercase font-black text-theme-muted tracking-wider">
                                {idx === 0 ? "Outbound" : "Return"} •{" "}
                                {formatShortDate(
                                  itin.segments?.[0]?.departure_time
                                )}
                              </span>
                              <span
                                className={`text-[16px] uppercase font-black tracking-wider px-2 py-1 rounded-md ${
                                  stops === 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {stops === 0
                                  ? "Direct Flight"
                                  : `${stops} Stop(s)`}
                              </span>
                            </div>

                            <div className="flex flex-col gap-3">
                              {(itin.segments || []).map(
                                (seg: any, sIdx: number) => {
                                  const layover =
                                    sIdx > 0
                                      ? getLayoverTime(
                                          itin.segments[sIdx - 1].arrival_time,
                                          seg.departure_time
                                        )
                                      : null;
                                  return (
                                    <React.Fragment key={sIdx}>
                                      {layover && (
                                        <div className="flex justify-center my-2">
                                          <span className="text-[16px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-sm">
                                            Layover: {layover}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4 text-theme-secondary/80">
                                        <div className="flex-1">
                                          <p className="font-black text-[16px] text-theme-secondary">
                                            {seg.departure_airport}
                                          </p>
                                          <p className="text-[16px]font-bold text-theme-muted">
                                            {formatTime(seg.departure_time)}
                                          </p>
                                        </div>
                                        <div className="text-theme-muted opacity-50">
                                          ✈️
                                        </div>
                                        <div className="flex-1 text-right">
                                          <p className="font-black text-[16px] text-theme-secondary">
                                            {seg.arrival_airport}
                                          </p>
                                          <p className="text-[16px]font-bold text-theme-muted">
                                            {formatTime(seg.arrival_time)}
                                          </p>
                                        </div>
                                      </div>
                                    </React.Fragment>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-theme-white border border-theme-surface rounded-[16px] p-5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-black text-[16px] text-theme-secondary">
                      Road Trip Journey
                    </p>
                    <span className="font-black text-theme-primary">
                      ${safeFloat(tData.drive?.fuelEstimate).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-theme-secondary/70 font-bold">
                    Estimated Duration:{" "}
                    <span className="text-theme-secondary">
                      {tData.drive?.duration}
                    </span>
                    <br />
                    Driving Distance:{" "}
                    <span className="text-theme-secondary">
                      {tData.drive?.distance}
                    </span>
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Accommodation */}
          {tData.hotel && (
            <section>
              <h3 className="text-[16px] font-black text-theme-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Hotel size={24} className="text-theme-primary" /> Accommodation
              </h3>
              <div className="bg-theme-white border border-theme-surface rounded-[16px] p-5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-black text-[16px] text-theme-secondary">
                      {tData.hotel.name}
                    </p>
                    <p className="text-sm font-medium text-theme-muted mt-2 flex items-start gap-2">
                      <MapPin size={16} className="shrink-0 mt-0.5" />
                      {tData.hotel.address?.lines?.join(", ") ||
                        "Address unavailable"}
                    </p>
                  </div>
                  <span className="font-black text-[24px] text-theme-primary">
                    ${safeFloat(tData.hotel.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Attractions */}
          {tData.attractions && tData.attractions.length > 0 && (
            <section>
              <h3 className="text-[16px] font-black text-theme-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Map size={24} className="text-theme-secondary" /> Planned
                Attractions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tData.attractions.map((attr: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-theme-white border border-theme-surface p-4 rounded-[16px] text-sm font-bold text-theme-secondary/80 shadow-sm flex items-start gap-3"
                  >
                    <span className="text-theme-secondary mt-0.5">•</span>
                    <span className="leading-snug">{attr.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Activities */}
          {tData.activities && tData.activities.length > 0 && (
            <section>
              <h3 className="text-[16px] font-black text-theme-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Ticket size={24} className="text-theme-secondary" /> Tours &
                Activities
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {tData.activities.map((tour: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-theme-white border border-theme-surface p-4 rounded-[16px] text-sm font-bold text-theme-secondary/80 shadow-sm flex items-start gap-3"
                  >
                    <span className="text-theme-secondary mt-0.5">•</span>
                    <span className="leading-snug">
                      {tour.name || tour.title}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* CTA Footer */}
        <div className="mt-12 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-[2rem] p-8 md:p-12 text-center shadow-[16px] relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-[24px] md:text-[24px] font-black text-white mb-4">
              Want to plan a trip like this?
            </h2>
            <p className="text-white/80 font-medium mb-8 max-w-lg mx-auto">
              MinuteBound US uses smart technology to build perfect, custom
              itineraries in seconds.
            </p>
            <Link
              href="/"
              className="inline-block bg-white text-theme-primary px-8 py-4 rounded-[16px] font-black text-[16px] hover:bg-gray-50 transition shadow-[16px] active:scale-95"
            >
              Start Planning for Free
            </Link>
          </div>

          {/* Background decorations */}
          <Plane
            className="absolute -top-10 -right-10 text-white/10 rotate-45"
            size={120}
          />
          <Map
            className="absolute -bottom-10 -left-10 text-white/10"
            size={120}
          />
        </div>
      </main>
    </div>
  );
}
