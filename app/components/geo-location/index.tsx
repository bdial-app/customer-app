import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useReverseGeocode, useSearchGeocode } from "@/hooks/useGeocode";
import { useUpdateUser } from "@/hooks/useUser";
import { setProfile } from "@/store/slices/authSlice";
import { addRecentLocation, setGuestCoords } from "@/store/slices/locationSlice";
import {
  SearchGeocodeResult,
  reverseGeocode as reverseGeocodeApi,
} from "@/services/geocode.service";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { useQueryClient } from "@tanstack/react-query";
import { useSavedLocations } from "@/hooks/useSavedLocation";
import { SavedLocation } from "@/services/saved-location.service";
import AddressBarNavigation from "./address-bar-navigation";
import NotificationBell from "../notification-center/NotificationBell";
import NotificationDropdown from "../notification-center/NotificationDropdown";
import { useAuthGate } from "@/hooks/useAuthGate";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  addOutline,
  arrowBack,
  businessOutline,
  homeOutline,
  locationOutline,
  locationSharp,
  navigateCircleOutline,
  searchOutline,
  timeOutline,
  bookmarkOutline,
  closeOutline,
  chevronDown,
  logInOutline,
  mapOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { getCurrentPosition } from "@/utils/geolocation";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_MAP_CENTER = { lat: 18.5204, lng: 73.8567 };

