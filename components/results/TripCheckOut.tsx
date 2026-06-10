"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CreditCard, Lock, AlertCircle, User, MapPin, CheckCircle2, Info } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { travelApi } from "@/services/api";
import { useUserResidence } from "@/hooks/useUserResidence";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock");

// Define SOT restricted states explicitly
const SOT_STATES = ["California", "Florida", "Hawaii", "Washington"];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

// Helper to safely parse numbers
const safeFloat = (val: any) => parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;

// Helper to determine State strictly from the Stripe Card ZIP Code
const getStateFromZip = (zip: string) => {
  if (!zip || zip.length < 5) return "";
  const zipNum = parseInt(zip.substring(0, 5), 10);
  
  if (zipNum >= 35000 && zipNum <= 36999) return "Alabama";
  if (zipNum >= 99500 && zipNum <= 99999) return "Alaska";
  if (zipNum >= 85000 && zipNum <= 86999) return "Arizona";
  if (zipNum >= 71600 && zipNum <= 72999) return "Arkansas";
  if (zipNum >= 90000 && zipNum <= 96199) return "California";
  if (zipNum >= 80000 && zipNum <= 81999) return "Colorado";
  if (zipNum >= 6000 && zipNum <= 6999) return "Connecticut";
  if (zipNum >= 19700 && zipNum <= 19999) return "Delaware";
  if (zipNum >= 32000 && zipNum <= 34999) return "Florida";
  if (zipNum >= 30000 && zipNum <= 31999) return "Georgia";
  if (zipNum >= 96700 && zipNum <= 96999) return "Hawaii";
  if (zipNum >= 83200 && zipNum <= 83999) return "Idaho";
  if (zipNum >= 60000 && zipNum <= 62999) return "Illinois";
  if (zipNum >= 46000 && zipNum <= 47999) return "Indiana";
  if (zipNum >= 50000 && zipNum <= 52999) return "Iowa";
  if (zipNum >= 66000 && zipNum <= 67999) return "Kansas";
  if (zipNum >= 40000 && zipNum <= 42999) return "Kentucky";
  if (zipNum >= 70000 && zipNum <= 71599) return "Louisiana";
  if (zipNum >= 4000 && zipNum <= 4999) return "Maine";
  if (zipNum >= 20600 && zipNum <= 21299) return "Maryland";
  if (zipNum >= 1000 && zipNum <= 2799) return "Massachusetts";
  if (zipNum >= 48000 && zipNum <= 49999) return "Michigan";
  if (zipNum >= 55000 && zipNum <= 56699) return "Minnesota";
  if (zipNum >= 38600 && zipNum <= 39799) return "Mississippi";
  if (zipNum >= 63000 && zipNum <= 65999) return "Missouri";
  if (zipNum >= 59000 && zipNum <= 59999) return "Montana";
  if (zipNum >= 68000 && zipNum <= 69399) return "Nebraska";
  if (zipNum >= 88900 && zipNum <= 89899) return "Nevada";
  if (zipNum >= 3000 && zipNum <= 3899) return "New Hampshire";
  if (zipNum >= 7000 && zipNum <= 8999) return "New Jersey";
  if (zipNum >= 87000 && zipNum <= 88499) return "New Mexico";
  if (zipNum >= 10000 && zipNum <= 14999) return "New York";
  if (zipNum >= 27000 && zipNum <= 28999) return "North Carolina";
  if (zipNum >= 58000 && zipNum <= 58999) return "North Dakota";
  if (zipNum >= 43000 && zipNum <= 45999) return "Ohio";
  if (zipNum >= 73000 && zipNum <= 74999) return "Oklahoma";
  if (zipNum >= 97000 && zipNum <= 97999) return "Oregon";
  if (zipNum >= 15000 && zipNum <= 19699) return "Pennsylvania";
  if (zipNum >= 2800 && zipNum <= 2999) return "Rhode Island";
  if (zipNum >= 29000 && zipNum <= 29999) return "South Carolina";
  if (zipNum >= 57000 && zipNum <= 57999) return "South Dakota";
  if (zipNum >= 37000 && zipNum <= 38599) return "Tennessee";
  if (zipNum >= 75000 && zipNum <= 79999) return "Texas";
  if (zipNum >= 84000 && zipNum <= 84999) return "Utah";
  if (zipNum >= 5000 && zipNum <= 5999) return "Vermont";
  if (zipNum >= 22000 && zipNum <= 24699) return "Virginia";
  if (zipNum >= 98000 && zipNum <= 99499) return "Washington";
  if (zipNum >= 24700 && zipNum <= 26999) return "West Virginia";
  if (zipNum >= 53000 && zipNum <= 54999) return "Wisconsin";
  if (zipNum >= 82000 && zipNum <= 83199) return "Wyoming";
  
  return "Unknown";
};

