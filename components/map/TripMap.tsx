"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import { renderToString } from "react-dom/server";
import { Hotel, FlagTriangleRight, CalendarDays } from "lucide-react";

interface TripMapProps {
  mapData?: any;
  tripData?: any;
}

// --- HELPER: Builds the beautiful hover card HTML ---
const buildHoverCard = (name: string, category: string, detailLeft: string, detailRight: string) => {
  return `
    <div class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none bg-theme-white text-theme-secondary p-3 rounded-[16px] shadow-[16px] z-50 flex flex-col gap-1 min-w-[160px] max-w-[216px] border border-theme-secondary/10 translate-y-2 group-hover:translate-y-0">
      <span class="font-black  leading-tight line-clamp-2 break-words">${name}</span>
      ${category ? `<span class="font-bold text-[16px] uppercase tracking-widest text-theme-primary line-clamp-1">${category}</span>` : ''}
      ${(detailLeft || detailRight) ? `
      <div class="flex items-center justify-between mt-1 pt-1.5 border-t border-theme-secondary/10">
         <span class="font-black text-[16px]text-theme-secondary">${detailLeft || ''}</span>
         <span class="font-bold text-[16px] text-theme-secondary/50">${detailRight || ''}</span>
      </div>` : ''}
      <div class="w-3 h-3 bg-theme-white border-b border-r border-theme-secondary/10 absolute -bottom-1.5 left-1/2 -translate-x-1/2 rotate-45"></div>
    </div>
  `;
};

