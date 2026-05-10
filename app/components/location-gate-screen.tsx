"use client";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  locationSharp,
  navigateCircleOutline,
  searchOutline,
} from "ionicons/icons";
import { useAppDispatch } from "@/hooks/useAppStore";
import { setGuestCoords, setSelectedCity, addRecentLocation } from "@/store/slices/locationSlice";
import { setProfile } from "@/store/slices/authSlice";
import { useUpdateUser } from "@/hooks/useUser";
import { useSearchGeocode } from "@/hooks/useGeocode";
import { getCurrentPosition } from "@/utils/geolocation";
import { reverseGeocode as reverseGeocodeApi, SearchGeocodeResult } from "@/services/geocode.service";
import { useAppSelector } from "@/hooks/useAppStore";

interface LocationGateScreenProps {
  onLocationSet: () => void;
}

export default function LocationGateScreen({ onLocationSet }: LocationGateScreenProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user as any);
  const updateUserMutation = useUpdateUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: isSearchLoading } = useSearchGeocode(searchQuery);

  const applyLocation = useCallback(
    async (lat: number, lng: number, geocodeResult?: { city?: string; label?: string; fullAddress?: string; placeId?: string; area?: string }) => {
      // Update user or guest coords
      if (user) {
        dispatch(setProfile({ ...user, latitude: lat, longitude: lng }));
        updateUserMutation.mutate({ latitude: lat, longitude: lng });
      } else {
        dispatch(setGuestCoords({ lat, lng }));
      }

      // Resolve city if not already provided
      let city = geocodeResult?.city;
      if (!city) {
        try {
          const geo = await reverseGeocodeApi({ lat, lng });
          city = geo.city;
          if (geo.placeId) {
            dispatch(addRecentLocation({
              placeId: geo.placeId,
              description: geo.fullAddress,
              mainText: geo.label,
              secondaryText: geo.area || "",
              lat,
              lng,
            }));
          }
        } catch {
          // Fallback — no city resolved
        }
      }

      dispatch(setSelectedCity(city || null));
      onLocationSet();
    },
    [user, dispatch, updateUserMutation, onLocationSet],
  );

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { latitude, longitude } = await getCurrentPosition({ timeout: 10000 });
      await applyLocation(latitude, longitude);
    } catch {
      // Silently ignore — user denied or timed out
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectLocation = (loc: SearchGeocodeResult) => {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    setSearchQuery("");
    dispatch(addRecentLocation(loc));
    // Extract city from the secondaryText or do a reverse geocode
    applyLocation(lat, lng);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-[#0f3460] via-[#1a1a2e] to-[#16213e]">
      {/* Abstract background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-blue-500/[0.03] blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6" style={{ paddingTop: "calc(var(--sat,0px) + 40px)" }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6"
        >
          <img
            src="/icons/512.png"
            alt="Tijarah"
            className="w-20 h-20 rounded-2xl shadow-lg shadow-black/30"
          />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Tijarah</h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-[280px]">
            Set your location to discover trusted services near you
          </p>
        </motion.div>

        {/* GPS Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="w-full max-w-sm flex items-center justify-center gap-3 h-14 rounded-2xl bg-amber-500 text-white font-semibold text-[15px] shadow-lg shadow-amber-500/25 active:scale-[0.97] transition-all disabled:opacity-60"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <IonIcon icon={navigateCircleOutline} className="text-xl" />
          )}
          {isLocating ? "Detecting location..." : "Use Current Location"}
        </motion.button>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 w-full max-w-sm my-5"
        >
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs font-medium">or search manually</span>
          <div className="flex-1 h-px bg-white/10" />
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="relative">
            <IonIcon
              icon={searchOutline}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your area, city..."
              className="w-full h-13 pl-11 pr-4 rounded-2xl bg-white/[0.07] border border-white/[0.08] text-white text-sm placeholder:text-white/30 outline-none focus:border-amber-400/40 transition-colors"
            />
          </div>

          {/* Search Results */}
          {searchQuery.length >= 3 && (
            <div className="mt-2 rounded-2xl bg-white/[0.07] border border-white/[0.08] overflow-hidden max-h-[240px] overflow-y-auto">
              {isSearchLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
                </div>
              ) : searchResults?.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.placeId}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-b-0"
                  >
                    <IonIcon
                      icon={locationSharp}
                      className="text-amber-400/70 text-base mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">
                        {result.mainText}
                      </p>
                      <p className="text-white/40 text-xs truncate mt-0.5">
                        {result.secondaryText}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-white/30 text-sm">
                  No results found
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 text-center pb-8 px-6"
        style={{ paddingBottom: "calc(var(--sab, 0px) + 32px)" }}
      >
        <p className="text-white/20 text-[11px]">
          We need your location to show relevant services
        </p>
      </motion.div>
    </div>
  );
}
