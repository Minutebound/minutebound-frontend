"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { travelApi } from "../../services/api";
import Link from "next/link";
import ItineraryModal from "../../components/results/ItineraryModal";
import {
  PlaneTakeoff,
  Building2,
  Map as MapIcon,
  Car,
  Share2,
  Mail,
  Copy,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  Trash,
  ChevronRight,
  Compass
} from "lucide-react";

interface SavedTrip {
  id: string;
  destination: string;
  visibility: "PRIVATE" | "PUBLIC";
  share_token?: string | null;
  data: {
    check_in_date?: string;
    check_out_date?: string;
    startDate?: string;
    endDate?: string;
    rawParams?: any;
    flight?: any;
    drive?: any;
    hotel?: any;
    weather?: any;
    activities?: any[];
    attractions?: any[];
  };
}

export default function savedItinerariesPage() {
  const { isLoggedIn } = useAuth();
  const [savedItineraries, setsavedItineraries] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  
  // Track which link was just copied for visual feedback
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    tripId: string | null;
    email: string;
    message: string;
    loading: boolean;
    success: boolean;
  }>({
    isOpen: false,
    tripId: null,
    email: "",
    message: "",
    loading: false,
    success: false,
  });

  useEffect(() => {
    const fetchTrips = async () => {
      if (!isLoggedIn) return;
      try {
        const data = await travelApi.getMyTrips();
        setsavedItineraries(data);
      } catch (error) {
        console.error("Failed to load trips:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [isLoggedIn]);

  const handleDelete = async (tripId: string) => {
    if (!window.confirm("Are you sure you want to delete this itinerary?"))
      return;
    try {
      await travelApi.deleteTrip(tripId);
      setsavedItineraries((prev) => prev.filter((t) => t.id !== tripId));
    } catch (error) {
      alert("Failed to delete trip.");
    }
  };

  const handleVisibilityChange = async (
    tripId: string,
    visibility: "PRIVATE" | "PUBLIC"
  ) => {
    try {
      const updated = await travelApi.updateItineraryVisibility(
        tripId,
        visibility
      );
      setsavedItineraries((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? {
                ...t,
                visibility: updated.visibility,
                share_token: updated.share_token,
              }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to update visibility", error);
      alert("Could not update visibility.");
    }
  };

  const handleCopyLink = (token: string, tripId: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkId(tripId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModal.tripId || !emailModal.email) return;

    setEmailModal((prev) => ({ ...prev, loading: true }));
    try {
      await travelApi.shareItineraryEmail(
        emailModal.tripId,
        emailModal.email,
        emailModal.message
      );
      setEmailModal((prev) => ({ ...prev, loading: false, success: true }));
      setTimeout(() => {
        setEmailModal({
          isOpen: false,
          tripId: null,
          email: "",
          message: "",
          loading: false,
          success: false,
        });
      }, 2000);
    } catch (error) {
      console.error("Email failed", error);
      alert("Failed to send email. Please try again.");
      setEmailModal((prev) => ({ ...prev, loading: false }));
    }
  };

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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTripTitle = (trip: SavedTrip) => {
    const source =
      trip.data.rawParams?.source?.name?.split(",")[0] ||
      trip.data.rawParams?.source?.city;
    return source ? `${source} to ${trip.destination.split(',')[0]}` : trip.destination.split(',')[0];
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-white">
        <h1 className="text-3xl font-black text-theme-secondary mb-3">Access Restricted</h1>
        <p className="text-theme-secondary/50 font-black text-[16px] mb-8 uppercase tracking-widest">
          Please login to view your saved trips
        </p>
        <Link
          href="/auth"
          className="bg-theme-primary text-theme-white px-8 py-4 rounded-xl hover:bg-theme-primary/90 transition-all font-black shadow-xl active:scale-95 text-[16px] uppercase tracking-widest"
        >
          Login To Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-white relative pb-20">
      
      {/* 1. NEW 1:1 REPLICA MODAL INTEGRATION */}
      {selectedTrip && (
         <ItineraryModal
           isOpen={!!selectedTrip}
           onClose={() => setSelectedTrip(null)}
           rawParams={selectedTrip.data.rawParams}
           weatherData={selectedTrip.data.weather}
           isSavedView={true}
           preloadedData={{
             flight: selectedTrip.data.flight,
             stay: selectedTrip.data.hotel, // Saved trip stores it as 'hotel'
             tours: selectedTrip.data.activities, // Saved trip stores it as 'activities'
             attractions: selectedTrip.data.attractions,
             drive: selectedTrip.data.drive,
             bookingRef: (selectedTrip as any).booking_ref || null
           }}
         />
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-theme-secondary tracking-tight">
              Saved Itineraries
            </h1>
            <p className="text-[16px] text-theme-secondary/50 font-black uppercase tracking-[0.2em] mt-2">
              You have {savedItineraries.length} saved trip{savedItineraries.length !== 1 && "s"}. View, share, or delete them here.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-8 h-8 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin"></div>
          </div>
        ) : savedItineraries.length === 0 ? (
          <div className="bg-theme-white border-[1px] border-theme-secondary/10 p-16 rounded-[2rem] shadow-sm text-center flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-theme-secondary/5 rounded-full flex items-center justify-center text-theme-secondary/20">
              <MapIcon size={32} />
            </div>
            <h3 className="text-xl font-black text-theme-secondary">
              No trips planned yet
            </h3>
            <p className="text-sm font-bold text-theme-secondary/50 max-w-md">
              Start building your next adventure. Search for flights, stays, and activities to create your perfect itinerary.
            </p>
            <Link
              href="/"
              className="mt-4 bg-theme-primary text-theme-white px-8 py-4 rounded-xl font-black text-[16px] uppercase tracking-widest hover:bg-theme-primary/90 transition-all shadow-xl active:scale-95"
            >
              Create Your First Itinerary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItineraries.map((trip) => (
              <div
                key={trip.id}
                className="bg-theme-white border-[1px] border-theme-secondary/10 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:border-theme-primary/50 transition-all duration-300 overflow-hidden flex flex-col relative group"
              >
                {/* Visibility Badge/Dropdown overlay */}
                <div className="absolute top-4 right-4 z-10 flex items-center bg-theme-white/90 backdrop-blur-md rounded-lg border border-theme-secondary/10 px-2.5 py-1.5 shadow-sm">
                  {trip.visibility === "PRIVATE" ? (
                    <Lock size={10} className="text-theme-secondary/40 mr-1.5" />
                  ) : (
                    <Globe size={10} className="text-blue-500 mr-1.5" />
                  )}
                  <select
                    value={trip.visibility || "PRIVATE"}
                    onChange={(e) =>
                      handleVisibilityChange(trip.id, e.target.value as any)
                    }
                    className="bg-transparent text-[10px] font-black tracking-widest uppercase focus:outline-none appearance-none pr-3 cursor-pointer text-theme-secondary"
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>

                <div className="p-6 flex-grow mt-4">
                  <div className="flex justify-between items-start mb-2 pr-24">
                    <h2
                      className="text-xl font-black text-theme-secondary line-clamp-2 leading-tight group-hover:text-theme-primary transition-colors"
                      title={getTripTitle(trip)}
                    >
                      {getTripTitle(trip)}
                    </h2>
                  </div>

                  <span className="inline-block bg-theme-primary/10 text-theme-primary text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest mb-6 border border-theme-primary/20">
                    {formatDate(
                      trip.data.check_in_date ||
                        trip.data.rawParams?.startDate ||
                        trip.data.startDate ||
                        ""
                    )}
                  </span>

                  <div className="space-y-4 text-[10px]text-theme-secondary/70 font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-secondary/5 flex items-center justify-center text-theme-secondary">
                        {trip.data.flight ? <PlaneTakeoff size={14} /> : <Car size={14} />}
                      </div>
                      <span className="truncate">
                        {trip.data.flight?.airline_name ||
                          (trip.data.drive
                            ? "Road Trip Journey"
                            : "No transport selected")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-secondary/5 flex items-center justify-center text-theme-secondary">
                        <Building2 size={14} />
                      </div>
                      <span className="truncate">
                        {trip.data.hotel?.name || "No hotel selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-secondary/5 flex items-center justify-center text-theme-secondary">
                        <MapIcon size={14} />
                      </div>
                      <span>
                        {trip.data.attractions?.length || 0} Attractions saved
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-theme-secondary/5 border-t border-theme-secondary/10 flex flex-col gap-2">
                  {trip.visibility !== "PRIVATE" && trip.share_token && (
                    <>
                      {copiedLinkId === trip.id ? (
                        <button className="w-full flex items-center justify-center gap-2 text-[16px] uppercase tracking-widest font-black bg-green-50 text-green-600 py-3 rounded-xl border border-green-200 transition-all">
                          <CheckCircle2 size={14} /> Link Copied!
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCopyLink(trip.share_token!, trip.id)}
                          className="w-full flex items-center justify-center gap-2 text-[16px] uppercase tracking-widest font-black bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100 transition-all active:scale-95 py-3 rounded-xl border border-blue-200"
                        >
                          <Copy size={14} /> Copy Public Link
                        </button>
                      )}
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTrip(trip)}
                      className="flex-[2] flex items-center justify-center gap-2 text-center bg-theme-white border border-theme-secondary/10 text-theme-secondary py-3 rounded-xl text-[16px] font-black uppercase tracking-widest hover:bg-theme-primary hover:text-theme-white hover:border-theme-primary active:scale-95 transition-all shadow-sm"
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                    <button
                      title="Email to a Friend"
                      onClick={() =>
                        setEmailModal({
                          isOpen: true,
                          tripId: trip.id,
                          email: "",
                          message: "",
                          loading: false,
                          success: false,
                        })
                      }
                      className="flex-1 flex justify-center items-center bg-theme-white border border-theme-secondary/10 text-theme-secondary py-3 rounded-xl hover:bg-theme-primary hover:text-theme-white hover:border-theme-primary active:scale-95 transition-all shadow-sm"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      title="Delete Trip"
                      onClick={() => handleDelete(trip.id)}
                      className="flex-1 flex justify-center items-center bg-theme-white border border-red-100 text-red-500 py-3 rounded-xl hover:bg-red-50 active:scale-95 transition-all shadow-sm"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- EMAIL MODAL --- */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() =>
              !emailModal.loading &&
              setEmailModal((prev) => ({ ...prev, isOpen: false }))
            }
          />
          <div className="relative bg-theme-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 border border-theme-secondary/10">
            <h3 className="text-xl font-black text-theme-secondary flex items-center gap-2 mb-1">
              <Share2 size={20} className="text-theme-primary" /> Share
              Itinerary
            </h3>
            <p className="text-[10px]font-bold text-theme-secondary/60 mb-5">
              Send a beautiful PDF copy of this trip to a friend via email.
            </p>

            {emailModal.success ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center justify-center gap-2 text-[16px] uppercase tracking-widest font-black mb-4 border border-green-200">
                <CheckCircle2 size={16} /> Email sent successfully!
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
                <div>
                  <label className="text-[16px] font-black text-theme-secondary/50 uppercase tracking-widest mb-2 block">
                    Friend's Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailModal.email}
                    onChange={(e) =>
                      setEmailModal((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="friend@example.com"
                    className="w-full px-4 py-4 bg-theme-secondary/5 border border-theme-secondary/10 rounded-xl text-sm font-bold focus:ring-1 focus:ring-theme-primary focus:border-theme-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[16px] font-black text-theme-secondary/50 uppercase tracking-widest mb-2 block">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={emailModal.message}
                    onChange={(e) =>
                      setEmailModal((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Hey! Check out this trip I planned..."
                    rows={3}
                    className="w-full px-4 py-4 bg-theme-secondary/5 border border-theme-secondary/10 rounded-xl text-sm font-bold focus:ring-1 focus:ring-theme-primary focus:border-theme-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setEmailModal((prev) => ({ ...prev, isOpen: false }))
                    }
                    className="flex-1 py-4 text-[16px] font-black uppercase tracking-widest text-theme-secondary bg-theme-secondary/5 rounded-xl hover:bg-theme-secondary/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={emailModal.loading}
                    className="flex-1 py-4 text-[16px] font-black uppercase tracking-widest text-theme-white bg-theme-primary rounded-xl flex justify-center items-center gap-2 hover:bg-theme-primary/90 transition-colors shadow-lg disabled:opacity-70"
                  >
                    {emailModal.loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={16} /> Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}