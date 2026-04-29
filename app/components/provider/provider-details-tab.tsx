"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  createOutline,
  callOutline,
  locationOutline,
  timeOutline,
  documentTextOutline,
  checkmarkOutline,
  closeOutline,
  storefrontOutline,
  mapOutline,
  cameraOutline,
  imageOutline,
  personCircleOutline,
  toggleOutline,
  navigateOutline,
  searchOutline,
  checkmarkCircle,
} from "ionicons/icons";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { List, Button, Sheet, Page, Navbar, Block } from "konsta/react";
import { FormikInput } from "../formik-input";
import { ProviderData } from "@/services/provider.service";
import { useUpdateProvider } from "@/hooks/useMyProvider";
import TimePicker from "../time-picker";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { reverseGeocode, searchGeocode } from "@/services/geocode.service";

interface ProviderDetailsTabProps {
  provider: ProviderData;
}

const detailsSchema = Yup.object({
  brandName: Yup.string().required("Brand name is required"),
  description: Yup.string().nullable(),
  contactNumber: Yup.string().required("Phone number is required"),
  address: Yup.string().nullable(),
  city: Yup.string().required("City is required"),
  area: Yup.string().nullable(),
  pincode: Yup.string().matches(/^\d{6}$/, "Must be 6 digits").nullable(),
  openTime: Yup.string().nullable(),
  closeTime: Yup.string().nullable(),
});

const InfoRow = ({
  icon,
  label,
  value,
  onTap,
}: {
  icon: string;
  label: string;
  value: string | null;
  onTap?: () => void;
}) => (
  <motion.div
    whileTap={onTap ? { scale: 0.98, backgroundColor: "#f8fafc" } : undefined}
    onClick={onTap}
    className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
  >
    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
      <IonIcon icon={icon} className="text-teal-600 text-lg" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-slate-800 mt-0.5 leading-relaxed">
        {value || "Not set"}
      </p>
    </div>
  </motion.div>
);

