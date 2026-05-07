"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Page } from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  locateOutline,
  search,
  homeOutline,
  briefcaseOutline,
  locationOutline,
  checkmarkCircle,
  closeCircle,
  navigateOutline,
  warningOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { useSearchGeocode } from "@/hooks/useGeocode";
import {
  SearchGeocodeResult,
  reverseGeocode,
  ReverseGeocodeResponse,
} from "@/services/geocode.service";
import { useCreateSavedLocation } from "@/hooks/useSavedLocation";
import { motion, AnimatePresence } from "framer-motion";
import PrivateRoute from "@/app/components/private-route";
import { getCurrentPosition } from "@/utils/geolocation";



const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 18.5204,
  lng: 73.8567,
};

const locationTypes = [
  { key: "Home", icon: homeOutline, label: "Home", value: "home" },
  { key: "Office", icon: briefcaseOutline, label: "Office", value: "work" },
  { key: "Other", icon: locationOutline, label: "Other", value: "other" },
];

const AddLocationContent = () => {
  const router = useRouter();
  const { goBack } = useBackNavigation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedType, setSelectedType] = useState("Home");
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useGoogleMapsLoader();

  const [marker, setMarker] = useState(defaultCenter);
  const [address, setAddress] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [fullLocation, setFullLocation] =
    useState<ReverseGeocodeResponse | null>(null);
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  const createSavedLocationMutation = useCreateSavedLocation();

  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchGeocode(searchQuery);

  const getAddress = async (lat: number, lng: number) => {
    try {
      setIsReverseLoading(true);
      const data = await reverseGeocode({ lat, lng });
      setAddress(data.fullAddress);
      setLocationLabel(data.label);
      setFullLocation(data);
    } catch (error) {
      console.error("Error fetching address:", error);
    } finally {
      setIsReverseLoading(false);
    }
  };

  const handleSelectLocation = async (loc: SearchGeocodeResult) => {
    const { lat, lng } = loc;
    const newPos = { lat, lng };
    setMarker(newPos);
    setIsFocused(false);
    setSearchQuery("");

    if (mapRef.current) {
      mapRef.current.panTo(newPos);
      mapRef.current.setZoom(16);
    }

    await getAddress(lat, lng);
  };

  const handleSaveAddress = async () => {
    if (!fullLocation) return;

    const titleMap: Record<string, string> = {
      Home: "home",
      Office: "work",
      Other: "other",
    };
    const payload = {
      title: titleMap[selectedType] ?? "other",
      label: fullLocation.label,
      latitude: marker.lat,
      longitude: marker.lng,
      city: fullLocation.city,
      area: fullLocation.area,
      fullAddress: fullLocation.fullAddress,
      placeId: fullLocation.placeId,
    };

    createSavedLocationMutation.mutate(payload, {
      onSuccess: () => {
        router.push("/");
      },
    });
  };

  useEffect(() => {
    handleLocateMe();
  }, []);

  const handleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });
    getAddress(lat, lng);
  }, []);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance;
    // If geolocation resolved before map loaded, pan to the updated marker now
    setMarker((current) => {
      if (
        current.lat !== defaultCenter.lat ||
        current.lng !== defaultCenter.lng
      ) {
        mapInstance.panTo(current);
        mapInstance.setZoom(16);
      }
      return current;
    });
  }, []);

  const handleBack = () => {
    if (isFocused) {
      setIsFocused(false);
      setSearchQuery("");
    } else {
      goBack("/");
    }
  };

  const handleLocateMe = useCallback(async () => {
    try {
      const { latitude, longitude } = await getCurrentPosition({ timeout: 10000, maximumAge: 60000 });
      const newPos = { lat: latitude, lng: longitude };
      setMarker(newPos);
      getAddress(latitude, longitude);
      if (mapRef.current) {
        mapRef.current.panTo(newPos);
        mapRef.current.setZoom(16);
      }
    } catch (error) {
      console.error("Geolocation error:", error);
    }
  }, []);

  const handleClearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <Page className="bg-white dark:bg-neutral-950">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800" style={{ paddingTop: "var(--sat,0px)" }}>
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
            >
              <IonIcon
                icon={arrowBack}
                className="text-xl text-neutral-800 dark:text-neutral-200"
              />
            </button>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {isFocused ? "Search Location" : "Add Address"}
            </h1>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative flex items-center">
              <IonIcon
                icon={search}
                className="absolute left-3.5 text-neutral-400 text-lg z-10 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for area, street, building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-base text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-600"
                >
                  <IonIcon icon={closeCircle} className="text-lg" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isFocused ? (
              /* Search Results */
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pb-8"
              >
                {/* Use Current Location Button */}
                <button
                  onClick={() => {
                    handleLocateMe();
                    setIsFocused(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors border-b border-neutral-100 dark:border-neutral-800"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
                    <IonIcon
                      icon={navigateOutline}
                      className="text-lg text-amber-500"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Use current location
                    </p>
                    <p className="text-xs text-neutral-400">Using GPS</p>
                  </div>
                </button>

                {searchResults && searchResults.length > 0 ? (
                  <div>
                    <p className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Search Results
                    </p>
                    {searchResults.map((loc, index) => (
                      <button
                        key={loc.placeId}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full flex items-start gap-3.5 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                          <IonIcon
                            icon={locationOutline}
                            className="text-base text-neutral-500"
                          />
                        </div>
                        <div className="text-left min-w-0 flex-1 border-b border-neutral-50 dark:border-neutral-800 pb-3">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                            {loc.mainText}
                          </p>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {loc.secondaryText}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 3 && !isSearchLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                      <IonIcon
                        icon={search}
                        className="text-2xl text-neutral-300"
                      />
                    </div>
                    <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                      No results found
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : isSearchLoading ? (
                  <div className="flex flex-col items-center py-16">
                    <div className="w-7 h-7 border-[2.5px] border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-neutral-400 mt-3">
                      Searching...
                    </p>
                  </div>
                ) : searchQuery.length > 0 && searchQuery.length < 3 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-neutral-400">
                      Type at least 3 characters to search
                    </p>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              /* Map + Details View */
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Map */}
                <div className="relative w-full h-72 bg-neutral-100 dark:bg-neutral-900">
                  {loadError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <IonIcon
                          icon={warningOutline}
                          className="text-xl text-red-500"
                        />
                      </div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Map failed to load
                      </p>
                      <p className="text-xs text-neutral-400">
                        Check your internet connection and try again
                      </p>
                    </div>
                  ) : isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={marker}
                      zoom={15}
                      onLoad={onMapLoad}
                      onClick={handleClick}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                        // "greedy" lets the map scroll on single-finger drag on mobile
                        // without showing the "use two fingers" overlay
                        gestureHandling: "greedy",
                      }}
                    >
                      <MarkerF position={marker} />
                    </GoogleMap>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="w-7 h-7 border-[2.5px] border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-neutral-400">Loading map...</p>
                    </div>
                  )}

                  {/* Locate Me */}
                  <button
                    onClick={handleLocateMe}
                    className="absolute bottom-3 right-3 w-11 h-11 bg-white dark:bg-neutral-800 rounded-full shadow-lg shadow-black/10 flex items-center justify-center active:scale-95 transition-transform z-10"
                  >
                    <IonIcon
                      icon={locateOutline}
                      className="text-xl text-amber-500"
                    />
                  </button>
                </div>

                {/* Location Details Card */}
                <div className="px-4 pt-5 pb-6">
                  {/* Selected Address */}
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-100 dark:border-neutral-800">
                    {isReverseLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-32 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-full" />
                          <div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded-full" />
                        </div>
                      </div>
                    ) : address ? (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0 mt-0.5">
                          <IonIcon
                            icon={locationOutline}
                            className="text-lg text-amber-500"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                            {locationLabel || "Selected Location"}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                            {address}
                          </p>
                        </div>
                        <div className="shrink-0 mt-0.5">
                          <IonIcon
                            icon={checkmarkCircle}
                            className="text-lg text-green-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 py-1">
                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          <IonIcon
                            icon={locationOutline}
                            className="text-lg text-neutral-400"
                          />
                        </div>
                        <p className="text-sm text-neutral-400">
                          Tap on the map or search to select a location
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Save As */}
                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3 px-1">
                      Save as
                    </p>
                    <div className="flex gap-2.5">
                      {locationTypes.map((type) => {
                        const isSelected = selectedType === type.key;
                        return (
                          <button
                            key={type.key}
                            onClick={() => setSelectedType(type.key)}
                            className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all active:scale-[0.97] ${
                              isSelected
                                ? "border-amber-400 bg-amber-400/5 dark:bg-amber-400/10"
                                : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600"
                            }`}
                          >
                            <IonIcon
                              icon={type.icon}
                              className={`text-xl ${
                                isSelected
                                  ? "text-amber-500"
                                  : "text-neutral-400"
                              }`}
                            />
                            <span
                              className={`text-xs font-medium ${
                                isSelected
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-neutral-500"
                              }`}
                            >
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveAddress}
                    disabled={!address || createSavedLocationMutation.isPending}
                    className={`w-full mt-8 h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                      !address || createSavedLocationMutation.isPending
                        ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                        : "bg-amber-400 text-neutral-900 shadow-lg shadow-amber-400/20 hover:bg-amber-500"
                    }`}
                  >
                    {createSavedLocationMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save Address"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Page>
  );
};

export default function AddLocationPage() {
  return (
    <PrivateRoute
      title="Add Location"
      description="Sign in to save and manage your favourite locations."
    >
      <AddLocationContent />
    </PrivateRoute>
  );
}