interface CheckoutProps {
  flightOffer?: any;
  stay?: any;
  tours?: any[];
  rawParams?: any;
  grandTotal: number;
  onPriceConfirmed: (total: number, taxes: number) => void;
  onExpandedChange: (expanded: boolean) => void;
  onStepChange: (step: string) => void;
  onSuccess?: (pnr: string, systemBookingId: string, email: string) => void;
}

const PaymentForm = ({ clientSecret, activeFlightOffer, grandTotal, onBookingComplete, onError, onRecoverySuccess }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState("");
  
  const [cardZip, setCardZip] = useState("");
  const detectedState = getStateFromZip(cardZip);

  const { residenceState, updateResidence } = useUserResidence();
  const [billingState, setBillingState] = useState("");

  const isSOTRestricted = SOT_STATES.includes(billingState) || (detectedState !== "Unknown" && SOT_STATES.includes(detectedState));

  useEffect(() => {
    if (residenceState && US_STATES.includes(residenceState)) {
      setBillingState(residenceState);
    }
  }, [residenceState]);
  
  const duffelPassengers = activeFlightOffer?.raw_offer_data?.passengers || [{ id: "pt_1", type: "adult" }];
  
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

  const [contactEmail, setContactEmail] = useState("battusujith2525@gmail.com");
  const [contactPhone, setContactPhone] = useState("+17208690684");

  const handlePassengerChange = (index: number, field: string, value: string) => {
    const newPass = [...passengers];
    newPass[index] = { ...newPass[index], [field]: value };
    setPassengers(newPass);
  };

  const triggerFlightRecovery = async () => {
    setIsProcessing(true);
    setProcessStatus("Session expired. Automatically fetching a fresh ticket...");
    
    try {
        const raw = activeFlightOffer.raw_offer_data;
        const itin = activeFlightOffer.itineraries;
        
        const originCode = raw?.slices?.[0]?.origin?.iata_code || itin[0].segments[0].departure_airport;
        const destCode = raw?.slices?.[0]?.destination?.iata_code || itin[0].segments[itin[0].segments.length - 1].arrival_airport;
        const date = itin[0].segments[0].departure_time.split('T')[0];
        const returnDate = itin.length > 1 ? itin[1].segments[0].departure_time.split('T')[0] : undefined;
        
        const adults = raw?.passengers?.filter((p:any) => p.type === 'adult').length || 1;
        const children = raw?.passengers?.filter((p:any) => p.type === 'child').length || 0;
        const travelClass = activeFlightOffer.travel_class || "economy";

        const results = await travelApi.searchFlights(originCode, destCode, date, returnDate, adults, children, travelClass);
        if (!results || results.error) throw new Error();

        const targetCarrier = activeFlightOffer.airline_name;
        const targetDepTime = itin[0].segments[0].departure_time;

        const matchingOffer = results.find((o: any) => 
            o.airline_name === targetCarrier && 
            o.itineraries[0]?.segments[0]?.departure_time === targetDepTime
        );

        if (!matchingOffer) {
            return onError("The airline is no longer offering this exact flight. Please return to the home page and search again.");
        }

        onRecoverySuccess(matchingOffer);

    } catch (e) {
        onError("Session expired and auto-recovery failed. Please return to the home page and search again.");
    } finally {
        setIsProcessing(false);
        setProcessStatus("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return onError("Secure payment gateway is still loading.");

    if (!billingState) return onError("Please select your Billing State.");

    if (isSOTRestricted) {
      const restrictedName = SOT_STATES.includes(detectedState) ? detectedState : billingState;
      return onError(`Payment Blocked: The billing state is registered as ${restrictedName}. We cannot accept bookings from this state due to Seller of Travel regulations.`);
    }

    if (!cardZip) return onError("Please enter a valid US zip code in the card details.");

    setIsProcessing(true);
    setProcessStatus(`Authenticating card in ${billingState}...`);

    try {
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${passengers[0].firstName} ${passengers[0].lastName}`,
            email: contactEmail,
            phone: contactPhone,
            address: { postal_code: cardZip, state: billingState, country: "US" }
          },
        },
      });

      if (stripeError) {
        setIsProcessing(false);
        setProcessStatus("");
        
        if (
          stripeError.code === "incorrect_zip" || 
          stripeError.decline_code === "incorrect_zip" || 
          stripeError.message?.toLowerCase().includes("postal code") ||
          stripeError.message?.toLowerCase().includes("zip")
        ) {
          return onError(`Card verification failed: The zip code entered (${cardZip}) does not match the billing address registered with your card issuer. Please enter the exact zip code tied to this card.`);
        }
        return onError(stripeError.message || "Payment authorization failed.");
      }

      if (paymentIntent && paymentIntent.status === "requires_capture") {
        updateResidence(billingState, true);
        setProcessStatus("Bank Authorized! Finalizing your trip...");
        
        if (activeFlightOffer?.id) {
          let cleanPhone = contactPhone.trim();
          if (!cleanPhone.startsWith('+')) {
            const digits = cleanPhone.replace(/\D/g, '');
            cleanPhone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
          }

          const mappedTravelers = passengers.map((p: any, index: number) => ({
            id: p.id, 
            name: { firstName: p.firstName, lastName: p.lastName },
            dateOfBirth: p.dob,
            gender: p.gender,
            phone_number: cleanPhone, 
            email: contactEmail,      
            contact: {
              emailAddress: contactEmail,
              phones: [{ countryCallingCode: "1", number: cleanPhone.replace('+1', '') }] 
            },
            payment_intent_id: index === 0 ? paymentIntent.id : undefined
          }));

          const bookingRes = await travelApi.bookFlight(activeFlightOffer.id, mappedTravelers);
          
          if (bookingRes.error) {
            const errorString = typeof bookingRes.error === "string" ? bookingRes.error : JSON.stringify(bookingRes.error);
            if (errorString.includes("already been booked") || errorString.includes("offer_request_already_booked") || errorString.includes("offer_request_expired")) {
              return triggerFlightRecovery();
            }
            throw new Error(bookingRes.error);
          }
          
          // Extracted from backend
          const mbSysId = bookingRes.booking_id ? bookingRes.booking_id.toString() : `MB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const providerPnr = bookingRes.pnr || bookingRes.booking_reference || "MB-CONFIRMED";
          onBookingComplete(providerPnr, mbSysId, contactEmail);
          
        } else {
          // Future stays/tours logic fallback ID
          const fallbackSysId = `MB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          onBookingComplete("MB-HOTEL-TOUR", fallbackSysId, contactEmail);
        }
      }
    } catch (err: any) {
      console.error(err);
      onError(err.message || "An error occurred while booking.");
    } finally {
      setIsProcessing(false);
      setProcessStatus("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* TRAVELER INFO */}
      <div className="space-y-4">
        <h3 className="font-black text-theme-secondary tracking-tight flex items-center gap-2">
          <User className="text-theme-primary" size={18}/> Traveler Information
        </h3>
        
        {passengers.map((p: any, idx: number) => (
          <div key={p.id} className="bg-theme-white p-6 rounded-2xl border border-theme-soft-slate shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-theme-primary"></div>
            <h4 className="text-[12px] font-black uppercase tracking-widest text-theme-secondary/50 mb-2">
              {p.type === 'child' ? 'Child' : 'Adult'} {idx + 1}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">First Name</label>
                <input type="text" value={p.firstName} onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)} required className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl px-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary" />
              </div>
              <div>
                <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">Last Name</label>
                <input type="text" value={p.lastName} onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)} required className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl px-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary" />
              </div>
              <div>
                <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">Date of Birth</label>
                <input type="date" value={p.dob} onChange={(e) => handlePassengerChange(idx, 'dob', e.target.value)} required className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl px-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary" />
              </div>
              <div>
                <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">Gender</label>
                <select value={p.gender} onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)} className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl px-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONTACT INFO & BILLING STATE */}
      <div className="bg-theme-white p-6 rounded-2xl border border-theme-soft-slate shadow-sm space-y-4">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-theme-secondary/50 mb-2 flex items-center gap-2">
           Contact Details & Billing Location
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">Email (For Tickets & Receipts)</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl px-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">Mobile Number</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl px-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[12px] font-black text-theme-secondary/50 uppercase tracking-widest mb-1">Billing State</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-light-gray" />
              <select 
                value={billingState} 
                onChange={(e) => setBillingState(e.target.value)} 
                required 
                className="w-full bg-theme-cool-white border border-theme-soft-slate rounded-xl pl-10 pr-4 py-3  font-bold text-theme-secondary focus:outline-none focus:border-theme-primary appearance-none cursor-pointer"
              >
                <option value="" disabled>Select State</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT & STRIPE CARD ELEMENT */}
      <div className={`bg-theme-white p-6 rounded-2xl border shadow-sm space-y-4 transition-all ${isSOTRestricted ? "border-theme-error bg-theme-error/5" : "border-theme-soft-slate"}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-black text-theme-secondary tracking-tight flex items-center gap-2">
            <CreditCard className="text-theme-primary" size={18}/> Secure Payment
          </h3>
          
          <div className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-widest">
            {detectedState && detectedState !== "Unknown" ? (
              <>
                <MapPin size={18} className={isSOTRestricted ? "text-theme-error" : "text-theme-success"} />
                <span className={isSOTRestricted ? "text-theme-error" : "text-theme-success"}>
                  Detected: {detectedState}
                </span>
              </>
            ) : (
              <span className="text-theme-light-gray">Enter Card to verify State</span>
            )}
          </div>
        </div>
        
        <div className={`p-4 rounded-xl bg-theme-cool-white border ${isSOTRestricted ? "border-theme-error/50" : "border-theme-soft-slate"}`}>
          <CardElement 
            onChange={(e) => {
              if (e.value.postalCode) {
                setCardZip(e.value.postalCode);
                const stateFromZip = getStateFromZip(e.value.postalCode);
                if (stateFromZip && stateFromZip !== "Unknown") {
                  setBillingState(stateFromZip);
                }
              } else {
                setCardZip("");
              }
            }}
            options={{ style: { base: { fontSize: '14px', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 'bold', '::placeholder': { color: '#9CA3AF' } }, invalid: { color: '#EF4444' } } }} 
          />
        </div>

        {isSOTRestricted && (
          <div className="flex items-start gap-2 text-theme-error mt-2 px-1 animate-in fade-in zoom-in duration-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs font-bold leading-tight">
              Due to Seller of Travel laws, we cannot accept payments registered in {SOT_STATES.includes(detectedState) ? detectedState : billingState}. Please use a different card or billing state.
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || isSOTRestricted || !cardZip}
        className="w-full flex items-center justify-center gap-2 py-4 bg-theme-primary text-theme-white rounded-xl font-black  uppercase tracking-widest hover:bg-theme-primary/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-theme-light-gray"
      >
        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
        {isProcessing ? (processStatus || "Processing Securely...") : `Pay $${grandTotal.toFixed(2)}`}
      </button>
    </form>
  );
};

export default function TripCheckout({ flightOffer, grandTotal, onPriceConfirmed, onExpandedChange, onStepChange, onSuccess }: CheckoutProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [step, setStep] = useState<"IDLE" | "VALIDATING" | "READY" | "ERROR" | "SUCCESS">("IDLE");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [activeFlightOffer, setActiveFlightOffer] = useState(flightOffer);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  useEffect(() => {
    if (flightOffer) setActiveFlightOffer(flightOffer);
  }, [flightOffer]);

  const handleInitializeCheckout = async (offerToUse = activeFlightOffer, isRecovery = false) => {
    setIsExpanded(true); 
    onExpandedChange(true); 
    setStep("VALIDATING"); 
    onStepChange("VALIDATING"); 
    setErrorMsg(null);
    if (!isRecovery) setWarningMsg(null);
    
    try {
      let currentGrandTotal = grandTotal;

      if (offerToUse?.id) {
        const offerId = typeof offerToUse === 'string' ? offerToUse : offerToUse.id;
        const priceRes = await travelApi.confirmFlightPrice(offerId);
        
        if (priceRes.error) {
           const errStr = typeof priceRes.error === 'string' ? priceRes.error : JSON.stringify(priceRes.error);
           if (errStr.includes("already been booked") || errStr.includes("expired")) {
               throw new Error("This exact flight session has expired. Please try again or return home to search anew.");
           }
           throw new Error(priceRes.error || "The airline price has expired. Please refresh your search.");
        }
        
        const newFlightTotal = priceRes.priced_offer?.total_amount || priceRes.priced_offer?.price || offerToUse.total_amount || offerToUse.price;
        const exactTaxes = priceRes.priced_offer?.tax_amount || offerToUse.tax_amount || (newFlightTotal * 0.15);
        
        const oldFlightTotal = safeFloat(offerToUse.price?.total || offerToUse.price || 0);
        const priceDelta = newFlightTotal - oldFlightTotal;
        currentGrandTotal = grandTotal + priceDelta;

        onPriceConfirmed(newFlightTotal, exactTaxes);
      }
      
      const paymentRes = await travelApi.createPaymentIntent(currentGrandTotal, "USD");
      if (paymentRes.client_secret) {
        setClientSecret(paymentRes.client_secret); 
        setStep("READY"); 
        onStepChange("READY");
      } else {
        throw new Error("Failed to initialize secure payment gateway.");
      }
    } catch (err: any) {
      setStep("ERROR"); 
      onStepChange("ERROR"); 
      setErrorMsg(err.message || "Failed to confirm availability. Please try again.");
    }
  };

  const handleRecoverySuccess = async (newOffer: any) => {
    setActiveFlightOffer(newOffer);
    setWarningMsg("Your previous session expired, but we successfully secured a fresh ticket for this flight! For your security, please re-enter your card details to finalize the booking.");
    await handleInitializeCheckout(newOffer, true);
  };

  return (
    <div className="w-full flex flex-col h-full bg-theme-cool-white relative rounded-b-2xl overflow-hidden">
      {!isExpanded ? (
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="text-center sm:text-left flex flex-col">
            <span className=" uppercase tracking-widest text-theme-secondary/50 font-black mb-0.5">Total Due Now</span>
            <span className=" sm:text-3xl font-black text-theme-primary leading-none">${grandTotal.toFixed(2)}</span>
          </div>
          <button onClick={() => handleInitializeCheckout(activeFlightOffer, false)} className="px-8 py-4 bg-theme-primary text-theme-white font-black  uppercase tracking-widest rounded-xl hover:bg-theme-primary/90 transition-all shadow-lg active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2">
            <ShieldCheck size={18} /> Confirm & Check Out
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar">
          <div className="flex justify-between items-center mb-6 border-b border-theme-soft-slate pb-4">
            <h2 className=" sm: font-black text-theme-secondary tracking-tight">
              {step === "SUCCESS" ? "Booking Complete" : "Complete Booking"}
            </h2>
            {step !== "SUCCESS" && (
              <button onClick={() => { setIsExpanded(false); onExpandedChange(false); }} className="text-[12px] font-black uppercase tracking-widest text-theme-secondary/50 hover:text-theme-secondary transition-colors px-3 py-1.5 border border-theme-soft-slate rounded-lg bg-theme-white shadow-sm">
                Cancel
              </button>
            )}
          </div>

          {step === "VALIDATING" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin text-theme-primary" size={40} />
              <p className=" font-bold text-theme-secondary/70">Checking live availability with the airline...</p>
            </div>
          )}

          {step === "ERROR" && (
            <div className="bg-theme-error/5 border border-theme-error/30 rounded-2xl p-6 flex items-start gap-4 text-theme-error shadow-sm">
              <AlertCircle className="shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-black ">Checkout Failed</h4>
                <p className=" font-bold mt-1.5 opacity-90">{errorMsg}</p>
                <button onClick={() => handleInitializeCheckout(activeFlightOffer, false)} className="mt-4 text-[12px] font-black uppercase tracking-widest underline hover:opacity-70 transition-opacity">Try Again</button>
              </div>
            </div>
          )}

          {step === "READY" && clientSecret && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {warningMsg && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 flex items-start gap-3 text-amber-700 shadow-sm animate-in fade-in zoom-in duration-300">
                  <Info className="shrink-0 mt-0.5 text-amber-500" size={18} />
                  <div className=" font-bold">{warningMsg}</div>
                </div>
              )}
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <PaymentForm 
                  clientSecret={clientSecret} 
                  activeFlightOffer={activeFlightOffer} 
                  grandTotal={grandTotal} 
                  onBookingComplete={(pnr: string, sysId: string, email: string) => {
                    setStep("SUCCESS");
                    onStepChange("SUCCESS");
                    if (onSuccess) onSuccess(pnr, sysId, email); 
                  }} 
                  onError={(msg: string) => { setStep("ERROR"); setErrorMsg(msg); }}
                  onRecoverySuccess={handleRecoverySuccess} 
                />
              </Elements>
            </div>
          )}
        </div>
      )}
    </div>
  );
}