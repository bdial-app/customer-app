import { useState, useCallback, useRef } from "react";
import { searchGeocode, SearchGeocodeResult } from "@/services/geocode.service";

interface AreaResult {
  area: string;
  pincode: string;
  description: string;
}

interface UseAreaSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: AreaResult[];
  isSearching: boolean;
  hasSearched: boolean;
  error: string | null;
}

export const useAreaSearch = (city: string): UseAreaSearchReturn => {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<AreaResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (q.trim().length < 3) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        setError(null);
        try {
          const searchQuery = city ? `${q}, ${city}` : q;
          const geocodeResults: SearchGeocodeResult[] =
            await searchGeocode(searchQuery);

          const mapped: AreaResult[] = geocodeResults.map((r) => {
            // Try to extract a 6-digit pincode from the description
            const pincodeMatch = r.description.match(/\b\d{6}\b/);
            return {
              area: r.mainText,
              pincode: pincodeMatch ? pincodeMatch[0] : "",
              description: r.description,
            };
          });

          setResults(mapped);
          setHasSearched(true);
        } catch {
          setError("Could not fetch areas. Try typing manually.");
          setResults([]);
          setHasSearched(true);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [city]
  );

  return { query, setQuery, results, isSearching, hasSearched, error };
};
