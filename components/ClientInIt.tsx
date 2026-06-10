"use client";

import { useEffect } from "react";
import { normalizeStateName } from "@/constants/states"; // Adjust import path as needed

export const COOKIE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

// Helper to determine if a state is an SOT state. 
export const isSOTState = (stateCode: string | null) => {
  if (!stateCode) return false;
  const sotStates = ["CA", "FL", "HI", "WA", "California", "Florida", "Hawaii", "Washington"];
  return sotStates.includes(stateCode);
};

export default function ClientInit() {
  useEffect(() => {
    // 1. Platform Detection
    const detectPlatform = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet";
      if (/Mobile|iP(hone|od)|Android|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "mobile";
      return "pc";
    };

    localStorage.setItem("app_platform", detectPlatform());

    // 2. Location Detection (GPS -> IP)
    const determineLocation = async (gpsData?: any) => {
      const manualOverride = localStorage.getItem("manual_resident_state");
      const storedState = localStorage.getItem("user_residence_state");
      const storedTimestamp = localStorage.getItem("user_residence_timestamp");
      const now = Date.now();

      // Skip fetch if there is a manual override OR a fresh 7-day automated state
      if (manualOverride) return;
      if (storedState && storedTimestamp && now - parseInt(storedTimestamp, 10) < COOKIE_EXPIRY_MS) return;

      let finalState = null;
      let finalCountry = null;

      // Attempt A: Use Reverse Geocoding if GPS data is available
      if (gpsData) {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${gpsData.lat}&longitude=${gpsData.lon}&localityLanguage=en`);
          const data = await res.json();
          if (data.principalSubdivisionCode) {
            // Splits "US-CA" to "CA"
            finalState = data.principalSubdivisionCode.split("-").pop(); 
            finalCountry = data.countryCode;
          }
        } catch (e) {
          console.warn("Reverse geocoding failed, falling back to IP:", e);
        }
      }

      // Attempt B: Fallback to IP Geolocation if GPS failed
      if (!finalState) {
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
          if (data.region_code) {
            finalState = data.region_code;
            finalCountry = data.country_code;
          }
        } catch (e) {
          console.warn("IP Geolocation failed:", e);
        }
      }

      // Format to Full Name, Save, and Dispatch
      if (finalState) {
        const fullStateName = normalizeStateName(finalState);
        localStorage.setItem("user_residence_state", fullStateName);
        localStorage.setItem("user_residence_country", finalCountry || "US");
        localStorage.setItem("user_residence_timestamp", Date.now().toString());
        window.dispatchEvent(new Event("user_residence_changed")); // Matches hook event name
      }
    };

    // 3. Initialize GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsData = { lat: position.coords.latitude, lon: position.coords.longitude };
          determineLocation(gpsData);
        },
        (error) => {
          console.warn("Could not get GPS location:", error.message);
          determineLocation();
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      determineLocation();
    }
  }, []);

  return null;
}