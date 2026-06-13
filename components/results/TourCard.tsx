"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2, ChevronDown, ArrowUpDown, MapPin, Clock,
  Star, Tag, Users, Ticket
} from 'lucide-react';

interface ToursCardProps {
  tours: any[];
}

type SortOption = 'price_asc' | 'price_desc' | 'rating_desc';

// ─── STATE SYSTEM ─────────────────────────────────────────────────────────────
//
//  CARD
//    resting   → border: secondary/10 (2px)   bg: white    shadow: none
//    hover     → border: secondary/30 (2px)   bg: white    shadow: subtle dark lift
//    selected  → border: primary (2px)         bg: white    shadow: warm orange lift
//    left bar  → transparent resting, primary when selected
//
//  BUTTON
//    unselected → secondary bg → hover: primary bg
//    selected   → primary bg

export default function ToursCard({ tours }: ToursCardProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('rating_desc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tripStateStr = sessionStorage.getItem('selected_trip_state');
    if (tripStateStr) {
      try {
        const t = JSON.parse(tripStateStr);
        if (t.tours) setSelectedKeys(t.tours.map((x: any) => x._selectionKey));
      } catch (e) {}
    }
  }, [tours]);

  // Outside-click close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTourSelection = (item: any, key: string) => {
    const tripStateStr = sessionStorage.getItem('selected_trip_state');
    let t = tripStateStr ? JSON.parse(tripStateStr) : {};
    if (!t.tours) t.tours = [];
    if (selectedKeys.includes(key)) {
      t.tours = t.tours.filter((x: any) => x._selectionKey !== key);
      setSelectedKeys(p => p.filter(k => k !== key));
    } else {
      t.tours.push({ ...item, _selectionKey: key });
      setSelectedKeys(p => [...p, key]);
    }
    sessionStorage.setItem('selected_trip_state', JSON.stringify(t));
    window.dispatchEvent(new Event("selected_trip_state_changed"));
  };

  const sortedTours = useMemo(() => {
    if (!tours || !Array.isArray(tours)) return [];
    return [...tours].sort((a, b) => {
      const priceA = parseFloat(a.price?.amount || a.price || a.amount || a.minPrice || '0');
      const priceB = parseFloat(b.price?.amount || b.price || b.amount || b.minPrice || '0');
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      switch (sortBy) {
        case 'price_asc':  return priceA === 0 ? 1 : priceB === 0 ? -1 : priceA - priceB;
        case 'price_desc': return priceB - priceA;
        case 'rating_desc': return ratingB - ratingA;
        default: return 0;
      }
    });
  }, [tours, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    price_asc: 'Price: Low to high',
    price_desc: 'Price: High to low',
    rating_desc: 'Top rated',
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'price_asc',   label: 'Price: Low to high' },
    { value: 'price_desc',  label: 'Price: High to low' },
    { value: 'rating_desc', label: 'Top rated' },
  ];

  if (!tours || tours.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-secondary/[0.12] bg-theme-secondary/[0.03] rounded-lg text-center flex flex-col items-center justify-center min-h-[160px]">
        <Ticket size={28} className="text-theme-secondary/25 mb-3" />
        <p className=" font-semibold text-theme-secondary/50 mb-1">No tours found</p>
        <span className="text-[16px] text-theme-secondary/35 font-medium">Try a different location or date range.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">

      {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-white p-2 rounded-lg border border-theme-soft-slate">
              <div className="flex items-center gap-2.5  text-theme-dark-slate">
                <Ticket size={18} className="text-theme-light-gray/70" />
                <span className="font-medium">
                  <strong className="text-theme-primary font-semibold">{tours.length}</strong>
                  <span className="text-theme-light-slate font-normal"> properties available</span>
                </span>
              </div>

        {/* Sort — secondary→primary, click-controlled */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md  font-semibold transition-colors duration-150 border ${
              sortMenuOpen
                ? 'bg-theme-primary border-theme-primary text-white'
                : 'bg-theme-secondary border-theme-secondary text-white hover:bg-theme-primary hover:border-theme-primary'
            }`}
          >
            <ArrowUpDown size={18} />
            {sortLabels[sortBy]}
            <ChevronDown size={18} className={`transition-transform duration-200 ${sortMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-theme-white border border-theme-secondary/[0.12] rounded-lg shadow-[0_12px_26px_rgba(15,23,42,0.10)] z-[60] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
              {sortOptions.map((opt, i) => (
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

      {/* ── TOURS GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sortedTours.map((tour: any, idx: number) => {
          const uniqueKey = tour.id || `tour-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);

          const priceVal = tour.price?.amount || tour.price || tour.amount || tour.minPrice;
          const currencySymbol = tour.currency === 'EUR' ? '€' : tour.currency === 'GBP' ? '£' : '$';
          const displayPrice = priceVal ? `${currencySymbol}${Number(priceVal).toFixed(0)}` : 'Free';
          const hasImage = !!(tour.picture_url || tour.image || tour.photo);
          const imgSrc = tour.picture_url || tour.image || tour.photo;
          const rating = tour.rating ? parseFloat(tour.rating) : null;
          const reviewCount = tour.review_count || tour.reviews_count || tour.numberOfReviews || null;
          const duration = tour.duration || tour.duration_hours || null;
          const location = tour.location || tour.city || tour.destination || null;
          const groupSize = tour.group_size || tour.maxGroupSize || null;
          const category = tour.category || tour.type || null;
          const pricePerPerson = tour.price_per_person || tour.pricePerPerson || null;

          return (
            <div
              key={uniqueKey}
              onClick={() => toggleTourSelection(tour, uniqueKey)}
              className={`relative group flex flex-col rounded-lg border-2 bg-theme-white cursor-pointer transition-all duration-150 overflow-hidden ${
                isSelected
                  ? 'border-theme-primary shadow-[0_4px_26px_rgba(249,115,22,0.10)]'
                  : 'border-theme-secondary/10 hover:border-theme-secondary/30 hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)]'
              }`}
            >
              {/* ── IMAGE ── */}
              <div className="w-full h-48 sm:h-52 shrink-0 overflow-hidden relative bg-theme-secondary/[0.05]">
                {hasImage ? (
                  <img
                    src={imgSrc}
                    alt={tour.name || tour.title}
                    className="w-full h-full object-cover scale-[1.03] group-hover:scale-100 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Ticket size={36} className="text-theme-secondary/20" />
                  </div>
                )}

                {/* Overlay chips on image */}
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
                  {/* Rating chip */}
                  {rating !== null && (
                    <div className="flex items-center gap-1 bg-theme-white/95 px-2 py-1 rounded-md border border-theme-secondary/[0.12] shadow-sm">
                      <Star size={18} className="fill-theme-gold text-theme-gold" />
                      <span className="text-[16px] font-bold text-theme-secondary leading-none">
                        {rating.toFixed(1)}
                      </span>
                      {reviewCount && (
                        <span className="text-[16px] font-medium text-theme-secondary/45">
                          ({reviewCount})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Category chip */}
                  {category && (
                    <div className="flex items-center gap-1 bg-theme-secondary/80 text-white px-2 py-1 rounded-md shadow-sm">
                      <Tag size={18} />
                      <span className="text-[16px] font-semibold capitalize">{category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CONTENT ── */}
              <div className="flex flex-col flex-1 p-4 sm:p-5 gap-3">

                {/* Title */}
                <div>
                  <h4 className={`font-semibold text-base sm: leading-snug transition-colors duration-150 ${
                    isSelected ? 'text-theme-primary' : 'text-theme-secondary'
                  }`}>
                    {tour.name || tour.title}
                  </h4>

                  {/* Location */}
                  {location && (
                    <p className="flex items-center gap-1 text-[16px] text-theme-secondary/45 font-medium mt-1">
                      <MapPin size={18} className="text-theme-secondary/30 shrink-0" />
                      {location}
                    </p>
                  )}
                </div>

                {/* Description */}
                <p className="text-[16px] text-theme-secondary/55 font-medium leading-relaxed line-clamp-2">
                  {tour.short_description || tour.description || "Explore the highlights of this destination with a knowledgeable local guide."}
                </p>

                {/* Meta row — duration, group size */}
                {(duration || groupSize) && (
                  <div className="flex flex-wrap gap-3">
                    {duration && (
                      <span className="flex items-center gap-1.5 text-[16px] font-medium text-theme-secondary/50">
                        <Clock size={18} className="text-theme-secondary/30" />
                        {typeof duration === 'number' ? `${duration}h` : duration}
                      </span>
                    )}
                    {groupSize && (
                      <span className="flex items-center gap-1.5 text-[16px] font-medium text-theme-secondary/50">
                        <Users size={18} className="text-theme-secondary/30" />
                        Up to {groupSize}
                      </span>
                    )}
                  </div>
                )}

                {/* ── PRICE + CTA ── */}
                <div className="flex items-center justify-between pt-3 mt-auto border-t border-theme-secondary/[0.08]">
                  <div>
                    <p className="text-[16px] font-semibold text-theme-secondary/40 uppercase tracking-wider mb-0.5">
                      {pricePerPerson ? 'Per person' : 'From'}
                    </p>
                    <p className="text-[24px] font-bold text-theme-secondary leading-none tracking-tight tabular-nums">
                      {displayPrice}
                    </p>
                  </div>

                  {/* Button: secondary → primary shift */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTourSelection(tour, uniqueKey); }}
                    className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-md font-semibold  transition-colors duration-150 border active:scale-95 whitespace-nowrap ${
                      isSelected
                        ? 'bg-theme-primary border-theme-primary text-white'
                        : 'bg-theme-secondary border-theme-secondary text-white hover:bg-theme-primary hover:border-theme-primary'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={18} />}
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}