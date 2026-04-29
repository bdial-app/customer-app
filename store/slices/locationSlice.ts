import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchGeocodeResult } from "@/services/geocode.service";

interface GuestCoords {
  lat: number;
  lng: number;
}

interface LocationState {
  recentLocations: SearchGeocodeResult[];
  guestCoords: GuestCoords | null;
}

const getInitialRecentLocations = (): SearchGeocodeResult[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("recentLocations");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const getInitialGuestCoords = (): GuestCoords | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("guestCoords");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const initialState: LocationState = {
  recentLocations: getInitialRecentLocations(),
  guestCoords: getInitialGuestCoords(),
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    addRecentLocation(state, action: PayloadAction<SearchGeocodeResult>) {
      const newLoc = action.payload;
      // Remove if already exists (to move to top)
      state.recentLocations = state.recentLocations.filter(
        (loc) => loc.placeId !== newLoc.placeId
      );
      // Add to front
      state.recentLocations.unshift(newLoc);
      // Limit to 5
      state.recentLocations = state.recentLocations.slice(0, 5);
      
      if (typeof window !== "undefined") {
        localStorage.setItem("recentLocations", JSON.stringify(state.recentLocations));
      }
    },
    clearRecentLocations(state) {
      state.recentLocations = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem("recentLocations");
      }
    },
    setGuestCoords(state, action: PayloadAction<GuestCoords | null>) {
      state.guestCoords = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("guestCoords", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("guestCoords");
        }
      }
    },
  },
});

export const { addRecentLocation, clearRecentLocations, setGuestCoords } = locationSlice.actions;
export default locationSlice.reducer;
