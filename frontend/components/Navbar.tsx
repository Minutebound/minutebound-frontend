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
                  <div className="absolute z-120 right-0 top-[100%] mt-0 w-64 bg-theme-white rounded-b-2xl rounded-t-none shadow-2xl border border-t-0 border-theme-surface py-2 z-120 animate-in slide-in-from-top-2 fade-in duration-200">
                    
                    {/* TRAVEL ID SECTION (Inside Dropdown) */}
                    <div className="px-4 py-3 mb-1 border-b border-theme-surface bg-theme-surface/20">
                      <div className="overflow-hidden">
                        <p className="font-bold text-theme-primary truncate leading-tight mt-0.5" title={profileData?.unique_travel_id}>
                         Travel ID: {profileData?.unique_travel_id || "Loading..."}
                        </p>
                      </div>
                    </div>

                    {!isHomePage && (
                      <Link
                        href="/"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-theme-secondary hover:bg-theme-surface font-bold transition-colors"
                      >
                        <Home size={16} className="text-theme-primary" />
                        Home
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-theme-secondary hover:bg-theme-surface font-bold transition-colors"
                    >
                      <UserIcon size={16} className="text-theme-primary" />
                      Profile Settings
                    </Link>
                    <Link
                      href="/savedtrips"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-theme-secondary hover:bg-theme-surface font-bold transition-colors"
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
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-bold transition-colors text-left"
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
        <div className="absolute top-full right-0 w-full bg-theme-white border-b border-theme-secondary/10 shadow-xl lg:hidden flex flex-col z-120 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col p-2">
            {!isHomePage && (
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-theme-secondary hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
              >
                <Home size={24} className="text-theme-primary" />
                Home
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-theme-secondary hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
                >
                  <UserIcon size={24} className="text-theme-primary" />
                  Profile Settings
                </Link>
                <Link
                  href="/savedtrips"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-4 text-theme-secondary hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
                >
                  <Bookmark size={24} className="text-theme-primary" />
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
                  <LogOut size={24} className="text-red-500" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-4 text-theme-secondary hover:bg-theme-surface font-bold transition-colors rounded-xl mx-2"
              >
                <UserIcon size={24} className="text-theme-primary" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}