"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle, User, CreditCard, X } from "lucide-react";
import { travelApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

function CheckoutFormInner({ flightOffer, pricedData, grandTotal, travelers, setTravelers, onSuccess, onCancel }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState<"FORM" | "PROCESSING" | "SUCCESS" | "ERROR">("FORM");
  const [errorMsg, setErrorMsg] = useState("");
  const [pnr, setPnr] = useState("");

  const updateTraveler = (index: number, field: string, value: string) => {
    const newTravelers = [...travelers];
    newTravelers[index][field] = value;
    setTravelers(newTravelers);
  };

  const handleCheckoutSubmit = async () => {
    if (!stripe || !elements) return;
    setStep("PROCESSING");
    setErrorMsg("");

    try {
      const { client_secret } = await travelApi.createPaymentIntent(grandTotal, "USD");
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const paymentResult = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${travelers[0].firstName} ${travelers[0].lastName}`,
            email: travelers[0].email,
          },
        },
      });

      if (paymentResult.error) throw new Error(paymentResult.error.message || "Payment declined.");

      const formattedTravelers = travelers.map((t: any) => ({
        id: t.id,
        dateOfBirth: t.dob,
        name: { firstName: t.firstName.toUpperCase(), lastName: t.lastName.toUpperCase() },
        gender: t.gender,
        contact: {
          emailAddress: t.email || travelers[0].email, // Fallback to primary email if omitted
          phones: [{ deviceType: "MOBILE", countryCallingCode: "1", number: (t.phone || travelers[0].phone).replace(/\D/g,'') }]
        }
      }));

      const bookingRes = await travelApi.bookFlight(pricedData.priced_offer, formattedTravelers);
      if (bookingRes.error) throw new Error(bookingRes.error);
      
      setPnr(bookingRes.pnr);
      setStep("SUCCESS");
      if (onSuccess) onSuccess(bookingRes.pnr);

    } catch (err: any) {
      setErrorMsg(err.message || err.error || "An error occurred during checkout.");
      setStep("ERROR");
    }
  };

  const CARD_OPTIONS = {
    style: {
      base: {
        iconColor: '#F97316',
        color: '#012C23',
        fontWeight: '900',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontSmoothing: 'antialiased',
        '::placeholder': { color: '#64748B' },
      },
      invalid: { iconColor: '#DC2626', color: '#DC2626' },
    },
  };

  if (step === "PROCESSING") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-theme-cool-white">
        <Loader2 size={32} className="text-theme-primary animate-spin" />
        <p className="text-[11px] font-black uppercase tracking-widest text-theme-secondary/60 text-center px-4">
          Processing Payment securely... <br/> <span className="opacity-50">Please do not close this window.</span>
        </p>
      </div>
    );
  }

  if (step === "ERROR") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 bg-theme-error/10 p-8">
        <AlertCircle size={48} className="text-theme-error mb-2" />
        <p className="font-bold text-base text-theme-secondary">{errorMsg}</p>
        <div className="flex gap-4 mt-6">
          <button onClick={onCancel} className="text-[11px] font-black uppercase tracking-widest text-theme-secondary border border-theme-soft-slate bg-theme-white px-8 py-4 rounded-xl hover:bg-theme-soft-slate/50 transition-colors shadow-sm">Cancel</button>
          <button onClick={() => setStep("FORM")} className="text-[11px] font-black uppercase tracking-widest text-theme-white border border-theme-primary bg-theme-primary px-8 py-4 rounded-xl hover:bg-theme-primary/90 transition-colors shadow-md">Try Again</button>
        </div>
      </div>
    );
  }

  let adultCount = 0;
  let childCount = 0;

  // Validation: Primary Adult needs everything. Others just need Name/DOB.
  const isFormValid = travelers.every((t: any, i: number) => {
    const basicValid = t.firstName && t.lastName && t.dob;
    if (i === 0) return basicValid && t.email && t.phone;
    return basicValid;
  });

  const inputClass = "w-full px-5 py-4 rounded-xl border border-theme-soft-slate bg-theme-white text-theme-secondary text-sm font-black placeholder:text-theme-light-gray/70 focus:outline-none focus:border-theme-primary focus:ring-4 focus:ring-theme-primary/10 transition-all shadow-sm";

  return (
    <div className="flex flex-col h-full bg-theme-cool-white/50 min-h-0">
      
      {/* Scrollable Form Area */}
      <div className="p-6 sm:p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
        {travelers.map((t: any, i: number) => {
          const isAdult = t.type !== "CHILD" && t.type !== "HELD_INFANT";
          if (isAdult) adultCount++; else childCount++;
          const label = isAdult ? `Adult ${adultCount}` : `Child ${childCount}`;

          return (
            <div key={i} className="space-y-5 pb-8 border-b border-theme-soft-slate last:border-0 last:pb-0">
              <h5 className="font-black text-[12px] uppercase tracking-widest text-theme-secondary flex items-center gap-2">
                <User size={16} className="text-theme-primary" /> {label}
                {i === 0 && <span className="ml-2 text-[9px] bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-md">Primary</span>}
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" value={t.firstName} onChange={(e) => updateTraveler(i, "firstName", e.target.value)} className={inputClass} />
                <input type="text" placeholder="Last Name" value={t.lastName} onChange={(e) => updateTraveler(i, "lastName", e.target.value)} className={inputClass} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="date" value={t.dob} onChange={(e) => updateTraveler(i, "dob", e.target.value)} className={inputClass} />
                <select value={t.gender} onChange={(e) => updateTraveler(i, "gender", e.target.value)} className={`${inputClass} cursor-pointer`}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              
              {/* Show Contact Info for ALL Adults */}
              {isAdult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="email" placeholder={`email (optional) ${i > 0 ? '(Optional)' : ''}`} value={t.email} onChange={(e) => updateTraveler(i, "email", e.target.value)} className={inputClass} />
                  <input type="tel" placeholder={`phone (optional) ${i > 0 ? '(Optional)' : ''}`} value={t.phone} onChange={(e) => updateTraveler(i, "phone", e.target.value)} className={inputClass} />
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-2">
          <h5 className="font-black text-[12px] uppercase tracking-widest text-theme-secondary flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-theme-primary" /> Payment Details
          </h5>
          <div className="p-5 rounded-xl border border-theme-soft-slate bg-theme-white shadow-sm focus-within:ring-4 focus-within:ring-theme-primary/10 transition-all focus-within:border-theme-primary">
            <CardElement options={CARD_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex gap-4 p-5 sm:p-6 border-t border-theme-soft-slate bg-theme-white shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={onCancel} 
          className="px-8 py-4 bg-theme-white text-theme-secondary font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-soft-slate/30 transition-all border border-theme-soft-slate flex items-center justify-center active:scale-95 shadow-sm"
        >
          Cancel
        </button>
        <button 
          onClick={handleCheckoutSubmit} 
          disabled={!isFormValid || !stripe} 
          className="flex-1 py-4 bg-theme-primary text-theme-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ShieldCheck size={18} /> Pay ${grandTotal.toFixed(2)} & Book
        </button>
      </div>
    </div>
  );
}

export default function FlightCheckout({ flightOffer, grandTotal, onSuccess, onPriceConfirmed, onExpandedChange }: any) {
  const { isLoggedIn } = useAuth();
  const [step, setStep] = useState<"IDLE" | "PRICING" | "READY" | "ERROR">("IDLE");
  const [pricedData, setPricedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Read exact Adult/Child composition from Amadeus API directly
  const travelerPricings = flightOffer.raw_offer_data?.travelerPricings || [];
  
  const [travelers, setTravelers] = useState<any[]>(() => {
    if (travelerPricings.length > 0) {
      return travelerPricings.map((tp: any, i: number) => ({
        id: tp.travelerId || String(i + 1), 
        type: tp.travelerType || "ADULT", // Maps exactly to ADULT, CHILD, etc.
        firstName: "", lastName: "", dob: "", gender: "MALE", email: "", phone: ""
      }));
    }
    // Fallback if Amadeus data is malformed
    return [{ id: "1", type: "ADULT", firstName: "", lastName: "", dob: "", gender: "MALE", email: "", phone: "" }];
  });

  // Inform parent modal when form expands to take over full screen
  useEffect(() => {
    if (onExpandedChange) onExpandedChange(step !== "IDLE");
  }, [step, onExpandedChange]);

  // Pre-fill Primary User if logged in
  useEffect(() => {
    if (isLoggedIn) {
      travelApi.getProfile()
        .then((profile) => {
          setTravelers((prev: any[]) => {
            const newTravelers = [...prev];
            newTravelers[0] = {
              ...newTravelers[0],
              firstName: profile.first_name || newTravelers[0].firstName,
              lastName: profile.last_name || newTravelers[0].lastName,
              email: profile.email || newTravelers[0].email,
              phone: profile.phone_number || newTravelers[0].phone,
              gender: profile.gender === "FEMALE" ? "FEMALE" : "MALE", 
              dob: profile.date_of_birth || newTravelers[0].dob,
            };
            return newTravelers;
          });
        })
        .catch((err) => console.error("Failed to fetch profile", err));
    }
  }, [isLoggedIn]);

  const handlePriceCheck = async () => {
    setStep("PRICING");
    try {
      const payloadToPrice = flightOffer.raw_offer_data; 
      if (!payloadToPrice) throw new Error("Missing raw airline data.");

      const res = await travelApi.confirmFlightPrice(payloadToPrice);
      if (res.error) throw new Error(res.error);
      
      setPricedData(res);
      if (onPriceConfirmed) {
        onPriceConfirmed(Number(res.priced_offer.price.total), Number(res.priced_offer.price.totalTaxes || 0));
      }
      setStep("READY");
    } catch (err: any) {
      setErrorMsg(err.message || err.error || "Failed to confirm fare. It may have expired.");
      setStep("ERROR");
    }
  };

  const handleCancel = () => setStep("IDLE");

  // Initial Closed View (Replaces Sticky Footer on Right Panel)
  if (step === "IDLE") {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <div className="text-center sm:text-left flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-theme-light-gray font-black mb-0.5">Total Due Now</span>
          <span className="text-3xl font-black text-theme-secondary leading-none">${grandTotal.toFixed(2)}</span>
        </div>
        <button onClick={handlePriceCheck} className="px-8 py-4 bg-theme-primary text-theme-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-lg active:scale-95 w-full sm:w-auto">
          Confirm Fares
        </button>
      </div>
    );
  }

  // Full Screen Overlays (Pricing Loading / Error / Form)
  return (
    <Elements stripe={stripePromise}>
      <div className="w-full h-full flex flex-col bg-theme-white overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Full Screen Header */}
        <div className="p-5 sm:p-6 bg-theme-cool-white border-b border-theme-soft-slate flex justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-2 text-theme-secondary">
            <ShieldCheck size={20} className="text-theme-primary" />
            <span className="font-black text-[12px] uppercase tracking-widest hidden sm:block">Fares Confirmed & Locked</span>
            <span className="font-black text-[12px] uppercase tracking-widest sm:hidden">Fares Locked</span>
          </div>
          <p className="font-black text-2xl text-theme-secondary">
            ${grandTotal.toFixed(2)}
          </p>
        </div>

        {/* Dynamic Form Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-theme-white">
          {step === "PRICING" ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-theme-white">
              <Loader2 size={32} className="text-theme-primary animate-spin" />
              <p className="text-[11px] font-black uppercase tracking-widest text-theme-secondary/60">Confirming live fare with airline...</p>
            </div>
          ) : (
            <CheckoutFormInner 
              flightOffer={flightOffer} 
              pricedData={pricedData}
              grandTotal={grandTotal} 
              travelers={travelers} 
              setTravelers={setTravelers} 
              onSuccess={onSuccess} 
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </Elements>
  );
}