import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

if (!API_BASE_URL) {
  console.error("🚨 NEXT_PUBLIC_API_URL is missing! Please check your frontend/.env.frontend file.");
}

// --- AXIOS INTERCEPTOR TO HANDLE 401s GLOBALLY ---
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        window.location.href = '/auth'; 
      }
    }
    return Promise.reject(error);
  }
);

// --- API SERVICE OBJECT INTERFACES ---
export interface UserCreatePayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone_country_code?: string;
  phone_number?: string;
  gender?: string;
}

export interface VerifyEmailOTP {
  email: string;
  code: string;
}

export interface VerifyPhoneOTP {
  email: string;
  phone_code: string;
}

export interface Tour {
  id: string;
  name: string;
  short_description?: string;
  geo_code?: Record<string, number>;
  price?: number;
  currency?: string;
  picture_url?: string;
  minimum_duration?: string;
  distance_km?: number;
}

export interface Attraction {
  id: number;
  name: string;
  category: string;
  attraction_type: string;
  address: string;
  website?: string;
  opening_hours?: string;
  latitude: number;
  longitude: number;
}

export interface Amenities {
  legroom?: string;
  wifi?: boolean;
  power_usb?: boolean;
  food?: string;
}

export interface FlightSegment {
  departure_airport: string;
  departure_airport_name?: string;
  departure_terminal?: string; 
  departure_lat?: number;
  departure_lon?: number;
  departure_time: string;
  
  arrival_airport: string;
  arrival_airport_name?: string;
  arrival_terminal?: string; 
  arrival_lat?: number;
  arrival_lon?: number;
  arrival_time: string;
  
  carrier_code: string;
  carrier_name: string;
  flight_number: string;
  
  aircraft?: string; 
  duration?: string; 
  cabin_class?: string; 
  checked_bags?: number;
  carry_on_bags?: number; 
  amenities?: Amenities; 
}

export interface FlightItinerary {
  duration: string;
  stops: number;
  segments: FlightSegment[];
}

export interface FlightOffer {
  id: string; // Duffel Offer ID
  price: number;
  currency: string;
  airline_code: string;
  airline_name: string;
  cabin_class: string;
  carbon_emissions_kg?: number; 
  raw_offer_data?: any; 
  itineraries: FlightItinerary[];
}

export interface RoomOffer {
  room_name: string;
  description?: string;
  category?: string;
  bed_type?: string;
  beds_count?: number;
  price: number;
  currency: string;
  amenities: string[];
}

export interface HotelOffer {
  hotel_id: string;
  name?: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  price: number;
  currency: string;
  address?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  rooms?: RoomOffer[];
}

export interface WeatherDay {
  date: string;
  max_temp: number;
  min_temp: number;
  weather: string;
  humidity: number;
  pressure: number;
}

export interface WeatherSummary {
  overall_summary: string;
  days: WeatherDay[];
}

export interface LocationResult {
  city?: string;
  name?: string;
  state?: string;
  iata?: string;
  type: 'city' | 'airport';
  distance?: number;
  lat?: number;
  lon?: number;
}

export interface TripSearchParams {
  source: any;
  destination: any;
  startDate: string;
  endDate: string;
  tripType?: "round-trip" | "one-way"; 
  numNights: number;
  adults: number;
  children: number;
  travelMode: 'fly' | 'drive';
  budget: 'budget' | 'Premium';
  radius: number;
  interests: string[];
}


