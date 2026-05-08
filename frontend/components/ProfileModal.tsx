"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Upload, Loader2, Save, User } from "lucide-react";
import { travelApi } from "@/services/api";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  onProfileUpdate,
}: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    suffix: "",
    email: "",
    mobile_number: "",
    profile_picture_url: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:8000";

  const SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V"];

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    } else {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await travelApi.getProfile();
      setProfile({
        first_name: data.first_name || "",
        middle_name: data.middle_name || "",
        last_name: data.last_name || "",
        suffix: data.suffix || "",
        email: data.email || "",
        mobile_number: data.mobile_number || "",
        profile_picture_url: data.profile_picture_url || "",
      });
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("first_name", profile.first_name);
      formData.append("last_name", profile.last_name);
      if (profile.middle_name) formData.append("middle_name", profile.middle_name);
      if (profile.suffix) formData.append("suffix", profile.suffix);
      formData.append("email", profile.email);
      formData.append("phone_number", profile.mobile_number); 

      if (selectedFile) {
        formData.append("profile_picture", selectedFile);
      }

      await travelApi.updateProfile(formData);
      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile updates.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-bg border border-theme-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-theme-text animate-in fade-in zoom-in duration-200 h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-theme-surface flex justify-between items-center bg-theme-surface/50 shrink-0">
          <h2 className="text-lg font-bold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center items-center flex-1">
            <Loader2 className="animate-spin text-theme-primary" size={32} />
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1">
            {/* Image Upload Section */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-full border-2 border-theme-surface overflow-hidden bg-theme-surface flex items-center justify-center relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile.profile_picture_url ? (
                  <img
                    src={
                      profile.profile_picture_url.startsWith("http")
                        ? profile.profile_picture_url
                        : `${API_BASE_URL}${profile.profile_picture_url}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-theme-muted" />
                )}

                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={20} className="text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-theme-primary hover:text-theme-secondary font-bold"
              >
                Change Picture
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-muted ml-1 mb-1 block">
                  First Name
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-theme-surface border border-theme-surface focus:border-theme-primary outline-none text-sm text-theme-text"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-muted ml-1 mb-1 block">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-theme-surface border border-theme-surface focus:border-theme-primary outline-none text-sm text-theme-text"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-muted ml-1 mb-1 block">
                  Middle Name <span className="text-[8px] opacity-50">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.middle_name}
                  onChange={(e) => setProfile({ ...profile, middle_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-theme-surface border border-theme-surface focus:border-theme-primary outline-none text-sm text-theme-text"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-muted ml-1 mb-1 block">
                  Suffix <span className="text-[8px] opacity-50">(Optional)</span>
                </label>
                <select
                  value={profile.suffix}
                  onChange={(e) => setProfile({ ...profile, suffix: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-theme-surface border border-theme-surface focus:border-theme-primary outline-none text-sm text-theme-text appearance-none"
                >
                  <option value="">None</option>
                  {SUFFIXES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-muted ml-1 mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-theme-surface border border-theme-surface focus:border-theme-primary outline-none text-sm text-theme-text"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-[0.1em] uppercase text-theme-muted ml-1 mb-1 block">
                Mobile Number
              </label>
              <input
                type="tel"
                value={profile.mobile_number}
                onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-theme-surface border border-theme-surface focus:border-theme-primary outline-none text-sm text-theme-text"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-theme-surface bg-theme-bg shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full p-3 rounded-xl bg-theme-primary hover:bg-theme-secondary text-theme-bg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-md"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "SAVING..." : "SAVE PROFILE"}
          </button>
        </div>
      </div>
    </div>
  );
}