const GeoLocation = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [mapMarker, setMapMarker] = useState(DEFAULT_MAP_CENTER);
  const [mapAddress, setMapAddress] = useState("");
  const [isMapReverseLoading, setIsMapReverseLoading] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<SearchGeocodeResult[]>([]);
  const [isMapSearching, setIsMapSearching] = useState(false);
  const mapSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapSearchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const dragControls = useDragControls();

  const { isLoaded: isMapLoaded } = useGoogleMapsLoader();

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const updateUserMutation = useUpdateUser();
  const { data: savedLocations } = useSavedLocations();
  const { recentLocations, guestCoords } = useAppSelector((state) => state.location);
  const user = useAppSelector((state) => state.auth.user as any);
  const { requireAuth } = useAuthGate();

  // Resolve coordinates: logged-in uses user profile, guest uses persisted Redux state.
  // Force Number() because TypeORM/pg returns numeric columns as strings from PostgreSQL.
  const activeCoords: { lat: number; lng: number } | null =
    user?.latitude && user?.longitude
      ? { lat: Number(user.latitude), lng: Number(user.longitude) }
      : guestCoords
      ? { lat: Number(guestCoords.lat), lng: Number(guestCoords.lng) }
      : null;

  const { data: addressData, isLoading: isAddressLoading } = useReverseGeocode(
    activeCoords,
  );

  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchGeocode(searchQuery);

  const isSearching = searchQuery.length > 0;

  // Focus search input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  const handleSelectLocation = useCallback((loc: SearchGeocodeResult) => {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    setSearchQuery("");
    if (user) {
      dispatch(setProfile({ ...user, latitude: lat, longitude: lng }));
      updateUserMutation.mutate({ latitude: lat, longitude: lng });
    } else {
      dispatch(setGuestCoords({ lat, lng }));
    }
    dispatch(addRecentLocation(loc));
    setOpen(false);
  }, [user, dispatch, updateUserMutation]);

  const handleSelectSavedLocation = useCallback((loc: SavedLocation) => {
    const { latitude, longitude, label, fullAddress, placeId } = loc;
    if (user) {
      dispatch(setProfile({ ...user, latitude, longitude }));
      updateUserMutation.mutate({ latitude, longitude });
    } else {
      dispatch(setGuestCoords({ lat: latitude, lng: longitude }));
    }
    dispatch(
      addRecentLocation({
        placeId,
        description: fullAddress,
        mainText: label,
        secondaryText: "",
        lat: latitude,
        lng: longitude,
      }),
    );
    setOpen(false);
  }, [user, dispatch, updateUserMutation]);

  const handleAddAddress = () => {
    requireAuth(() => {
      setOpen(false);
      router.push("/add-location");
    });
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { latitude, longitude } = await getCurrentPosition({ timeout: 10000 });
      if (user) {
        dispatch(setProfile({ ...user, latitude, longitude }));
        updateUserMutation.mutate({ latitude, longitude });
      } else {
        dispatch(setGuestCoords({ lat: latitude, lng: longitude }));
      }
      if (addressData) {
        dispatch(
          addRecentLocation({
            placeId: addressData.placeId,
            description: addressData.fullAddress,
            mainText: addressData.label,
            secondaryText: "",
            lat: latitude,
            lng: longitude,
          }),
        );
      }
      setOpen(false);
    } catch {
      // silently ignore – user denied or timed out
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      setOpen(false);
    }
  };

  // ── Map Picker Handlers ──
  const handleOpenMap = useCallback(() => {
    const center = activeCoords
      ? { lat: Number(activeCoords.lat), lng: Number(activeCoords.lng) }
      : DEFAULT_MAP_CENTER;
    setMapMarker(center);
    setMapAddress("");
    setMapSearchQuery("");
    setMapSearchResults([]);
    setShowMap(true);
  }, [activeCoords]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMapMarker({ lat, lng });
    setMapSearchQuery("");
    setMapSearchResults([]);
    setIsMapReverseLoading(true);
    try {
      const geo = await reverseGeocodeApi({ lat, lng });
      setMapAddress(geo.fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch {
      setMapAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsMapReverseLoading(false);
    }
  }, []);

  const handleMapLocateMe = useCallback(async () => {
    try {
      const { latitude: lat, longitude: lng } = await getCurrentPosition({ timeout: 10000 });
      const newPos = { lat, lng };
      setMapMarker(newPos);
      setMapSearchQuery("");
      setMapSearchResults([]);
      if (mapRef.current) {
        mapRef.current.panTo(newPos);
        mapRef.current.setZoom(16);
      }
      setIsMapReverseLoading(true);
      try {
        const geo = await reverseGeocodeApi({ lat, lng });
        setMapAddress(geo.fullAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } catch {
        setMapAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } finally {
        setIsMapReverseLoading(false);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const handleMapSearch = useCallback((query: string) => {
    setMapSearchQuery(query);
    setMapSearchResults([]);
    if (mapSearchDebounceRef.current) clearTimeout(mapSearchDebounceRef.current);
    if (!query.trim()) return;
    mapSearchDebounceRef.current = setTimeout(async () => {
      setIsMapSearching(true);
      try {
        // Import lazily to avoid circular dep
        const { searchGeocode } = await import("@/services/geocode.service");
        const results = await searchGeocode(query.trim());
        setMapSearchResults(results.filter((r) => r.lat && r.lng));
      } catch {
        // silent
      } finally {
        setIsMapSearching(false);
      }
    }, 350);
  }, []);

  const handleMapSelectResult = useCallback(async (result: SearchGeocodeResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lng);
    const pos = { lat, lng };
    setMapMarker(pos);
    setMapSearchQuery("");
    setMapSearchResults([]);
    if (mapRef.current) {
      mapRef.current.panTo(pos);
      mapRef.current.setZoom(16);
    }
    setIsMapReverseLoading(true);
    try {
      const geo = await reverseGeocodeApi({ lat, lng });
      setMapAddress(geo.fullAddress || result.description);
    } catch {
      setMapAddress(result.description);
    } finally {
      setIsMapReverseLoading(false);
    }
  }, []);

  const handleConfirmMapLocation = useCallback(async () => {
    const { lat, lng } = mapMarker;
    if (user) {
      dispatch(setProfile({ ...user, latitude: lat, longitude: lng }));
      updateUserMutation.mutate({ latitude: lat, longitude: lng });
    } else {
      dispatch(setGuestCoords({ lat, lng }));
    }
    // Try to create a recent entry
    try {
      const geo = await reverseGeocodeApi({ lat, lng });
      dispatch(addRecentLocation({
        placeId: geo.placeId || `${lat},${lng}`,
        description: geo.fullAddress || "",
        mainText: geo.label || "Map Pin",
        secondaryText: geo.area || "",
        lat,
        lng,
      }));
    } catch {
      dispatch(addRecentLocation({
        placeId: `${lat},${lng}`,
        description: mapAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        mainText: "Map Pin",
        secondaryText: "",
        lat,
        lng,
      }));
    }
    setShowMap(false);
    setOpen(false);
  }, [mapMarker, mapAddress, user, dispatch, updateUserMutation]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
  }, []);

  const savedLocationIcon = (title: string) => {
    if (title === "home") return homeOutline;
    if (title === "work") return businessOutline;
    return locationOutline;
  };

  return (
    <>
      {/* ── Header Bar ── */}
      <div
        className="sticky top-0 z-40"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 55%, #1e3a5f 100%)",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
        <div
          onClick={() => setOpen(true)}
          className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer active:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="shrink-0 w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/20 flex items-center justify-center">
              <IonIcon icon={locationSharp} className="text-amber-400 text-[17px]" />
            </div>
            <AddressBarNavigation
              title={addressData?.label || "Select Location"}
              address={addressData?.fullAddress || "Tap to set your location"}
              isLoading={isAddressLoading}
              hideIcon
            />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {user ? (
              <NotificationBell onClick={() => setNotifOpen((v) => !v)} className="!w-9 !h-9 !rounded-2xl !bg-white/[0.07] !border !border-white/[0.08] !p-0 [&_ion-icon]:!text-white/75 [&_ion-icon]:!text-[17px]" />
            ) : (
              <button
                onClick={() => requireAuth()}
                className="w-9 h-9 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon icon={logInOutline} className="text-[17px] text-white/75" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification dropdown */}
      <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={handleDragEnd}
              className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl max-h-[92dvh] flex flex-col shadow-2xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Drag handle */}
              <div
                className="flex justify-center py-3 cursor-grab active:cursor-grabbing shrink-0"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Select Location</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                >
                  <IonIcon icon={closeOutline} className="text-base text-slate-500" />
                </motion.button>
              </div>

              {/* Search Input */}
              <div className="px-4 pb-3 shrink-0">
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
                  <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for area, street name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                  {searchQuery && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSearchQuery("")}>
                      <IonIcon icon={closeOutline} className="text-base text-slate-400" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Content — scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {!isSearching ? (
                  /* ── Default State ── */
                  <div className="pb-6">
                    {/* Use Current Location CTA */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUseCurrentLocation}
                      className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-3.5 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <IonIcon icon={navigateCircleOutline} className="text-xl text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-amber-800">Use Current Location</p>
                        <p className="text-[11px] text-amber-600/70 mt-0.5">Using GPS</p>
                      </div>
                      <IonIcon icon={chevronDown} className="text-sm text-amber-400 -rotate-90" />
                    </motion.button>

                    {/* Pick on Map CTA */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOpenMap}
                      className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <IonIcon icon={mapOutline} className="text-xl text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 dark:text-white">Pick on Map</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tap the map to choose a location</p>
                      </div>
                      <IonIcon icon={chevronDown} className="text-sm text-slate-400 -rotate-90" />
                    </motion.button>

                    {/* Saved Locations — only for logged-in users */}
                    {user && savedLocations && savedLocations.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 px-4 mb-2">
                          <IonIcon icon={bookmarkOutline} className="text-sm text-slate-400" />
                          <h3 className="text-[13px] font-bold text-slate-700">Saved Locations</h3>
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
                          {savedLocations.map((loc) => (
                            <motion.button
                              key={loc.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSelectSavedLocation(loc)}
                              className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 shadow-sm rounded-xl px-3 py-2.5"
                            >
                              <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                                <IonIcon icon={savedLocationIcon(loc.title)} className="text-sm text-slate-500 dark:text-slate-400" />
                              </div>
                              <div className="text-left">
                                <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 capitalize leading-tight">{loc.title}</p>
                                <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[120px]">{loc.label}</p>
                              </div>
                            </motion.button>
                          ))}
                          {/* Add New */}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAddAddress}
                            className="shrink-0 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5"
                          >
                            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center">
                              <IonIcon icon={addOutline} className="text-sm text-slate-400" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Add New</span>
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* No saved — show Add Address prominently (only for logged-in users) */}
                    {user && (!savedLocations || savedLocations.length === 0) && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddAddress}
                        className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <IonIcon icon={addOutline} className="text-xl text-slate-500 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Add New Address</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Home, Work, or Other</p>
                        </div>
                      </motion.button>
                    )}

                    {/* Recent Locations */}
                    {recentLocations && recentLocations.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 px-4 mb-2">
                          <IonIcon icon={timeOutline} className="text-sm text-slate-400" />
                          <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Recent</h3>
                        </div>
                        <div className="mx-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                          {recentLocations.slice(0, 5).map((loc) => (
                            <motion.button
                              key={loc.placeId}
                              whileTap={{ backgroundColor: "rgb(248 250 252)" }}
                              onClick={() => handleSelectLocation(loc)}
                              className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <IonIcon icon={timeOutline} className="text-sm text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{loc.mainText}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{loc.description}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Search Results ── */
                  <div className="pb-6">
                    {isSearchLoading && searchQuery.length >= 3 && (
                      <div className="mx-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                              <div className="h-2.5 bg-slate-50 rounded-full w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length < 3 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-slate-400">Type at least 3 characters to search</p>
                      </div>
                    )}

                    {searchResults && searchResults.length > 0 && (
                      <div className="mx-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                        {searchResults.map((loc, i) => (
                          <motion.button
                            key={loc.placeId}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ backgroundColor: "rgb(248 250 252)" }}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <IonIcon icon={locationOutline} className="text-sm text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-slate-800 line-clamp-1">{loc.mainText}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{loc.secondaryText}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 3 && !isSearchLoading && searchResults && searchResults.length === 0 && (
                      <div className="flex flex-col items-center py-12">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                          <IonIcon icon={searchOutline} className="text-xl text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No results found</p>
                        <p className="text-[12px] text-slate-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Map Picker Overlay ── */}
      <AnimatePresence>
        {showMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col"
          >
            {/* Map Header — back button + search bar */}
            <div
              className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shrink-0"
              style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => setShowMap(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                >
                  <IonIcon icon={arrowBack} className="text-lg text-slate-700 dark:text-white" />
                </button>

                {/* Search input */}
                <div className="flex-1 relative">
                  <div className={`flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2 transition-all ${
                    mapSearchQuery ? "ring-2 ring-amber-400/40" : ""
                  }`}>
                    {isMapSearching
                      ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      : <IonIcon icon={searchOutline} className="text-base text-slate-400 shrink-0" />}
                    <input
                      ref={mapSearchInputRef}
                      type="text"
                      value={mapSearchQuery}
                      onChange={(e) => handleMapSearch(e.target.value)}
                      placeholder="Search landmark, area, address…"
                      className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
                    />
                    {mapSearchQuery && (
                      <button onClick={() => { setMapSearchQuery(""); setMapSearchResults([]); }}
                        className="text-slate-400 active:text-slate-600 text-lg leading-none shrink-0">
                        &times;
                      </button>
                    )}
                  </div>

                  {/* Suggestions dropdown */}
                  {mapSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl z-20 max-h-64 overflow-y-auto">
                      {mapSearchResults.map((r) => (
                        <button
                          key={r.placeId}
                          onClick={() => handleMapSelectResult(r)}
                          className="w-full flex items-start gap-3 px-3.5 py-3 text-left border-b border-slate-50 dark:border-slate-700/50 last:border-0 active:bg-amber-50 dark:active:bg-slate-700 transition-colors"
                        >
                          <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                            <IonIcon icon={locationOutline} className="text-xs text-amber-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight truncate">{r.mainText}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight truncate">{r.secondaryText || r.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
              {isMapLoaded ? (
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={mapMarker}
                  zoom={15}
                  onClick={handleMapClick}
                  onLoad={onMapLoad}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    gestureHandling: "greedy",
                  }}
                >
                  <MarkerF position={{ lat: Number(mapMarker.lat), lng: Number(mapMarker.lng) }} />
                </GoogleMap>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                  <p className="text-sm text-slate-400">Loading map...</p>
                </div>
              )}

              {/* Locate Me FAB */}
              <button
                onClick={handleMapLocateMe}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon icon={navigateCircleOutline} className="text-xl text-amber-600" />
              </button>
            </div>

            {/* Bottom Confirm Bar */}
            <div
              className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-3"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
            >
              {mapAddress ? (
                <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                  {isMapReverseLoading ? "Finding address..." : mapAddress}
                </p>
              ) : (
                <p className="text-[13px] text-slate-400 mb-2">Tap the map or search to pin a location</p>
              )}
              <button
                onClick={handleConfirmMapLocation}
                disabled={!mapAddress || isMapReverseLoading}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-bold text-sm active:bg-amber-600 disabled:opacity-40 transition-opacity"
              >
                Confirm Location
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GeoLocation;