export const travelApi = {
  searchLocations: async (keyword: string, lat?: number, lon?: number): Promise<LocationResult[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/search`, {
        params: { keyword, lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  },
  
  getNearestCity: async (lat: number, lon: number): Promise<LocationResult | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/nearest`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  },

  saveTrip: async (tripData: any, visibility: "PRIVATE" | "PUBLIC" = "PRIVATE") => {
    const payload = {
      destination: tripData.destination || "My Trip",
      data: tripData,
      visibility: visibility
    };
    const response = await axios.post(`${API_BASE_URL}/itineraries/save`, payload, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getMyTrips: async () => {
    const response = await axios.get(`${API_BASE_URL}/itineraries/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },


  deleteTrip: async (tripId: string) => {
    const response = await axios.delete(`${API_BASE_URL}/itineraries/${tripId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateItineraryVisibility: async (itineraryId: string, visibility: "PRIVATE" | "PUBLIC") => {
    const response = await axios.patch(`${API_BASE_URL}/itineraries/${itineraryId}/visibility`, 
      { visibility }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getSharedItinerary: async (shareToken: string) => {
    const response = await axios.get(`${API_BASE_URL}/itineraries/shared/${shareToken}`);
    return response.data;
  },

  shareItineraryEmail: async (itineraryId: string, email: string, message?: string) => {
    const response = await axios.post(`${API_BASE_URL}/itineraries/${itineraryId}/share-email`, 
      { email, message }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  sharePdf: async (data: any, email: string, signal?: AbortSignal) => {
    try {
      const payload = { ...data, email };
      const response = await axios.post(`${API_BASE_URL}/itineraries/share-pdf`, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        signal
      });
      return response.data;
    } catch (error) {
      console.error("Failed to share PDF:", error);
      throw error;
    }
  },

  exportPdf: async (data: any, signal?: AbortSignal) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/itineraries/generate-pdf`, data, {
        responseType: 'blob', 
        headers: {
          'Content-Type': 'application/json'
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("PDF generation cancelled by user");
      } else {
        console.error("Failed to generate PDF:", error);
      }
      return null;
    }
  },

  signup: async (userData: UserCreatePayload) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/signup`, userData);
    return data;
  },

  verifyEmailOtp: async (payload: VerifyEmailOTP) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/verify-email`, payload);
    return data;
  },

  verifyPhoneOtp: async (payload: VerifyPhoneOTP) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/verify-phone`, payload);
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: email,
      password: password
    });
    return data;
  },

  forgotPassword: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return response.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, { 
      email: email,
      code: code,
      new_password: newPassword
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    const response = await axios.put(`${API_BASE_URL}/users/me`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  requestAccountDeletion: async () => {
    const response = await axios.post(`${API_BASE_URL}/users/me/request-delete`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  confirmAccountDeletion: async (code: string) => {
    const response = await axios.delete(`${API_BASE_URL}/users/me/confirm-delete`, {
      headers: getAuthHeaders(),
      data: { code }
    });
    return response.data;
  },

  getDestinations: async (skip: number = 0, limit: number = 50) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations/`, {
        params: { skip, limit }
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch destinations list:", error);
      return [];
    }
  },
  
  getTopDestinations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations/top?limit=12`);
      return response.data; 
    } catch (error) {
      console.error("Top destinations fetch failed:", error);
      return [];
    }
  },

  searchDestinations: async (params?: { category?: string; query?: string }) => {
    try {
      const cleanParams = params?.category === 'All' ? {} : params;
      const response = await axios.get(`${API_BASE_URL}/destinations/search`, { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error("Destination search failed:", error);
      return [];
    }
  },

  getDestinationDetails: async (destinationId: string | number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations/${destinationId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch details for destination ${destinationId}:`, error);
      return null;
    }
  },

  createDestination: async (destinationData: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/destinations/`, destinationData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create destination:", error);
      throw error;
    }
  },

  getTopEvents: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/top?limit=12`);
      return response.data;
    } catch (error) {
      console.error("Top events fetch failed:", error);
      return [];
    }
  },

  searchEvents: async (params?: { category?: string; query?: string }) => {
    try {
      const cleanParams = params?.category === 'All' ? {} : params;
      const response = await axios.get(`${API_BASE_URL}/events/search`, { params: cleanParams });
      return response.data;
    } catch (error) {
      console.error("Events search failed:", error);
      return [];
    }
  },

  getEventDetails: async (eventId: string | number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch details for event ${eventId}:`, error);
      return null;
    }
  },

  createEvent: async (eventData: any) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/events/`, eventData, {
        headers: getAuthHeaders() 
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error;
    }
  },

  getFlights: async (params: TripSearchParams, signal?: AbortSignal): Promise<FlightOffer[]> => {
    try {
      let originIata = params.source.iata;
      let destIata = params.destination.iata;

      if (!originIata && params.source.lat && params.source.lon) {
         const { data } = await axios.get(`${API_BASE_URL}/locations/airport/nearest`, { 
           params: { lat: params.source.lat, lon: params.source.lon },
           signal 
         });
         originIata = data.iata;
      }
      
      if (!destIata && params.destination.lat && params.destination.lon) {
         const { data } = await axios.get(`${API_BASE_URL}/locations/airport/nearest`, { 
           params: { lat: params.destination.lat, lon: params.destination.lon },
           signal 
         });
         destIata = data.iata;
      }

      // FIX: Duffel only accepts a single strict string: 'economy', 'premium_economy', 'business', or 'first'
      const travelClass = params.budget === 'Premium' 
        ? 'business' 
        : 'economy';

      // Dynamically build the parameters to optionally exclude return_date
      const searchParams: any = {
        origin: originIata || 'JFK',
        destination: destIata || 'LAX',
        date: params.startDate,
        adults: params.adults,
        children: params.children,
        travel_class: travelClass // Now passing the clean string
      };

      // Only attach return_date if it's a round trip and an endDate exists
      if (params.tripType !== "one-way" && params.endDate) {
        searchParams.return_date = params.endDate;
      }

      const response = await axios.get(`${API_BASE_URL}/flights/search`, {
        params: searchParams,
        signal
      });
      
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
    } catch (error) {
      if (axios.isCancel(error)) return [];
      console.error("Failed to fetch flights:", error);
      return [];
    }
  },

  // ==========================================
  // UPDATED METHODS FOR DUFFEL INTEGRATION
  // ==========================================
  
  /**
   * confirmFlightPrice expects a Duffel Offer ID instead of a raw JSON blob.
   * It returns the validated priced offer along with the available seat maps.
   */
  confirmFlightPrice: async (offerId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/flights/price`, {
        offer_id: offerId
      }, { headers: getAuthHeaders() });
      return response.data;
    } catch (error: any) {
      console.error("Pricing confirmation failed:", error);
      throw error.response?.data || { error: "Pricing failed" };
    }
  },

  /**
   * bookFlight passes the Duffel Offer ID, formatted travelers, and their selected seat addons.
   */
