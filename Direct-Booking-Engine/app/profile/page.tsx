"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import ProfileModal from "../../components/ProfileModal";
import Link from "next/link";
import { User, LogOut, Bookmark, Settings, Edit3, Loader2, MapPin, CheckCircle2, AlertCircle, ChevronRight, Compass } from "lucide-react";
import { travelApi } from "@/services/api";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { logout, isLoggedIn } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Email Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Account Deletion Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await travelApi.getProfile();
      setProfileData(data);
    } catch (error: any) {
      console.error("Failed to fetch profile", error);
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchProfile();
  }, [isLoggedIn]);

  // Email Verification Handlers
  const handleResendVerification = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/resend-email-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profileData.email }),
      });
      setVerifyOtp("");
      setVerifyError("");
      setIsVerifyModalOpen(true);
    } catch (err) {
      console.error("Failed to trigger verification", err);
    }
  };

  const handleVerifySubmit = async () => {
    setVerifyLoading(true);
    setVerifyError("");
    try {
      await travelApi.verifyEmailOtp({ email: profileData.email, code: verifyOtp });
      setIsVerifyModalOpen(false);
      fetchProfile();
    } catch (err: any) {
      setVerifyError(err.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // Account Deletion Handlers
  const handleDeleteRequest = async () => {
    try {
      await travelApi.requestAccountDeletion();
      setDeleteOtp("");
      setDeleteError("");
      setIsDeleteModalOpen(true);
    } catch (err: any) {
      console.error("Failed to request deletion", err);
      alert(err.response?.data?.detail || "Failed to send deletion code. Please try again.");
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await travelApi.confirmAccountDeletion(deleteOtp);
      setIsDeleteModalOpen(false);
      logout();
      router.push("/");
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-white">
        <h1 className="text-3xl font-black text-theme-secondary mb-3">Access Restricted</h1>
        <p className="text-theme-secondary/50 font-black text-[16px] mb-8 uppercase tracking-widest">
          Please login to access your profile
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
    <div className="min-h-screen bg-theme-white relative flex flex-col">
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProfileUpdate={fetchProfile}
      />

      {/* Verification Popup Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-theme-white border-[1px] border-theme-secondary/10 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-theme-secondary animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-1">Verify Email</h3>
            <p className="text-xs font-bold text-theme-secondary/60 mb-5">A 6-digit code has been sent to your email.</p>
            
            {verifyError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-[16px] font-black uppercase tracking-widest rounded-xl text-center">
                {verifyError}
              </div>
            )}
            
            <input 
              type="text" 
              maxLength={6} 
              value={verifyOtp} 
              onChange={(e) => setVerifyOtp(e.target.value)} 
              placeholder="123456" 
              className="w-full p-4 rounded-xl bg-theme-secondary/5 border border-theme-secondary/10 focus:border-theme-primary focus:ring-1 focus:ring-theme-primary outline-none text-center tracking-[0.5em] text-xl font-black mb-5"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsVerifyModalOpen(false)} 
                className="flex-1 p-3 rounded-xl bg-theme-secondary/5 hover:bg-theme-secondary/10 text-theme-secondary font-black text-[16px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifySubmit} 
                disabled={verifyLoading || verifyOtp.length !== 6}
                className="flex-[1.5] p-3 rounded-xl bg-theme-primary hover:bg-theme-primary/90 text-theme-white font-black text-[16px] uppercase tracking-widest transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {verifyLoading && <Loader2 size={16} className="animate-spin" />}
                {verifyLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Popup Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-theme-white border-[1px] border-red-100 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 text-theme-secondary animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-1 text-red-600">Delete Account</h3>
            <p className="text-xs font-bold text-theme-secondary/60 mb-5">
              Enter the 6-digit code sent to your email to confirm permanent deletion.
            </p>
            
            {deleteError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-[16px] font-black uppercase tracking-widest rounded-xl text-center">
                {deleteError}
              </div>
            )}
            
            <input 
              type="text" 
              maxLength={6} 
              value={deleteOtp} 
              onChange={(e) => setDeleteOtp(e.target.value)} 
              placeholder="123456" 
              className="w-full p-4 rounded-xl bg-theme-secondary/5 border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-center tracking-[0.5em] text-xl font-black mb-5 text-red-600"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 p-3 rounded-xl bg-theme-secondary/5 hover:bg-theme-secondary/10 text-theme-secondary font-black text-[16px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                disabled={deleteLoading || deleteOtp.length !== 6}
                className="flex-[1.5] p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[16px] uppercase tracking-widest transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-red-500/20"
              >
                {deleteLoading && <Loader2 size={16} className="animate-spin" />}
                {deleteLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-theme-secondary tracking-tight">My Profile</h1>
          <p className="text-[16px] text-theme-secondary/50 font-black uppercase tracking-[0.2em] mt-2">
            Manage your personal information and preferences
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-8 h-8 border-4 border-theme-primary/20 border-t-theme-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-theme-white rounded-[2rem] border-[1px] border-theme-secondary/10 shadow-sm overflow-hidden relative">
            
            <div className="h-32 bg-theme-secondary w-full absolute top-0 left-0 z-0"></div>

            {/* Section 1: User Profile Header */}
            <div className="p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10 mt-12 border-b border-theme-secondary/10 pb-10">
              <div className="w-32 h-32 bg-theme-white text-theme-secondary border-4 border-theme-white rounded-full flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                {profileData?.profile_picture_url ? (
                  <img
                    src={
                      profileData.profile_picture_url.startsWith("http")
                        ? profileData.profile_picture_url
                        : `${API_BASE_URL}${profileData.profile_picture_url}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-theme-secondary/20" />
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h2 className="text-3xl font-black text-theme-secondary truncate">
                    {profileData?.full_name || profileData?.email?.split("@")[0]}
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-white bg-theme-primary px-2.5 py-1 rounded-md shrink-0 shadow-sm mt-1">
                    {profileData?.role?.replace("_", " ") || "USER"}
                  </span>
                </div>
                
                <div className="mt-2 flex justify-center md:justify-start items-center gap-2 text-[16px] font-black uppercase tracking-widest text-theme-secondary/50">
                   <span>Travel ID:</span>
                   <span className="bg-theme-secondary/10 px-2 py-0.5 rounded text-theme-secondary">{profileData?.unique_travel_id || "Pending"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-theme-secondary/5 text-theme-secondary rounded-xl hover:bg-theme-secondary/10 hover:text-theme-primary transition-all font-black text-[16px] uppercase tracking-widest active:scale-95 border border-theme-secondary/10"
                >
                  <Edit3 size={16} /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-black text-[16px] uppercase tracking-widest active:scale-95 border border-red-100"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>

            {/* Section 2: Account Details */}
            <div className="p-6 md:p-10 border-b border-theme-secondary/10 bg-theme-white">
              <h3 className="text-[16px] font-black uppercase tracking-[0.2em] text-theme-secondary/50 mb-6 flex items-center gap-2">
                <Settings size={16} className="text-theme-primary" />
                Account Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-theme-secondary/5 p-5 rounded-[1rem] border-[1px] border-theme-secondary/10 shadow-sm">
                  <label className="block text-[16px] font-black text-theme-secondary/50 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-theme-secondary text-base truncate">
                    {profileData?.email || <span className="text-theme-secondary/40 italic">Not provided</span>}
                    </div>
                    {profileData?.is_email_verified ? (
                      <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <button 
                        onClick={handleResendVerification} 
                        className="hover:scale-110 transition-transform flex-shrink-0 group relative"
                        title="Unverified - Click to verify"
                      >
                        <AlertCircle size={20} className="text-red-500" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[120%] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-theme-secondary text-theme-white text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded whitespace-nowrap z-10">
                          Click to verify
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-theme-secondary/5 p-5 rounded-[1rem] border-[1px] border-theme-secondary/10 shadow-sm">
                  <label className="block text-[16px] font-black text-theme-secondary/50 uppercase tracking-widest mb-2">Mobile Number</label>
                  <div className="font-black text-theme-secondary text-base truncate">
                    {profileData?.mobile_number || <span className="text-theme-secondary/40 italic">Not provided</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Quick Links */}
            <div className="p-6 md:p-10 bg-theme-white">
              <h3 className="text-[16px] font-black uppercase tracking-[0.2em] text-theme-secondary/50 mb-6 flex items-center gap-2">
                <Compass size={16} className="text-theme-primary" />
                Travel Hub
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/savedItineraries"
                  className="group w-full rounded-[1rem] border-[1px] border-theme-secondary/10 bg-theme-white p-5 flex items-center justify-between cursor-pointer hover:border-theme-primary hover:bg-theme-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-theme-secondary/5 rounded-full flex items-center justify-center text-theme-secondary group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-colors shrink-0">
                      <Bookmark size={20} />
                    </div>
                    <div className="text-left flex flex-col justify-center">
                      <h4 className="font-black text-sm sm:text-base text-theme-secondary group-hover:text-theme-primary transition-colors">
                        Saved Trips
                      </h4>
                      <p className="text-[16px] font-bold text-theme-secondary/50 mt-0.5 uppercase tracking-widest">
                        View Itineraries
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-theme-white border border-theme-secondary/10 flex items-center justify-center text-theme-secondary/40 group-hover:text-theme-primary group-hover:border-theme-primary/30 group-hover:translate-x-1 transition-all shrink-0 shadow-sm">
                    <ChevronRight size={16} />
                  </div>
                </Link>

                <Link
                  href="/"
                  className="group w-full rounded-[1rem] border-[1px] border-theme-secondary/10 bg-theme-white p-5 flex items-center justify-between cursor-pointer hover:border-theme-primary hover:bg-theme-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary transition-all duration-300 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-theme-secondary/5 rounded-full flex items-center justify-center text-theme-secondary group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-colors shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div className="text-left flex flex-col justify-center">
                      <h4 className="font-black text-sm sm:text-base text-theme-secondary group-hover:text-theme-primary transition-colors">
                        Plan New Trip
                      </h4>
                      <p className="text-[16px] font-bold text-theme-secondary/50 mt-0.5 uppercase tracking-widest">
                        Start an Adventure
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-theme-white border border-theme-secondary/10 flex items-center justify-center text-theme-secondary/40 group-hover:text-theme-primary group-hover:border-theme-primary/30 group-hover:translate-x-1 transition-all shrink-0 shadow-sm">
                    <ChevronRight size={16} />
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Section 4: Danger Zone */}
            <div className="p-6 md:p-10 border-t border-red-100 bg-red-50/50">
              <h3 className="text-[16px] font-black uppercase tracking-[0.2em] text-red-600/60 mb-4 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-white p-5 rounded-[1rem] border-[1px] border-red-100 shadow-sm">
                <div>
                  <h4 className="font-black text-red-600 text-sm">Delete Account</h4>
                  <p className="text-[16px] font-bold text-red-600/60 mt-1">
                    Permanently delete your account and all of your saved itineraries.
                  </p>
                </div>
                <button
                  onClick={handleDeleteRequest}
                  className="px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black text-[16px] uppercase tracking-widest transition-colors border border-red-100 shadow-sm active:scale-95 whitespace-nowrap"
                >
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}