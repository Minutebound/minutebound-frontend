"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';

interface ToursCardProps {
  tours: any[];
}

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc';

export default function ToursCard({ tours }: ToursCardProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  
  useEffect(() => { 
    const tripStateStr = sessionStorage.getItem('selected_trip_state'); 
    if (tripStateStr) { 
      try { 
        const t = JSON.parse(tripStateStr); 
        if (t.tours) setSelectedKeys(t.tours.map((x: any) => x._selectionKey)); 
      } catch (e) {} 
    } 
  }, [tours]);
  
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

  // ROBUST SORTING LOGIC
  const sortedTours = useMemo(() => {
    if (!tours || !Array.isArray(tours)) return [];
    
    // Copy the array to avoid mutating the prop directly
    const toursCopy = [...tours];

    return toursCopy.sort((a, b) => {
      // Safely extract prices handling various API string/number formats
      const priceA = parseFloat(a.price?.amount || a.price || a.amount || a.minPrice || '0');
      const priceB = parseFloat(b.price?.amount || b.price || b.amount || b.minPrice || '0');
      
      // Safely extract ratings
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;

      switch (sortBy) {
        case 'price_asc':
          // Push free/unknown (0) prices to the bottom
          if (priceA === 0) return 1;
          if (priceB === 0) return -1;
          return priceA - priceB;
        case 'price_desc':
          return priceB - priceA;
        case 'rating_desc':
          return ratingB - ratingA;
        case 'recommended':
        default:
          return 0; // Default API order
      }
    });
  }, [tours, sortBy]);

  // Handle Display Name for Dropdown
  const getSortLabel = () => {
    switch (sortBy) {
      case 'price_asc': return 'Low to High (Price)';
      case 'price_desc': return 'High to Low (Price)';
      default: return 'Recommended';
    }
  };

  if (!tours || tours.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-secondary/20 bg-theme-secondary/5 rounded-[1rem] text-center flex items-center justify-center min-h-[124px]">
        <span className="text-[10px] text-theme-secondary/40 font-black tracking-widest uppercase">
          No tours or activities found for this location.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      
      {/* STICKY SORT TOOLBAR */}
      <div className="sticky top-[248px] z-[45] bg-theme-white py-3 border-b border-theme-secondary/10 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary/60">
          {tours.length} Tours available
        </span>

        <div className="relative group z-[50]">
          <button className="flex items-center gap-2 px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Sort: {getSortLabel()}
            <ChevronDown size={12} />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-theme-white border border-theme-secondary/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden flex flex-col">
            <button onClick={() => setSortBy('recommended')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 border-b border-theme-secondary/5 ${sortBy === 'recommended' ? 'text-theme-primary' : 'text-theme-secondary'}`}>
              Recommended
            </button>
            <button onClick={() => setSortBy('price_asc')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 border-b border-theme-secondary/5 ${sortBy === 'price_asc' ? 'text-theme-primary' : 'text-theme-secondary'}`}>
              Price: Low to High
            </button>
            <button onClick={() => setSortBy('price_desc')} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 border-b border-theme-secondary/5 ${sortBy === 'price_desc' ? 'text-theme-primary' : 'text-theme-secondary'}`}>
              Price: High to Low
            </button>
          </div>
        </div>
      </div>

      {/* TOURS GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {sortedTours.map((tour: any, idx: number) => {
          const uniqueKey = tour.id || `tour-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);
          
          // Determine Price Display
          const priceVal = tour.price?.amount || tour.price || tour.amount || tour.minPrice;
          const displayPrice = priceVal 
            ? `${tour.currency === 'USD' ? '$' : tour.currency === 'EUR' ? '€' : (tour.currency || '$')}${Number(priceVal).toFixed(0)}` 
            : 'Free';

          return (
            <div 
              key={uniqueKey} 
              onClick={() => toggleTourSelection(tour, uniqueKey)}
              className={`group border-[1px] rounded-[1rem] p-4 sm:p-6 transition-all duration-300 flex flex-col gap-5 cursor-pointer overflow-hidden ${isSelected ? 'border-theme-primary bg-theme-primary/10' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-primary'}`}
            >
              {tour.picture_url || tour.image || tour.photo ? (
                <div className="w-full h-48 sm:h-56 rounded-sm shrink-0 shadow-sm border border-theme-secondary/10 overflow-hidden relative">
                  <img 
                    src={tour.picture_url || tour.image || tour.photo} 
                    alt={tour.name || tour.title} 
                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out" 
                  />
                  {tour.rating && (
                    <div className="absolute top-3 left-3 bg-theme-white/90 backdrop-blur-sm px-2 py-1 rounded border border-theme-secondary/10 flex items-center gap-1 shadow-sm">
                      <span className="text-[10px] font-black text-theme-secondary">⭐ {parseFloat(tour.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 sm:h-56 bg-theme-surface text-theme-primary flex items-center justify-center rounded-sm shrink-0 text-5xl border border-theme-secondary/10">🎟️</div>
              )}
              
              <div className="flex flex-col flex-1 justify-between gap-4">
                <div>
                  <h4 className="font-black text-theme-secondary text-lg sm:text-xl leading-tight mb-2">
                    {tour.name || tour.title}
                  </h4>
                  <p className=" text-theme-secondary/60 line-clamp-3 leading-relaxed font-bold">
                    {tour.short_description || tour.description || "Experience the best of the local culture and sights with this guided tour."}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-theme-secondary/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-[10px] font-black text-theme-secondary/40 uppercase tracking-widest mb-0.5">Price</span>
                    <span className="text-2xl sm:text-[24px] font-black text-theme-secondary leading-none tracking-tighter">
                      {displayPrice}
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleTourSelection(tour, uniqueKey); }} 
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-[100px] font-black text-[10px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isSelected ? "bg-theme-secondary text-theme-white" : "bg-theme-primary text-theme-white hover:bg-theme-primary/90"}`}
                  >
                    {isSelected ? <CheckCircle2 size={16} /> : null}
                    {isSelected ? 'Selected' : 'Select Tour'}
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