// inside frontend/services/api.ts -> export const travelApi = { ... }
bookFlight: async (offerId: string, travelers: any[], selectedSeats: any[] = []) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/flights/book`, {
        offer_id: offerId,
        travelers: travelers,
        selected_seats: selectedSeats
      }, { 
        headers: getAuthHeaders() // <--- THIS WAS MISSING
      });
      return response.data;
    } catch (error: any) {
      console.error("Booking Error:", error);
      // Handle Duffel's complex error array if it exists
      const detail = error.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      return { error: errorMsg || "Failed to complete the booking." };
    }
  },
  
  createPaymentIntent: async (amount: number, currency: string = "USD") => {
    try {
      const response = await axios.post(`${API_BASE_URL}/flights/create-payment-intent`, {
        amount,
        currency
      }, { 
        headers: getAuthHeaders() // <--- THIS WAS MISSING
      });
      return response.data;
    } catch (error: any) {
      console.error("Payment Intent Error:", error);
      return { error: error.response?.data?.detail || "Failed to initialize secure payment." };
    }
  },

  
  
  getDuffelOrderDetails: async (orderId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/flights/orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to load order metadata:", error);
      return { error: "Could not read booking details." };
    }
  },
  // ==========================================

  getDriving: async (params: TripSearchParams, signal?: AbortSignal) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/driving/route`, {
        params: {
          origin_lat: params.source.lat,
          origin_lon: params.source.lon,
          dest_lat: params.destination.lat,
          dest_lon: params.destination.lon
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      console.error("Failed to fetch driving route:", error);
      return null;
    }
  },