export default function TripMap({ mapData }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isInitialMount = useRef(true);

  const staticMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [radiusValue, setRadiusValue] = useState<number>(10);
  const [currentTripState, setCurrentTripState] = useState<any>({});
  const [sessionResults, setSessionResults] = useState<any>({});

  const calculateZoomFromRadius = (miles: number) => 14.5 - Math.log2(Math.max(1, miles));

  // 1. Separated Event Listeners
  useEffect(() => {
    const loadSelectionData = () => {
      const stateStr = sessionStorage.getItem("selected_trip_state");
      if (stateStr) {
        try { setCurrentTripState(JSON.parse(stateStr)); } catch (e) {}
      } else {
        setCurrentTripState({});
      }
    };

    const loadSearchData = () => {
      const sessionStr = sessionStorage.getItem("current_trip_results");
      if (sessionStr) {
        try { setSessionResults(JSON.parse(sessionStr)); } catch (e) {}
      } else {
        setSessionResults({});
      }
    };

    loadSelectionData();
    loadSearchData();

    window.addEventListener("selected_trip_state_changed", loadSelectionData);
    window.addEventListener("current_trip_results_changed", loadSearchData);

    return () => {
      window.removeEventListener("selected_trip_state_changed", loadSelectionData);
      window.removeEventListener("current_trip_results_changed", loadSearchData);
    };
  }, []);

  // 2. Initialize Map & Base Theme
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let initialCenter: [number, number] = [-105.2705, 40.015];
    let initialZoom = 15;

    const savedViewState = localStorage.getItem("map_view_state");
    if (savedViewState) {
      try {
        const { lng, lat, zoom } = JSON.parse(savedViewState);
        if (lng !== undefined && lat !== undefined && zoom !== undefined) {
          initialCenter = [lng, lat];
          initialZoom = zoom;
        }
      } catch (e) {}
    } else {
      const searchStateStr = localStorage.getItem("search_state");
      if (searchStateStr) {
        try {
          const { destination, radius } = JSON.parse(searchStateStr);
          if (destination?.lat && destination?.lon) {
            initialCenter = [destination.lon, destination.lat];
            const r = radius ? Math.max(1, Math.min(25, radius)) : 10;
            initialZoom = calculateZoomFromRadius(r);
          }
        } catch (e) {}
      }
    }

    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.protomaps.com/styles/v5/light/en.json?key=${process.env.NEXT_PUBLIC_PROTOMAPS_KEY}`,
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    const saveMapState = () => {
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      localStorage.setItem("map_view_state", JSON.stringify({
        lng: center.lng,
        lat: center.lat,
        zoom: zoom
      }));
    };

    mapRef.current.on('moveend', saveMapState);
    mapRef.current.on('zoomend', saveMapState);

    mapRef.current.addControl(new maplibregl.AttributionControl({ compact: false }), "bottom-right");
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;
      const layers = mapRef.current.getStyle().layers;

      layers.forEach((layer) => {
        if (layer.id === "background") mapRef.current!.setPaintProperty(layer.id, "background-color", "#F3F4F6");
        if (layer.id === "earth" || layer.id.includes("land")) {
          try { mapRef.current!.setPaintProperty(layer.id, "fill-color", "#F3F4F6"); } catch (e) {}
        }
        if (layer.id.includes("water") && layer.type === "fill") {
          try { mapRef.current!.setPaintProperty(layer.id, "fill-color", "#E5E7EB"); } catch (e) {}
        }
        if (layer.id.includes("transit_") && layer.type === "line") {
          try {
            mapRef.current!.setPaintProperty(layer.id, "line-color", "#111827");
            mapRef.current!.setPaintProperty(layer.id, "line-opacity", layer.id.includes("minor") ? 0.05 : 0.15);
          } catch (e) {}
        }
        if (layer.id.includes("buildings") && layer.type === "fill") {
          try {
            mapRef.current!.setLayoutProperty(layer.id, "visibility", "visible");
            mapRef.current!.setPaintProperty(layer.id, "fill-color", "#e9eaec");
            mapRef.current!.setPaintProperty(layer.id, "fill-opacity", 0.75);
          } catch (e) {}
        }
      });
    });

    return () => {
      maplibregl.removeProtocol("pmtiles");
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // 3. Dynamic Interactive Markers & Paths
  const renderInteractiveData = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    staticMarkersRef.current.forEach((m) => m.remove());
    staticMarkersRef.current = [];

    if (map.getLayer("driving-route-layer")) map.removeLayer("driving-route-layer");
    if (map.getSource("driving-route-source")) map.removeSource("driving-route-source");

    const layers = map.getStyle().layers;
    let firstSymbolId: string | undefined;
    for (const layer of layers) {
      if (layer.type === "symbol") {
        firstSymbolId = layer.id;
        break;
      }
    }

    const { stays: allStays, attractions: allAttractions, events: allEvents, drivingData } = sessionResults;
    const { stays: selectedStays, attractions: selectedAttractions, events: selectedEvents, drive: selectedDrive } = currentTripState;

    // RULE 1: Stays (Using Building2)
    const selectedStayKeys = selectedStays?.map((s: any) => s._selectionKey) || [];
    if (allStays?.length > 0) {
      allStays.slice(0, 12).forEach((stay: any, idx: number) => {
        const lat = stay.latitude || stay.geoCode?.latitude || stay.geo_code?.latitude || stay.hotel?.latitude;
        const lng = stay.longitude || stay.geoCode?.longitude || stay.geo_code?.longitude || stay.hotel?.longitude;
        const uniqueKey = stay.hotel_id || stay.hotelId || stay.hotel?.hotelId || stay.id || `stay-${idx}`;
        const isSelected = selectedStayKeys.includes(uniqueKey);

        if (lat && lng) {
          const el = document.createElement("div");
          const iconHtml = renderToString(<Hotel size={18} strokeWidth={2} />);

          const name = stay.name || stay.hotel?.name || "Hotel";
          const price = stay.price ? `$${stay.price}` : (stay.offers?.[0]?.price?.total ? `$${stay.offers[0].price.total}` : 'View details');
          const rating = stay.rating ? `${stay.rating} ★` : '';

          const hoverCard = buildHoverCard(name, "Accommodation", price, rating);

          const baseClass = "w-8 h-8 flex items-center justify-center shadow-sm z-20 hover:z-[100] group relative cursor-pointer transition-all duration-300";
          el.className = isSelected
            ? `${baseClass} bg-theme-primary text-theme-white rounded-[16px] border-2 border-theme-primary shadow-[16px] z-30`
            : `${baseClass} bg-theme-white text-theme-secondary fill-theme-secondary rounded-[16px] border border-theme-secondary/20 hover:bg-theme-secondary/5 hover:shadow-md transition-all`;

          el.innerHTML = `${iconHtml} ${hoverCard}`;
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          staticMarkersRef.current.push(marker);
        }
      });
    }

    // RULE 2: Attractions (Using Telescope)
    const selectedAttractionKeys = selectedAttractions?.map((a: any) => a._selectionKey) || [];
    if (allAttractions?.length > 0) {
      allAttractions.slice(0, 12).forEach((attr: any, idx: number) => {
        const lat = attr.latitude || attr.geoCode?.latitude || attr.geo_code?.latitude;
        const lng = attr.longitude || attr.geoCode?.longitude || attr.geo_code?.longitude;
        const uniqueKey = attr.id || `attraction-${idx}`;
        const isSelected = selectedAttractionKeys.includes(uniqueKey);

        if (lat && lng) {
          const el = document.createElement("div");
          const iconHtml = renderToString(<FlagTriangleRight size={18} strokeWidth={2} />);

          const name = attr.name || attr.tags?.name || "Attraction";
          const category = (attr.category || attr.tags?.tourism || attr.tags?.amenity || "Point of Interest").replace(/_/g, ' ');

          const hoverCard = buildHoverCard(name, category, "Free Entry", "Explore");

          const baseClass = "w-8 h-8 flex items-center justify-center shadow-sm z-20 hover:z-[100] group relative cursor-pointer transition-all duration-300";
          el.className = isSelected
             ? `${baseClass} bg-theme-info text-theme-white rounded-[16px] border-2 border-theme-info shadow-[16px] z-30`
            : `${baseClass} bg-theme-white text-theme-emerald rounded-[16px] border border-theme-info/20 opacity-80 hover:opacity-100 hover:shadow-md`;

          el.innerHTML = `${iconHtml} ${hoverCard}`;
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          staticMarkersRef.current.push(marker);
        }
      });
    }

    // RULE 3: Events (Using CalendarDays)
    const selectedEventKeys = selectedEvents?.map((e: any) => e._selectionKey) || [];
    if (allEvents?.length > 0) {
      allEvents.slice(0, 10).forEach((event: any, idx: number) => {
        const lat = event.latitude || event._embedded?.venues?.[0]?.location?.latitude || event.geo_code?.latitude;
        const lng = event.longitude || event._embedded?.venues?.[0]?.location?.longitude || event.geo_code?.longitude;
        const uniqueKey = event.id || `event-${idx}`;
        const isSelected = selectedEventKeys.includes(uniqueKey);

        if (lat && lng) {
          const el = document.createElement("div");
          const iconHtml = renderToString(<CalendarDays size={18} strokeWidth={2.5} />);

          const name = event.name || "Local Event";
          const category = event.classifications?.[0]?.segment?.name || "Live Event";
          const date = event.dates?.start?.localDate || "";
          const price = event.priceRanges?.[0]?.min ? `$${event.priceRanges[0].min}` : "TBA";

          const hoverCard = buildHoverCard(name, category, price, date);

          const baseClass = "w-8 h-8 flex items-center justify-center shadow-sm z-20 hover:z-[100] group relative cursor-pointer transition-all duration-300";
          el.className = isSelected
            ? `${baseClass} bg-theme-info text-theme-white rounded-lg border-2 border-theme-info shadow-[16px] z-30`
            : `${baseClass} bg-theme-secondary/80 text-theme-info rounded-lg border border-theme-info/20 opacity-80 hover:opacity-100 hover:shadow-md`;

          el.innerHTML = `${iconHtml} ${hoverCard}`;
          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
          staticMarkersRef.current.push(marker);
        }
      });
    }

    // RULE 4: Clean Drive Path
    if (selectedDrive?.selected && drivingData?.geometry) {
      map.addSource("driving-route-source", {
        type: "geojson",
        data: drivingData.geometry,
      });

      map.addLayer({
        id: "driving-route-layer",
        type: "line",
        source: "driving-route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#012C23", "line-width": 4, "line-opacity": 0.85 },
      }, firstSymbolId);
    }

  }, [sessionResults, currentTripState]);

  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) {
      renderInteractiveData();
    } else {
      mapRef.current?.once("styledata", renderInteractiveData);
    }
  }, [renderInteractiveData]);


  // Center Map ONLY on New Search (sessionResults change)
  useEffect(() => {
    if (!mapRef.current) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      const savedData = localStorage.getItem("search_state");
      if (savedData) {
        try {
          const { radius } = JSON.parse(savedData);
          if (radius) setRadiusValue(Math.max(1, Math.min(25, radius)));
        } catch (e) {}
      }
      return;
    }

    const savedData = localStorage.getItem("search_state");
    if (!savedData) return;

    try {
      const { destination, radius } = JSON.parse(savedData);
      const initialRadius = radius ? Math.max(1, Math.min(25, radius)) : 10;
      const targetZoom = calculateZoomFromRadius(initialRadius);

      setRadiusValue(initialRadius);

      if (destination?.lat && destination?.lon) {

        localStorage.setItem("map_view_state", JSON.stringify({
          lng: destination.lon,
          lat: destination.lat,
          zoom: targetZoom
        }));

        const currentCenter = mapRef.current.getCenter();

        const isSameLocation =
          Math.abs(currentCenter.lng - destination.lon) < 0.02 &&
          Math.abs(currentCenter.lat - destination.lat) < 0.02;

        if (isSameLocation) {
          mapRef.current.easeTo({
            zoom: targetZoom - 0.7,
            duration: 600,
            essential: true
          });

          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [destination.lon, destination.lat],
                zoom: targetZoom,
                essential: true,
                duration: 1500,
              });
            }
          }, 650);
        } else {
          mapRef.current.flyTo({
            center: [destination.lon, destination.lat],
            zoom: targetZoom,
            essential: true,
            duration: 2000,
          });
        }
      }
    } catch (err) {}
  }, [sessionResults]);

  // Radius Slider Handling
  const handleRadiusSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRadiusValue(val);
    const savedData = localStorage.getItem("search_state");
    if (!savedData || !mapRef.current) return;

    try {
      const state = JSON.parse(savedData);
      if (state.destination?.lat && state.destination?.lon) {
        mapRef.current.flyTo({
          center: [state.destination.lon, state.destination.lat],
          zoom: calculateZoomFromRadius(val),
          duration: 300,
          essential: true,
        });
      }
    } catch (e) {}
  };

  const handleRadiusDrop = () => {
    const savedData = localStorage.getItem("search_state");
    if (!savedData) return;
    try {
      const state = JSON.parse(savedData);
      state.radius = radiusValue;
      localStorage.setItem("search_state", JSON.stringify(state));
    } catch (e) {}
  };

  return (
    <div className="relative w-full h-full rounded-[16px] overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}