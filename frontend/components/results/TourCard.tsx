"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';

interface ToursCardProps {
  tours: any[];
}

type SortOption = 'price_asc' | 'price_desc';

export default function ToursCard({ tours }: ToursCardProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  
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

  const sortedTours = useMemo(() => {
    if (!tours || !Array.isArray(tours)) return [];
    return [...tours].sort((a, b) => {
      const priceA = parseFloat(a.price?.amount || a.price || '0');
      const priceB = parseFloat(b.price?.amount || b.price || '0');
      return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  }, [tours, sortBy]);

  if (!tours || tours.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-theme-secondary/20 bg-theme-secondary/5 rounded-[1rem] text-center flex items-center justify-center min-h-[124px]">
        <span className="text-[8px] text-theme-secondary/40 font-black tracking-widest uppercase">
          No tours or activities found for this location.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
{/* STICKY TOURS HEADER */}
      <div className="sticky top-[113px] z-[45] bg-theme-white py-3 border-b border-theme-secondary/10 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary/60">
          {tours.length} Activities available
        </span>

        <div className="relative group z-[50]">
          <button className="flex items-center gap-2 px-4 py-2 bg-theme-primary/10 text-theme-primary rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
            Sort: {sortBy === 'price_asc' ? 'Low to High (Price)' : 'High to Low (Price)'}
            <ChevronDown size={12} />
          </button>
          
          <div className="absolute right-0 mt-2 w-48 bg-theme-white border border-theme-secondary/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
            <button onClick={() => setSortBy('price_asc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 text-theme-secondary border-b border-theme-secondary/5">
              Price: Low to High
            </button>
            <button onClick={() => setSortBy('price_desc')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-theme-primary/10 text-theme-secondary">
              Price: High to Low
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {sortedTours.map((tour: any, idx: number) => {
          const uniqueKey = tour.id || `tour-${idx}`;
          const isSelected = selectedKeys.includes(uniqueKey);

          return (
            <div 
              key={uniqueKey} 
              onClick={() => toggleTourSelection(tour, uniqueKey)}
              className={`group border-[1px] rounded-[1rem] p-4 sm:p-6 transition-all duration-300 flex flex-col gap-5 cursor-pointer overflow-hidden ${isSelected ? 'border-theme-primary bg-theme-primary/10' : 'border-theme-secondary/10 bg-theme-white hover:border-theme-primary'}`}
            >
              {tour.picture_url ? (
                <div className="w-full h-48 sm:h-56 rounded-sm shrink-0 shadow-sm border border-theme-secondary/10 overflow-hidden relative">
                  <img src={tour.picture_url} alt={tour.name} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out" />
                </div>
              ) : (
                <div className="w-full h-48 sm:h-56 bg-theme-surface text-theme-primary flex items-center justify-center rounded-sm shrink-0 text-5xl border border-theme-secondary/10">🎟️</div>
              )}
              
              <div className="flex flex-col flex-1 justify-between gap-4">
                <div>
                  <h4 className="font-black text-theme-secondary text-lg sm:text-xl leading-tight mb-2">{tour.name}</h4>
                  <p className=" text-theme-secondary/60 line-clamp-3 leading-relaxed font-bold">
                    {tour.short_description || "Experience the best of the local culture and sights with this guided tour."}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 mt-auto border-t border-theme-secondary/10">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[8px] font-black text-theme-secondary/40 uppercase tracking-widest mb-0.5">Price</span>
                    <span className="text-2xl sm:text-[26px] font-black text-theme-secondary leading-none tracking-tighter">
                      {tour.price ? `${tour.currency === 'USD' ? '$' : tour.currency === 'EUR' ? '€' : tour.currency}${Number(tour.price.amount || tour.price).toFixed(0)}` : 'Free'}
                    </span>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleTourSelection(tour, uniqueKey); }} 
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-[100px] font-black text-[8px] sm:text-[8px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap ${isSelected ? "bg-theme-secondary text-theme-white" : "bg-theme-primary text-theme-white hover:bg-theme-primary/90"}`}
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