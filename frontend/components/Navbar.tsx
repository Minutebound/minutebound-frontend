"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Map,
  X,
  LogOut,
  User as UserIcon,
  Bookmark,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { travelApi } from "../services/api"; // Added API import to fetch profile

interface NavbarProps {
  onMenuClick?: () => void;
  mapOpen?: boolean;
  onMapToggle?: () => void;
  menuOpen?: boolean;
}

const MinuteboundLogo = ({ className = "" }: { className?: string }) => (
  <>
    {/* Mobile & Tablet Logo (Icon + Text, Less Wide Smile, Min Height) */}
    <svg viewBox="0 20 1400 170" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} lg:hidden`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          .logo-text-mobile {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont;
            font-size: 140px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <g transform="translate(580, -30)">
        <path
          d="M 20 160 C 100 40, 90 40, 120 120"
          className="fill-[#00C950]"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 120 120 C 180 20, 180 20, 200 140"
          className="fill-[#00C950]"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />  
      </g>

      <text x="200" y="130" className="logo-text-mobile" textAnchor="start">
        <tspan className="font-bold fill-[#102942]">Minute</tspan>
        <tspan className="font-bold fill-[#102942]">Bound</tspan>
      </text>

      <g transform="translate(140, -20)"> 
        <path 
          d="M 420 170 Q 550 230 680 170" 
          className="text-[#102942]"
          stroke="currentColor"
          fill="none"
          strokeWidth="8" 
          strokeLinecap="round"
        />
      </g>
    </svg>

    {/* Desktop Logo (Icon + Text) */}
    <svg viewBox="0 20 1300 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} hidden lg:block`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
          .logo-text {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont;
            font-size: 130px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <text x="20" y="140" className="logo-text" textAnchor="start">
        <tspan className="font-bold fill-[#102942]">MINUTE</tspan>
        </text>
      <g transform="translate(550,-30)">
        <path
          d="M 20 160 C 100 40, 90 40, 120 120"
          className="fill-[#00C950]"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 120 120 C 180 20, 180 20, 200 140"
          className="fill-[#00C950]"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />  
      </g>

      <text x="800" y="140" className="logo-text" textAnchor="start">
        <tspan className="font-bold fill-[#102942]">BOUND</tspan>
      </text>

      <g transform="translate(110, -20)"> 
        <path 
          d="M 420 170 Q 550 230 680 170" 
          className="text-[#102942]"
          stroke="currentColor"
          fill="none"
          strokeWidth="8" 
          strokeLinecap="round"
        />
      </g>
    </svg>
  </>
);

