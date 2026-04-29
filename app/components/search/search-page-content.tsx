"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  arrowBack,
  close,
  searchOutline,
  micOutline,
} from "ionicons/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { addRecentSearch, setCategoryIds, resetFilters, setSortBy, setMinRating, setMaxDistance, setVerifiedOnly, setWomenLedOnly } from "@/store/slices/searchSlice";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { ROUTE_PATH } from "@/utils/contants";
import type { SearchSuggestion } from "@/services/search.service";

import SearchZeroState from "./search-zero-state";
import SuggestionList from "./suggestion-list";
import SearchResultsView from "./search-results-view";

type SearchPhase = "zero" | "typing" | "results";

const SearchPageContent = () => {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [committedQuery, setCommittedQuery] = useState(initialQ);
  const debouncedQuery = useDebounce(query, 150);
  const [isFocused, setIsFocused] = useState(!initialQ);

  const user = useAppSelector((s) => s.auth.user as any);
  const lat = user?.latitude;
  const lng = user?.longitude;

  // Hydrate Redux filters from URL params (for deep-links from explore, shared URLs, etc.)
  useEffect(() => {
    const catIds = searchParams.get("categoryIds");
    const sortBy = searchParams.get("sortBy");
    const minRating = searchParams.get("minRating");
    const maxDistance = searchParams.get("maxDistance");
    const verified = searchParams.get("verifiedOnly");
    const womenLed = searchParams.get("womenLedOnly");

    if (catIds) dispatch(setCategoryIds(catIds.split(",").filter(Boolean)));
    if (sortBy && ["relevance", "distance", "rating", "newest"].includes(sortBy)) dispatch(setSortBy(sortBy as any));
    if (minRating) dispatch(setMinRating(parseFloat(minRating)));
    if (maxDistance) dispatch(setMaxDistance(parseFloat(maxDistance)));
    if (verified === "true") dispatch(setVerifiedOnly(true));
    if (womenLed === "true") dispatch(setWomenLedOnly(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const phase: SearchPhase = committedQuery
    ? "results"
    : debouncedQuery.length >= 1
      ? "typing"
      : "zero";

  const { data: suggestions = [], isFetching: isSuggestionsFetching } =
    useSearchSuggestions(
      phase === "typing" ? debouncedQuery : "",
      lat,
      lng
    );

  useEffect(() => {
    if (!initialQ) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialQ]);

  useEffect(() => {
    if (committedQuery) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", committedQuery);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [committedQuery]);

  const handleSubmit = useCallback(
    (q?: string) => {
      const finalQ = (q ?? query).trim();
      if (!finalQ) return;
      dispatch(addRecentSearch(finalQ));
      setQuery(finalQ);
      setCommittedQuery(finalQ);
      setIsFocused(false);
      inputRef.current?.blur();
    },
    [query, dispatch]
  );

  const handleSuggestionTap = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === "provider") {
        // Navigate directly to the business page
        router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${suggestion.id}`);
      } else if (suggestion.type === "product") {
        // Navigate directly to the product page
        router.push(`${ROUTE_PATH.PRODUCT_DETAILS}?id=${suggestion.id}`);
      } else {
        // Category: filter by category and show all businesses in it
        dispatch(resetFilters());
        dispatch(setCategoryIds([suggestion.id]));
        setQuery(suggestion.text);
        handleSubmit(suggestion.text);
      }
    },
    [handleSubmit, router, dispatch]
  );

  const handleRecentTap = useCallback(
    (text: string) => {
      setQuery(text);
      handleSubmit(text);
    },
    [handleSubmit]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setCommittedQuery("");
    setIsFocused(true);
    inputRef.current?.focus();
    router.replace("/search", { scroll: false });
  }, [router]);

  const handleBack = useCallback(() => {
    dispatch(resetFilters());
    goBack(ROUTE_PATH.HOME);
  }, [goBack, dispatch]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (committedQuery) {
      setCommittedQuery("");
    }
  }, [committedQuery]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FAFAFA]">
      {/* ── Header ─────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Back"
          >
            <IonIcon icon={arrowBack} className="w-[22px] h-[22px] text-gray-800" />
          </motion.button>

          {/* Search input container */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IonIcon
                icon={searchOutline}
                className={`w-[18px] h-[18px] transition-colors duration-200 ${
                  isFocused && !committedQuery ? "text-amber-500" : "text-gray-400"
                }`}
              />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Search services, businesses, products..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (committedQuery) setCommittedQuery("");
              }}
              onFocus={handleInputFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="w-full h-11 pl-10 pr-20 rounded-xl bg-gray-100 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400/40 focus:shadow-[0_0_0_4px_rgba(245,158,11,0.08)] transition-all duration-200"
            />

            {/* Right-side icons inside the input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {query.length > 0 && phase !== "results" && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={handleClear}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <IonIcon icon={close} className="w-4 h-4 text-gray-500" />
                </motion.button>
              )}
              {query.length === 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-px h-5 bg-gray-200" />
                  <button className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-200 transition-colors">
                    <IonIcon icon={micOutline} className="w-[18px] h-[18px] text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search / Cancel button */}
          {query.length > 0 && phase !== "results" ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleSubmit()}
              className="flex-shrink-0 h-10 px-4 bg-amber-500 text-white text-[13px] font-semibold rounded-xl active:bg-amber-600 transition-colors shadow-sm"
            >
              Search
            </motion.button>
          ) : phase === "results" ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleClear}
              className="flex-shrink-0 text-[13px] font-medium text-gray-500 px-2 py-1 active:opacity-60"
            >
              Cancel
            </motion.button>
          ) : null}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          {phase === "zero" && (
            <motion.div
              key="zero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SearchZeroState
                onRecentTap={handleRecentTap}
                onTrendingTap={handleRecentTap}
                onCategoryTap={(name, id) => {
                  dispatch(setCategoryIds([id]));
                  setQuery(name);
                  handleSubmit(name);
                }}
              />
            </motion.div>
          )}

          {phase === "typing" && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <SuggestionList
                suggestions={suggestions}
                query={debouncedQuery}
                isLoading={isSuggestionsFetching}
                onSelect={handleSuggestionTap}
              />
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <SearchResultsView
                query={committedQuery}
                lat={lat}
                lng={lng}
                city={user?.city}
                onCategoryTap={(name, id) => {
                  dispatch(resetFilters());
                  dispatch(setCategoryIds([id]));
                  setQuery(name);
                  handleSubmit(name);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchPageContent;
