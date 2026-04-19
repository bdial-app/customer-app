"use client";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Page,
  Navbar,
  Block,
  BlockTitle,
  List,
  ListInput,
  ListItem,
  Button,
  Searchbar,
  Chip,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  locateOutline,
  pin,
  search,
  home,
  business,
  ellipsisHorizontal,
  ellipsisHorizontalCircleOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useSearchGeocode } from "@/hooks/useGeocode";
import {
  SearchGeocodeResult,
  reverseGeocode,
  ReverseGeocodeResponse,
} from "@/services/geocode.service";
import AddressBarNavigation from "../components/geo-location/address-bar-navigation";
import { useCreateSavedLocation } from "@/hooks/useSavedLocation";

// Custom Advanced Marker Component to replace deprecated google.maps.Marker
const AdvancedMarker = ({
  position,
  map,
}: {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
}) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );

  useEffect(() => {
    if (!map) return;

    // Create the Advanced Marker
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.position = position;
    }
  }, [position]);

  return null;
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 18.5204, // Pune
  lng: 73.8567,
};

const AddLocationPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedType, setSelectedType] = useState("Home");
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const libraries: ("marker" | "places")[] = useMemo(() => ["marker"], []);

  // Google Maps Logic
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAcciwPVPALEtOh_vhFyELCyMMxFOtf384",
    libraries,
  });

  const [marker, setMarker] = useState(defaultCenter);
  const [address, setAddress] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [fullLocation, setFullLocation] = useState<ReverseGeocodeResponse | null>(
    null,
  );
  const [isReverseLoading, setIsReverseLoading] = useState(false);

  const createSavedLocationMutation = useCreateSavedLocation();

  // Search Hook
  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchGeocode(searchQuery);

  // Reverse geocode
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

    if (map) {
      map.panTo(newPos);
      map.setZoom(16);
    }

    // Get full details (city, area, label, fullAddress, placeId)
    await getAddress(lat, lng);
  };

  const handleSaveAddress = async () => {
    if (!fullLocation) return;

    const payload = {
      title: selectedType.toLowerCase(),
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

  // On mount, get current location
  useEffect(() => {
    handleLocateMe();
  }, []);

  // Update marker and center map during mount if needed, but handleLocateMe already does this.

  // On map click
  const handleClick = useCallback((e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setMarker({ lat, lng });
    getAddress(lat, lng);
  }, []);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const mockLocations = [
    // ... (rest)
    { title: "Camp, Pune", area: "Maharashtra, India" },
    { title: "MG Road, Pune", area: "Maharashtra, India" },
    { title: "Koregaon Park, Pune", area: "Maharashtra, India" },
    { title: "Bohri Ali, Pune", area: "Maharashtra, India" },
    { title: "Viman Nagar, Pune", area: "Maharashtra, India" },
    { title: "Kalyani Nagar, Pune", area: "Maharashtra, India" },
    { title: "Hadapsar, Pune", area: "Maharashtra, India" },
    { title: "Magarpatta, Pune", area: "Maharashtra, India" },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = { lat: latitude, lng: longitude };
        setMarker(newPos);
        getAddress(latitude, longitude);
        if (map) {
          map.panTo(newPos);
          map.setZoom(16);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
    );
  };

  return (
    <Page className="flex flex-col h-full">
      <Navbar
        title={isFocused ? "Search Location" : "Add Address"}
        left={
          <button onClick={handleBack} className="link">
            {/* <IonIcon icon={arrowBack} className="text-2xl" /> */}
          </button>
        }
        leftClassName="w-11"
        className="!pb-4"
      />

      <div className="flex flex-col flex-1">
        {/* Hide Map and Form when searching */}
        {!isFocused && (
          <div className="flex-1 relative w-full h-80 bg-slate-200 overflow-hidden flex items-center justify-center transition-opacity duration-300">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={marker}
                zoom={15}
                onLoad={onMapLoad}
                onClick={handleClick}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  mapId: "3d186cf47c01e972b8b1486d",
                }}
              >
                <AdvancedMarker map={map} position={marker} />
              </GoogleMap>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-slate-400 text-sm">Loading Map...</div>
              </div>
            )}

            {/* Floating "Locate Me" Button */}
            <button
              onClick={handleLocateMe}
              className="absolute bottom-4 w-12 h-12 grid place-content-center right-4 bg-white p-3 rounded-full shadow-lg active:scale-95 transition-transform z-10"
            >
              <IonIcon
                icon={locateOutline}
                className="text-2xl text-blue-500"
              />
            </button>
          </div>
        )}

        <div>
          <BlockTitle className={!isFocused ? "mt-6" : "mt-2"}>
            {isFocused ? "Results" : "Location Details"}
          </BlockTitle>

          <Block>
            <Searchbar
              placeholder="Search for your building/area..."
              onInput={(e: any) => setSearchQuery(e.target.value)}
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchQuery) setIsFocused(false);
                }, 200);
              }}
              disableButton
              onDisable={() => {
                setIsFocused(false);
                setSearchQuery("");
              }}
            />

            {!isFocused && address && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <AddressBarNavigation
                  title={locationLabel || "Selected Location"}
                  address={address}
                  isLoading={isReverseLoading}
                  hideIcon
                  hideChevron
                />
              </div>
            )}
          </Block>

          {!isFocused ? (
            <div>
              <BlockTitle className="mt-6 uppercase text-xs font-bold tracking-widest text-slate-400">
                Save As
              </BlockTitle>
              <Block className="flex gap-2 flex-wrap !mt-2">
                <Chip
                  className={`transition-all duration-200 cursor-pointer ${
                    selectedType === "Home"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                  // media={
                  //   <IonIcon
                  //     icon={home}
                  //     className={`w-8 ${selectedType === "Home" ? "text-white" : "text-slate-400"}`}
                  //   />
                  // }
                  onClick={() => setSelectedType("Home")}
                >
                  Home
                </Chip>
                <Chip
                  className={`transition-all duration-200 cursor-pointer ${
                    selectedType === "Office"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                  // media={
                  //   <IonIcon
                  //     icon={business}
                  //     className={`w-8 ${selectedType === "Office" ? "text-white" : "text-slate-400"}`}
                  //   />
                  // }
                  onClick={() => setSelectedType("Office")}
                >
                  Office
                </Chip>
                <Chip
                  className={`transition-all duration-200 cursor-pointer ${
                    selectedType === "Other"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                  // media={
                  //   <IonIcon
                  //     icon={ellipsisHorizontalCircleOutline}
                  //     className={`w-8 ${selectedType === "Other" ? "text-white" : "text-slate-400"}`}
                  //   />
                  // }
                  onClick={() => setSelectedType("Other")}
                >
                  Other
                </Chip>
              </Block>

              <Block className="mt-8">
                <Button
                  large
                  rounded
                  onClick={handleSaveAddress}
                  disabled={!address || createSavedLocationMutation.isPending}
                >
                  {createSavedLocationMutation.isPending
                    ? "Saving..."
                    : "Save Address"}
                </Button>
              </Block>
            </div>
          ) : (
            <>
              {searchResults && searchResults.length > 0 ? (
                <List strong inset className="mt-0">
                  {searchResults.map((loc) => (
                    <ListItem
                      key={loc.placeId}
                      link
                      title={loc.mainText}
                      text={loc.secondaryText}
                      onClick={() => handleSelectLocation(loc)}
                    />
                  ))}
                </List>
              ) : searchQuery.length >= 3 && !isSearchLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 gap-2">
                  <IonIcon
                    icon={search}
                    className="text-4xl text-slate-300 mb-2"
                  />
                  <div className="text-lg font-semibold text-slate-800">
                    No results found
                  </div>
                  <div className="text-sm">
                    We couldn't find anything matching "{searchQuery}"
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {isSearchLoading
                    ? "Searching..."
                    : searchQuery.length < 3
                      ? "Type at least 3 characters to search..."
                      : "No results found"}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
};

export default AddLocationPage;
