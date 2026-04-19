import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useReverseGeocode, useSearchGeocode } from "@/hooks/useGeocode";
import { useUpdateUser } from "@/hooks/useUser";
import { setProfile } from "@/store/slices/authSlice";
import { addRecentLocation } from "@/store/slices/locationSlice";
import {
  SearchGeocodeResult,
  ReverseGeocodeResponse,
} from "@/services/geocode.service";
import { useQueryClient } from "@tanstack/react-query";
import { useSavedLocations } from "@/hooks/useSavedLocation";
import { SavedLocation } from "@/services/saved-location.service";
import AddressBarNavigation from "./address-bar-navigation";
import {
  Block,
  BlockTitle,
  List,
  ListInput,
  ListItem,
  Navbar,
  Page,
  Searchbar,
  Sheet,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  add,
  arrowBack,
  business,
  home,
  laptopOutline,
  location,
  navigateCircleOutline,
  search,
} from "ionicons/icons";
import { useRouter } from "next/navigation";

const GeoLocation = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleInput = (e: any) => {
    setSearchQuery(e.target.value);
  };

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const updateUserMutation = useUpdateUser();
  const { data: savedLocations } = useSavedLocations();
  const { recentLocations } = useAppSelector((state) => state.location);
  const user = useAppSelector((state) => state.auth.user as any);

  const { data: addressData, isLoading: isAddressLoading } = useReverseGeocode(
    user?.latitude && user?.longitude
      ? { lat: user.latitude, lng: user.longitude }
      : null,
  );

  const { data: searchResults, isLoading: isSearchLoading } =
    useSearchGeocode(searchQuery);

  console.log({ addressData, user, searchResults });

  const handleSelectLocation = (loc: SearchGeocodeResult) => {
    const { lat, lng, mainText, description, placeId } = loc;

    // 1. Clear search text
    setSearchQuery("");

    // 2. Store in user slice
    if (user) {
      dispatch(setProfile({ ...user, latitude: lat, longitude: lng }));
    }

    // 3. Add to recent locations
    dispatch(addRecentLocation(loc));

    // 4. Call patch user api (BTS)
    updateUserMutation.mutate({ latitude: lat, longitude: lng });

    // 4. Close drawer
    setOpen(false);
  };

  const handleSelectSavedLocation = (loc: SavedLocation) => {
    const { latitude, longitude, label, fullAddress, placeId } = loc;

    // 1. Store in user slice
    if (user) {
      dispatch(setProfile({ ...user, latitude, longitude }));
    }

    // 2. Add to recent locations
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

    // 3. Call patch user api (BTS)
    updateUserMutation.mutate({ latitude, longitude });

    // 4. Close drawer
    setOpen(false);
  };

  const handleAddAddress = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/add-location");
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // 1. Store in user slice
        if (user) {
          dispatch(setProfile({ ...user, latitude, longitude }));
        }

        // 2. Add to recent locations if we have address data
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

        // 3. Call patch user api (BTS - background update)
        updateUserMutation.mutate({ latitude, longitude });

        // 4. Close drawer
        setOpen(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
    );
  };

  const mockLocations = [
    { title: "Camp, Pune", area: "Maharashtra, India" },
    { title: "MG Road, Pune", area: "Maharashtra, India" },
    { title: "Koregaon Park, Pune", area: "Maharashtra, India" },
    { title: "Bohri Ali, Pune", area: "Maharashtra, India" },
    { title: "Viman Nagar, Pune", area: "Maharashtra, India" },
    { title: "Kalyani Nagar, Pune", area: "Maharashtra, India" },
    { title: "Hadapsar, Pune", area: "Maharashtra, India" },
    { title: "Magarpatta, Pune", area: "Maharashtra, India" },
    { title: "Kothrud, Pune", area: "Maharashtra, India" },
    { title: "Bavdhan, Pune", area: "Maharashtra, India" },
    { title: "Baner, Pune", area: "Maharashtra, India" },
    { title: "Balewadi High Street, Pune", area: "Maharashtra, India" },
    { title: "Hinjewadi Phase 1, Pune", area: "Maharashtra, India" },
    { title: "Hinjewadi Phase 2, Pune", area: "Maharashtra, India" },
    { title: "Wakad, Pune", area: "Maharashtra, India" },
    { title: "Pimple Saudagar, Pune", area: "Maharashtra, India" },
    { title: "Aundh, Pune", area: "Maharashtra, India" },
    { title: "Shivaji Nagar, Pune", area: "Maharashtra, India" },
    { title: "FC Road, Pune", area: "Maharashtra, India" },
    { title: "Deccan Gymkhana, Pune", area: "Maharashtra, India" },
    { title: "Swargate, Pune", area: "Maharashtra, India" },
    { title: "Bibwewadi, Pune", area: "Maharashtra, India" },
    { title: "Kondhwa, Pune", area: "Maharashtra, India" },
  ];

  return (
    <>
      <Block onClick={() => setOpen(true)}>
        <AddressBarNavigation
          title={addressData?.label || "Azam Campus"}
          address={addressData?.fullAddress || "Gulistan-e-Jauhar, Camp"}
          isLoading={isAddressLoading}
        />
      </Block>
      <Sheet opened={open} onBackdropClick={() => setOpen(false)}>
        <Page
          className={`relative !rounded-3xl transition-all duration-300 ${
            isFocused ? "!h-[100dvh]" : "h-auto"
          }`}
        >
          <Navbar
            title="Select Location"
            left={<IonIcon icon={arrowBack} />}
            leftClassName="w-11"
            subnavbarClassName="mt-4"
            subnavbar={
              <Searchbar
                onInput={handleInput}
                value={searchQuery}
                onClear={handleClear}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200);
                }}
                disableButton
                placeholder={"Search for area, street name..."}
                onDisable={() => {
                  setIsFocused(false);
                  setSearchQuery("");
                }}
              />
            }
          />

          {!isFocused ? (
            <>
              <List strong inset>
                <ListItem
                  media={
                    <IonIcon className="w-8 h-8" icon={navigateCircleOutline} />
                  }
                  link
                  title="Use Current Location"
                  onClick={handleUseCurrentLocation}
                />
                <ListItem
                  media={<IonIcon className="w-8 h-8" icon={add} />}
                  link
                  title="Add new address"
                  onClick={handleAddAddress}
                />
              </List>
              <BlockTitle>Saved Locations</BlockTitle>
              {savedLocations && savedLocations.length > 0 ? (
                <List strong inset>
                  {savedLocations.map((loc) => (
                    <ListItem
                      key={loc.id}
                      media={
                        <IonIcon
                          className="w-6 h-6 text-blue-500"
                          icon={
                            loc.title === "home"
                              ? home
                              : loc.title === "office"
                                ? business
                                : location
                          }
                        />
                      }
                      link
                      title={
                        loc.title.charAt(0).toUpperCase() + loc.title.slice(1)
                      }
                      text={loc.label}
                      onClick={() => handleSelectSavedLocation(loc)}
                    />
                  ))}
                </List>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  No saved locations yet
                </div>
              )}
            </>
          ) : searchQuery === "" ? (
            <>
              <BlockTitle>Recent Locations</BlockTitle>
              {recentLocations && recentLocations.length > 0 ? (
                <List strong inset>
                  {recentLocations.map((loc) => (
                    <ListItem
                      key={loc.placeId}
                      link
                      title={loc.mainText}
                      text={loc.description}
                      onClick={() => handleSelectLocation(loc)}
                    />
                  ))}
                </List>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No recent locations yet
                </div>
              )}
            </>
          ) : (
            <>
              <BlockTitle>
                {isSearchLoading ? "Searching..." : "Search Results"}
              </BlockTitle>
              {searchResults && searchResults.length > 0 ? (
                <List strong inset>
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
                  {searchQuery.length < 3
                    ? "Type at least 3 characters to search..."
                    : "No results found"}
                </div>
              )}
            </>
          )}
        </Page>
      </Sheet>
    </>
  );
};

export default GeoLocation;
