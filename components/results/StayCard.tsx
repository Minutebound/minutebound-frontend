"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MapPin,
  BedDouble,
  Info,
  Building,
  ArrowUpDown,
  Lock,
  Unlock,
  Users,
  Maximize2,
  Wind,
  Coffee,
  Wifi,
  Car,
  Dumbbell,
  Eye,
  Layers,
  Tag,
  CalendarX,
  ShieldCheck,
  ShieldAlert,
  Moon,
  SunMedium,
  UtensilsCrossed,
  Utensils,
  BadgePercent,
  Cigarette,
  CigaretteOff,
  Star,
} from "lucide-react";

type SortOption = 'price_asc' | 'price_desc';

const getNumNights = (start?: string, end?: string) => {
  if (!start || !end || end.trim() === "") return 1;
  return Math.max(1, Math.ceil(Math.abs(new Date(end).getTime() - new Date(start).getTime()) / 86400000));
};

const formatAddress = (address: any) => {
  if (!address) return "Location unavailable";
  if (typeof address === "string") return address;
  const parts = [address.lines?.join(", "), address.cityName, address.stateCode, address.countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Days until a deadline
const daysUntil = (dateString: string) => {
  if (!dateString) return null;
  const diff = new Date(dateString).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const getAmenityIcon = (amenity: string) => {
  const k = amenity.toLowerCase();
  if (k.includes('wifi') || k.includes('internet')) return <Wifi size={18} />;
  if (k.includes('parking')) return <Car size={18} />;
  if (k.includes('breakfast') || k.includes('coffee')) return <Coffee size={18} />;
  if (k.includes('gym') || k.includes('fitness')) return <Dumbbell size={18} />;
  if (k.includes('air') || k.includes('climate') || k.includes('ac')) return <Wind size={18} />;
  return null;
};

// Derive board basis label from rate plan / meal codes
const getBoardLabel = (room: any): string | null => {
  const src = (room.rate_plan_name || room.board_basis || room.meal_plan || '').toLowerCase();
  if (src.includes('all inclusive') || src.includes('all-inclusive')) return 'All Inclusive';
  if (src.includes('full board') || src.includes('fb')) return 'Full Board';
  if (src.includes('half board') || src.includes('hb') || src.includes('dinner')) return 'Half Board';
  if (src.includes('breakfast') || src.includes('bb')) return 'Breakfast Included';
  if (src.includes('room only') || src.includes('ro') || src.includes('ep')) return 'Room Only';
  return null;
};

const BoardBadge = ({ label }: { label: string }) => {
  const isInclusive = label.toLowerCase().includes('inclusive') || label.toLowerCase().includes('board') || label.toLowerCase().includes('breakfast');
  return (
    <span className={`inline-flex items-center gap-1 text-[16px] font-semibold px-2 py-0.5 rounded border ${
      isInclusive
        ? 'bg-theme-secondary/[0.06] text-theme-secondary border-theme-secondary/20'
        : 'bg-theme-cool-white text-theme-light-slate border-theme-soft-slate'
    }`}>
      {isInclusive ? <Utensils size={18} /> : <UtensilsCrossed size={18} />}
      {label}
    </span>
  );
};

// ─── CANCELLATION URGENCY INDICATOR ──────────────────────────────────────────
const CancellationPolicyBlock = ({ policies, isRefundable }: { policies: any[]; isRefundable: boolean }) => {
  if (!policies || policies.length === 0) {
    return isRefundable ? (
      <div className="flex items-center gap-1.5 text-theme-success">
        <ShieldCheck size={18} />
        <span className="text-[16px] font-semibold">Free cancellation — no deadline</span>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {policies.map((pol: any, idx: number) => {
        const days = daysUntil(pol.deadline);
        const isUrgent = days !== null && days <= 3;
        const isSoon = days !== null && days > 3 && days <= 7;
        return (
          <div key={idx} className={`flex items-start gap-2 px-2.5 py-2 rounded-md border text-[16px] font-medium ${
            isUrgent
              ? 'bg-theme-error/[0.05] border-theme-error/20 text-theme-error/80'
              : isSoon
              ? 'bg-theme-gold/[0.07] border-theme-gold/25 text-theme-dark-slate'
              : 'bg-theme-cool-white border-theme-soft-slate text-theme-light-slate'
          }`}>
            <CalendarX size={18} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span>
                <strong>${parseFloat(pol.amount).toFixed(2)}</strong> fee if cancelled after{' '}
                <strong>{formatDateTime(pol.deadline)}</strong>
              </span>
              {days !== null && (
                <span className={`text-[16px] font-semibold ${isUrgent ? 'text-theme-error' : isSoon ? 'text-theme-gold' : 'text-theme-light-gray'}`}>
                  {days <= 0 ? 'Deadline passed' : isUrgent ? `⚠ ${days}d remaining` : isSoon ? `${days} days remaining` : `${days} days away`}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── ROOM DETAIL ROW ──────────────────────────────────────────────────────────
const RoomDetailRow = ({ stay, uniqueKey, isSelected, selectedRoomIndex, toggleStaySelection, numNights }: any) => {
  const offer = stay.roomDetails;
  if (!offer?.rooms) return null;

  return (
    <div className="border-t border-theme-soft-slate rounded-b-lg" style={{ background: 'rgba(248,250,252,0.8)' }}>

      {/* Table header */}
      <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b border-theme-soft-slate text-[16px] font-semibold text-theme-light-gray uppercase tracking-wider">
        <div className="col-span-4">Room & Configuration</div>
        <div className="col-span-3">Inclusions & Policy</div>
        <div className="col-span-2">Amenities</div>
        <div className="col-span-1 text-right">Per Night</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      <div className="flex flex-col">
        {offer.rooms.map((room: any, i: number) => {
          const isThisRoomSelected = isSelected && selectedRoomIndex === i;
          const boardLabel = getBoardLabel(room);
          const roomAmenities: string[] = room.amenities || room.room_amenities || [];
          const roomSize = room.size || room.square_meters || room.sqm || null;
          const viewType = room.view || room.view_type || room.room_view || null;
          const floorLevel = room.floor || room.floor_level || null;
          const maxOccupancy = room.max_occupancy || room.occupancy || null;
          const smokingPolicy = room.smoking !== undefined ? room.smoking : (room.smoking_allowed !== undefined ? room.smoking_allowed : null);
          const ratePlanName = room.rate_plan_name || room.rate_plan || room.plan_name || null;

          return (
            <div
              key={i}
              onClick={() => toggleStaySelection(stay, uniqueKey, i)}
              className={`relative flex flex-col lg:grid lg:grid-cols-12 gap-3 px-4 lg:px-5 py-4 cursor-pointer transition-colors duration-100 ${
                isThisRoomSelected
                  ? 'bg-theme-surface/60'
                  : 'hover:bg-theme-white'
              }`}
            >

              {/* ── COL 1: Room Identity & Configuration (4 cols) ── */}
              <div className="col-span-4 flex flex-col gap-2">

                {/* Room name + rate plan */}
                <div>
                  <p className={`font-semibold  leading-snug transition-colors duration-150 ${
                    isThisRoomSelected ? 'text-theme-primary' : 'text-theme-dark-slate'
                  }`}>
                    {room.category === "ROOM" ? "Standard Room" : room.category || room.room_name || "Standard Room"}
                  </p>
                  {ratePlanName && (
                    <p className="text-[16px] text-theme-light-gray mt-0.5 flex items-center gap-1">
                      <Tag size={18} /> {ratePlanName}
                    </p>
                  )}
                </div>

                {/* Room description
                {room.description && (
                  <p className="text-[16px] text-theme-light-slate leading-relaxed line-clamp-2">
                    {room.description.replace(/\n/g, ' ')}
                  </p>
                )} */}

                {/* Physical attributes grid */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-0.5">
                  {/* Bed configuration */}
                  <span className="flex items-center gap-1.5 text-[16px] text-theme-light-slate">
                    <BedDouble size={18} className="text-theme-secondary/50" />
                    {room.beds_count ? `${room.beds_count}× ` : ''}{room.bed_type || 'Standard Bed'}
                  </span>

                  {/* Max occupancy */}
                  {maxOccupancy && (
                    <span className="flex items-center gap-1.5 text-[16px] text-theme-light-slate">
                      <Users size={18} className="text-theme-secondary/50" />
                      Up to {maxOccupancy} guests
                    </span>
                  )}

                  {/* Room size */}
                  {roomSize && (
                    <span className="flex items-center gap-1.5 text-[16px] text-theme-light-slate">
                      <Maximize2 size={18} className="text-theme-secondary/50" />
                      {roomSize} m²
                    </span>
                  )}

                  {/* View */}
                  {viewType && (
                    <span className="flex items-center gap-1.5 text-[16px] text-theme-light-slate">
                      <Eye size={18} className="text-theme-secondary/50" />
                      {viewType}
                    </span>
                  )}

                  {/* Floor */}
                  {floorLevel && (
                    <span className="flex items-center gap-1.5 text-[16px] text-theme-light-slate">
                      <Layers size={18} className="text-theme-secondary/50" />
                      Floor {floorLevel}
                    </span>
                  )}

                  {/* Smoking policy */}
                  {smokingPolicy !== null && (
                    <span className={`flex items-center gap-1.5 text-[16px] ${smokingPolicy ? 'text-theme-light-slate' : 'text-theme-light-slate'}`}>
                      {smokingPolicy
                        ? <Cigarette size={18} className="text-theme-light-gray" />
                        : <CigaretteOff size={18} className="text-theme-light-gray" />}
                      {smokingPolicy ? 'Smoking' : 'Non-smoking'}
                    </span>
                  )}
                </div>
              </div>

              {/* ── COL 2: Inclusions & Policy (3 cols) ── */}
              <div className="col-span-3 flex flex-col gap-2.5">

                {/* Board basis */}
                {boardLabel && <BoardBadge label={boardLabel} />}

                {/* Refundability */}
                <div>
                  {room.is_refundable ? (
                    <span className="inline-flex items-center gap-1.5 text-theme-success bg-theme-success/[0.08] border border-theme-success/20 px-2 py-1 rounded text-[16px] font-semibold">
                      <Unlock size={18} /> Free cancellation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-theme-light-slate bg-theme-white border border-theme-soft-slate px-2 py-1 rounded text-[16px] font-semibold">
                      <Lock size={18} /> Non-refundable
                    </span>
                  )}
                </div>

                {/* Cancellation policies */}
                <CancellationPolicyBlock
                  policies={room.cancellation_policies || []}
                  isRefundable={!!room.is_refundable}
                />
              </div>

              {/* ── COL 3: Room-level Amenities (2 cols) ── */}
              <div className="col-span-2 flex flex-col gap-1.5">
                {roomAmenities.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-1">
                      {roomAmenities.slice(0, 5).map((a: string, ai: number) => {
                        const icon = getAmenityIcon(a);
                        return (
                          <span key={ai} className="flex items-center gap-1.5 text-[16px] text-theme-light-slate capitalize">
                            <span className="text-theme-secondary/40">{icon || <Star size={18} />}</span>
                            {a.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        );
                      })}
                    </div>
                    {roomAmenities.length > 5 && (
                      <span className="text-[16px] font-medium text-theme-light-gray">
                        +{roomAmenities.length - 5} more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[16px] text-theme-light-gray/60 italic">
                    Standard amenities
                  </span>
                )}
              </div>

              {/* ── COL 4: Per-night price (1 col) ── */}
              <div className="col-span-1 flex flex-col items-end justify-center gap-0.5">
                <p className="text-base font-bold text-theme-dark-slate leading-none">
                  ${(room.price / numNights).toFixed(0)}
                </p>
                <p className="text-[16px] text-theme-light-gray leading-none">/night</p>
              </div>

              {/* ── COL 5: Action (2 cols) ── */}
              <div className="col-span-2 flex flex-col items-end justify-center gap-2">
                {/* Select button:
                    unselected → secondary (dark green) bg, white text
                    hover      → primary (orange) bg  — attractive color shift
                    selected   → primary bg + check   */}
                <button className={`w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md font-semibold text-[16px] transition-colors duration-150 border ${
                  isThisRoomSelected
                    ? 'bg-theme-primary border-theme-primary text-white'
                    : 'bg-theme-secondary border-theme-secondary text-white hover:bg-theme-primary hover:border-theme-primary'
                }`}>
                  {isThisRoomSelected ? <><CheckCircle2 size={18} /> Selected</> : "Select Room"}
                </button>

                {/* Price-per-night mobile fallback label */}
                <p className="lg:hidden text-[16px] text-theme-light-gray text-right">
                  ${(room.price / numNights).toFixed(2)}/night · ${room.price.toFixed(2)} total
                </p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── STAY CARD ────────────────────────────────────────────────────────────────
const StayRow = ({ stay, uniqueKey, isSelected, selectedRoomIndex, toggleStaySelection, searchParams }: any) => {
  const offer = stay.roomDetails;
  const isUnavailable = offer?.unavailable || !offer || (offer.rooms && offer.rooms.length === 0);
  const numNights = getNumNights(searchParams?.startDate, searchParams?.endDate);
  const [isExpanded, setIsExpanded] = useState(isSelected);
  const chainCode = stay.chainCode || stay.hotel?.chainCode || offer?.rooms?.[0]?.chain_code || null;

  useEffect(() => {
    if (isSelected) setIsExpanded(true);
  }, [isSelected]);

  return (
    <div className={`flex flex-col rounded-lg border-2 bg-theme-white transition-all duration-150 ${
      isSelected
        ? 'border-theme-primary shadow-[0_4px_26px_rgba(249,115,22,0.10)]'
        : 'border-theme-soft-slate hover:border-theme-light-slate/40 hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]'
    }`}>

      {/* HOTEL SUMMARY */}
      <div
        className="flex flex-col md:flex-row p-4 md:p-5 gap-5 cursor-pointer"
        onClick={() => { if (!isUnavailable) setIsExpanded(!isExpanded); }}
      >
        {/* Thumbnail */}
        <div className="w-full md:w-40 h-32 md:h-auto bg-theme-cool-white rounded-md border border-theme-soft-slate flex flex-col items-center justify-center shrink-0 text-theme-light-gray relative">
          <ImageIcon size={28} className="mb-2 opacity-40" />
          <span className="text-[16px] font-medium uppercase tracking-wide opacity-50">No Image</span>
        </div>

        {/* Core Details */}
        <div className="flex flex-col flex-1 justify-center">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold  md: leading-tight transition-colors duration-150 ${
              isSelected ? 'text-theme-primary' : 'text-theme-dark-slate'
            }`}>
              {stay.name || stay.hotel?.name || "Standard Accommodation"}
            </h3>
            {chainCode && (
              <span className="flex items-center gap-1 bg-theme-cool-white text-theme-light-slate px-2 py-0.5 rounded text-[16px] font-medium border border-theme-soft-slate">
                <Building size={18} /> {chainCode}
              </span>
            )}
          </div>

          <p className=" text-theme-light-gray flex items-start gap-1.5 mb-3">
            <MapPin size={18} className="shrink-0 mt-0.5 text-theme-light-slate/50" />
            {formatAddress(stay.address)}
          </p>

          {offer?.rooms?.[0]?.amenities && offer.rooms[0].amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {offer.rooms[0].amenities.slice(0, 4).map((amenity: string, idx: number) => (
                <span key={idx} className="text-[16px] text-theme-light-slate bg-theme-cool-white px-2 py-1 rounded border border-theme-soft-slate capitalize">
                  {amenity.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
              {offer.rooms[0].amenities.length > 4 && (
                <span className="text-[16px] font-medium text-theme-light-gray self-center px-1">
                  +{offer.rooms[0].amenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price + Actions */}
        <div
          className="flex flex-row md:flex-col justify-between items-center md:items-end shrink-0 md:pl-6 md:border-l border-theme-soft-slate md:min-w-[164px]"
          onClick={(e) => e.stopPropagation()}
        >
          {!isUnavailable && offer ? (
            <div className="text-left md:text-right">
              <p className="text-[16px] font-semibold text-theme-light-gray mb-0.5 uppercase tracking-wider">Starting At</p>
              <p className=" md:text-[24px] font-bold text-theme-dark-slate leading-none">
                ${offer.price?.toFixed(2)}
              </p>
              <p className="text-[16px] text-theme-light-slate mt-1">
                {numNights} {numNights > 1 ? 'nights' : 'night'}
              </p>
            </div>
          ) : (
            <span className="text-theme-error text-[16px] font-semibold uppercase tracking-wide border border-theme-error/30 px-3 py-1.5 rounded bg-theme-error/[0.05]">
              Sold Out
            </span>
          )}

          <div className="flex flex-col gap-2 mt-4 w-full md:w-auto">
            {!isUnavailable && (
              /* "View Rooms" toggle:
                 resting   → secondary (dark green) bg, white text
                 hover     → primary (orange) bg — attractive shift
                 expanded  → lighter ghost state to signal it's open */
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`hidden md:flex w-full items-center justify-center gap-1.5 px-4 py-2 rounded-md font-semibold  transition-colors duration-150 border ${
                  isExpanded
                    ? 'bg-theme-cool-white border-theme-soft-slate text-theme-dark-slate/70 hover:bg-theme-soft-slate'
                    : 'bg-theme-secondary border-theme-secondary text-white hover:bg-theme-primary hover:border-theme-primary'
                }`}
              >
                {isExpanded ? "Close Rooms" : `View ${offer?.rooms?.length || 0} Rooms`}
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ROOMS SECTION */}
      {isExpanded && offer?.rooms && !isUnavailable && (
        <RoomDetailRow
          stay={stay}
          uniqueKey={uniqueKey}
          isSelected={isSelected}
          selectedRoomIndex={selectedRoomIndex}
          toggleStaySelection={toggleStaySelection}
          numNights={numNights}
        />
      )}
    </div>
  );
};

// ─── MAIN WRAPPER ─────────────────────────────────────────────────────────────
export default function StaysCard({ stays, searchParams }: { stays: any[]; searchParams?: any; }) {
  const [selectedStayKey, setSelectedStayKey] = useState<string | null>(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tripState = sessionStorage.getItem("selected_trip_state");
    if (tripState) {
      try {
        const parsed = JSON.parse(tripState);
        if (parsed.stays && parsed.stays.length > 0) {
          setSelectedStayKey(parsed.stays[0]._selectionKey);
          setSelectedRoomIndex(parsed.stays[0]._selectedRoomIndex || 0);
        } else {
          setSelectedStayKey(null);
        }
      } catch (e) {}
    }
  }, [stays]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleStaySelection = (stay: any, uniqueKey: string, roomIndex: number = 0) => {
    const tripStateStr = sessionStorage.getItem("selected_trip_state");
    let tripState = tripStateStr ? JSON.parse(tripStateStr) : {};
    if (selectedStayKey === uniqueKey && selectedRoomIndex === roomIndex) {
      tripState.stays = [];
      setSelectedStayKey(null);
    } else {
      tripState.stays = [{ ...stay, _selectionKey: uniqueKey, offerDetails: stay.roomDetails, _selectedRoomIndex: roomIndex }];
      setSelectedStayKey(uniqueKey);
      setSelectedRoomIndex(roomIndex);
    }
    sessionStorage.setItem("selected_trip_state", JSON.stringify(tripState));
    window.dispatchEvent(new Event("selected_trip_state_changed"));
  };

  const sortedStays = useMemo(() => {
    if (!stays || !Array.isArray(stays)) return [];
    return [...stays].sort((a, b) => {
      const priceA = a.roomDetails?.price || a.price || Infinity;
      const priceB = b.roomDetails?.price || b.price || Infinity;
      const aUnavail = a.roomDetails?.unavailable || !a.roomDetails || a.roomDetails.rooms?.length === 0;
      const bUnavail = b.roomDetails?.unavailable || !b.roomDetails || b.roomDetails.rooms?.length === 0;
      if (aUnavail && !bUnavail) return 1;
      if (!aUnavail && bUnavail) return -1;
      return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  }, [stays, sortBy]);

  if (!stays || stays.length === 0) {
    return (
      <div className="p-8 border border-dashed border-theme-soft-slate bg-theme-cool-white rounded-lg text-center flex flex-col items-center justify-center min-h-[200px]">
        <Info size={32} className="text-theme-light-gray/50 mb-4" />
        <h4 className="text-base text-theme-dark-slate font-semibold mb-1">No accommodations found</h4>
        <span className=" text-theme-light-slate/70">Try adjusting your filters or date range.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-white p-2 rounded-lg border border-theme-soft-slate">
        <div className="flex items-center gap-2.5  text-theme-dark-slate">
          <Building size={18} className="text-theme-light-gray/70" />
          <span className="font-medium">
            <strong className="text-theme-primary font-semibold">{stays.length}</strong>
            <span className="text-theme-light-slate font-normal"> properties available</span>
          </span>
        </div>

        <div className="relative w-full sm:w-auto" ref={sortRef}>
          {/* Sort button: secondary color when closed, slight highlight when open */}
          <button
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            className={`w-full sm:w-auto flex justify-between items-center gap-3 px-4 py-2 border rounded-md  font-semibold transition-colors duration-150 ${
              sortMenuOpen
                ? 'bg-theme-secondary border-theme-secondary text-white'
                : 'bg-theme-secondary border-theme-secondary text-white hover:bg-theme-primary hover:border-theme-primary'
            }`}
          >
            <span className="flex items-center gap-2">
              <ArrowUpDown size={18} />
              Sort: {sortBy === 'price_asc' ? 'Lowest Price' : 'Highest Price'}
            </span>
            <ChevronDown size={18} className={`transition-transform duration-200 ${sortMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-full sm:w-48 bg-theme-white border border-theme-soft-slate rounded-md shadow-[0_12px_26px_rgba(15,23,42,0.08)] z-10 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => { setSortBy('price_asc'); setSortMenuOpen(false); }}
                className={`text-left px-4 py-3  font-medium transition-colors duration-100 ${
                  sortBy === 'price_asc'
                    ? 'bg-theme-secondary/[0.07] text-theme-secondary font-semibold'
                    : 'text-theme-dark-slate hover:bg-theme-cool-white'
                }`}
              >
                Lowest Price First
              </button>
              <button
                onClick={() => { setSortBy('price_desc'); setSortMenuOpen(false); }}
                className={`text-left px-4 py-3  font-medium transition-colors duration-100 border-t border-theme-soft-slate ${
                  sortBy === 'price_desc'
                    ? 'bg-theme-secondary/[0.07] text-theme-secondary font-semibold'
                    : 'text-theme-dark-slate hover:bg-theme-cool-white'
                }`}
              >
                Highest Price First
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {sortedStays.slice(0, 12).map((stay, idx) => {
          const uniqueKey = stay.hotel_id || stay.hotelId || stay.hotel?.hotelId || stay.id || `stay-${idx}`;
          return (
            <StayRow
              key={uniqueKey}
              stay={stay}
              uniqueKey={uniqueKey}
              isSelected={selectedStayKey === uniqueKey}
              selectedRoomIndex={selectedRoomIndex}
              toggleStaySelection={toggleStaySelection}
              searchParams={searchParams}
            />
          );
        })}
      </div>
    </div>
  );
}