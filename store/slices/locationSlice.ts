import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SearchGeocodeResult } from "@/services/geocode.service";
import { getItemSync, setItemSync, removeItemSync } from "@/utils/storage";

interface GuestCoords {
  lat: number;
  lng: number;
}

interface LocationState {
  recentLocations: SearchGeocodeResult[];
  guestCoords: GuestCoords | null;
  selectedCity: string | null;
}

const getInitialRecentLocations = (): SearchGeocodeResult[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = getItemSync("recentLocations");
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
      const stored = getItemSync("guestCoords");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const getInitialSelectedCity = (): string | null => {
  if (typeof window !== "undefined") {
    try {
      return getItemSync("selectedCity") || null;
    } catch {
      return null;
    }
  }
  return null;
};

const initialState: LocationState = {
  recentLocations: getInitialRecentLocations(),
  guestCoords: getInitialGuestCoords(),
  selectedCity: getInitialSelectedCity(),
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
        setItemSync("recentLocations", JSON.stringify(state.recentLocations));
      }
    },
    clearRecentLocations(state) {
      state.recentLocations = [];
      if (typeof window !== "undefined") {
        removeItemSync("recentLocations");
      }
    },
    setGuestCoords(state, action: PayloadAction<GuestCoords | null>) {
      state.guestCoords = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          setItemSync("guestCoords", JSON.stringify(action.payload));
        } else {
          removeItemSync("guestCoords");
        }
      }
    },
    setSelectedCity(state, action: PayloadAction<string | null>) {
      state.selectedCity = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          setItemSync("selectedCity", action.payload);
        } else {
          removeItemSync("selectedCity");
        }
      }
    },
  },
});

export const { addRecentLocation, clearRecentLocations, setGuestCoords, setSelectedCity } = locationSlice.actions;
export default locationSlice.reducer;