const ProviderDetailsTab = ({ provider }: ProviderDetailsTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [detailSheet, setDetailSheet] = useState<{ title: string; content: string } | null>(null);
  const updateMutation = useUpdateProvider();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [bannerError, setBannerError] = useState(false);
  const [profileError, setProfileError] = useState(false);

  // Map / location state for edit mode
  const { isLoaded } = useGoogleMapsLoader();
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(
    provider.latitude && provider.longitude
      ? { lat: Number(provider.latitude), lng: Number(provider.longitude) }
      : null,
  );
  const [mapCenter, setMapCenter] = useState(
    mapCoords || { lat: 18.5204, lng: 73.8567 },
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ placeId: string; description: string; mainText: string; secondaryText: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const formikRef = useRef<any>(null);

  const handleSearchLocation = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchGeocode(query.trim());
        setSearchResults(results.filter(r => r.lat && r.lng).map(r => ({
          placeId: r.placeId,
          description: r.description,
          mainText: r.mainText || r.description,
          secondaryText: r.secondaryText || "",
          lat: Number(r.lat),
          lng: Number(r.lng),
        })));
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 400);
  }, []);

  const handleMapSelect = useCallback(async (lat: number, lng: number) => {
    const pos = { lat, lng };
    setMapCoords(pos);
    setMapCenter(pos);
    mapRef.current?.panTo(pos);
    if (!formikRef.current) return;
    try {
      const geo = await reverseGeocode({ lat, lng });
      const { setFieldValue } = formikRef.current;
      if (geo.fullAddress) setFieldValue("address", geo.fullAddress);
      if (geo.city) setFieldValue("city", geo.city);
      if (geo.area) setFieldValue("area", geo.area);
      if (geo.pincode) setFieldValue("pincode", geo.pincode);
    } catch { /* keep coords even if reverse geocode fails */ }
  }, []);

  const handleSelectSearchResult = useCallback((result: { lat: number; lng: number; description: string }) => {
    setSearchQuery(result.description);
    setSearchResults([]);
    handleMapSelect(result.lat, result.lng);
  }, [handleMapSelect]);

  const handleDetectGPS = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true }),
      );
      handleMapSelect(pos.coords.latitude, pos.coords.longitude);
    } catch {
      alert("Could not detect location. Please allow location access and try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  }, [handleMapSelect]);

  const handleSave = async (values: any) => {
    try {
      await updateMutation.mutateAsync({
        id: provider.id,
        payload: {
          brandName: values.brandName,
          description: values.description || undefined,
          contactNumber: values.contactNumber,
          address: values.address || undefined,
          city: values.city,
          area: values.area || undefined,
          pincode: values.pincode || undefined,
          openTime: values.openTime || undefined,
          closeTime: values.closeTime || undefined,
          ...(mapCoords ? { latitude: mapCoords.lat, longitude: mapCoords.lng } : {}),
        },
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateMutation.mutate({
        id: provider.id,
        payload: { bannerImageUrl: url },
      });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateMutation.mutate({
        id: provider.id,
        payload: { profilePhotoUrl: url },
      });
    }
  };

  const handleToggleAvailability = () => {
    updateMutation.mutate({
      id: provider.id,
      payload: { isAvailable: !provider.isAvailable },
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return null;
    try {
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch {
      return time;
    }
  };

  const operatingHours =
    provider.openTime && provider.closeTime
      ? `${formatTime(provider.openTime)} — ${formatTime(provider.closeTime)}`
      : "Not set";

  const fullAddress = [provider.address, provider.area, provider.city, provider.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="animate-in fade-in duration-300">
      {/* ─── Banner + Profile Photo Hero ──────────────── */}
      <div className="relative mx-4 mt-3 mb-6">
        {/* Banner */}
        <div
          onClick={() => bannerInputRef.current?.click()}
          className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-50 cursor-pointer group"
        >
          {provider.bannerImageUrl && !bannerError ? (
            <img
              src={provider.bannerImageUrl}
              alt="Banner"
              className="w-full h-full object-cover"
              onError={() => setBannerError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <IonIcon icon={imageOutline} className="text-3xl text-teal-300 mb-1" />
              <span className="text-[11px] text-teal-400 font-medium">
                Add Banner Image
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-active:bg-black/20 transition-colors flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <IonIcon icon={cameraOutline} className="text-slate-600 text-lg" />
            </div>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
        </div>

        {/* Profile Photo */}
        <div className="absolute -bottom-5 left-4">
          <div
            onClick={() => profileInputRef.current?.click()}
            className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden cursor-pointer relative group"
          >
            {provider.profilePhotoUrl && !profileError ? (
              <img
                src={provider.profilePhotoUrl}
                alt={provider.brandName}
                className="w-full h-full object-cover"
                onError={() => setProfileError(true)}
              />
            ) : (
              <div className="w-full h-full bg-teal-50 flex items-center justify-center">
                <IonIcon icon={personCircleOutline} className="text-3xl text-teal-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-active:bg-black/30 transition-colors flex items-center justify-center">
              <IonIcon icon={cameraOutline} className="text-white text-sm opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
            </div>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileChange}
            />
          </div>
        </div>

        {/* Availability toggle */}
        <div className="absolute -bottom-5 right-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleAvailability}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${
              provider.isAvailable
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                provider.isAvailable ? "bg-emerald-500" : "bg-red-400"
              }`}
            />
            {provider.isAvailable ? "Available" : "Unavailable"}
          </motion.button>
        </div>
      </div>

      {/* View Mode */}
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Section header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Business Details</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 active:bg-teal-100"
              >
                <IonIcon icon={createOutline} className="text-teal-600 text-sm" />
                <span className="text-xs font-semibold text-teal-600">Edit</span>
              </motion.button>
            </div>

            <div className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
              <InfoRow icon={storefrontOutline} label="Brand Name" value={provider.brandName} />
              <InfoRow
                icon={documentTextOutline}
                label="Description"
                value={provider.description ? (provider.description.length > 60 ? provider.description.slice(0, 60) + "..." : provider.description) : null}
                onTap={provider.description ? () => setDetailSheet({ title: "Description", content: provider.description! }) : undefined}
              />
              <InfoRow icon={callOutline} label="Contact" value={provider.contactNumber} />
              <InfoRow
                icon={locationOutline}
                label="Address"
                value={fullAddress || null}
                onTap={fullAddress ? () => setDetailSheet({ title: "Address", content: fullAddress }) : undefined}
              />
              <InfoRow icon={timeOutline} label="Operating Hours" value={operatingHours} />
            </div>
          </motion.div>
        ) : (
          /* Edit Mode */
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Edit Details</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <IonIcon icon={closeOutline} className="text-slate-500" />
              </motion.button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <Formik
                innerRef={formikRef}
                initialValues={{
                  brandName: provider.brandName || "",
                  description: provider.description || "",
                  contactNumber: provider.contactNumber || "",
                  address: provider.address || "",
                  city: provider.city || "",
                  area: provider.area || "",
                  pincode: provider.pincode || "",
                  openTime: provider.openTime?.slice(0, 5) || "",
                  closeTime: provider.closeTime?.slice(0, 5) || "",
                }}
                validationSchema={detailsSchema}
                onSubmit={handleSave}
              >
                {({ isValid, dirty, isSubmitting, setFieldValue, values }) => (
                  <Form>
                    <List strongIos insetIos className="!my-0">
                      <FormikInput
                        name="brandName"
                        label="Brand Name"
                        type="text"
                        placeholder="Your business name"
                        media={<IonIcon icon={storefrontOutline} />}
                      />
                      <FormikInput
                        name="description"
                        label="Description"
                        type="textarea"
                        placeholder="Tell customers about your business..."
                        inputClassName="!h-24 resize-none"
                        media={<IonIcon icon={documentTextOutline} />}
                      />
                      <FormikInput
                        name="contactNumber"
                        label="Contact"
                        type="tel"
                        placeholder="+91 98765 43210"
                        media={<IonIcon icon={callOutline} />}
                      />
                    </List>

                    {/* ── Location Section with Map ── */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                          <IonIcon icon={locationOutline} className="text-teal-600 text-sm" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Business Location</p>
                      </div>

                      {/* GPS detect */}
                      <button type="button" onClick={handleDetectGPS} disabled={isDetectingLocation}
                        className="w-full flex items-center gap-3 p-2.5 mb-2 rounded-xl border border-teal-200 bg-teal-50/50 hover:border-teal-300 transition-all active:scale-[0.99] disabled:opacity-60">
                        <div className={`w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 ${isDetectingLocation ? "animate-pulse" : ""}`}>
                          <IonIcon icon={navigateOutline} className="text-teal-600 text-base" />
                        </div>
                        <span className="text-[11px] font-bold text-teal-700">
                          {isDetectingLocation ? "Detecting..." : "Use Current Location"}
                        </span>
                      </button>

                      {/* Search bar */}
                      <div className="relative mb-2">
                        <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10" />
                        <input type="text" value={searchQuery} onChange={(e) => handleSearchLocation(e.target.value)}
                          placeholder="Search for your business location..."
                          className="w-full pl-8 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all" />
                        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-3 h-3 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" /></div>}
                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                            {searchResults.map((r) => (
                              <button key={r.placeId} type="button" onClick={() => handleSelectSearchResult(r)}
                                className="w-full px-3 py-2 text-left hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-b-0 flex items-start gap-2">
                                <IonIcon icon={locationOutline} className="text-xs text-teal-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-700 truncate">{r.mainText}</p>
                                  <p className="text-[9px] text-slate-400 truncate">{r.secondaryText}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Google Map */}
                      {isLoaded ? (
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-2">
                          <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "200px", borderRadius: "12px" }}
                            center={mapCenter}
                            zoom={mapCoords ? 16 : 12}
                            onClick={(e) => {
                              if (!e.latLng) return;
                              handleMapSelect(e.latLng.lat(), e.latLng.lng());
                            }}
                            onLoad={(map) => { mapRef.current = map; }}
                            options={{ disableDefaultUI: true, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
                          >
                            {mapCoords && (
                              <Marker position={mapCoords} draggable onDragEnd={(e) => {
                                if (!e.latLng) return;
                                handleMapSelect(e.latLng.lat(), e.latLng.lng());
                              }} />
                            )}
                          </GoogleMap>
                          <div className="px-2 py-1.5 bg-slate-50 border-t border-slate-100">
                            <p className="text-[9px] text-slate-400 flex items-center gap-1">
                              <IonIcon icon={mapOutline} className="text-[10px]" />
                              {mapCoords ? `📍 ${mapCoords.lat.toFixed(5)}, ${mapCoords.lng.toFixed(5)}` : "Tap on the map or search to pin your location"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[200px] rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                          <div className="w-5 h-5 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                        </div>
                      )}

                      <p className="text-[9px] text-slate-400 mb-1">
                        Address fields are auto-filled from the map. Move the pin to update.
                      </p>
                    </div>

                    {/* Address fields (readonly, auto-filled from map) */}
                    <List strongIos insetIos className="!my-0">
                      <FormikInput
                        name="address"
                        label="Address"
                        type="text"
                        placeholder="Auto-filled from map"
                        readonly
                        media={<IonIcon icon={locationOutline} />}
                      />
                      <FormikInput
                        name="city"
                        label="City"
                        type="text"
                        placeholder="Auto-filled from map"
                        readonly
                        media={<IonIcon icon={mapOutline} />}
                      />
                      <FormikInput
                        name="area"
                        label="Area"
                        type="text"
                        placeholder="Auto-filled from map"
                        readonly
                      />
                      <FormikInput
                        name="pincode"
                        label="Pincode"
                        type="text"
                        placeholder="Auto-filled from map"
                        readonly
                      />
                    </List>

                    {/* ── Operating Hours with TimePicker ── */}
                    <div className="px-4 pt-2 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                          <IonIcon icon={timeOutline} className="text-teal-600 text-sm" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Operating Hours</p>
                      </div>
                    </div>
                    <List strongIos insetIos className="!my-0">
                      <TimePicker
                        label="Open Time"
                        value={values.openTime}
                        onChange={(val) => setFieldValue("openTime", val)}
                      />
                      <TimePicker
                        label="Close Time"
                        value={values.closeTime}
                        onChange={(val) => setFieldValue("closeTime", val)}
                      />
                    </List>

                    <div className="grid grid-cols-2 gap-3 p-4">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!isValid || !dirty || isSubmitting}
                        className="py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </motion.button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Sheet */}
      <Sheet
        opened={!!detailSheet}
        onBackdropClick={() => setDetailSheet(null)}
        className="pb-safe rounded-t-3xl h-fit min-h-[400px] max-h-[80vh]"
      >
        <Page className="static bg-white">
          <Navbar
            title={detailSheet?.title || ""}
            left={
              <Button clear onClick={() => setDetailSheet(null)}>
                <IonIcon icon={closeOutline} className="w-5 h-5" />
              </Button>
            }
          />
          <Block className="overflow-y-auto mt-4 px-4 pb-8 space-y-4 text-slate-700 leading-relaxed whitespace-pre-wrap">
            {detailSheet?.content}
            {detailSheet?.title === "Address" && detailSheet?.content && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative h-48 w-full bg-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(detailSheet.content)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            )}
          </Block>
        </Page>
      </Sheet>
    </div>
  );
};

export default ProviderDetailsTab;