// --- STAYS ---
  getStays: async (params: TripSearchParams, signal?: AbortSignal): Promise<HotelOffer[]> => {
    try {
      // Calculate a 1-night stay if it's a one-way trip (endDate is missing)
      const effectiveEndDate = params.endDate || (params.startDate ? new Date(new Date(params.startDate + "T12:00:00").getTime() + 86400000).toISOString().split("T")[0] : "");
      const radiusKm = Math.round(params.radius * 1.60934); 

      const response = await axios.get(`${API_BASE_URL}/stays/nearby`, {
        params: {
          lat: params.destination.lat,
          lon: params.destination.lon,
          check_in_date: params.startDate,
          check_out_date: effectiveEndDate, // Use the fallback date
          adults: params.adults,
          radius: radiusKm || 50
        },
        signal
      });
      
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
    } catch (error) {
      if (axios.isCancel(error)) return [];
      console.error("Failed to fetch stays:", error);
      return [];
    }
  },

  getStayOffer: async (hotelId: string, params: any, signal?: AbortSignal): Promise<HotelOffer | { error: boolean } | null> => {
    try {
      // Calculate a 1-night stay if it's a one-way trip
      const effectiveEndDate = params.endDate || (params.startDate ? new Date(new Date(params.startDate + "T12:00:00").getTime() + 86400000).toISOString().split("T")[0] : "");
      
      const response = await axios.get(`${API_BASE_URL}/stays/offer`, {
        params: {
          hotel_id: hotelId,
          check_in_date: params.startDate,
          check_out_date: effectiveEndDate, // Use the fallback date
          adults: params.adults
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      return { error: true }; 
    }
  },

  bookStay: async (stayOffer: any, travelers: any[]) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/stays/book`, {
        offer: stayOffer,
        travelers: travelers
      }, { headers: getAuthHeaders() });
      return response.data;
    } catch (error: any) {
      console.error("Stay booking failed:", error);
      // Fallback for MVP if endpoint isn't fully wired
      return { success: true, booking_ref: "STAY-" + Math.floor(Math.random() * 100000) };
    }
  },

  bookTours: async (tours: any[], travelers: any[]) => {
    try {
      // Stub for multi-tour booking
      return { success: true, booking_ref: "TOUR-" + Math.floor(Math.random() * 100000) };
    } catch (error: any) {
      console.error("Tour booking failed:", error);
      return { success: true, booking_ref: "TOUR-ERR" };
    }
  },

  // --- WEATHER ---
getWeather: async (dest: { lat: number; lon: number }, dates: { start?: string; end?: string }) => {
    // 1. Safety Check: If coordinates are missing, gracefully abort
    if (!dest?.lat || !dest?.lon) return null;

    // 2. Sanitize Start Date
    const startDate = dates.start || new Date().toISOString().split("T")[0];

    // 3. Sanitize End Date (Fixes the 400 Error for One-Way Trips)
    let endDate = dates.end;
    if (!endDate || endDate === "") {
      // If end date is missing, default to 7 days after start date
      const fallbackDate = new Date(startDate + "T12:00:00");
      fallbackDate.setDate(fallbackDate.getDate() + 7);
      endDate = fallbackDate.toISOString().split("T")[0];
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/weather/forecast`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response.data;
    } catch (error) {
      // 4. Graceful Fallback: If weather fails, log it but return null 
      // so it doesn't crash the entire Promise.all() in tripSearch.ts
      console.warn("Weather API gracefully degraded:", error);
      return null;
    }
  },

  getAttractions: async (dest: any, radiusMiles: number, signal?: AbortSignal, retries = 2): Promise<Attraction[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attractions/nearby`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          radius_miles: radiusMiles
        },
        signal,
        validateStatus: (status) => status < 500 
      });

      if (response.status >= 400) {
        throw new Error("Overpass API is busy");
      }

      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return [];
      if (retries > 0) {
        console.warn(`Attractions API busy, letting it cool down... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return await travelApi.getAttractions(dest, radiusMiles, signal, retries - 1);
      }
      console.warn("Skipping attractions due to Overpass API limits.");
      return []; 
    }
  },

  getTours: async (dest: any, radiusMiles: number, signal?: AbortSignal): Promise<Tour[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tours/nearby`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          radius_miles: radiusMiles
        },
        signal
      });
      
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
      
    } catch (error) {
      if (axios.isCancel(error)) return [];
      return [];
    }
  },

  getMyBookings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/me/bookings`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      return [];
    }
  },

  getLiveDuffelOrder: async (orderId: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/duffel-order/${orderId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch live order from Duffel:", error);
      throw error.response?.data || { detail: "Failed to load order" };
    }
  },

};