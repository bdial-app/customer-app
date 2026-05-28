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
  trashOutline,
  toggleOutline,
  navigateOutline,
  searchOutline,
  checkmarkCircle,
  alertCircleOutline,
  linkOutline,
  logoInstagram,
  logoFacebook,
  logoYoutube,
  logoWhatsapp,
  globeOutline,
  shieldCheckmarkOutline,
} from "ionicons/icons";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { List, Button } from "konsta/react";
import { BottomSheet } from "../bottom-sheet";
import { FormikInput } from "../formik-input";
import WhatsAppPhoneInput from "../whatsapp-phone-input";
import LinkedInInput from "../linkedin-input";
import { ProviderData } from "@/services/provider.service";
import { useUpdateProvider, useUpdateContactNumber } from "@/hooks/useMyProvider";
import { useUploadProfileImage } from "@/hooks/usePhotos";
import { AppDialog } from "../app-dialog";
import TimePicker from "../time-picker";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { reverseGeocode, searchGeocode } from "@/services/geocode.service";
import { checkContent } from "@/utils/content-sanitizer";
import { useNotification } from "@/app/context/NotificationContext";
import { PhoneOtpVerifier } from "./phone-otp-verifier";

interface ProviderDetailsTabProps {
  provider: ProviderData;
}

