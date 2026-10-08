"use client";
import { useState, useRef, useCallback } from "react";
import { IonIcon } from "@ionic/react";
import {
  callOutline,
  locationOutline,
  timeOutline,
  documentTextOutline,
  storefrontOutline,
  imageOutline,
  trashOutline,
  logoInstagram,
  logoFacebook,
  logoYoutube,
  logoWhatsapp,
  logoLinkedin,
  globeOutline,
  shieldCheckmark,
  linkOutline,
  mapOutline,
  personCircleOutline,
  createOutline,
  warningOutline,
} from "ionicons/icons";
import { Formik, type FormikProps } from "formik";
import * as Yup from "yup";
import { isAxiosError } from "axios";
import { ProviderData } from "@/services/provider.service";
import { useUpdateProvider, useUpdateContactNumber } from "@/hooks/useMyProvider";
import { useUploadProfileImage } from "@/hooks/usePhotos";
import { AppDialog } from "../app-dialog";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { reverseGeocode, searchGeocode } from "@/services/geocode.service";
import { checkContent } from "@/utils/content-sanitizer";
import { useNotification } from "@/app/context/NotificationContext";
import { Card, GroupLabel, ManagePage, ManageSheet, Pill, PrimaryButton, SectionHeader } from "./manage/kit";
import { BoostNudge } from "./manage/boost";
import {
  AvailabilityCard,
  DetailRow,
  ProfileChecklist,
  ProfilePreview,
  RowLink,
  formatTime,
  type ChecklistItem,
  type DetailsEditor,
  type TileTone,
} from "./manage/details-parts";
import {
  BasicsSheet,
  HoursSheet,
  LinksSheet,
  LocationSheet,
  PhoneSheet,
  PhotosSheet,
  type DetailsFormValues,
  type PlaceResult,
} from "./manage/details-sheets";

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

const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

const coordsOf = (p: ProviderData) =>
  p.latitude && p.longitude ? { lat: Number(p.latitude), lng: Number(p.longitude) } : null;

/** The form as it stands for this provider. Hours stay empty when unset, so
 *  saving another section never quietly invents opening hours. */
const valuesFor = (provider: ProviderData): DetailsFormValues => ({
  brandName: provider.brandName || "",
  description: provider.description || "",
  address: provider.address || "",
  city: provider.city || "",
  area: provider.area || "",
  pincode: provider.pincode || "",
  openTime: provider.openTime?.slice(0, 5) || "",
  closeTime: provider.closeTime?.slice(0, 5) || "",
  websiteUrl: provider.websiteUrl || "",
  instagramHandle: provider.instagramHandle || "",
  facebookHandle: provider.facebookHandle || "",
  youtubeHandle: provider.youtubeHandle || "",
  whatsappNumber: provider.whatsappNumber || "",
  linkedinHandle: provider.linkedinHandle || "",
});

