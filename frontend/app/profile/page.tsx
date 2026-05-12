"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import ProfileModal from "../../components/ProfileModal";
import Link from "next/link";
import { User, LogOut, Bookmark, Settings, Edit3, Loader2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
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
        <p className="text-theme-muted font-bold text-sm mb-8 uppercase tracking-widest">
          Please login to access your profile
        </p>
        <Link
          href="/auth"
          className="bg-theme-primary text-theme-white px-8 py-4 rounded-2xl hover:bg-theme-secondary transition-all font-black shadow-xl active:scale-95 tracking-wider"
        >
          LOGIN TO CONTINUE
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-white border border-theme-surface w-full max-w-sm rounded-3xl shadow-2xl p-6 text-theme-secondary animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-1">Verify Email</h3>
            <p className="text-xs font-bold text-theme-muted mb-5">A 6-digit code has been sent to your email.</p>
            
            {verifyError && (
              <div className="p-2 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                {verifyError}
              </div>
            )}
            
            <input 
              type="text" 
              maxLength={6} 
              value={verifyOtp} 
              onChange={(e) => setVerifyOtp(e.target.value)} 
              placeholder="123456" 
              className="w-full p-4 rounded-xl bg-theme-surface/50 border border-theme-surface focus:border-theme-primary focus:ring-1 focus:ring-theme-primary outline-none text-center tracking-[0.5em] text-xl font-black mb-5"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsVerifyModalOpen(false)} 
                className="flex-1 p-3 rounded-xl bg-theme-surface hover:bg-theme-secondary/20 text-theme-secondary font-black text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleVerifySubmit} 
                disabled={verifyLoading || verifyOtp.length !== 6}
                className="flex-[1.5] p-3 rounded-xl bg-theme-primary hover:bg-theme-secondary text-theme-white font-black text-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-theme-white border border-red-100 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-theme-secondary animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-1 text-red-600">Delete Account</h3>
            <p className="text-xs font-bold text-theme-muted mb-5">
              Enter the 6-digit code sent to your email to confirm permanent deletion.
            </p>
            
            {deleteError && (
              <div className="p-2 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
                {deleteError}
              </div>
            )}
            
            <input 
              type="text" 
              maxLength={6} 
              value={deleteOtp} 
              onChange={(e) => setDeleteOtp(e.target.value)} 
              placeholder="123456" 
              className="w-full p-4 rounded-xl bg-theme-surface/50 border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-center tracking-[0.5em] text-xl font-black mb-5 text-red-600"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="flex-1 p-3 rounded-xl bg-theme-surface hover:bg-theme-secondary/20 text-theme-secondary font-black text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                disabled={deleteLoading || deleteOtp.length !== 6}
                className="flex-[1.5] p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-red-500/20"
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
          <p className="text-[11px] text-theme-muted font-black uppercase tracking-widest mt-2">
            Manage your personal information and preferences
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="animate-spin text-theme-primary" size={48} />
          </div>
        ) : (
          <div className="bg-theme-surface/20 rounded-[32px] border border-theme-surface shadow-2xl overflow-hidden relative">
            
            <div className="h-32 bg-theme-secondary w-full absolute top-0 left-0 z-0"></div>

            {/* Section 1: User Profile Header */}
            <div className="p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10 mt-12 border-b border-theme-surface pb-10">
              <div className="w-32 h-32 bg-theme-white text-theme-secondary border-4 border-theme-white rounded-full flex items-center justify-center overflow-hidden shadow-xl shrink-0">
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
                  <User size={64} />
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                {/* Name & Role Badge Inline */}
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h2 className="text-3xl font-black text-theme-secondary truncate">
                    {profileData?.full_name || profileData?.email?.split("@")[0]}
                  </h2>
                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-white bg-theme-primary px-2 py-1 rounded-lg shrink-0 shadow-sm mt-1">
                    {profileData?.role?.replace("_", " ") || "USER"}
                  </span>
                </div>
                
                {/* Travel ID beneath name */}
                <div className="mt-2">
                  <p className="text-[11px] font-bold text-theme-muted tracking-widest uppercase">
                    Travel ID: <span className="text-theme-secondary font-black">{profileData?.unique_travel_id || "Pending"}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-theme-surface text-theme-secondary rounded-2xl hover:bg-theme-muted/20 transition-colors font-black text-sm active:scale-95"
                >
                  <Edit3 size={18} /> Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors font-black text-sm active:scale-95"
                >
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </div>

            {/* Section 2: Account Details */}
            <div className="p-6 md:p-10 border-b border-theme-surface bg-theme-white">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-theme-secondary mb-6 flex items-center gap-3">
                <div className="p-2 bg-theme-secondary text-theme-white rounded-xl shadow-md"><Settings size={16} /></div>
                Account Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-theme-surface/20 p-5 rounded-2xl border border-theme-surface shadow-sm">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Email Address</label>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-theme-secondary text-lg truncate">
                    {profileData?.email || <span className="text-theme-secondary/40 italic">Not provided</span>}
                    </div>
                    {/* Verification Symbol Only */}
                    {profileData?.is_email_verified ? (
                      <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <button 
                        onClick={handleResendVerification} 
                        className="hover:scale-110 transition-transform flex-shrink-0 group relative"
                        title="Unverified - Click to verify"
                      >
                        <AlertCircle size={20} className="text-red-500" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[120%] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-theme-secondary text-theme-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10">
                          Click to verify
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-theme-surface/20 p-5 rounded-2xl border border-theme-surface shadow-sm">
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Mobile Number</label>
                  <div className="font-bold text-theme-secondary text-lg truncate">
                    {profileData?.mobile_number || <span className="text-theme-secondary/40 italic">Not provided</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Quick Links */}
            <div className="p-6 md:p-10 bg-theme-surface/20">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-theme-secondary mb-6 flex items-center gap-3">
                <div className="p-2 bg-theme-secondary text-theme-white rounded-xl shadow-md"><MapPin size={16} /></div>
                Travel Hub
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Link
                  href="/savedtrips"
                  className="flex items-center gap-5 p-6 rounded-2xl bg-theme-surface/20 border border-theme-surface hover:border-theme-primary hover:shadow-xl transition-all group active:scale-[0.98]"
                >
                  <div className="p-4 bg-theme-white text-theme-primary border border-theme-surface rounded-xl group-hover:bg-theme-primary group-hover:text-theme-white transition-colors shadow-sm">
                    <Bookmark size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-theme-secondary group-hover:text-theme-secondary transition-colors">Saved Trips</h4>
                    <p className="text-[11px] font-black uppercase tracking-widest text-theme-muted mt-1">View itineraries</p>
                  </div>
                </Link>

                <Link
                  href="/"
                  className="flex items-center gap-5 p-6 rounded-2xl bg-theme-surface/20 border border-theme-surface hover:border-theme-primary hover:shadow-xl transition-all group active:scale-[0.98]"
                >
                  <div className="p-4 bg-theme-white text-theme-secondary border border-theme-surface rounded-xl group-hover:bg-theme-primary group-hover:text-theme-white transition-colors shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-theme-secondary group-hover:text-theme-secondary transition-colors">Plan New Trip</h4>
                    <p className="text-[11px] font-black uppercase tracking-widest text-theme-muted mt-1">Start an adventure</p>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Section 4: Danger Zone */}
            <div className="p-6 md:p-10 border-t border-red-100 bg-red-50/30 rounded-b-[32px]">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl shadow-sm"><AlertCircle size={16} /></div>
                Danger Zone
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 p-5 rounded-2xl border border-red-100 shadow-sm">
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Delete Account</h4>
                  <p className="text-xs font-medium text-red-700/70 mt-1">
                    Permanently delete your account and all of your saved itineraries.
                  </p>
                </div>
                <button
                  onClick={handleDeleteRequest}
                  className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-black text-sm transition-colors shadow-sm active:scale-95 whitespace-nowrap"
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