const detailsSchema = Yup.object({
  brandName: Yup.string().trim().max(150, "Must be under 150 characters").required("Brand name is required"),
  description: Yup.string().max(2000, "Must be under 2000 characters").nullable(),
  address: Yup.string().max(300, "Must be under 300 characters").nullable(),
  city: Yup.string().max(100, "Must be under 100 characters").required("City is required"),
  area: Yup.string().max(100, "Must be under 100 characters").nullable(),
  pincode: Yup.string().matches(/^\d{6}$/, "Must be 6 digits").nullable(),
  openTime: Yup.string().nullable(),
  closeTime: Yup.string().nullable().test(
    "after-open",
    "Close time must be after open time",
    function (value) {
      const { openTime } = this.parent;
      if (!value || !openTime) return true;
      return value > openTime;
    },
  ),
  websiteUrl: Yup.string().url("Enter a valid URL").max(512).nullable(),
  instagramHandle: Yup.string().matches(/^[a-zA-Z0-9._]{0,30}$/, "Invalid handle").max(30).nullable(),
  facebookHandle: Yup.string().max(128).nullable(),
  youtubeHandle: Yup.string().max(128).nullable(),
  whatsappNumber: Yup.string().matches(/^\+\d{7,15}$/, "Enter a valid WhatsApp number").nullable(),
  linkedinHandle: Yup.string().max(128, "Too long").nullable(),
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
    whileTap={onTap ? { scale: 0.98 } : undefined}
    onClick={onTap}
    className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
  >
    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0 mt-0.5">
      <IonIcon icon={icon} className="text-teal-600 text-lg" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-slate-800 dark:text-white mt-0.5 leading-relaxed">
        {value || "Not set"}
      </p>
    </div>
  </motion.div>
);

const ProviderDetailsTab = ({ provider }: ProviderDetailsTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [detailSheet, setDetailSheet] = useState<{ title: string; content: string } | null>(null);
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const updateMutation = useUpdateProvider();
  const updateContactMutation = useUpdateContactNumber();
  const uploadImageMutation = useUploadProfileImage();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [bannerError, setBannerError] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<"banner" | "profile" | null>(null);

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
      const { getCurrentPosition } = await import("@/utils/geolocation");
      const pos = await getCurrentPosition({ timeout: 10000, enableHighAccuracy: true });
      handleMapSelect(pos.latitude, pos.longitude);
    } catch {
      alert("Could not detect location. Please allow location access and try again.");
    } finally {
      setIsDetectingLocation(false);
    }
  }, [handleMapSelect]);

  const { notify } = useNotification();

  const handleSave = async (values: any) => {
    // Content sanitization
    const brandCheck = checkContent(values.brandName || "");
    const descCheck = checkContent(values.description || "");
    if (brandCheck.flagged || descCheck.flagged) {
      notify({ title: "Inappropriate language", subtitle: "Please remove inappropriate language from your brand name or description.", variant: "error" });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: provider.id,
        payload: {
          brandName: values.brandName?.trim(),
          description: values.description?.trim() || undefined,
          address: values.address?.trim() || undefined,
          city: values.city?.trim(),
          area: values.area?.trim() || undefined,
          pincode: values.pincode?.trim() || undefined,
          openTime: values.openTime || undefined,
          closeTime: values.closeTime || undefined,
          websiteUrl: values.websiteUrl?.trim() || null,
          instagramHandle: values.instagramHandle?.trim().replace(/^@/, "") || null,
          facebookHandle: values.facebookHandle?.trim() || null,
          youtubeHandle: values.youtubeHandle?.trim() || null,
          whatsappNumber: values.whatsappNumber?.trim() || null,
          linkedinHandle: values.linkedinHandle?.trim() || null,
          ...(mapCoords ? { latitude: String(mapCoords.lat), longitude: String(mapCoords.lng) } : {}),
        },
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleContactNumberVerified = async (otp: string) => {
    try {
      await updateContactMutation.mutateAsync({
        id: provider.id,
        contactNumber: newPhoneNumber,
        otp,
      });
      notify({ title: "Number Updated", subtitle: "Your contact number has been changed successfully.", variant: "success" });
      setShowPhoneChange(false);
      setNewPhoneNumber("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update contact number";
      notify({ title: "Error", subtitle: msg, variant: "error" });
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerError(false);
    setBannerPreview(URL.createObjectURL(file));
    uploadImageMutation.mutate(
      { providerId: provider.id, file, field: "bannerImageUrl" },
      {
        onSuccess: () => setBannerPreview(null),
        onError: () => { setBannerPreview(null); setBannerError(true); },
      },
    );
    e.target.value = "";
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileError(false);
    setProfilePreview(URL.createObjectURL(file));
    uploadImageMutation.mutate(
      { providerId: provider.id, file, field: "profilePhotoUrl" },
      {
        onSuccess: () => setProfilePreview(null),
        onError: () => { setProfilePreview(null); setProfileError(true); },
      },
    );
    e.target.value = "";
  };

  const handleRemoveBanner = () => {
    if (uploadImageMutation.isPending || updateMutation.isPending) return;
    setBannerPreview(null);
    setBannerError(false);
    updateMutation.mutate({
      id: provider.id,
      payload: { bannerImageUrl: null },
    });
  };

  const handleRemoveProfile = () => {
    if (uploadImageMutation.isPending || updateMutation.isPending) return;
    setProfilePreview(null);
    setProfileError(false);
    updateMutation.mutate({
      id: provider.id,
      payload: { profilePhotoUrl: null },
    });
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
          onClick={() => !uploadImageMutation.isPending && bannerInputRef.current?.click()}
          className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-teal-50 cursor-pointer group"
        >
          {(bannerPreview || provider.bannerImageUrl) && !bannerError ? (
            <>
              <img
                src={bannerPreview || provider.bannerImageUrl!}
                alt="Banner"
                className={`w-full h-full object-cover transition-opacity ${bannerPreview ? "opacity-60" : ""}`}
                onError={() => { if (!bannerPreview) setBannerError(true); }}
              />
              {bannerPreview && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!bannerPreview && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmRemove("banner"); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-10"
                >
                  <IonIcon icon={trashOutline} className="text-white text-sm" />
                </button>
              )}
            </>
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
            onClick={() => !uploadImageMutation.isPending && profileInputRef.current?.click()}
            className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-700 bg-white dark:bg-slate-700 shadow-md overflow-hidden cursor-pointer relative group"
          >
            {(profilePreview || provider.profilePhotoUrl) && !profileError ? (
              <>
                <img
                  src={profilePreview || provider.profilePhotoUrl!}
                  alt={provider.brandName}
                  className={`w-full h-full object-cover transition-opacity ${profilePreview ? "opacity-60" : ""}`}
                  onError={() => { if (!profilePreview) setProfileError(true); }}
                />
                {profilePreview && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!profilePreview && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmRemove("profile"); }}
                    className="absolute top-0 right-0 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-10"
                  >
                    <IonIcon icon={closeOutline} className="text-white text-[11px]" />
                  </button>
                )}
              </>
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
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
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
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Business Details</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 active:bg-teal-100"
              >
                <IonIcon icon={createOutline} className="text-teal-600 text-sm" />
                <span className="text-xs font-semibold text-teal-600">Edit</span>
              </motion.button>
            </div>

            <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
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

            {/* Online Presence (view) */}
            {((provider as any).websiteUrl || (provider as any).instagramHandle || (provider as any).facebookHandle || (provider as any).youtubeHandle || (provider as any).whatsappNumber) && (
              <div className="mx-4 mt-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                <div className="px-4 py-2.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Online Presence</p>
                </div>
                {(provider as any).websiteUrl && <InfoRow icon={globeOutline} label="Website" value={(provider as any).websiteUrl} />}
                {(provider as any).instagramHandle && <InfoRow icon={logoInstagram} label="Instagram" value={`@${(provider as any).instagramHandle}`} />}
                {(provider as any).facebookHandle && <InfoRow icon={logoFacebook} label="Facebook" value={(provider as any).facebookHandle} />}
                {(provider as any).youtubeHandle && <InfoRow icon={logoYoutube} label="YouTube" value={(provider as any).youtubeHandle} />}
                {(provider as any).whatsappNumber && <InfoRow icon={logoWhatsapp} label="WhatsApp" value={(provider as any).whatsappNumber} />}
              </div>
            )}
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
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Edit Details</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center"
              >
                <IonIcon icon={closeOutline} className="text-slate-500" />
              </motion.button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <Formik
                innerRef={formikRef}
                initialValues={{
                  brandName: provider.brandName || "",
                  description: provider.description || "",
                  address: provider.address || "",
                  city: provider.city || "",
                  area: provider.area || "",
                  pincode: provider.pincode || "",
                  openTime: provider.openTime?.slice(0, 5) || "09:00",
                  closeTime: provider.closeTime?.slice(0, 5) || "18:00",
                  websiteUrl: (provider as any).websiteUrl || "",
                  instagramHandle: (provider as any).instagramHandle || "",
                  facebookHandle: (provider as any).facebookHandle || "",
                  youtubeHandle: (provider as any).youtubeHandle || "",
                  whatsappNumber: (provider as any).whatsappNumber || "",
                  linkedinHandle: (provider as any).linkedinHandle || "",
                }}
                validationSchema={detailsSchema}
                onSubmit={handleSave}
              >
                {({ isValid, dirty, isSubmitting, setFieldValue, setFieldTouched, values, touched, errors }) => (
                  <Form>
                    {/* ── Brand Name ── */}
                    <div className="px-4 pt-4 mb-3">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Brand Name
                      </label>
                      <div className={`flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all overflow-hidden ${
                        touched.brandName && errors.brandName
                          ? "border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/30"
                          : "border-slate-100 dark:border-slate-700 focus-within:border-teal-300 dark:focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-teal-900/30"
                      }`}>
                        <div className="pl-3 pr-2 flex items-center justify-center shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                            <IonIcon icon={storefrontOutline} className="text-teal-600 text-base" />
                          </div>
                        </div>
                        <input
                          type="text"
                          value={values.brandName}
                          onChange={(e) => setFieldValue("brandName", e.target.value)}
                          onBlur={() => setFieldTouched("brandName", true)}
                          placeholder="e.g. Fatema's Kitchen, Husain Motors"
                          className="flex-1 min-w-0 px-1.5 py-3.5 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                      </div>
                      {touched.brandName && errors.brandName && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-medium">{errors.brandName as string}</p>
                      )}
                    </div>

                    {/* ── Description ── */}
                    <div className="px-4 mb-3">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Description
                      </label>
                      <div className={`flex items-start gap-0 bg-white dark:bg-slate-800 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all overflow-hidden ${
                        touched.description && errors.description
                          ? "border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/30"
                          : "border-slate-100 dark:border-slate-700 focus-within:border-teal-300 dark:focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-teal-900/30"
                      }`}>
                        <div className="pl-3 pr-2 pt-3.5 flex items-start justify-center shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                            <IonIcon icon={documentTextOutline} className="text-teal-600 text-base" />
                          </div>
                        </div>
                        <textarea
                          value={values.description}
                          onChange={(e) => setFieldValue("description", e.target.value)}
                          onBlur={() => setFieldTouched("description", true)}
                          placeholder="What you offer, your experience, why customers love you..."
                          rows={3}
                          className="flex-1 min-w-0 px-1.5 py-3.5 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                        />
                      </div>
                      {touched.description && errors.description && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-medium">{errors.description as string}</p>
                      )}
                    </div>

                    {/* ── Contact Number (OTP-protected) ── */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                          <IonIcon icon={callOutline} className="text-teal-600 text-sm" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-white">Contact Number</p>
                        <IonIcon icon={shieldCheckmarkOutline} className="text-teal-500 text-sm ml-auto" />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-600">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {provider.contactNumber || "Not set"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Protected • OTP verification required to change
                            </p>
                          </div>
                          {!showPhoneChange && (
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => {
                                setShowPhoneChange(true);
                                setNewPhoneNumber(provider.contactNumber || "");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 text-xs font-semibold"
                            >
                              Change
                            </motion.button>
                          )}
                        </div>

                        <AnimatePresence>
                          {showPhoneChange && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  New Number
                                </label>
                                <input
                                  type="tel"
                                  value={newPhoneNumber}
                                  onChange={(e) => setNewPhoneNumber(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 15))}
                                  placeholder="New 10-digit mobile number"
                                  className="w-full mt-1 px-3 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-700 focus:border-teal-400 transition-all"
                                />

                                {newPhoneNumber.replace(/\D/g, "").slice(-10) !== (provider.contactNumber || "").replace(/\D/g, "").slice(-10) &&
                                  newPhoneNumber.replace(/\D/g, "").length >= 10 && (
                                  <PhoneOtpVerifier
                                    phoneNumber={newPhoneNumber}
                                    onVerified={handleContactNumberVerified}
                                    isPending={updateContactMutation.isPending}
                                  />
                                )}

                                <button
                                  type="button"
                                  onClick={() => { setShowPhoneChange(false); setNewPhoneNumber(""); }}
                                  className="mt-3 text-xs text-slate-500 dark:text-slate-400 underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* ── Location Section with Map ── */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                          <IonIcon icon={locationOutline} className="text-teal-600 text-sm" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-white">Business Location</p>
                      </div>

                      {/* GPS detect */}
                      <button type="button" onClick={handleDetectGPS} disabled={isDetectingLocation}
                        className="w-full flex items-center gap-3 p-2.5 mb-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-700 transition-all active:scale-[0.99] disabled:opacity-60">
                        <div className={`w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center shrink-0 ${isDetectingLocation ? "animate-pulse" : ""}`}>
                          <IonIcon icon={navigateOutline} className="text-teal-600 text-base" />
                        </div>
                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400">
                          {isDetectingLocation ? "Detecting..." : "Use Current Location"}
                        </span>
                      </button>

                      {/* Search bar */}
                      <div className="relative mb-2">
                        <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10" />
                        <input type="text" value={searchQuery} onChange={(e) => handleSearchLocation(e.target.value)}
                          placeholder="Search for your business location..."
                          className="w-full pl-8 pr-3 py-2.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 dark:focus:ring-teal-700 focus:border-teal-400 dark:focus:border-teal-600 transition-all" />
                        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-3 h-3 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" /></div>}
                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                            {searchResults.map((r) => (
                              <button key={r.placeId} type="button" onClick={() => handleSelectSearchResult(r)}
                                className="w-full px-3 py-2 text-left hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors border-b border-slate-50 dark:border-slate-600 last:border-b-0 flex items-start gap-2">
                                <IonIcon icon={locationOutline} className="text-xs text-teal-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-700 dark:text-white truncate">{r.mainText}</p>
                                  <p className="text-[9px] text-slate-400 dark:text-slate-400 truncate">{r.secondaryText}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Google Map */}
                      {isLoaded ? (
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm mb-2">
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
                          <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-600">
                            <p className="text-[9px] text-slate-400 flex items-center gap-1">
                              <IonIcon icon={mapOutline} className="text-[10px]" />
                              {mapCoords ? `📍 ${mapCoords.lat.toFixed(5)}, ${mapCoords.lng.toFixed(5)}` : "Tap on the map or search to pin your location"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[200px] rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                          <div className="w-5 h-5 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                        </div>
                      )}

                      <p className="text-[9px] text-slate-400 mb-1">
                        Address fields are auto-filled from the map. Move the pin to update.
                      </p>
                    </div>

                    {/* Address fields — auto-filled from map, display-only */}
                    <div className="px-4 mb-3">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                        {[
                          { label: "Address", value: values.address, icon: locationOutline },
                          { label: "City", value: values.city, icon: mapOutline },
                          { label: "Area", value: values.area, icon: mapOutline },
                          { label: "Pincode", value: values.pincode, icon: null },
                        ].map((row, i, arr) => (
                          <div
                            key={row.label}
                            className={`flex items-start gap-3 px-4 py-3 ${i < arr.length - 1 ? "border-b border-slate-50 dark:border-slate-700/60" : ""}`}
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                              <IonIcon icon={row.icon ?? mapOutline} className="text-slate-400 text-xs" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{row.label}</p>
                              <p className={`text-[13px] font-medium leading-snug ${row.value ? "text-slate-800 dark:text-white" : "text-slate-300 dark:text-slate-600 italic"}`}>
                                {row.value || "Auto-filled from map"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 ml-1 flex items-center gap-1">
                        <IonIcon icon={mapOutline} className="text-[10px]" />
                        Move the map pin above to update your location
                      </p>
                    </div>

                    {/* ── Operating Hours with TimePicker ── */}
                    <div className="px-4 pt-2 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                          <IonIcon icon={timeOutline} className="text-teal-600 text-sm" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-white">Operating Hours</p>
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
                    {values.openTime && values.closeTime && values.closeTime <= values.openTime && (
                      <div className="flex items-center gap-2 mx-4 mt-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <IonIcon icon={alertCircleOutline} className="text-red-500 text-base shrink-0" />
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">Close time must be after open time — business hours cannot overlap</p>
                      </div>
                    )}

                    {/* ── Online Presence ── */}
                    <div className="px-4 pt-3 pb-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                          <IonIcon icon={linkOutline} className="text-teal-600 text-sm" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-white">Online Presence</p>
                        <span className="text-[9px] text-slate-400 ml-auto">Optional</span>
                      </div>
                    </div>
                    {/* Website */}
                    <div className="px-4 mb-3">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Website
                      </label>
                      <div className="flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-violet-300 dark:focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-100 dark:focus-within:ring-violet-900/30 transition-all overflow-hidden">
                        <div className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                            <IonIcon icon={globeOutline} className="text-violet-600 text-base" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">https://</span>
                        <input
                          type="text"
                          value={values.websiteUrl.replace(/^https?:\/\//i, "")}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/^https?:\/\//i, "");
                            setFieldValue("websiteUrl", raw ? `https://${raw}` : "");
                          }}
                          placeholder="www.mybusiness.com"
                          className="flex-1 min-w-0 px-1.5 py-3 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        {values.websiteUrl && (
                          <button type="button" onClick={() => setFieldValue("websiteUrl", "")} className="pr-3 shrink-0">
                            <IonIcon icon={closeOutline} className="text-slate-300 dark:text-slate-600 text-lg" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="px-4 mb-3">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Instagram
                      </label>
                      <div className="flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-pink-300 dark:focus-within:border-pink-600 focus-within:ring-2 focus-within:ring-pink-100 dark:focus-within:ring-pink-900/30 transition-all overflow-hidden">
                        <div className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center">
                            <IonIcon icon={logoInstagram} className="text-pink-600 text-base" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">instagram.com/</span>
                        <input
                          type="text"
                          value={values.instagramHandle.replace(/^@/, "")}
                          onChange={(e) => setFieldValue("instagramHandle", e.target.value.replace(/^@/, ""))}
                          placeholder="yourbusiness"
                          className="flex-1 min-w-0 px-1.5 py-3 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        {values.instagramHandle && (
                          <button type="button" onClick={() => setFieldValue("instagramHandle", "")} className="pr-3 shrink-0">
                            <IonIcon icon={closeOutline} className="text-slate-300 dark:text-slate-600 text-lg" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Facebook */}
                    <div className="px-4 mb-3">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Facebook
                      </label>
                      <div className="flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-blue-300 dark:focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all overflow-hidden">
                        <div className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <IonIcon icon={logoFacebook} className="text-[#1877F2] text-base" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">facebook.com/</span>
                        <input
                          type="text"
                          value={values.facebookHandle.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, "")}
                          onChange={(e) => setFieldValue("facebookHandle", e.target.value.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, ""))}
                          placeholder="yourbusiness"
                          className="flex-1 min-w-0 px-1.5 py-3 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        {values.facebookHandle && (
                          <button type="button" onClick={() => setFieldValue("facebookHandle", "")} className="pr-3 shrink-0">
                            <IonIcon icon={closeOutline} className="text-slate-300 dark:text-slate-600 text-lg" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* YouTube */}
                    <div className="px-4 mb-3">
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        YouTube
                      </label>
                      <div className="flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus-within:border-red-300 dark:focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100 dark:focus-within:ring-red-900/30 transition-all overflow-hidden">
                        <div className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                            <IonIcon icon={logoYoutube} className="text-[#FF0000] text-base" />
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">youtube.com/</span>
                        <input
                          type="text"
                          value={values.youtubeHandle.replace(/^(https?:\/\/)?(www\.)?youtube\.com\//i, "")}
                          onChange={(e) => setFieldValue("youtubeHandle", e.target.value.replace(/^(https?:\/\/)?(www\.)?youtube\.com\//i, ""))}
                          placeholder="@yourbusiness"
                          className="flex-1 min-w-0 px-1.5 py-3 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        />
                        {values.youtubeHandle && (
                          <button type="button" onClick={() => setFieldValue("youtubeHandle", "")} className="pr-3 shrink-0">
                            <IonIcon icon={closeOutline} className="text-slate-300 dark:text-slate-600 text-lg" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp with country code picker */}
                    <WhatsAppPhoneInput
                      value={values.whatsappNumber}
                      onChange={(val) => setFieldValue("whatsappNumber", val)}
                      error={errors.whatsappNumber as string | undefined}
                      touched={touched.whatsappNumber as boolean}
                    />

                    {/* LinkedIn with URL normalization */}
                    <LinkedInInput
                      value={values.linkedinHandle}
                      onChange={(val) => setFieldValue("linkedinHandle", val)}
                      error={errors.linkedinHandle as string | undefined}
                      touched={touched.linkedinHandle as boolean}
                    />

                    <div className="grid grid-cols-2 gap-3 p-4">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm"
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
      <BottomSheet
        opened={!!detailSheet}
        onClose={() => setDetailSheet(null)}
        title={detailSheet?.title || ""}
        className="max-h-[80vh]"
        headerLeft={
          <button onClick={() => setDetailSheet(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <IonIcon icon={closeOutline} className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        }
      >
        <div className="overflow-y-auto px-4 pb-8 pt-4 space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {detailSheet?.content}
            {detailSheet?.title === "Address" && detailSheet?.content && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative h-48 w-full bg-slate-100 dark:bg-slate-800">
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
        </div>
      </BottomSheet>

      {/* Remove image confirmation */}
      <AppDialog
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title={confirmRemove === "banner" ? "Remove Banner?" : "Remove Logo?"}
        description={confirmRemove === "banner" ? "The banner image will be removed." : "The profile logo will be removed."}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (confirmRemove === "banner") handleRemoveBanner();
          else if (confirmRemove === "profile") handleRemoveProfile();
          setConfirmRemove(null);
        }}
        confirmColor="red"
      />
    </div>
  );
};

export default ProviderDetailsTab;
