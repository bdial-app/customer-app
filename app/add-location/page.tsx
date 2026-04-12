"use client";
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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

// Custom Advanced Marker Component to replace deprecated google.maps.Marker
const AdvancedMarker = ({
  position,
  map,
}: {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
}) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

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

  // Reverse geocode
  const getAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAcciwPVPALEtOh_vhFyELCyMMxFOtf384`,
      );
      const data = await res.json();
      const formattedAddress =
        data.results[0]?.formatted_address || "No address found";
      setAddress(formattedAddress);
      setSearchQuery(formattedAddress);
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

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

  return (
    <Page className="flex flex-col h-full">
      <Navbar
        title={isFocused ? "Search Location" : "Add Address"}
        left={
          <button onClick={handleBack} className="link">
            <IonIcon icon={arrowBack} className="text-2xl" />
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
                  mapId: "DEMO_MAP_ID",
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
            <button className="absolute bottom-4 w-12 h-12 grid place-content-center right-4 bg-white p-3 rounded-full shadow-lg active:scale-95 transition-transform z-10">
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
                  media={
                    <IonIcon
                      icon={home}
                      className={`w-8 ${selectedType === "Home" ? "text-white" : "text-slate-400"}`}
                    />
                  }
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
                  media={
                    <IonIcon
                      icon={business}
                      className={`w-8 ${selectedType === "Office" ? "text-white" : "text-slate-400"}`}
                    />
                  }
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
                  media={
                    <IonIcon
                      icon={ellipsisHorizontalCircleOutline}
                      className={`w-8 ${selectedType === "Other" ? "text-white" : "text-slate-400"}`}
                    />
                  }
                  onClick={() => setSelectedType("Other")}
                >
                  Other
                </Chip>
              </Block>

              <Block className="mt-8">
                <Button large rounded onClick={handleBack}>
                  Save Address
                </Button>
              </Block>
            </div>
          ) : (
            <List strong inset className="mt-0">
              {mockLocations
                .filter((l) =>
                  l.title.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((loc, i) => (
                  <ListItem
                    key={i}
                    title={loc.title}
                    text={loc.area}
                    link
                    onClick={() => {
                      setSearchQuery(loc.title);
                      setIsFocused(false);
                    }}
                  />
                ))}
              {mockLocations.filter((l) =>
                l.title.toLowerCase().includes(searchQuery.toLowerCase()),
              ).length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No regions found for "{searchQuery}"
                </div>
              )}
            </List>
          )}
        </div>
      </div>
    </Page>
  );
};

export default AddLocationPage;
