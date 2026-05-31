"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Bookmark,
  Home,
  Ticket,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { travelApi } from "../services/api";

interface NavbarProps {
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

const MinuteboundLogo = ({ className = "" }: { className?: string }) => (
  <>
    {/* Mobile & Tablet Logo (Icon + Text, Less Wide Smile, Min Height) */}
    <svg viewBox="0 20 1600 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} lg:hidden`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
          .logo-text {
            font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont;
            font-size: 170px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <text x="320" y="150" className="logo-text" textAnchor="start">
        <tspan className="font-bold fill-[#012C23]">Minute</tspan>
        <tspan className="font-bold fill-[#012C23]">Bound</tspan>
        <tspan className="font-bold fill-[#F97316]">USA</tspan>
      </text>
      <rect x="0" y="0" width="300" height="350" fill="" rx="20" ry="20" transform="rotate(-10 70 140)" />
      <g transform="translate(20,-30) scale(1)">
        <path
          d="M 20 160 C 100 40, 90 40, 120 120"
          className="fill-[#012C23]"
        />
        <path
          d="M 120 120 C 180 20, 180 20, 200 140"
          className="fill-[#012C23]"
        />  
      </g>

      <g transform="translate(-310,10) scale(0.8)"> 
      <path 
          d="M 420 170 Q 550 240 680 170" 
          className="text-[#012C23]"
          stroke="currentColor"
          fill="none"
          strokeWidth="14" 
          strokeLinecap="round"
        />
      </g>
    </svg>

     {/* Desktop Logo (Icon + Text) */}
    <svg viewBox="10 20 1600 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} hidden lg:block`}>
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap');
          .logo-text {
            font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont;
            font-size: 150px;
            letter-spacing: -0.01em;
          }
        `}</style>
      </defs>
      <text x="350" y="160" className="logo-text" textAnchor="start">
        <tspan className="font-bold fill-[#012C23]">Minute</tspan>
        <tspan className="font-bold fill-[#012C23]">Bound</tspan>
        <tspan className="font-bold fill-[#F97316]">USA</tspan>
      </text>
      <rect x="0" y="0" width="300" height="300" fill="" rx="20" ry="20" transform="rotate(-10 70 140)" />
      <g transform="translate(10,-30) scale(1.2)">
        <path
          d="M 20 160 C 100 40, 90 40, 120 120"
          className="fill-[#012C23]"
        />
        <path
          d="M 120 120 C 180 20, 180 20, 200 140"
          className="fill-[#012C23]"
        />  
      </g>

      <g transform="translate(-410,10)"> 
      <path 
          d="M 420 170 Q 550 240 680 170" 
          className="text-[#012C23]"
          stroke="currentColor"
          fill="none"
          strokeWidth="14" 
          strokeLinecap="round"
        />
      </g>
    </svg>
  </>
);

export default function Navbar({
  onMenuClick = () => {},
  menuOpen = false,
}: NavbarProps) {
  const { user, email, logout, isLoggedIn } = useAuth() as any;
  const pathname = usePathname();
  const stickyRoutes = ['/', '/destinations'];
  const isSticky = stickyRoutes.includes(pathname);
  const isHomePage = pathname === '/';

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
<nav className={`${isSticky ? "sticky top-0 shadow-md" : "relative"} z-[120] bg-theme-white`}>      
  <div className="w-full lg:w-[85%] mx-auto flex items-center justify-between px-4 md:px-6 text-theme-secondary relative transition-all duration-300 h-[60px]">
        {/* LEFT SECTION - Logo */}
        <div className="flex items-center flex-shrink-0 h-full">
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

        {/* RIGHT SECTION - Profile Dropdown & Mobile Menu Button */}
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
                  className="cursor-pointer flex items-center gap-3 px-4 h-full border-b-[3px] border-transparent hover:border-theme-primary transition-colors active:bg-theme-surface/60 text-theme-secondary"
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
                      <UserIcon size={24} className="text-theme-primary" />
                    </div>
                  )}

                  <span className="text-theme-secondary font-bold hidden sm:block max-w-[124px] truncate">
                    {displayName}
                  </span>
                </button>

                {isDropdownOpen && (
                  /* INVISIBLE BRIDGE WRAPPER: pt-1.5 creates a safe hover zone */
                  <div className="absolute right-0 top-[100%] w-[280px] pt-1.5 z-[120]">
                    
                    {/* VISIBLE DROPDOWN CARD */}
                    <div className="bg-theme-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-theme-secondary/10 py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                      
                      {/* User Profile Header */}
                      <div className="px-4 py-3.5 mb-2 mx-2 border border-theme-secondary/10 bg-theme-secondary/5 flex flex-col gap-0.5 rounded-xl">
                        <p className="font-bold text-[12px] text-theme-primary uppercase tracking-widest truncate mt-0.5" title={profileData?.unique_travel_id}>
                          Travel ID: {profileData?.unique_travel_id || "Loading..."}
                        </p>
                      </div>

                      <div className="flex flex-col px-2 gap-1">
                        {!isHomePage && (
                          <Link
                            href="/"
                            onClick={() => setIsDropdownOpen(false)}
                            className="group flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold tracking-wide text-theme-secondary/80 hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                          >
                            <Home size={18} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                            Home
                          </Link>
                        )}

                        <Link
                          href="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="group flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold tracking-wide text-theme-secondary/80 hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                        >
                          <UserIcon size={18} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                          Profile Settings
                        </Link>

                        <Link
                          href="/bookings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="group flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold tracking-wide text-theme-secondary/80 hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                        >
                          <Ticket size={18} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                          My Bookings
                        </Link>

                        <Link
                          href="/savedItineraries"
                          onClick={() => setIsDropdownOpen(false)}
                          className="group flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold tracking-wide text-theme-secondary/80 hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                        >
                          <Bookmark size={18} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                          Saved Itineraries
                        </Link>
                      </div>

                      <div className="h-[1px] bg-theme-secondary/10 my-2 mx-4"></div>

                      <div className="px-2">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            logout();
                          }}
                          className="group w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-bold tracking-wide text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-left"
                        >
                          <LogOut size={18} className="text-red-400 group-hover:text-red-500 transition-colors" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center h-full px-2">
                <Link
                  href="/auth"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-theme-primary text-theme-white rounded-lg hover:bg-theme-secondary transition-all shadow-md text-sm font-black active:scale-95"
                >
                  <UserIcon size={16} />
                  <span className="hidden sm:inline">Login / Sign Up</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle - Visible only on Mobile/Tablet (lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="cursor-pointer rounded-lg bg-theme-surface text-theme-secondary lg:hidden hover:bg-theme-surface/80 transition-all duration-300 shadow-sm active:scale-95 border border-theme-surface p-1.5"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION MENU */}
      {isMobileMenuOpen && (
        <div className="absolute top-full right-0 w-full bg-theme-white border-b border-theme-secondary/10 shadow-2xl lg:hidden flex flex-col z-[120] animate-in slide-in-from-top-2 duration-200">
          
          {/* Mobile User Header (Shows if Logged In) */}
          {isLoggedIn && (
            <div className="px-6 py-5 border-b border-theme-secondary/10 bg-theme-secondary/5 flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl.startsWith("http") ? avatarUrl : `${API_BASE_URL}${avatarUrl}`}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover border-2 border-theme-white shadow-md"
                />
              ) : (
                <div className="bg-theme-primary/10 p-3 rounded-full shadow-inner">
                  <UserIcon size={28} className="text-theme-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-[18px] text-theme-secondary leading-tight">{displayName}</span>
                <span className="font-bold text-[11px] text-theme-primary uppercase tracking-widest mt-1 truncate">
                  ID: {profileData?.unique_travel_id || "..."}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col p-4 gap-1.5">
            {!isHomePage && (
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center gap-4 px-4 py-3.5 text-[16px] font-bold tracking-wide text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
              >
                <Home size={22} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                Home
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center gap-4 px-4 py-3.5 text-[16px] font-bold tracking-wide text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                >
                  <UserIcon size={22} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                  Profile Settings
                </Link>

                <Link
                  href="/bookings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center gap-4 px-4 py-3.5 text-[16px] font-bold tracking-wide text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                >
                  <Ticket size={22} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                  My Bookings
                </Link>

                <Link
                  href="/savedItineraries"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center gap-4 px-4 py-3.5 text-[16px] font-bold tracking-wide text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
                >
                  <Bookmark size={22} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                  Saved Itineraries
                </Link>

                <div className="h-[1px] bg-theme-secondary/10 my-3 mx-4"></div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="group w-full flex items-center gap-4 px-4 py-3.5 text-[16px] font-bold tracking-wide text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-left"
                >
                  <LogOut size={22} className="text-red-400 group-hover:text-red-500 transition-colors" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center gap-4 px-4 py-3.5 text-[16px] font-bold tracking-wide text-theme-secondary hover:text-theme-primary hover:bg-theme-secondary/5 rounded-xl transition-all"
              >
                <UserIcon size={22} className="text-theme-secondary/50 group-hover:text-theme-primary transition-colors" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}