export default function Navbar({
  onMenuClick = () => {},
  mapOpen = false,
  onMapToggle = () => {},
  menuOpen = false,
}: NavbarProps) {
  const { user, email, logout, isLoggedIn } = useAuth() as any;
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Desktop Profile Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Fetch real profile data so avatar and name are guaranteed to exist
  useEffect(() => {
    if (isLoggedIn) {
      travelApi.getProfile()
        .then((data) => setProfileData(data))
        .catch((err) => console.error("Navbar failed to load profile", err));
    } else {
      setProfileData(null);
    }
  }, [isLoggedIn]);

  // Safe variables for display
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
  const avatarUrl = profileData?.profile_picture_url;
  const displayName = profileData?.full_name || (typeof user === 'string' ? user : user?.name) || "Traveler";
  const displayEmail = profileData?.email || email || "";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="relative sticky top-0 w-full flex-shrink-0 z-[999]">
      <div 
        className="w-full flex items-center justify-between px-4 md:px-6 bg-theme-bg text-theme-text shadow-sm border-b border-theme-text/10 relative z-[999] transition-all duration-300 h-[60px]"
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0 h-full">
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="cursor-pointer rounded-lg bg-theme-surface text-theme-text lg:hidden hover:bg-theme-surface/80 transition-all duration-300 shadow-sm active:scale-95 border border-theme-surface p-1.5"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <MinuteboundLogo 
              className="w-auto transition-all duration-300 h-6 sm:h-7 md:h-8" 
            />
          </Link>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0 h-full">
          
          {/* Profile/Auth Container - Hidden on Mobile/Tablet (lg) */}
          <div className="hidden lg:flex items-stretch h-full">
            {isLoggedIn ? (
              <div 
                className="relative flex items-stretch h-full"
                ref={dropdownRef}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {/* FULL-HEIGHT BUTTON */}
                <button
                  className="cursor-pointer flex items-center gap-3 px-4 h-full border-b-[3px] border-transparent hover:border-theme-primary hover:bg-theme-surface/40 transition-colors active:bg-theme-surface/60 text-theme-text"
                >
                  {/* Profile Picture or Fallback Icon */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl.startsWith("http") ? avatarUrl : `${API_BASE_URL}${avatarUrl}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-theme-surface shadow-sm"
                    />
                  ) : (
                    <div className="bg-theme-primary/10 p-1.5 rounded-full">
                      <UserIcon size={16} className="text-theme-primary" />
                    </div>
                  )}

                  <span className="text-sm font-bold hidden sm:block max-w-[120px] truncate">
                    {displayName}
                  </span>
                </button>

                {isDropdownOpen && (
                  /* DROPDOWN PANEL: 
                    rounded-t-none makes the top completely flat/flush with the navbar.
                    border-t-0 removes the top line so it merges nicely.
                  */
                  <div className="absolute right-0 top-[100%] mt-0 w-64 bg-theme-bg rounded-b-2xl rounded-t-none shadow-2xl border border-t-0 border-theme-surface py-2 z-[1000] animate-in slide-in-from-top-2 fade-in duration-200">
                    
                    {/* AVATAR + SIGNED IN AS SECTION (Inside Dropdown) */}
                    <div className="px-4 py-3 mb-1 border-b border-theme-surface bg-theme-surface/20 flex items-center gap-3">
                      
                      {avatarUrl ? (
                        <img
                          src={avatarUrl.startsWith("http") ? avatarUrl : `${API_BASE_URL}${avatarUrl}`}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border border-theme-surface shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="bg-theme-primary/10 p-2 rounded-full shrink-0">
                          <UserIcon size={20} className="text-theme-primary" />
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest leading-tight">Signed in as</p>
                        <p className="text-sm font-bold text-theme-text truncate leading-tight mt-0.5" title={displayName}>
                          {displayName}
                        </p>
                        {displayEmail && displayEmail !== displayName && (
                          <p className="text-xs font-medium text-theme-muted truncate leading-tight" title={displayEmail}>
                            {displayEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isHomePage && (
                      <Link
                        href="/"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                      >
                        <Home size={16} className="text-theme-primary" />
                        Home
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                    >
                      <UserIcon size={16} className="text-theme-primary" />
                      Profile
                    </Link>
                    <Link
                      href="/savedtrips"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-theme-text hover:bg-theme-surface font-bold transition-colors"
                    >
                      <Bookmark size={16} className="text-theme-primary" />
                      Saved Itineraries
                    </Link>

                    <div className="h-px bg-theme-surface my-1.5 mx-3"></div>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors text-left"
                    >
                      <LogOut size={16} className="text-red-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center h-full px-2">
                <Link
                  href="/auth"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-theme-primary text-theme-bg rounded-lg hover:bg-theme-secondary transition-all shadow-md text-sm font-black active:scale-95"
                >
                  <UserIcon size={16} />
                  <span className="hidden sm:inline">Login / Sign Up</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </div>
            )}
          </div>

          {/* Map Toggle - Visible only on Mobile/Tablet (lg) */}
          {!isHomePage && (
            <button
              onClick={onMapToggle}
              className="cursor-pointer p-1.5 rounded-lg bg-theme-text text-theme-bg hover:bg-theme-muted/20 border border-theme-surface transition-colors shadow-sm lg:hidden active:scale-95"
              aria-label={mapOpen ? "Close map" : "Toggle map"}
            >
              {mapOpen ? <X size={20} /> : <Map size={20} className="text-theme-primary" />}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE NAVIGATION MENU */}
      {isMobileMenuOpen && (
        <div className="absolute top-full right-0 w-full bg-theme-bg border-b border-theme-text/10 shadow-xl lg:hidden flex flex-col z-[1000] animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-2">
            {!isHomePage && (
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
              >
                <Home size={20} className="text-theme-primary" />
                Home
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
                >
                  <UserIcon size={20} className="text-theme-primary" />
                  Profile
                </Link>
                <Link
                  href="/savedtrips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
                >
                  <Bookmark size={20} className="text-theme-primary" />
                  Saved Itineraries
                </Link>

                <div className="h-px bg-theme-surface my-2 mx-4"></div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="cursor-pointer flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 font-bold transition-colors text-left rounded-xl mx-2"
                >
                  <LogOut size={20} className="text-red-500" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-theme-text hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
              >
                <UserIcon size={20} className="text-theme-primary" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}