"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plane, Clock, CheckCircle2, ChevronDown, ShieldCheck, Gift,
  Wifi, Utensils, Briefcase, Leaf, Luggage, BatteryCharging,
  RefreshCcw, PlaneTakeoff, X, ArrowUpDown, TrendingDown, Zap,
  AlertTriangle, Lock, Unlock, Coffee, Wind
} from 'lucide-react';

type SortOption = 'price_asc' | 'duration_asc';

// ─── STATE SYSTEM (matches StaysCard standards) ───────────────────────────────
//
//  CARD
//    resting   → border: secondary/10 (1px)    bg: white    shadow: none
//    hover     → border: secondary/30 (2px)    bg: white    shadow: subtle dark lift
//    selected  → border: primary (2px)          bg: white    shadow: warm orange lift
//    left bar  → transparent resting, primary selected (not the reverse)
//
//  BUTTONS
//    CTA unselected  → secondary bg → hover: primary bg
//    CTA selected    → primary bg
//    ghost actions   → white/cool-white bg, soft-slate border → hover: secondary/5
//    sort button     → secondary bg → hover: primary bg  (matches StaysCard)

export default function FlightCard({ flights, loading, searchParams }: { flights: any[], loading?: boolean, searchParams?: any }) {
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [selectedFlightKeys, setSelectedFlightKeys] = useState<string[]>([]);
  const [expandedFlightKey, setExpandedFlightKey] = useState<string | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const travelerCount = (searchParams?.adults || 1) + (searchParams?.children || 0);
  const isRoundTrip = flights?.some(f => f.itineraries?.length > 1) || false;

  useEffect(() => {
    const tripStateStr = sessionStorage.getItem('selected_trip_state');
    if (tripStateStr) {
      try {
        const tripState = JSON.parse(tripStateStr);
        if (tripState.flights?.length > 0) {
          setSelectedFlightKeys(tripState.flights.map((f: any) => f._selectionKey));
        } else {
          setSelectedFlightKeys([]);
        }
      } catch (e) {}
    }
  }, [flights]);

  // Outside-click close — same pattern as StaysCard
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFlightSelection = (flight: any, uniqueKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tripStateStr = sessionStorage.getItem('selected_trip_state');
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    const isSelected = selectedFlightKeys.includes(uniqueKey);
    if (isSelected) {
      tripState.flights = [];
      setSelectedFlightKeys([]);
    } else {
      tripState.flights = [{ ...flight, _selectionKey: uniqueKey }];
      setSelectedFlightKeys([uniqueKey]);
    }
    sessionStorage.setItem('selected_trip_state', JSON.stringify(tripState));
    window.dispatchEvent(new Event("selected_trip_state_changed"));
  };

  const getPrice = (f: any) => {
    const raw = f.price?.grandTotal || f.price?.total || f.price || 0;
    return typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.-]/g, '')) || 0;
  };

  const getSortPrice = (f: any) => {
    const total = getPrice(f);
    return f.itineraries?.length ? total / f.itineraries.length : total;
  };

  const getTotalDurationMins = (flight: any) => {
    let totalMins = 0;
    flight.itineraries?.forEach((itin: any) => {
      let str = (itin.duration || '').toUpperCase().replace('PT', '').replace(/\s/g, '');
      let h = 0, m = 0;
      if (str.includes('H')) { const p = str.split('H'); h = parseInt(p[0]) || 0; str = p[1] || ''; }
      if (str.includes('M')) m = parseInt(str.replace('M', '')) || 0;
      totalMins += h * 60 + m;
    });
    return flight.itineraries?.length ? totalMins / flight.itineraries.length : totalMins;
  };

  const getLayoverDuration = (arrivalTime: string, nextDepartureTime: string) => {
    if (!arrivalTime || !nextDepartureTime) return '';
    const diffMins = Math.floor((new Date(nextDepartureTime).getTime() - new Date(arrivalTime).getTime()) / 60000);
    if (diffMins <= 0) return '';
    const h = Math.floor(diffMins / 60), m = diffMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDuration = (dur: string) =>
    (dur || '').replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase().trim();

  const sortedFlights = useMemo(() => {
    if (!flights || !Array.isArray(flights)) return [];
    return [...flights].sort((a, b) =>
      sortBy === 'price_asc'
        ? getSortPrice(a) - getSortPrice(b)
        : getTotalDurationMins(a) - getTotalDurationMins(b)
    );
  }, [flights, sortBy]);

  if (loading) return null;

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">

      {/* ── TOOLBAR ── */}
      <div className="bg-theme-white p-2 border border-theme-secondary/10 flex rounded-xl justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Icon + count — secondary bg, consistent with flight toolbar */}
          <div className="flex items-center gap-2">
               <Plane size={18} className="text-[var(--color-theme-light-gray)]/70" />
                        <span className="font-medium">
                          <strong className="text-[var(--color-theme-primary)] font-semibold">{flights.length}</strong>
                          <span className="text-[var(--color-theme-light-slate)] font-normal"> flights available</span>
                        </span>
          </div>
        </div>

        {/* Sort — secondary→primary, click-controlled */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md  font-semibold transition-colors duration-150 border ${
              sortMenuOpen
                ? 'bg-theme-secondary text-theme-white'
                : 'bg-theme-secondary text-theme-white'
            }`}
          >
            <ArrowUpDown size={18} />
            {sortBy === 'price_asc' ? 'Lowest Price' : 'Fastest'}
            <ChevronDown size={18} className={`transition-transform duration-200 ${sortMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-theme-white rounded-xl shadow-[0_8px_26px_rgba(15,23,42,0.10)] z-[60] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
              {([
                { value: 'price_asc' as SortOption, label: `Lowest Price${isRoundTrip ? ' (avg)' : ''}` },
                { value: 'duration_asc' as SortOption, label: `Fastest${isRoundTrip ? ' (avg)' : ''}` },
              ]).map((opt, i) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortMenuOpen(false); }}
                  className={`flex items-center justify-between px-4 py-3  font-medium transition-colors duration-100 ${i > 0 ? 'border-t border-theme-secondary/[0.08]' : ''} ${
                    sortBy === opt.value
                      ? 'bg-theme-secondary/[0.06] text-theme-secondary font-semibold'
                      : 'text-theme-secondary/70 hover:bg-theme-secondary/[0.04]'
                  }`}
                >
                  {opt.label}
                  {sortBy === opt.value && <CheckCircle2 size={18} className="text-theme-secondary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FLIGHT CARDS ── */}
      {sortedFlights.map((flight, flightIndex) => {
        const uniqueKey = flight.id ? `${flight.id}-${flightIndex}` : `flight-${flightIndex}`;
        const isSelected = selectedFlightKeys.includes(uniqueKey);
        const isExpanded = expandedFlightKey === uniqueKey;

        // Aggregate amenities across all segments
        let totalCheckedBags = 0, totalCarryOnBags = 0, hasWifi = false, hasPower = false, foodOption: string | null = null;
        flight.itineraries?.forEach((itin: any) => {
          itin.segments?.forEach((seg: any) => {
            if (seg.baggages && Array.isArray(seg.baggages)) {
              const checked = seg.baggages.find((b: any) => b.type === 'checked')?.quantity || 0;
              const carryOn = seg.baggages.find((b: any) => b.type === 'carry_on')?.quantity || 0;
              if (checked > totalCheckedBags) totalCheckedBags = checked;
              if (carryOn > totalCarryOnBags) totalCarryOnBags = carryOn;
            } else {
              if (seg.checked_bags > totalCheckedBags) totalCheckedBags = seg.checked_bags;
              if (seg.carry_on_bags > totalCarryOnBags) totalCarryOnBags = seg.carry_on_bags;
            }
            if (seg.amenities?.wifi) hasWifi = true;
            if (seg.amenities?.power_usb) hasPower = true;
            if (seg.amenities?.food) foodOption = seg.amenities.food;
          });
        });

        const isRefundable = flight.refund_policy?.is_refundable ?? false;
        const penaltyAmount = flight.refund_policy?.penalty_amount;
        const penaltyCurrency = flight.refund_policy?.currency || flight.currency;
        const price = getPrice(flight);

        return (
          <div
            key={uniqueKey}
            onClick={() => setExpandedFlightKey(isExpanded ? null : uniqueKey)}
            className={`relative flex flex-col rounded-lg border-2 bg-theme-white cursor-pointer transition-all duration-150 overflow-hidden ${
              isSelected
                ? 'border-theme-primary shadow-[0_4px_26px_rgba(249,115,22,0.10)]'
                : 'border-theme-secondary/10 hover:border-theme-secondary/30 hover:shadow-[0_4px_14px_rgba(15,23,42,0.07)]'
            }`}
          >
            {/* Left accent bar — primary when selected, transparent resting */}
            <div className={`absolute top-0 left-0 w-[3px] h-full rounded-r transition-colors duration-150 ${
              isSelected ? 'bg-theme-primary' : 'bg-transparent'
            }`} />

            {/* ── CARD BODY ── */}
            <div className="pl-4 pr-4 sm:pr-5 py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center gap-5">

              {/* Airline logo + name */}
              <div className="flex lg:flex-col items-center gap-3 lg:gap-1.5 shrink-0 lg:w-[72px]">
                <div className="w-12 h-12 bg-theme-white rounded-lg border-2 border-theme-secondary/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={`https://images.kiwi.com/airlines/64/${flight.airline_code}.png`}
                    className="w-full h-full object-contain"
                    alt={flight.airline_name || flight.airline_code}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="text-[12px] font-semibold text-theme-secondary/70 leading-tight lg:text-center">
                  {flight.airline_name || flight.airline_code}
                </span>
              </div>

              {/* Itineraries */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                {flight.itineraries?.slice(0, 2).map((itin: any, i: number) => {
                  const stops = (itin.segments?.length || 1) - 1;
                  const depSeg = itin.segments?.[0];
                  const arrSeg = itin.segments?.[itin.segments.length - 1];
                  const isDirect = stops === 0;

                  return (
                    <div key={i} className={`flex items-center gap-3 sm:gap-4 ${i > 0 ? 'pt-3 border-t border-theme-secondary/[0.08]' : ''}`}>

                      {/* Leg label */}
                      <span className="text-[12px] font-semibold uppercase st text-theme-secondary/35 w-8 shrink-0">
                        {i === 0 ? 'Out' : 'Ret'}
                      </span>

                      {/* Depart */}
                      <div className="text-right shrink-0 min-w-[52px]">
                        <p className=" font-bold text-theme-secondary leading-none tabular-nums">
                          {depSeg ? new Date(depSeg.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </p>
                        <p className="text-[12px] font-semibold text-theme-secondary/40 mt-0.5 ">
                          {depSeg?.departure_airport}
                        </p>
                      </div>

                      {/* Route visualization */}
                      <div className="flex-1 flex flex-col items-center gap-1.5 px-1 min-w-0">
                        {/* Route line with plane icon */}
                        <div className="w-full flex items-center gap-1">
                          <div className="flex-1 h-px bg-theme-secondary/15" />
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isDirect ? 'bg-theme-success/10' : 'bg-theme-secondary/[0.07]'}`}>
                            <Plane size={18} className={isDirect ? 'text-theme-success' : 'text-theme-secondary/40'} />
                          </div>
                          <div className="flex-1 h-px bg-theme-secondary/15" />
                        </div>

                        {/* Duration + stop count */}
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-theme-secondary/50">
                            {formatDuration(itin.duration)}
                          </span>
                          <span className="text-theme-secondary/20 text-[12px]">·</span>
                          <span className={`text-[12px] font-semibold ${isDirect ? 'text-theme-success' : 'text-theme-secondary/60'}`}>
                            {isDirect ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>

                      {/* Arrive */}
                      <div className="shrink-0 min-w-[52px]">
                        <p className=" font-bold text-theme-secondary leading-none tabular-nums">
                          {arrSeg ? new Date(arrSeg.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </p>
                        <p className="text-[12px] font-semibold text-theme-secondary/40 mt-0.5 ">
                          {arrSeg?.arrival_airport}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Amenity badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-theme-secondary/[0.08]">
                  {flight.carbon_emissions_kg && (
                    <FlightBadge variant="emerald" icon={<Leaf size={18} />} label={`${flight.carbon_emissions_kg} kg CO₂`} />
                  )}
                  {(totalCheckedBags > 0 || totalCarryOnBags > 0) && (
                    <FlightBadge variant="blue" icon={<Luggage size={18} />} label="Bags included" />
                  )}
                  {isRefundable
                    ? <FlightBadge variant="amber" icon={<Unlock size={18} />} label={ 'Refundable'} />
                    : <FlightBadge variant="error" icon={<Lock size={18} />} label="Non-refundable" />
                  }
                  {hasWifi && <FlightBadge variant="muted" icon={<Wifi size={18} />} label="WiFi" />}
                  {hasPower && <FlightBadge variant="muted" icon={<BatteryCharging size={18} />} label="Power" />}
                  {foodOption && <FlightBadge variant="muted" icon={<Utensils size={18} />} label="Food" />}

                  {/* Expand toggle inline with badges on desktop */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpandedFlightKey(isExpanded ? null : uniqueKey); }}
                    className="hidden lg:flex ml-auto items-center gap-1.5 text-[12px] font-semibold text-theme-secondary/50 hover:text-theme-primary transition-colors duration-150 px-2 py-1 rounded hover:bg-theme-primary/[0.06]"
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                    <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Price + CTA */}
              <div
                className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 shrink-0 pt-4 border-t lg:border-t-0 lg:border-l border-theme-secondary/[0.08] lg:pl-6 lg:min-w-[148px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Price block */}
                <div className="text-left lg:text-right">
                  <p className="text-[12px] font-semibold text-theme-secondary/40 uppercase r mb-0.5">
                    {isRoundTrip ? 'Roundtrip' : 'One way'}
                  </p>
                  <p className="text-[26px] font-bold text-theme-secondary leading-none tabular-nums tracking-tight">
                    {price.toFixed(0)}
                    <span className="text-[12px] font-semibold text-theme-secondary/40 ml-0.5">{flight.currency || 'USD'}</span>
                  </p>
                  <p className="text-[12px] text-theme-secondary/40 font-medium mt-1">
                    {travelerCount} {travelerCount > 1 ? 'travelers' : 'traveler'}
                  </p>
                </div>

                {/* CTA: secondary→primary shift */}
                <button
                  onClick={(e) => toggleFlightSelection(flight, uniqueKey, e)}
                  className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold  transition-colors duration-150 border whitespace-nowrap ${
                    isSelected
                      ? 'bg-theme-primary border-theme-primary text-white'
                      : 'bg-theme-secondary border-theme-secondary text-theme-white hover:bg-theme-primary hover:border-theme-primary'
                  }`}
                >
                  {isSelected && <CheckCircle2 size={18} />}
                  {isSelected ? 'Selected' : 'Select Flight'}
                </button>

                {/* Mobile expand */}
                <button
                  onClick={(e) => { e.stopPropagation(); setExpandedFlightKey(isExpanded ? null : uniqueKey); }}
                  className="lg:hidden flex items-center gap-1 text-[12px] font-semibold text-theme-secondary/50 hover:text-theme-primary transition-colors"
                >
                  {isExpanded ? 'Hide' : 'Details'}
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* ── EXPANDED PANEL ── */}
            {isExpanded && (
              <div
                className="border-t border-theme-secondary/10 p-5 lg:p-7 animate-in slide-in-from-top-1 fade-in duration-200"
                style={{ background: 'rgba(248,250,252,0.8)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-l">

                  {/* LEFT: Segment timeline */}
                  <div className="lg:col-span-8 flex flex-col">
                    {flight.itineraries?.map((itin: any, idx: number) => {
                      const stops = (itin.segments?.length || 1) - 1;
                      const boundDate = itin.segments?.[0]?.departure_time
                        ? new Date(itin.segments[0].departure_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : '';

                      return (
                        <div key={idx}>
                          {/* Bound header */}
                          <div className="flex flex-wrap justify-between items-center mb-4 pb-3 border-b border-theme-secondary/[0.08] gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="h-[3px] w-4 rounded-full bg-theme-secondary" />
                              <span className="text-[12px] font-semibold uppercase text-theme-secondary">
                                {idx === 0 ? 'Outbound' : 'Return'}
                              </span>
                              {boundDate && (
                                <span className="text-[12px] font-medium text-theme-secondary/40">{boundDate}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {itin.duration && (
                                <span className="flex items-center gap-1.5 text-[12px] font-medium text-theme-secondary/50">
                                  <Clock size={18} /> {formatDuration(itin.duration)}
                                </span>
                              )}
                              <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-md border ${
                                stops === 0
                                  ? 'bg-theme-success/[0.08] text-theme-success border-theme-success/20'
                                  : 'bg-theme-secondary/[0.06] text-theme-secondary/60 border-theme-secondary/[0.12]'
                              }`}>
                                {stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>

                          {/* Segment timeline */}
                          <div className="relative pl-5 border-l-2 border-theme-secondary/[0.10] space-y-5 ml-2">
                            {itin.segments.map((seg: any, sIdx: number) => {
                              const nextSeg = itin.segments[sIdx + 1];
                              let aircraftName: string | null = null;
                              if (seg.aircraft && !['undefined', 'null', ''].includes(String(seg.aircraft).toLowerCase())) {
                                aircraftName = typeof seg.aircraft === 'object' ? seg.aircraft.name : String(seg.aircraft);
                              }
                              const layover = nextSeg ? getLayoverDuration(seg.arrival_time, nextSeg.departure_time) : null;

                              return (
                                <React.Fragment key={sIdx}>
                                  <div className="relative">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[26px] top-4 w-2.5 h-2.5 rounded-full bg-theme-white border-2 border-theme-primary shadow-sm" />

                                    {/* Segment card */}
                                    <div className="bg-theme-white rounded-lg border-2 border-theme-secondary/[0.08] p-4 transition-colors duration-150 hover:border-theme-secondary/20">

                                      {/* Dep → Arr row */}
                                      <div className="flex items-start gap-4">
                                        {/* Departure */}
                                        <div className="flex-1 min-w-0">
                                          <p className=" font-bold text-theme-secondary leading-none tabular-nums">
                                            {new Date(seg.departure_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                          </p>
                                          <p className="text-[12px] font-semibold text-theme-secondary/60 mt-1">
                                            {seg.departure_airport_name || seg.departure_airport}
                                          </p>
                                          {seg.departure_terminal && (
                                            <span className="inline-block mt-1 bg-theme-secondary/[0.07] text-theme-secondary/60 px-1.5 py-0.5 rounded text-[12px] font-semibold uppercase  border border-theme-secondary/[0.10]">
                                              Terminal {seg.departure_terminal}
                                            </span>
                                          )}
                                        </div>

                                        {/* Center: plane + flight meta */}
                                        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-1">
                                          <div className="flex items-center gap-2">
                                            <div className="w-10 h-px bg-theme-secondary/20" />
                                            <div className="w-7 h-7 rounded-full bg-theme-secondary/[0.07] flex items-center justify-center border border-theme-secondary/[0.12]">
                                              <PlaneTakeoff size={18} className="text-theme-secondary/50" />
                                            </div>
                                            <div className="w-10 h-px bg-theme-secondary/20" />
                                          </div>
                                          {aircraftName && (
                                            <span className="text-[12px] font-semibold text-theme-primary/70 bg-theme-primary/[0.07] px-2 py-0.5 rounded border border-theme-primary/[0.12] whitespace-nowrap">
                                              {aircraftName}
                                            </span>
                                          )}
                                        </div>

                                        {/* Arrival */}
                                        <div className="flex-1 min-w-0 text-right">
                                          <p className=" font-bold text-theme-secondary leading-none tabular-nums">
                                            {new Date(seg.arrival_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                          </p>
                                          <p className="text-[12px] font-semibold text-theme-secondary/60 mt-1">
                                            {seg.arrival_airport_name || seg.arrival_airport}
                                          </p>
                                          {seg.arrival_terminal && (
                                            <span className="inline-block mt-1 bg-theme-secondary/[0.07] text-theme-secondary/60 px-1.5 py-0.5 rounded text-[12px] font-semibold uppercase  border border-theme-secondary/[0.10]">
                                              Terminal {seg.arrival_terminal}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Flight meta row */}
                                      <div className="flex flex-wrap items-center gap-3 mt-3.5 pt-3 border-t border-theme-secondary/[0.07]">
                                        {seg.carrier_code && (
                                          <span className="text-[12px] font-semibold text-theme-secondary/60">
                                            {seg.carrier_code} {seg.flight_number}
                                          </span>
                                        )}
                                        {seg.duration && (
                                          <span className="flex items-center gap-1 text-[12px] font-medium text-theme-secondary/45">
                                            <Clock size={18} className="text-theme-secondary/30" />
                                            {formatDuration(seg.duration)}
                                          </span>
                                        )}
                                        {seg.cabin_class && (
                                          <span className="text-[12px] font-medium text-theme-secondary/45 capitalize">
                                            {seg.cabin_class.toLowerCase().replace('_', ' ')}
                                          </span>
                                        )}
                                        {/* Seg-level amenities */}
                                        {seg.amenities?.wifi && (
                                          <span className="flex items-center gap-1 text-[12px] font-semibold text-theme-secondary/50 bg-theme-secondary/[0.05] px-2 py-0.5 rounded border border-theme-secondary/[0.08]">
                                            <Wifi size={18} /> WiFi
                                          </span>
                                        )}
                                        {seg.amenities?.power_usb && (
                                          <span className="flex items-center gap-1 text-[12px] font-semibold text-theme-secondary/50 bg-theme-secondary/[0.05] px-2 py-0.5 rounded border border-theme-secondary/[0.08]">
                                            <BatteryCharging size={18} /> Power
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Layover pill */}
                                  {layover && (
                                    <div className="flex items-center gap-2 py-1">
                                      <div className="flex-1 border-t border-dashed border-theme-secondary/[0.12]" />
                                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-theme-secondary/50 bg-theme-white px-3 py-1.5 rounded-full border border-theme-secondary/[0.12] shadow-sm whitespace-nowrap">
                                        <Clock size={18} className="text-theme-primary" />
                                        {layover} in {seg.arrival_airport_name || seg.arrival_airport}
                                      </span>
                                      <div className="flex-1 border-t border-dashed border-theme-secondary/[0.12]" />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* RIGHT: Policies + Amenities */}
                  <div className="lg:col-span-4 flex flex-col gap-5">

                    {/* Baggage & Cancellation */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-[3px] w-4 rounded-full bg-theme-secondary" />
                        <span className="text-[12px] font-semibold uppercase r text-theme-secondary">
                          Policies
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <PolicyRow icon={<Luggage size={18} />} label="Checked bag" value={totalCheckedBags > 0 ? `${totalCheckedBags} included` : 'Not included'} active={totalCheckedBags > 0} />
                        <PolicyRow icon={<Briefcase size={18} />} label="Carry-on" value={totalCarryOnBags > 0 ? `${totalCarryOnBags} included` : 'Not included'} active={totalCarryOnBags > 0} />
                        <div className="flex items-center justify-between px-3 py-2.5 bg-theme-white rounded-lg border-2 border-theme-secondary/[0.08]">
                          <span className="flex items-center gap-2 text-[12px] font-medium text-theme-secondary/50">
                            <RefreshCcw size={18} /> Cancellation
                          </span>
                          <span className={`text-[12px] font-semibold ${
                            isRefundable
                              ? penaltyAmount ? 'text-theme-gold' : 'text-theme-success'
                              : 'text-theme-error'
                          }`}>
                            {!isRefundable
                              ? 'Non-refundable'
                              : penaltyAmount
                              ? `Fee: ${penaltyCurrency} ${penaltyAmount}`
                              : 'Free cancellation'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amenity tiles */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-[3px] w-4 rounded-full bg-theme-secondary" />
                        <span className="text-[12px] font-semibold uppercase r text-theme-secondary">
                          Amenities
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <AmenityTile icon={<Wifi size={18} />} label="WiFi" active={hasWifi} />
                        <AmenityTile icon={<BatteryCharging size={18} />} label="Power outlets" active={hasPower} />
                        <AmenityTile icon={<Utensils size={18} />} label={foodOption || 'Meal service'} active={!!foodOption} />
                        <AmenityTile icon={<Briefcase size={18} />} label="Carry-on bag" active={totalCarryOnBags > 0} />
                      </div>
                    </div>

                    {/* CO₂ block if present */}
                    {flight.carbon_emissions_kg && (
                      <div className="flex items-center gap-3 px-3 py-2.5 bg-theme-success/[0.05] rounded-lg border border-theme-success/20">
                        <Leaf size={18} className="text-theme-success shrink-0" />
                        <div>
                          <p className="text-[12px] font-semibold text-theme-success">{flight.carbon_emissions_kg} kg CO₂</p>
                          <p className="text-[12px] font-medium text-theme-success/70 mt-0.5">estimated emissions</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FlightBadge({ variant, icon, label }: { variant: 'emerald' | 'blue' | 'amber' | 'error' | 'muted'; icon: React.ReactNode; label: string }) {
  const styles: Record<string, string> = {
    emerald: 'bg-theme-success/[0.08] text-theme-success border-theme-success/20',
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    amber:   'bg-theme-gold/[0.10] text-theme-gold border-theme-gold/25',
    error:   'bg-theme-error/[0.07] text-theme-error/80 border-theme-error/15',
    muted:   'bg-theme-secondary/[0.05] text-theme-secondary/55 border-theme-secondary/[0.10]',
  };
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-medium border ${styles[variant]}`}>
      {icon} {label}
    </span>
  );
}

function PolicyRow({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-theme-white rounded-lg border-2 border-theme-secondary/[0.08]">
      <span className="flex items-center gap-2 text-[12px] font-medium text-theme-secondary/50">
        {icon} {label}
      </span>
      <span className={`text-[12px] font-semibold ${active ? 'text-theme-secondary/70' : 'text-theme-secondary/35'}`}>
        {value}
      </span>
    </div>
  );
}

function AmenityTile({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 bg-theme-white rounded-lg border-2 transition-colors duration-150 overflow-hidden ${
      active
        ? 'border-theme-secondary/[0.10] text-theme-secondary/70'
        : 'border-theme-secondary/[0.06] opacity-40'
    }`}>
      <span className={`shrink-0 ${active ? 'text-theme-secondary' : 'text-theme-secondary/40'}`}>{icon}</span>
      <span className="text-[12px] font-medium text-theme-secondary/60 truncate capitalize">{label}</span>
    </div>
  );
}