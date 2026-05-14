import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getItemSync, setItemSync, removeItemSync } from "@/utils/storage";
import type { SearchEntityType, SearchSortBy } from "@/services/search.service";

interface SearchFilters {
  categoryIds: string[];
  minRating: number | null;
  maxDistance: number | null;
  verifiedOnly: boolean;
  womenLedOnly: boolean;
  sortBy: SearchSortBy;
  listingType: 'all' | 'products' | 'services';
}

interface SearchState {
  activeTab: SearchEntityType;
  filters: SearchFilters;
  recentSearchesLocal: string[]; // client-side cache for instant display
}

const MAX_LOCAL_RECENT = 15;

const initialState: SearchState = {
  activeTab: "all",
  filters: {
    categoryIds: [],
    minRating: null,
    maxDistance: null,
    verifiedOnly: false,
    womenLedOnly: false,
    sortBy: "relevance",
    listingType: "all",
  },
  recentSearchesLocal:
    typeof window !== "undefined"
      ? JSON.parse(getItemSync("recentSearches") || "[]")
      : [],
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<SearchEntityType>) {
      state.activeTab = action.payload;
    },
    setSortBy(state, action: PayloadAction<SearchSortBy>) {
      state.filters.sortBy = action.payload;
    },
    setCategoryIds(state, action: PayloadAction<string[]>) {
      state.filters.categoryIds = action.payload;
    },
    setMinRating(state, action: PayloadAction<number | null>) {
      state.filters.minRating = action.payload;
    },
    setMaxDistance(state, action: PayloadAction<number | null>) {
      state.filters.maxDistance = action.payload;
    },
    setVerifiedOnly(state, action: PayloadAction<boolean>) {
      state.filters.verifiedOnly = action.payload;
    },
    setWomenLedOnly(state, action: PayloadAction<boolean>) {
      state.filters.womenLedOnly = action.payload;
    },
    setListingType(state, action: PayloadAction<'all' | 'products' | 'services'>) {
      state.filters.listingType = action.payload;
    },
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    addRecentSearch(state, action: PayloadAction<string>) {
      const q = action.payload.trim().toLowerCase();
      if (!q) return;
      state.recentSearchesLocal = [
        q,
        ...state.recentSearchesLocal.filter((s) => s !== q),
      ].slice(0, MAX_LOCAL_RECENT);
      if (typeof window !== "undefined") {
        setItemSync(
          "recentSearches",
          JSON.stringify(state.recentSearchesLocal)
        );
      }
    },
    removeRecentSearch(state, action: PayloadAction<string>) {
      state.recentSearchesLocal = state.recentSearchesLocal.filter(
        (s) => s !== action.payload
      );
      if (typeof window !== "undefined") {
        setItemSync(
          "recentSearches",
          JSON.stringify(state.recentSearchesLocal)
        );
      }
    },
    clearRecentSearchesLocal(state) {
      state.recentSearchesLocal = [];
      if (typeof window !== "undefined") {
        removeItemSync("recentSearches");
      }
    },
  },
});

export const {
  setActiveTab,
  setSortBy,
  setCategoryIds,
  setMinRating,
  setMaxDistance,
  setVerifiedOnly,
  setWomenLedOnly,
  setListingType,
  resetFilters,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearchesLocal,
} = searchSlice.actions;

export default searchSlice.reducer;
