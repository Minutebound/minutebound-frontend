"use client";

import { useState, useEffect, useCallback } from "react";
import { normalizeStateName } from "@/constants/states"; // Adjust import path

export const COOKIE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

export function useUserResidence() {
  const [residenceState, setResidenceState] = useState<string>("");

  const checkAndLoadResidence = useCallback(() => {
    const storedState = localStorage.getItem("user_residence_state");
    const storedTimestamp = localStorage.getItem("user_residence_timestamp");
    const manualOverride = localStorage.getItem("manual_resident_state");
    const now = Date.now();

    // Manual override takes absolute priority
    if (manualOverride) {
      setResidenceState(manualOverride);
      return;
    }

    // Check if automated state exists and is fresh
    if (storedState && storedTimestamp && now - parseInt(storedTimestamp, 10) < COOKIE_EXPIRY_MS) {
      setResidenceState(storedState);
    } else {
      setResidenceState("");
    }
  }, []);

  useEffect(() => {
    checkAndLoadResidence();
    window.addEventListener("user_residence_changed", checkAndLoadResidence);
    window.addEventListener("storage", checkAndLoadResidence);

    return () => {
      window.removeEventListener("user_residence_changed", checkAndLoadResidence);
      window.removeEventListener("storage", checkAndLoadResidence);
    };
  }, [checkAndLoadResidence]);

  const updateResidence = (newState: string, isManual: boolean = true) => {
    if (!newState) return;
    
    // Extract state if passed as "City, State"
    const parts = newState.split(",");
    const rawState = parts.length > 1 ? parts[1].trim() : newState.trim();
    
    // Guarantee it is the full state name
    const finalState = normalizeStateName(rawState);

    if (isManual) {
      localStorage.setItem("manual_resident_state", finalState);
    } else {
      localStorage.removeItem("manual_resident_state");
    }

    localStorage.setItem("user_residence_state", finalState);
    localStorage.setItem("user_residence_timestamp", Date.now().toString());
    
    setResidenceState(finalState);
    window.dispatchEvent(new Event("user_residence_changed"));
  };

  const clearResidence = () => {
    localStorage.removeItem("manual_resident_state");
    localStorage.removeItem("user_residence_state");
    localStorage.removeItem("user_residence_timestamp");
    
    setResidenceState("");
    window.dispatchEvent(new Event("user_residence_changed"));
  };

  return { residenceState, updateResidence, clearResidence };
}