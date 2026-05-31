"use client";

import React, { useState } from "react";
import { Loader2, ShieldCheck, CreditCard, Lock, CheckCircle2, AlertCircle, User } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { travelApi } from "@/services/api";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock");

interface CheckoutProps {
  flightOffer?: any;
  stay?: any;
  tours?: any[];
  rawParams?: any;
  grandTotal: number;
  onPriceConfirmed: (total: number, taxes: number) => void;
  onExpandedChange: (expanded: boolean) => void;
  onStepChange: (step: string) => void;
  onSuccess: (pnr: string) => void;
}

const PaymentForm = ({ clientSecret, flightOffer, grandTotal, onSuccess, onError }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Extract exact passengers from Duffel, or fallback if none
  const duffelPassengers = flightOffer?.raw_offer_data?.passengers || [{ id: "pt_1", type: "adult" }];
  
  // Dynamic Passenger State pre-filled for faster testing
  const [passengers, setPassengers] = useState(
    duffelPassengers.map((p: any, idx: number) => ({
      id: p.id,
      type: p.type,
      firstName: idx === 0 ? "Sujith" : "",
      lastName: idx === 0 ? "Battu" : "",
      dob: p.type === 'child' ? "2016-06-15" : (idx === 0 ? "2002-05-25" : "1990-01-01"), 
      gender: "MALE"
    }))
  );

  // Booking Contact Info
  const [contactEmail, setContactEmail] = useState("battusujith2525@gmail.com");
  const [contactPhone, setContactPhone] = useState("+17208690684");

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const newPass = [...passengers];
    newPass[index] = { ...newPass[index], [field]: value };
    setPassengers(newPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return onError("Secure payment gateway is still loading.");

    setIsProcessing(true);

    try {
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${passengers[0].firstName} ${passengers[0].lastName}`,
            email: contactEmail,
          },
        },
      });

      if (stripeError) {
        setIsProcessing(false);
        return onError(stripeError.message || "Payment authorization failed");
      }

      if (paymentIntent && paymentIntent.status === "requires_capture") {
        if (flightOffer?.id) {
          
          // FIX: Strictly enforce E.164 formatting for Duffel (e.g. +17208690684)
          let cleanPhone = contactPhone.trim();
          if (!cleanPhone.startsWith('+')) {
            const digits = cleanPhone.replace(/\D/g, '');
            // Automatically assume US +1 if exactly 10 digits are provided without a code
            cleanPhone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
          }

          // Build dynamic traveler array for the backend
          const mappedTravelers = passengers.map((p: any, index: number) => ({
            id: p.id, 
            name: { firstName: p.firstName, lastName: p.lastName },
            dateOfBirth: p.dob,
            gender: p.gender,
            phone_number: cleanPhone, // Explicitly pass at root level for Duffel API v2
            email: contactEmail,      // Explicitly pass at root level for Duffel API v2
            contact: {
              emailAddress: contactEmail,
              phones: [{ countryCallingCode: "1", number: cleanPhone.replace('+1', '') }] 
            },
            payment_intent_id: index === 0 ? paymentIntent.id : undefined
          }));

          const bookingRes = await travelApi.bookFlight(flightOffer.id, mappedTravelers);
          if (bookingRes.error) throw new Error(bookingRes.error);
          onSuccess(bookingRes.pnr || bookingRes.booking_reference || "MB-CONFIRMED");
        } else {
          onSuccess("MB-HOTEL-TOUR");
        }
      }
    } catch (err: any) {
      console.error(err);
      onError(err.message || "An error occurred while booking.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Dynamic Passenger Loop */}
      <div className="space-y-4">
        <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
          <User className="text-theme-primary" size={20}/> Traveler Information
        </h3>
        
        {passengers.map((p: any, idx: number) => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">
              {p.type === 'child' ? 'Child' : 'Adult'} {idx + 1}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">First Name</label>
                <input type="text" value={p.firstName} onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-theme-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Last Name</label>
                <input type="text" value={p.lastName} onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-theme-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date of Birth</label>
                <input type="date" value={p.dob} onChange={(e) => handlePassengerChange(idx, 'dob', e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-theme-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Gender</label>
                <select value={p.gender} onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-theme-primary">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Contact Block */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-2">Booking Contact Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email (For Tickets)</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-theme-primary" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Mobile Number (Include Country Code)</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:outline-none focus:border-theme-primary" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
          <CreditCard className="text-theme-primary" size={20}/> Secure Payment
        </h3>
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#111827', '::placeholder': { color: '#9CA3AF' } }, invalid: { color: '#EF4444' } } }} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center gap-2 py-4 bg-theme-primary text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-theme-primary/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
        {isProcessing ? "Processing Securely..." : `Pay $${grandTotal.toFixed(2)}`}
      </button>
    </form>
  );
};

export default function TripCheckout({ flightOffer, grandTotal, onPriceConfirmed, onExpandedChange, onStepChange, onSuccess }: CheckoutProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState<"IDLE" | "VALIDATING" | "READY" | "ERROR">("IDLE");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInitializeCheckout = async () => {
    setIsExpanded(true); onExpandedChange(true); setStep("VALIDATING"); onStepChange("VALIDATING"); setErrorMsg(null);
    try {
      if (flightOffer?.id) {
        const offerId = typeof flightOffer === 'string' ? flightOffer : flightOffer.id;
        const priceRes = await travelApi.confirmFlightPrice(offerId);
        if (priceRes.error) throw new Error(priceRes.error || "The airline price has expired. Please refresh your search.");
        const newTotal = priceRes.priced_offer?.price || flightOffer.price;
        onPriceConfirmed(newTotal, newTotal * 0.15);
      }
      const paymentRes = await travelApi.createPaymentIntent(grandTotal, "USD");
      if (paymentRes.client_secret) {
        setClientSecret(paymentRes.client_secret); setStep("READY"); onStepChange("READY");
      } else throw new Error("Failed to initialize secure payment gateway.");
    } catch (err: any) {
      setStep("ERROR"); onStepChange("ERROR"); setErrorMsg(err.message || "Failed to confirm availability. Please try again.");
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-gray-50 relative">
      {!isExpanded ? (
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="text-center sm:text-left flex flex-col">
            <span className="text-[12px] uppercase tracking-widest text-gray-500 font-black mb-0.5">Total Due Now</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none">${grandTotal.toFixed(2)}</span>
          </div>
          <button onClick={handleInitializeCheckout} className="px-8 py-4 bg-theme-primary text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-lg active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2">
            <ShieldCheck size={18} /> Confirm & Check Out
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900">Complete Booking</h2>
            <button onClick={() => { setIsExpanded(false); onExpandedChange(false); }} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Cancel</button>
          </div>
          {step === "VALIDATING" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-theme-primary" size={40} />
              <p className="text-sm font-bold text-gray-500">Checking live availability with airline...</p>
            </div>
          )}
          {step === "ERROR" && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 text-red-700">
              <AlertCircle className="shrink-0" size={24} />
              <div>
                <h4 className="font-black text-lg">Checkout Failed</h4>
                <p className="text-sm font-medium mt-1">{errorMsg}</p>
                <button onClick={handleInitializeCheckout} className="mt-4 text-xs font-black uppercase tracking-widest underline hover:text-red-900">Try Again</button>
              </div>
            </div>
          )}
          {step === "READY" && clientSecret && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <PaymentForm clientSecret={clientSecret} flightOffer={flightOffer} grandTotal={grandTotal} onSuccess={onSuccess} onError={(msg: string) => { setStep("ERROR"); setErrorMsg(msg); }} />
              </Elements>
            </div>
          )}
        </div>
      )}
    </div>
  );
}