const ProviderDetailsTab = ({ provider }: ProviderDetailsTabProps) => {
  const [editor, setEditor] = useState<DetailsEditor | null>(null);
  const [readSheet, setReadSheet] = useState<"description" | "address" | null>(null);
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

  // Map / location state for the location editor
  const { isLoaded } = useGoogleMapsLoader();
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(coordsOf(provider));
  const [mapCenter, setMapCenter] = useState(mapCoords || DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const formikRef = useRef<FormikProps<DetailsFormValues>>(null);

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
      const { requestLocationOrPrompt } = await import("@/utils/geolocation");
      const pos = await requestLocationOrPrompt("Detecting your location", { timeout: 10000, enableHighAccuracy: true });
      handleMapSelect(pos.latitude, pos.longitude);
    } catch (err: unknown) {
      const { LOCATION_PERMISSION_DENIED } = await import("@/utils/geolocation");
      const code = typeof err === "object" && err !== null && "code" in err ? err.code : undefined;
      if (code !== LOCATION_PERMISSION_DENIED) {
        alert("Could not detect location. Please try again in an open area.");
      }
    } finally {
      setIsDetectingLocation(false);
    }
  }, [handleMapSelect]);

  const { notify } = useNotification();

  /** Open one editor with the form freshly loaded from the saved profile. */
  const openEditor = (next: DetailsEditor) => {
    setReadSheet(null);
    if (next === "phone") {
      setShowPhoneChange(false);
      setNewPhoneNumber("");
    } else if (next !== "photos") {
      const base = valuesFor(provider);
      const form = formikRef.current;
      form?.resetForm({ values: base });
      // First time setting hours: start from a sensible 9 AM – 6 PM.
      if (next === "hours" && (!base.openTime || !base.closeTime)) {
        form?.setValues({ ...base, openTime: base.openTime || "09:00", closeTime: base.closeTime || "18:00" });
      }
      // An unsaved pin from an earlier, closed editor must not ride along.
      const coords = coordsOf(provider);
      setMapCoords(coords);
      setMapCenter(coords || DEFAULT_CENTER);
      setSearchQuery("");
      setSearchResults([]);
      updateMutation.reset();
    }
    setEditor(next);
  };
  const closeEditor = () => setEditor(null);

  const handleSave = async (values: DetailsFormValues) => {
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
      setEditor(null);
      notify({ title: "Saved", subtitle: "Customers will see your changes right away.", variant: "success" });
    } catch {
      // Error handled by mutation state (shown in the sheet footer)
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
    } catch (err: unknown) {
      const msg =
        (isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined) ||
        "Failed to update contact number";
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

  // ─── Derived display values ───────────────────────────────────────────
  const hoursText =
    provider.openTime && provider.closeTime
      ? `${formatTime(provider.openTime)} – ${formatTime(provider.closeTime)}`
      : null;

  const fullAddress = [provider.address, provider.area, provider.city, provider.pincode]
    .filter(Boolean)
    .join(", ");

  const bannerSrc = (bannerPreview || provider.bannerImageUrl) && !bannerError ? bannerPreview || provider.bannerImageUrl : null;
  const logoSrc = (profilePreview || provider.profilePhotoUrl) && !profileError ? profilePreview || provider.profilePhotoUrl : null;
  const onBannerImgError = () => { if (!bannerPreview) setBannerError(true); };
  const onLogoImgError = () => { if (!profilePreview) setProfileError(true); };

  const pinned = !!(provider.latitude && provider.longitude);
  const roughPin = pinned && provider.geocodePrecision === "city";

  type LinkRow = { key: string; icon: string; tone: TileTone; label: string; value: string | null | undefined };
  const links = ([
    { key: "wa", icon: logoWhatsapp, tone: "whatsapp", label: "WhatsApp", value: provider.whatsappNumber },
    { key: "ig", icon: logoInstagram, tone: "pink", label: "Instagram", value: provider.instagramHandle && `@${provider.instagramHandle}` },
    { key: "web", icon: globeOutline, tone: "violet", label: "Website", value: provider.websiteUrl?.replace(/^https?:\/\//i, "").replace(/\/$/, "") },
    { key: "fb", icon: logoFacebook, tone: "facebook", label: "Facebook", value: provider.facebookHandle },
    { key: "yt", icon: logoYoutube, tone: "youtube", label: "YouTube", value: provider.youtubeHandle },
    { key: "li", icon: logoLinkedin, tone: "linkedin", label: "LinkedIn", value: provider.linkedinHandle && `linkedin.com/${provider.linkedinHandle}` },
  ] satisfies LinkRow[]).filter((l) => !!l.value);

  const checklist: ChecklistItem[] = [
    { key: "logo", done: !!logoSrc, todo: "Add your logo", icon: personCircleOutline, editor: "photos" },
    { key: "cover", done: !!bannerSrc, todo: "Add a cover photo of your shop", icon: imageOutline, editor: "photos" },
    { key: "desc", done: !!provider.description?.trim(), todo: "Tell customers what you sell", icon: documentTextOutline, editor: "basics" },
    { key: "pin", done: pinned && !roughPin, todo: "Pin your shop on the map", icon: locationOutline, editor: "location" },
    { key: "hours", done: !!hoursText, todo: "Add your opening hours", icon: timeOutline, editor: "hours" },
    { key: "links", done: links.length > 0, todo: "Add your WhatsApp or Instagram", icon: linkOutline, editor: "links" },
  ];

  const longDescription = (provider.description?.length ?? 0) > 140;

  return (
    <ManagePage>
      <SectionHeader
        title="Your shop profile"
        subtitle="This is what customers see when they open your shop. A complete profile gets more calls."
      />

      <GroupLabel>How customers see you</GroupLabel>
      <ProfilePreview
        provider={provider}
        bannerSrc={bannerSrc}
        logoSrc={logoSrc}
        bannerUploading={!!bannerPreview}
        logoUploading={!!profilePreview}
        onBannerError={onBannerImgError}
        onLogoError={onLogoImgError}
        hoursText={hoursText}
        onEditPhotos={() => openEditor("photos")}
      />

      <ProfileChecklist items={checklist} onOpen={openEditor} />

      <AvailabilityCard available={provider.isAvailable} onToggle={handleToggleAvailability} />

      <BoostNudge
        id="details"
        title="Get seen before other businesses nearby"
        body="Boosted businesses show at the top of search and in Featured — customers find you first."
      />

      <GroupLabel>About your business</GroupLabel>
      <Card padded={false} className="divide-y divide-slate-100 dark:divide-slate-800">
        <DetailRow
          icon={storefrontOutline}
          label="Business name"
          value={provider.brandName}
          missing="Add your business name"
          onClick={() => openEditor("basics")}
        />
        <DetailRow
          icon={documentTextOutline}
          tone="violet"
          label="About your business"
          value={provider.description ? <span className="line-clamp-3 whitespace-pre-line">{provider.description}</span> : null}
          missing="Tell customers what you sell and what makes you special"
          onClick={() => openEditor("basics")}
          extra={longDescription ? <RowLink onClick={() => setReadSheet("description")}>Read all</RowLink> : undefined}
        />
      </Card>

      <GroupLabel>How customers reach you</GroupLabel>
      <Card padded={false} className="divide-y divide-slate-100 dark:divide-slate-800">
        <DetailRow
          icon={callOutline}
          tone="emerald"
          label="Contact number"
          badge={
            provider.contactNumber ? (
              <Pill tone="emerald">
                <IonIcon icon={shieldCheckmark} className="text-[11px]" />
                Verified
              </Pill>
            ) : undefined
          }
          value={provider.contactNumber ? <span className="tabular-nums">{provider.contactNumber}</span> : null}
          missing="Add the number customers should call"
          onClick={() => openEditor("phone")}
        />
        <DetailRow
          icon={locationOutline}
          tone="sky"
          label="Shop address"
          value={fullAddress || null}
          missing="Pin your shop on the map so customers can find you"
          onClick={() => openEditor("location")}
          extra={
            fullAddress ? (
              pinned && !roughPin ? (
                <RowLink icon={mapOutline} onClick={() => setReadSheet("address")}>See on map</RowLink>
              ) : (
                <button
                  type="button"
                  onClick={() => openEditor("location")}
                  className="flex items-start gap-1.5 py-1 text-left text-[12.5px] font-semibold text-amber-700 dark:text-amber-300 leading-snug"
                >
                  <IonIcon icon={warningOutline} className="text-[15px] shrink-0 mt-px" />
                  {roughPin
                    ? "Your pin is only at the city centre. Tap to move it to your shop."
                    : "No map pin yet, so customers can’t get directions. Tap to add one."}
                </button>
              )
            ) : undefined
          }
        />
        <DetailRow
          icon={timeOutline}
          tone="amber"
          label="Opening hours"
          value={hoursText}
          missing="Add your opening hours so customers know when to visit"
          onClick={() => openEditor("hours")}
        />
      </Card>

      <GroupLabel>Online presence</GroupLabel>
      <Card padded={false} className="divide-y divide-slate-100 dark:divide-slate-800">
        {links.map((l) => (
          <DetailRow key={l.key} icon={l.icon} tone={l.tone} label={l.label} value={<span className="break-all">{l.value}</span>} missing="" onClick={() => openEditor("links")} />
        ))}
        <DetailRow
          icon={linkOutline}
          label={links.length ? "More links" : "Social & website"}
          value={null}
          missing={
            links.length === 0
              ? "Add WhatsApp, Instagram or your website so customers can follow you"
              : links.length < 6
                ? "Add or change your links"
                : "Change your links"
          }
          onClick={() => openEditor("links")}
        />
      </Card>

      {/* Hidden pickers, kept outside the sheets so they survive them closing */}
      <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
      <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileChange} />

      {/* ─── Editors ─────────────────────────────────────────────────── */}
      <Formik
        innerRef={formikRef}
        initialValues={valuesFor(provider)}
        validationSchema={detailsSchema}
        onSubmit={handleSave}
      >
        {(formik) => {
          const saveError = updateMutation.isError;
          return (
            <>
              <BasicsSheet open={editor === "basics"} onClose={closeEditor} formik={formik} saveError={saveError} />
              <HoursSheet open={editor === "hours"} onClose={closeEditor} formik={formik} saveError={saveError} />
              <LinksSheet open={editor === "links"} onClose={closeEditor} formik={formik} saveError={saveError} />
              <LocationSheet
                open={editor === "location"}
                onClose={closeEditor}
                formik={formik}
                saveError={saveError}
                mapsLoaded={isLoaded}
                mapCenter={mapCenter}
                mapCoords={mapCoords}
                onMapLoad={(map) => { mapRef.current = map; }}
                onMapSelect={handleMapSelect}
                searchQuery={searchQuery}
                onSearch={handleSearchLocation}
                isSearching={isSearching}
                searchResults={searchResults}
                onPickResult={handleSelectSearchResult}
                isDetecting={isDetectingLocation}
                onDetect={handleDetectGPS}
              />
            </>
          );
        }}
      </Formik>

      <PhoneSheet
        open={editor === "phone"}
        onClose={closeEditor}
        currentNumber={provider.contactNumber || null}
        changing={showPhoneChange}
        onStartChange={() => {
          setShowPhoneChange(true);
          setNewPhoneNumber(provider.contactNumber || "");
        }}
        onCancelChange={() => { setShowPhoneChange(false); setNewPhoneNumber(""); }}
        newNumber={newPhoneNumber}
        onNewNumber={setNewPhoneNumber}
        onVerified={handleContactNumberVerified}
        verifying={updateContactMutation.isPending}
      />

      <PhotosSheet
        open={editor === "photos"}
        onClose={closeEditor}
        brandName={provider.brandName}
        bannerSrc={bannerSrc}
        logoSrc={logoSrc}
        bannerUploading={!!bannerPreview}
        logoUploading={!!profilePreview}
        bannerError={bannerError}
        logoError={profileError}
        onBannerImgError={onBannerImgError}
        onLogoImgError={onLogoImgError}
        busy={uploadImageMutation.isPending}
        onPickBanner={() => !uploadImageMutation.isPending && bannerInputRef.current?.click()}
        onPickLogo={() => !uploadImageMutation.isPending && profileInputRef.current?.click()}
        onRemoveBanner={() => setConfirmRemove("banner")}
        onRemoveLogo={() => setConfirmRemove("profile")}
      />

      {/* Full description / address with map */}
      <ManageSheet
        open={readSheet !== null}
        onClose={() => setReadSheet(null)}
        title={readSheet === "address" ? "Shop address" : "About your business"}
        footer={
          <PrimaryButton full icon={createOutline} onClick={() => openEditor(readSheet === "address" ? "location" : "basics")}>
            {readSheet === "address" ? "Change location" : "Edit description"}
          </PrimaryButton>
        }
      >
        <div className="pb-2">
          <p className="text-[14.5px] text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
            {readSheet === "address" ? fullAddress : provider.description}
          </p>
          {readSheet === "address" && fullAddress && (
            <div className="mt-4 rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 h-56 w-full bg-slate-100 dark:bg-slate-800">
              <iframe
                title="Shop on map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          )}
        </div>
      </ManageSheet>

      {/* Remove image confirmation */}
      <AppDialog
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        icon={trashOutline}
        iconColor="text-red-500"
        iconBg="bg-red-50"
        title={confirmRemove === "banner" ? "Remove cover photo?" : "Remove logo?"}
        description={confirmRemove === "banner" ? "Your shop will show a plain background until you add a new one." : "Your shop will show its first letter until you add a new logo."}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (confirmRemove === "banner") handleRemoveBanner();
          else if (confirmRemove === "profile") handleRemoveProfile();
          setConfirmRemove(null);
        }}
        confirmColor="red"
      />
    </ManagePage>
  );
};

export default ProviderDetailsTab;
