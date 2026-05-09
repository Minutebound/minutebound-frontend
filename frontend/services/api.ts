import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

if (!API_BASE_URL) {
  console.error("🚨 NEXT_PUBLIC_API_URL is missing! Please check your frontend/.env.frontend file.");
}

// --- NEW TYPESCRIPT INTERFACES ALIGNED WITH BACKEND SCHEMAS ---

export interface UserCreatePayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  phone_country_code?: string;
  phone_number?: string;
  gender?: string; // Added gender
}

export interface VerifyEmailOTP {
  email: string;
  code: string;
}

export interface VerifyPhoneOTP {
  email: string;
  phone_code: string;
}

export interface Activity {
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

export interface FlightSegment {
  departure_airport: string;
  departure_airport_name?: string;
  departure_lat?: number;
  departure_lon?: number;
  departure_time: string;
  arrival_airport: string;
  arrival_airport_name?: string;
  arrival_lat?: number;
  arrival_lon?: number;
  arrival_time: string;
  carrier_code: string;
  carrier_name: string;
  flight_number: string;
  checked_bags?: number;
}

export interface FlightItinerary {
  duration: string;
  stops: number;
  segments: FlightSegment[];
}

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  airline_code: string;
  airline_name: string;
  cabin_class: string;
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

// --- EXISTING INTERFACES ---

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

  // --- UPDATED ITINERARY ENDPOINTS ---

  saveTrip: async (tripData: any, visibility: "PRIVATE" | "SHARED" | "PUBLIC" = "PRIVATE") => {
    // Formats the payload to match the backend ItineraryCreate schema
    const payload = {
      destination: tripData.destination || "My Trip",
      data: tripData,
      visibility: visibility
    };
    const response = await axios.post(`${API_BASE_URL}/trips/save`, payload, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getMyTrips: async () => {
    const response = await axios.get(`${API_BASE_URL}/trips/me`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  deleteTrip: async (itineraryId: string) => {
    const response = await axios.delete(`${API_BASE_URL}/trips/${itineraryId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateItineraryVisibility: async (itineraryId: string, visibility: "PRIVATE" | "SHARED" | "PUBLIC") => {
    const response = await axios.patch(`${API_BASE_URL}/trips/${itineraryId}/visibility`, 
      { visibility }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getSharedItinerary: async (shareToken: string) => {
    const response = await axios.get(`${API_BASE_URL}/trips/shared/${shareToken}`);
    return response.data;
  },

  shareItineraryEmail: async (itineraryId: string, email: string, message?: string) => {
    const response = await axios.post(`${API_BASE_URL}/trips/${itineraryId}/share-email`, 
      { email, message }, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // --- LEGACY PDF SHARE (Kept for backwards compatibility if needed) ---
  sharePdf: async (data: any, email: string, signal?: AbortSignal) => {
    try {
      const payload = { ...data, email };
      const response = await axios.post(`${API_BASE_URL}/trips/share-pdf`, payload, {
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
      const response = await axios.post(`${API_BASE_URL}/trips/generate-pdf`, data, {
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

  // --- AUTH ENDPOINTS ---

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

  // --- TRAVEL DATA ENDPOINTS ---

  getDestinationData: async (params: any) => ({ lat: params?.destination?.lat, lon: params?.destination?.lon }),
  
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

      const travelClasses = params.budget === 'Premium' 
        ? 'BUSINESS,FIRST' 
        : 'ECONOMY,PREMIUM_ECONOMY';

      const response = await axios.get(`${API_BASE_URL}/flights/search`, {
        params: {
          origin: originIata || 'JFK',
          destination: destIata || 'LAX',
          date: params.startDate,
          return_date: params.endDate,
          adults: params.adults,
          children: params.children,
          travel_class: travelClasses
        },
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

  getStays: async (params: TripSearchParams, signal?: AbortSignal): Promise<HotelOffer[]> => {
    try {
      const radiusKm = Math.round(params.radius * 1.60934); 
      const response = await axios.get(`${API_BASE_URL}/hotels/nearby`, {
        params: {
          lat: params.destination.lat,
          lon: params.destination.lon,
          check_in_date: params.startDate,
          check_out_date: params.endDate,
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

  getHotelOffer: async (hotelId: string, params: any, signal?: AbortSignal): Promise<HotelOffer | { error: boolean } | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/hotels/offer`, {
        params: {
          hotel_id: hotelId,
          check_in_date: params.startDate,
          check_out_date: params.endDate,
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

  getWeather: async (dest: any, dates: any, signal?: AbortSignal): Promise<WeatherSummary | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/weather/forecast`, {
        params: {
          lat: dest.lat,
          lon: dest.lon,
          check_in_date: dates.start,
          check_out_date: dates.end
        },
        signal
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) return null;
      console.error("Failed to fetch weather:", error);
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

  getTours: async (dest: any, radiusMiles: number, signal?: AbortSignal): Promise<Activity[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/activities/nearby`, {
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

  getTopDestinations: async (signal?: AbortSignal): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/destinations/top`, {
        signal
      });
      const responseData = response.data;
      return Array.isArray(responseData) ? responseData : (responseData?.data || []);
    } catch (error) {
      if (axios.isCancel(error)) return [];
      console.error("Failed to fetch top destinations:", error);
      return [];
    }
  }
};