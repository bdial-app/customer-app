"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { List, Button, Block, Navbar, Page } from "konsta/react";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  arrowForwardOutline,
  cloudUploadOutline,
  checkmarkCircle,
  documentTextOutline,
  alertCircleOutline,
  timeOutline,
  checkmarkDoneCircleOutline,
  storefrontOutline,
  locationOutline,
  shieldCheckmarkOutline,
  imageOutline,
  informationCircleOutline,
  sparklesOutline,
  cardOutline,
  fingerPrintOutline,
  closeCircle,
  navigateOutline,
  searchOutline,
  layersOutline,
  cameraOutline,
  imagesOutline,
  addCircleOutline,
  trashOutline,
  bagHandleOutline,
  pricetagOutline,
  callOutline,
  shieldOutline,
  mapOutline,
} from "ionicons/icons";
import { useAppContext } from "../context/AppContext";
import { useNotification } from "../context/NotificationContext";
import { useRouter } from "next/navigation";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import TimePicker from "../components/time-picker";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FormikInput } from "../components/formik-input";
import { useAppSelector } from "@/hooks/useAppStore";
import {
  becomeProvider,
  getMyProviderStatus,
  sendProviderOtp,
  verifyProviderOtp,
} from "@/services/provider.service";
import { getTopLevelCategories, Category } from "@/services/category.service";
import { reverseGeocode } from "@/services/geocode.service";
import { searchGeocode } from "@/services/geocode.service";
import { AppDialog } from "../components/app-dialog";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import PrivateRoute from "@/app/components/private-route";
import FeatureGate from "@/app/components/feature-gate";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_FILE_SIZE = 15 * 1024 * 1024; // Accept up to 15MB — we compress client-side before upload
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const STEPS = [
  { id: 1, label: "Business", icon: storefrontOutline },
  { id: 2, label: "Location", icon: locationOutline },
  { id: 3, label: "Categories", icon: layersOutline },
  { id: 4, label: "Products", icon: bagHandleOutline },
  { id: 5, label: "Verify", icon: shieldCheckmarkOutline },
] as const;

type StepId = 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Validation schemas per step
// ---------------------------------------------------------------------------
const step1Schema = Yup.object({
  brand_name: Yup.string().trim().required("Brand name is required"),
  description: Yup.string().trim().required("Description is required"),
  contact_number: Yup.string()
    .matches(/^\d{10}$/, "Enter a valid 10-digit mobile number")
    .required("Contact number is required"),
  open_time: Yup.string(),
  close_time: Yup.string(),
});

const step2Schema = Yup.object({
  address: Yup.string().trim().required("Address is required"),
  city: Yup.string().trim().required("City is required"),
  area: Yup.string().trim().required("Area is required"),
  pincode: Yup.string()
    .matches(/^\d{6}$/, "Pincode must be 6 digits")
    .required("Pincode is required"),
});

const step3Schema = Yup.object({});
const step4Schema = Yup.object({});
const step5Schema = Yup.object({
  identity_doc: Yup.mixed<File>()
    .nullable()
    .test("fileSize", "File must be less than 15 MB", (val) =>
      !val || (val instanceof File && val.size <= MAX_FILE_SIZE),
    )
    .test("fileType", "Only JPEG, PNG or PDF allowed", (val) =>
      !val || (val instanceof File && ALLOWED_FILE_TYPES.includes(val.type)),
    ),
});

const schemaForStep: Record<StepId, Yup.ObjectSchema<any>> = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ---------------------------------------------------------------------------
// Step indicator (4-step horizontal)
// ---------------------------------------------------------------------------
const StepIndicator = ({
  current,
  completedSteps,
  onStepClick,
  isSubmitting,
}: {
  current: StepId;
  completedSteps: Set<number>;
  onStepClick: (step: StepId) => void;
  isSubmitting: boolean;
}) => (
  <div className="px-3 pt-3 pb-2">
    <div className="flex items-center">
      {STEPS.map((step, idx) => {
        const isActive = current === step.id;
        const isDone = completedSteps.has(step.id);
        const canClick =
          step.id <= current ||
          isDone ||
          completedSteps.has(step.id - 1);

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              type="button"
              disabled={!canClick || isSubmitting}
              onClick={() =>
                canClick &&
                !isSubmitting &&
                onStepClick(step.id as StepId)
              }
              className="flex flex-col items-center gap-1 flex-1 disabled:opacity-40 transition-opacity"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200 scale-110"
                    : isDone
                    ? "bg-emerald-500 border-emerald-500"
                    : "bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                }`}
              >
                {isDone && !isActive ? (
                  <IonIcon
                    icon={checkmarkCircle}
                    className="text-white text-base"
                  />
                ) : (
                  <IonIcon
                    icon={step.icon}
                    className={`text-sm ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-[9px] font-bold tracking-wide ${
                  isActive
                    ? "text-indigo-600"
                    : isDone
                    ? "text-emerald-600"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-0.5 rounded-full transition-colors duration-500 ${
                  completedSteps.has(step.id)
                    ? "bg-emerald-400"
                    : "bg-slate-200 dark:bg-slate-600"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
const SectionHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0">
      <IonIcon icon={icon} className="text-indigo-500 dark:text-indigo-400 text-lg" />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Tip banner
// ---------------------------------------------------------------------------
const TipBanner = ({
  icon,
  text,
  color = "indigo",
}: {
  icon: string;
  text: string;
  color?: string;
}) => {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50/70 border-indigo-100 text-indigo-700",
    amber: "bg-amber-50/70 border-amber-100 text-amber-800",
    emerald: "bg-emerald-50/70 border-emerald-100 text-emerald-700",
  };
  const iconColors: Record<string, string> = {
    indigo: "text-indigo-500",
    amber: "text-amber-500",
    emerald: "text-emerald-500",
  };
  return (
    <div
      className={`mx-4 mb-3 p-3 border rounded-2xl flex items-start gap-2.5 ${colors[color]}`}
    >
      <IonIcon
        icon={icon}
        className={`text-lg shrink-0 mt-0.5 ${iconColors[color]}`}
      />
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Interactive Map location picker with search (Step 2)
// ---------------------------------------------------------------------------
const MAP_CONTAINER = { width: "100%", height: "260px", borderRadius: "16px" };
const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 }; // Pune default

const MapLocationPicker = ({
  coords,
  onLocationSelect,
  onDetectGPS,
  isDetecting,
  detectedLabel,
}: {
  coords: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onDetectGPS: () => void;
  isDetecting: boolean;
  detectedLabel: string | null;
}) => {
  const { isLoaded } = useGoogleMapsLoader();
  const [mapCenter, setMapCenter] = useState(coords || DEFAULT_CENTER);
  const [markerPos, setMarkerPos] = useState(coords || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ placeId: string; description: string; mainText: string; secondaryText: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (coords) { setMapCenter(coords); setMarkerPos(coords); }
  }, [coords]);

  const handleSearch = useCallback((query: string) => {
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

  const selectResult = (result: { lat: number; lng: number; description: string; mainText?: string; secondaryText?: string }) => {
    const pos = { lat: Number(result.lat), lng: Number(result.lng) };
    setMarkerPos(pos);
    setMapCenter(pos);
    setSearchQuery(result.description);
    setSearchResults([]);
    mapRef.current?.panTo(pos);
    onLocationSelect(pos.lat, pos.lng);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    onLocationSelect(lat, lng);
  };

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    onLocationSelect(lat, lng);
  };

  return (
    <div className="px-4 space-y-3 mb-3">
      {/* GPS button */}
      <button type="button" onClick={onDetectGPS} disabled={isDetecting}
        className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 transition-all active:scale-[0.99] disabled:opacity-60">
        <div className={`w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 ${isDetecting ? "animate-pulse" : ""}`}>
          <IonIcon icon={navigateOutline} className="text-indigo-600 text-lg" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-xs font-bold text-indigo-700">{isDetecting ? "Detecting..." : "Use My Current Location"}</p>
          <p className="text-[10px] text-indigo-500/70 truncate">{detectedLabel || "Auto-fill from GPS"}</p>
        </div>
        {detectedLabel && !isDetecting && <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-lg shrink-0" />}
      </button>

      {/* Search bar */}
      <div className="relative">
        <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base z-10" />
        <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for your business location..."
          className="w-full pl-9 pr-4 py-2.5 text-base bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all dark:text-white dark:placeholder:text-slate-400" />
        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /></div>}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-20 max-h-56 overflow-y-auto">
            {searchResults.map((r) => (
              <button key={r.placeId} type="button" onClick={() => selectResult(r)}
                className="w-full px-3 py-2.5 text-left hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-b-0 flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center">
                  <IonIcon icon={locationOutline} className="text-xs text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug truncate">{r.mainText}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug truncate">{r.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {isLoaded ? (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
          <GoogleMap mapContainerStyle={MAP_CONTAINER} center={mapCenter} zoom={markerPos ? 16 : 12}
            onClick={handleMapClick} onLoad={(map) => { mapRef.current = map; }}
            options={{ disableDefaultUI: true, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}>
            {markerPos && <Marker position={markerPos} draggable onDragEnd={handleDragEnd} />}
          </GoogleMap>
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border-t border-slate-100 dark:border-slate-600">
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <IonIcon icon={mapOutline} className="text-xs" />
              {markerPos ? `📍 ${markerPos.lat.toFixed(5)}, ${markerPos.lng.toFixed(5)}` : "Tap on the map or search to pin your location"}
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[260px] rounded-2xl bg-slate-100 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Category selector with search (Step 3)
// ---------------------------------------------------------------------------
// Placeholder icon colors by first letter (consistent per category)
const PLACEHOLDER_COLORS = [
  "from-indigo-400 to-indigo-500",
  "from-violet-400 to-violet-500",
  "from-blue-400 to-blue-500",
  "from-cyan-400 to-cyan-500",
  "from-teal-400 to-teal-500",
  "from-emerald-400 to-emerald-500",
  "from-amber-400 to-amber-500",
  "from-orange-400 to-orange-500",
  "from-rose-400 to-rose-500",
  "from-pink-400 to-pink-500",
  "from-fuchsia-400 to-fuchsia-500",
  "from-sky-400 to-sky-500",
];
const getPlaceholderColor = (name: string) =>
  PLACEHOLDER_COLORS[name.charCodeAt(0) % PLACEHOLDER_COLORS.length];

const CategorySelector = ({
  categories,
  selectedIds,
  onToggle,
  maxSelect = 2,
}: {
  categories: Category[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxSelect?: number;
}) => {
  const [search, setSearch] = useState("");
  const [brokenIcons, setBrokenIcons] = useState<Set<string>>(new Set());
  const atLimit = selectedIds.length >= maxSelect;

  const handleImgError = (catId: string) => {
    setBrokenIcons((prev) => new Set(prev).add(catId));
  };

  const hasValidIcon = (cat: Category) =>
    cat.icon && cat.icon.trim() !== "" && !brokenIcons.has(cat.id);

  const filtered = search.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  // Group filtered categories alphabetically
  const grouped = filtered.reduce<Record<string, Category[]>>((acc, cat) => {
    const letter = cat.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(cat);
    return acc;
  }, {});
  const sortedLetters = Object.keys(grouped).sort();

  const selectedCats = categories.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="px-4 pb-2 space-y-3">
      {/* Search bar */}
      <div className="relative">
        <IonIcon
          icon={searchOutline}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search from categories..."
          className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 shadow-sm transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 dark:text-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
          >
            <IonIcon icon={closeCircle} className="text-lg" />
          </button>
        )}
      </div>

      {/* Results count when searching */}
      {search.trim() && (
        <p className="text-[11px] text-slate-400 px-1">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Max selection hint */}
      {atLimit && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <IonIcon icon={informationCircleOutline} className="text-amber-500 text-base flex-shrink-0" />
          <p className="text-[11px] text-amber-700 font-medium">
            Maximum {maxSelect} categories allowed. Remove one to change.
          </p>
        </div>
      )}

      {/* Selected chips (pinned at top) */}
      {selectedCats.length > 0 && (
        <div className="bg-indigo-50/70 rounded-2xl p-3 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{selectedCats.length}</span>
              </div>
              <p className="text-xs font-semibold text-indigo-700">
                Selected <span className="font-normal text-indigo-400">({selectedCats.length}/{maxSelect})</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectedIds.forEach((id) => onToggle(id))}
              className="text-[11px] font-medium text-indigo-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedCats.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onToggle(cat.id)}
                className="group flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-[11px] font-semibold bg-white text-indigo-700 border border-indigo-200 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.96]"
              >
                {hasValidIcon(cat) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.icon!} alt="" className="w-4 h-4 rounded-full object-cover" onError={() => handleImgError(cat.id)} />
                ) : (
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${getPlaceholderColor(cat.name)} flex items-center justify-center`}>
                    <span className="text-[8px] font-bold text-white">{cat.name.charAt(0)}</span>
                  </div>
                )}
                {cat.name}
                <IonIcon icon={closeCircle} className="text-indigo-300 group-hover:text-red-400 text-sm transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable alphabetical list */}
      <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm">
        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center animate-pulse">
              <IonIcon icon={layersOutline} className="text-slate-300 text-xl" />
            </div>
            <p className="text-xs text-slate-400">Loading categories...</p>
          </div>
        )}
        {filtered.length === 0 && categories.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <IonIcon icon={searchOutline} className="text-slate-300 text-xl" />
            </div>
            <p className="text-xs text-slate-400">
              No categories matching &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
        {sortedLetters.map((letter, letterIdx) => (
          <div key={letter}>
            <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-700/95 backdrop-blur-md px-3 py-1.5 border-b border-slate-100 dark:border-slate-600">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                {letter}
              </span>
            </div>
            {grouped[letter].map((cat, catIdx) => {
              const selected = selectedIds.includes(cat.id);
              const disabled = atLimit && !selected;
              const isLast =
                letterIdx === sortedLetters.length - 1 &&
                catIdx === grouped[letter].length - 1;
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(cat.id)}
                  className={`flex items-center gap-3 w-full px-3 py-3 text-left transition-all ${
                    !isLast ? "border-b border-slate-50" : ""
                  } ${
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "active:scale-[0.98]"
                  } ${
                    selected
                      ? "bg-indigo-50/80"
                      : disabled
                        ? ""
                        : "hover:bg-slate-50"
                  }`}
                >
                  {/* Icon / Placeholder */}
                  {hasValidIcon(cat) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.icon!}
                      alt=""
                      onError={() => handleImgError(cat.id)}
                      className={`w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ${
                        selected ? "ring-indigo-300" : "ring-slate-100"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getPlaceholderColor(cat.name)} flex items-center justify-center shadow-sm ${
                        selected ? "ring-2 ring-indigo-300 ring-offset-1" : ""
                      }`}
                    >
                      <span className="text-sm font-bold text-white drop-shadow-sm">
                        {cat.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <span
                    className={`text-[13px] flex-1 leading-tight ${
                      selected
                        ? "font-semibold text-indigo-700"
                        : "font-medium text-slate-600"
                    }`}
                  >
                    {cat.name}
                  </span>

                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      selected
                        ? "bg-indigo-600 shadow-sm shadow-indigo-200"
                        : disabled
                          ? "border-2 border-slate-100 bg-slate-50"
                          : "border-2 border-slate-200"
                    }`}
                  >
                    {selected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Photo file upload with preview (replaces URL input)
// ---------------------------------------------------------------------------
const PhotoFileUpload = ({
  label,
  icon,
  file,
  onChange,
  hint,
}: {
  label: string;
  icon: string;
  file: File | null;
  onChange: (file: File | null) => void;
  hint: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE) onChange(f);
    e.target.value = "";
  };

  return (
    <div className="px-4 mb-3">
      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
        {label}
      </label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleChange} />
      {file && preview ? (
        <div className="relative rounded-xl overflow-hidden border border-green-200 bg-green-50/30 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-32 object-cover" />
          <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <IonIcon icon={checkmarkCircle} className="text-xs" /> Selected
          </div>
          <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
            <IonIcon icon={closeCircle} className="text-white text-sm" />
          </button>
          <div className="flex items-center justify-between p-2 border-t border-green-100 bg-white/80">
            <p className="text-[10px] text-slate-500 truncate flex-1">{file.name} &bull; {formatFileSize(file.size)}</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5 ml-2 shrink-0">Replace</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/50 hover:border-indigo-300 transition-all active:scale-[0.99]">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0">
            <IonIcon icon={icon} className="text-indigo-500 dark:text-indigo-400 text-lg" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Upload {label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
          </div>
          <IonIcon icon={cloudUploadOutline} className="text-slate-300 text-xl shrink-0" />
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product form item
// ---------------------------------------------------------------------------
interface ProductItem {
  name: string;
  description: string;
  price: string;
  images: File[];
}

const emptyProduct = (): ProductItem => ({ name: "", description: "", price: "", images: [] });

const MAX_PRODUCT_IMAGES = 5;

const ProductFormCard = ({
  product,
  index,
  onUpdate,
  onRemove,
}: {
  product: ProductItem;
  index: number;
  onUpdate: (p: ProductItem) => void;
  onRemove: () => void;
}) => {
  const imgRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = product.images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [product.images]);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    const remaining = MAX_PRODUCT_IMAGES - product.images.length;
    if (remaining > 0 && valid.length > 0) {
      onUpdate({ ...product, images: [...product.images, ...valid.slice(0, remaining)] });
    }
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    onUpdate({ ...product, images: product.images.filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-slate-700/80 border-b border-slate-100 dark:border-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-600">{index + 1}</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {product.name.trim() || `Product ${index + 1}`}
          </span>
        </div>
        <button type="button" onClick={onRemove} className="p-1 rounded-lg hover:bg-red-50 transition-colors active:scale-90">
          <IonIcon icon={trashOutline} className="text-red-400 text-base" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Product images (up to 5) */}
        <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleAddImages} />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photos ({product.images.length}/{MAX_PRODUCT_IMAGES})</label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {previews.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                  <IonIcon icon={closeCircle} className="text-white text-xs" />
                </button>
              </div>
            ))}
            {product.images.length < MAX_PRODUCT_IMAGES && (
              <button type="button" onClick={() => imgRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:border-indigo-200 transition-all shrink-0">
                <IonIcon icon={cameraOutline} className="text-sm" />
                <span className="text-[8px] font-medium">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Product Name *</label>
          <input type="text" value={product.name} onChange={(e) => onUpdate({ ...product, name: e.target.value })} placeholder="e.g. Bridal Mehndi Package" maxLength={150}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all dark:text-white dark:placeholder:text-slate-400" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description</label>
          <textarea value={product.description} onChange={(e) => onUpdate({ ...product, description: e.target.value })} placeholder="Brief description of this product or service..." rows={2} maxLength={2000}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none dark:text-white dark:placeholder:text-slate-400" />
        </div>

        {/* Price */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Price (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <input type="text" inputMode="decimal" value={product.price} onChange={(e) => onUpdate({ ...product, price: e.target.value.replace(/[^\d.]/g, "") })} placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all dark:text-white dark:placeholder:text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Document type selector (Step 4)
// ---------------------------------------------------------------------------
const DOC_TYPES = [
  {
    id: "aadhaar",
    label: "Aadhaar Card",
    icon: fingerPrintOutline,
    color: "indigo",
  },
  {
    id: "pan",
    label: "PAN Card",
    icon: cardOutline,
    color: "emerald",
  },
  {
    id: "other",
    label: "Other ID",
    icon: documentTextOutline,
    color: "amber",
  },
] as const;

type DocTypeId = (typeof DOC_TYPES)[number]["id"];

const DocumentTypeSelector = ({
  selected,
  onChange,
}: {
  selected: DocTypeId;
  onChange: (id: DocTypeId) => void;
}) => (
  <div className="px-4 pt-2 pb-1">
    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
      Select document type
    </p>
    <div className="grid grid-cols-3 gap-2">
      {DOC_TYPES.map((doc) => {
        const isActive = selected === doc.id;
        const colorMap: Record<
          string,
          { ring: string; bg: string; text: string; icon: string }
        > = {
          indigo: {
            ring: "ring-indigo-500 bg-indigo-50",
            bg: "bg-indigo-50",
            text: "text-indigo-700",
            icon: "text-indigo-500",
          },
          emerald: {
            ring: "ring-emerald-500 bg-emerald-50",
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            icon: "text-emerald-500",
          },
          amber: {
            ring: "ring-amber-500 bg-amber-50",
            bg: "bg-amber-50",
            text: "text-amber-700",
            icon: "text-amber-500",
          },
        };
        const c = colorMap[doc.color];

        return (
          <button
            key={doc.id}
            type="button"
            onClick={() => onChange(doc.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
              isActive
                ? `ring-2 ${c.ring} border-transparent`
                : "border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-500"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isActive ? c.bg : "bg-slate-50"
              }`}
            >
              <IonIcon
                icon={doc.icon}
                className={`text-xl ${
                  isActive ? c.icon : "text-slate-400"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-bold leading-tight text-center ${
                isActive ? c.text : "text-slate-500"
              }`}
            >
              {doc.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Document file picker
// ---------------------------------------------------------------------------
const DocFilePicker = ({
  file,
  error,
  touched,
  docType,
  onChange,
}: {
  file: File | null;
  error?: string;
  touched?: boolean;
  docType: DocTypeId;
  onChange: (file: File | null) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const hasError = touched && !!error;
  const docLabel =
    DOC_TYPES.find((d) => d.id === docType)?.label ?? "Document";

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    onChange(selected);
    e.target.value = "";
  };

  return (
    <div className="px-4 py-2">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleChange}
      />

      {file ? (
        <div className="rounded-2xl border border-green-200 bg-gradient-to-b from-green-50/60 to-white overflow-hidden shadow-sm">
          {preview ? (
            <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`${docLabel} preview`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <IonIcon icon={checkmarkCircle} className="text-sm" />
                Uploaded
              </div>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon
                  icon={closeCircle}
                  className="text-white text-lg"
                />
              </button>
            </div>
          ) : (
            <div className="relative w-full h-32 bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <IonIcon
                    icon={documentTextOutline}
                    className="text-3xl text-indigo-400"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  PDF Document
                </span>
              </div>
              <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <IonIcon icon={checkmarkCircle} className="text-sm" />
                Uploaded
              </div>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/20 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon
                  icon={closeCircle}
                  className="text-slate-600 text-lg"
                />
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 border-t border-green-100">
            <div className="p-1.5 bg-green-100 rounded-lg shrink-0">
              <IonIcon
                icon={checkmarkCircle}
                className="text-green-600 text-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {file.name}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatFileSize(file.size)} &bull;{" "}
                {file.type === "application/pdf" ? "PDF" : "Image"} &bull;{" "}
                {docLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5 active:scale-95 transition-transform shrink-0"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`relative flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
            hasError
              ? "border-red-300 bg-red-50/40 min-h-[180px]"
              : "border-slate-200 bg-gradient-to-b from-slate-50/50 to-white hover:border-indigo-300 min-h-[180px]"
          }`}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleChange}
          />
          <div className="flex flex-col items-center gap-3 p-6 pointer-events-none">
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 group-hover:scale-105 group-hover:shadow-md ${
                hasError
                  ? "bg-red-50 border-red-200 text-red-400"
                  : "bg-white border-slate-100 text-indigo-500 shadow-sm"
              }`}
            >
              <IonIcon icon={cloudUploadOutline} className="text-4xl" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                Upload {docLabel}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Take a photo or upload a scanned copy
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {["JPEG", "PNG", "PDF"].map((f) => (
                <span
                  key={f}
                  className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium"
                >
                  {f}
                </span>
              ))}
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full font-medium">
                Max 5 MB
              </span>
            </div>
          </div>
        </label>
      )}

      {hasError && (
        <div className="flex items-center gap-1.5 mt-2 px-1">
          <IonIcon
            icon={alertCircleOutline}
            className="text-red-500 text-sm shrink-0"
          />
          <p className="text-xs text-red-500 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Document guidelines
// ---------------------------------------------------------------------------
const DocumentGuidelines = () => (
  <div className="mx-4 mt-3 space-y-3">
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">
        Document guidelines
      </p>
      <div className="space-y-2.5">
        {[
          "Document should be clearly visible and not blurred",
          "All four corners of the document must be visible",
          "File size should not exceed 5 MB",
          "Accepted: Aadhaar Card, PAN Card, Passport, Voter ID",
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-indigo-600">
                {i + 1}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-start gap-2.5 px-1">
      <IonIcon
        icon={shieldCheckmarkOutline}
        className="text-green-500 text-base shrink-0 mt-0.5"
      />
      <p className="text-[10px] text-slate-400 leading-relaxed">
        Your documents are encrypted end-to-end and stored securely. Only
        verified administrators can access them for identity verification.
      </p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// What happens next
// ---------------------------------------------------------------------------
const WhatHappensNext = () => (
  <div className="mx-4 mt-4 mb-2 rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-800 dark:to-slate-800 p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <IonIcon
        icon={informationCircleOutline}
        className="text-indigo-400 text-lg"
      />
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        What happens next
      </p>
    </div>
    <div className="space-y-3">
      {[
        {
          step: "1",
          text: "Our team reviews your identity document",
          time: "Within 24 hrs",
        },
        {
          step: "2",
          text: "Your provider profile gets verified and activated",
          time: "1-2 business days",
        },
        {
          step: "3",
          text: "You receive a notification and can start listing services",
          time: "After approval",
        },
      ].map((item) => (
        <div key={item.step} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            {item.step}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">{item.text}</p>
            <p className="text-[10px] text-slate-400">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Under-review / status page
// ---------------------------------------------------------------------------
const UnderReviewBanner = ({
  status,
  onGoBack,
}: {
  status: "pending" | "in_review" | "approved";
  onGoBack: () => void;
}) => {
  const { setUserMode } = useAppContext();
  const router = useRouter();
  const config = {
    pending: {
      icon: timeOutline,
      iconBg: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-500",
      title: "Application Submitted",
      subtitle:
        "Your application is in our queue and will be reviewed shortly. This usually takes 1-2 business days.",
      steps: [
        { label: "Application submitted", done: true },
        { label: "Identity verification in progress", done: false },
        { label: "Approval & account activation", done: false },
      ],
    },
    in_review: {
      icon: shieldCheckmarkOutline,
      iconBg: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-500",
      title: "Under Active Review",
      subtitle:
        "Our team is currently verifying your identity and documents. You'll hear from us soon.",
      steps: [
        { label: "Application submitted", done: true },
        { label: "Identity verification in progress", done: true },
        { label: "Approval & account activation", done: false },
      ],
    },
    approved: {
      icon: sparklesOutline,
      iconBg: "bg-green-50 border-green-200",
      iconColor: "text-green-500",
      title: "You're Approved!",
      subtitle:
        "Your provider account is active. Continue as a provider to manage your business, add products, and start receiving orders.",
      steps: [
        { label: "Application submitted", done: true },
        { label: "Identity verified", done: true },
        { label: "Account activated", done: true },
      ],
    },
  }[status];

  return (
    <Page>
      <Navbar
        title="Application Status"
        leftClassName="w-11"
        left={
          <Button clear onClick={onGoBack}>
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>
        }
      />
      <div className="flex flex-col items-center px-6 pt-8 pb-8 gap-6">
        <div className={`p-5 rounded-full border-2 ${config.iconBg}`}>
          <IonIcon
            icon={config.icon}
            className={`text-5xl ${config.iconColor}`}
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {config.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
            {config.subtitle}
          </p>
        </div>
        <div className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-0">
          {config.steps.map((s, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 py-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    s.done
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {s.done && (
                    <IonIcon
                      icon={checkmarkDoneCircleOutline}
                      className="text-white text-xs"
                    />
                  )}
                </div>
                <p
                  className={`text-sm font-medium ${
                    s.done ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </p>
              </div>
              {i < config.steps.length - 1 && (
                <div className="ml-3 w-0.5 h-3 bg-slate-100 rounded-full" />
              )}
            </div>
          ))}
        </div>
        {status === "approved" ? (
          <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-start gap-2">
            <IonIcon
              icon={storefrontOutline}
              className="text-emerald-500 text-lg shrink-0 mt-0.5"
            />
            <p className="text-xs text-emerald-700 leading-relaxed">
              Your provider dashboard is ready. Switch to Provider Mode from your profile to manage products, bookings, and business settings.
            </p>
          </div>
        ) : (
          <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-start gap-2">
            <IonIcon
              icon={informationCircleOutline}
              className="text-indigo-400 text-lg shrink-0 mt-0.5"
            />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Your application is being reviewed. You'll be notified once approved.
            </p>
          </div>
        )}

        {status === "approved" ? (
          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setUserMode("provider");
                router.replace("/");
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 active:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
            >
              <IonIcon icon={storefrontOutline} className="text-white text-xl" />
              <span className="text-white font-semibold text-[15px]">Continue as Provider</span>
              <IonIcon icon={arrowForwardOutline} className="text-white/80 text-base ml-auto" />
            </button>
            <button
              type="button"
              onClick={onGoBack}
              className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-medium text-sm active:bg-slate-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onGoBack}
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-semibold text-[15px] active:bg-slate-50 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    </Page>
  );
};

// ===========================================================================
// MAIN PAGE
// ===========================================================================
const ProviderOnboardingPage = () => {
  const { providerStatus, setProviderStatus } = useAppContext();
  const { notify } = useNotification();
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const user = useAppSelector((state) => state.auth.user);

  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [docType, setDocType] = useState<DocTypeId>("aadhaar");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [productItems, setProductItems] = useState<ProductItem[]>([emptyProduct()]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isWomenLed, setIsWomenLed] = useState(false);
  const [detectedLocationLabel, setDetectedLocationLabel] = useState<
    string | null
  >(null);
  const [detectedCoords, setDetectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const pendingSubmitRef = useRef<(() => void) | null>(null);
  const formikRef = useRef<any>(null);

  // Fetch categories
  useEffect(() => {
    getTopLevelCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  // Fetch provider status
  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const result = await getMyProviderStatus();
        if (!cancelled) setProviderStatus(result.providerStatus as any);
      } catch {
        // keep as not_applied
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };
    fetchStatus();
    return () => {
      cancelled = true;
    };
  }, [setProviderStatus]);

  const alreadyApplied =
    providerStatus === "pending" ||
    providerStatus === "in_review" ||
    providerStatus === "approved";

  // Location detection with reverse geocode auto-fill
  const handleDetectLocation = useCallback(async () => {
    if (!formikRef.current) return;
    setIsDetectingLocation(true);
    try {
      const { getCurrentPosition } = await import("@/utils/geolocation");
      const pos = await getCurrentPosition({ timeout: 10000, enableHighAccuracy: true });
      const { latitude: lat, longitude: lng } = pos;
      setDetectedCoords({ lat, lng });

      try {
        const geo = await reverseGeocode({ lat, lng });
        const { setFieldValue } = formikRef.current;
        if (geo.city) setFieldValue("city", geo.city);
        if (geo.area) setFieldValue("area", geo.area);
        if (geo.fullAddress) setFieldValue("address", geo.fullAddress);
        if (geo.pincode) setFieldValue("pincode", geo.pincode);
        setDetectedLocationLabel(
          geo.label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        );
      } catch {
        setDetectedLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      alert(
        "Could not detect location. Please allow location access and try again.",
      );
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOtp = useCallback(async (phone: string) => {
    if (!phone || phone.length !== 10) return;
    setOtpSending(true);
    setOtpError(null);
    try {
      const res = await sendProviderOtp(phone);
      setOtpSent(true);
      setOtpCooldown(60);
      const testOtp = res?.data?.otp;
      notify({
        title: "OTP Sent",
        subtitle: testOtp ? `Your code: ${testOtp}` : "Check your messages",
        variant: "success",
        duration: 10000,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to send OTP";
      setOtpError(typeof msg === "string" ? msg : JSON.stringify(msg));
      if (err?.response?.data?.retryAfterSeconds) setOtpCooldown(err.response.data.retryAfterSeconds);
    } finally { setOtpSending(false); }
  }, []);

  const handleVerifyOtp = useCallback(async (phone: string) => {
    if (!otpCode || otpCode.length !== 6) { setOtpError("Enter 6-digit OTP"); return; }
    setOtpVerifying(true);
    setOtpError(null);
    try {
      const res = await verifyProviderOtp(phone, otpCode);
      if (res.verified) setOtpVerified(true);
      else setOtpError("Invalid OTP");
    } catch (err: any) {
      setOtpError(err?.response?.data?.message ?? "Verification failed");
    } finally { setOtpVerifying(false); }
  }, [otpCode]);

  // Map location select → reverse geocode to fill fields
  const handleMapLocationSelect = useCallback(async (lat: number, lng: number) => {
    setDetectedCoords({ lat, lng });
    if (!formikRef.current) return;
    try {
      const geo = await reverseGeocode({ lat, lng });
      const { setFieldValue } = formikRef.current;
      if (geo.city) setFieldValue("city", geo.city);
      if (geo.area) setFieldValue("area", geo.area);
      if (geo.fullAddress) setFieldValue("address", geo.fullAddress);
      if (geo.pincode) setFieldValue("pincode", geo.pincode);
      setDetectedLocationLabel(geo.label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch {
      setDetectedLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  const handleBack = () => {
    if (isSubmitting) return;
    if (currentStep > 1) setCurrentStep((currentStep - 1) as StepId);
    else goBack("/");
  };

  const handleNext = async (validateForm: any, setTouched: any) => {
    const errors = await validateForm();
    const stepFields: Record<StepId, string[]> = {
      1: ["brand_name", "description", "contact_number"],
      2: ["address", "city", "area", "pincode"],
      3: [],
      4: [],
      5: ["identity_doc"],
    };
    const relevantErrors = Object.keys(errors).filter((k) =>
      stepFields[currentStep].includes(k),
    );

    if (relevantErrors.length === 0) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep(Math.min(currentStep + 1, 5) as StepId);
    } else {
      setTouched(
        relevantErrors.reduce(
          (acc, k) => ({ ...acc, [k]: true }),
          {} as any,
        ),
      );
    }
  };

  const handleSubmit = async (values: any) => {
    if (!user?.id) {
      setSubmitError("You must be logged in to become a provider.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    let latitude: string | undefined;
    let longitude: string | undefined;
    if (detectedCoords) {
      latitude = String(detectedCoords.lat);
      longitude = String(detectedCoords.lng);
    } else if ((user as any)?.latitude && (user as any)?.longitude) {
      latitude = String((user as any).latitude);
      longitude = String((user as any).longitude);
    }

    try {
      // Build products array (only ones with a name)
      const validProducts = productItems
        .filter((p) => p.name.trim())
        .map((p, i) => ({
          name: p.name.trim(),
          description: p.description.trim() || undefined,
          price: p.price ? parseFloat(p.price) : undefined,
          imageCount: p.images.length,
        }));

      // Collect all product images as a flat array
      const allProductImages: File[] = [];
      productItems.filter((p) => p.name.trim()).forEach((p) => {
        p.images.forEach((img) => allProductImages.push(img));
      });

      await becomeProvider({
        userId: user.id,
        brandName: values.brand_name.trim(),
        description: values.description.trim(),
        contactNumber: `+91${values.contact_number.trim()}`,
        city: values.city.trim(),
        area: values.area.trim(),
        address: values.address.trim(),
        pincode: values.pincode.trim(),
        openTime: values.open_time?.slice(0, 5) || undefined,
        closeTime: values.close_time?.slice(0, 5) || undefined,
        aadhaarFile: values.identity_doc || undefined,
        latitude,
        longitude,
        isWomenLed,
        categoryIds: selectedCategoryIds.length
          ? selectedCategoryIds
          : undefined,
        bannerImage: bannerFile || undefined,
        profileImage: profileFile || undefined,
        products: validProducts.length ? validProducts : undefined,
        productImages: allProductImages.length
          ? allProductImages
          : undefined,
      });
      setProviderStatus(values.identity_doc ? "pending" : "approved");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Something went wrong. Please try again.";
      setSubmitError(
        Array.isArray(message) ? message.join(", ") : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (statusLoading) {
    return (
      <Page>
        <Navbar title="Become a Provider" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Checking your status...</p>
        </div>
      </Page>
    );
  }

  // Already applied
  if (alreadyApplied) {
    return (
      <UnderReviewBanner
        status={providerStatus as "pending" | "in_review" | "approved"}
        onGoBack={() => goBack("/")}
      />
    );
  }

  return (
    <Page className="!bg-white dark:!bg-slate-900">
      <Navbar
        title="Become a Provider"
        leftClassName="w-11"
        left={
          <Button clear onClick={handleBack} disabled={isSubmitting}>
            <IonIcon icon={arrowBack} className="w-5 h-5" />
          </Button>
        }
      />

      <Formik
        innerRef={formikRef}
        initialValues={{
          brand_name: "",
          description: "",
          contact_number: "",
          open_time: "",
          close_time: "",
          address: "",
          city: "",
          area: "",
          pincode: "",
          identity_doc: null as File | null,
        }}
        validationSchema={schemaForStep[currentStep]}
        onSubmit={handleSubmit}
        validateOnChange={false}
        validateOnBlur
      >
        {({
          values,
          setFieldValue,
          validateForm,
          setTouched,
          errors,
          touched,
          submitForm,
        }) => {
          const isStep1Valid = Boolean(
            values.brand_name.trim() &&
              values.description.trim() &&
              values.contact_number.trim() &&
              otpVerified,
          );
          const isStep2Valid = Boolean(
            values.address.trim() &&
              values.city.trim() &&
              values.area.trim() &&
              values.pincode.trim(),
          );
          const isStep5HasDoc = values.identity_doc instanceof File;

          const canAdvance: Record<StepId, boolean> = {
            1: isStep1Valid,
            2: isStep2Valid,
            3: true,
            4: true,
            5: true,
          };

          return (
            <Form className="contents">
              <StepIndicator
                current={currentStep}
                completedSteps={completedSteps}
                onStepClick={setCurrentStep}
                isSubmitting={isSubmitting}
              />

              <div className="overflow-y-auto max-h-[calc(100vh-210px)] pb-36">
                {/* ======================================================= */}
                {/* STEP 1 — Business Information                           */}
                {/* ======================================================= */}
                {currentStep === 1 && (
                  <>
                    <TipBanner
                      icon={sparklesOutline}
                      text="Fill in your business details below. Accurate information helps customers find and trust your services."
                    />
                    <SectionHeader
                      icon={storefrontOutline}
                      title="Business Information"
                      subtitle="Tell customers about your brand"
                    />
                    <List strongIos insetIos>
                      <FormikInput
                        name="brand_name"
                        label="Brand Name"
                        type="text"
                        placeholder="e.g. Babji's Catering"
                      />
                      <FormikInput
                        name="description"
                        label="Description"
                        type="textarea"
                        placeholder="Describe your services, specialties, experience..."
                        inputClassName="!min-h-[110px]"
                      />
                      <FormikInput
                        name="contact_number"
                        label="Contact Number"
                        type="tel"
                        placeholder="10-digit mobile number"
                        formatValue={(val) =>
                          val.replace(/\D/g, "").slice(0, 10)
                        }
                      />
                    </List>

                    {/* OTP Verification for Contact Number */}
                    <div className="px-4 mb-4">
                      {otpVerified ? (
                        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                          <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-xl shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-700">Phone number verified</p>
                            <p className="text-[10px] text-emerald-600/70">+91 {values.contact_number}</p>
                          </div>
                        </div>
                      ) : !otpSent ? (
                        <button type="button" disabled={values.contact_number.length !== 10 || otpSending}
                          onClick={() => handleSendOtp(values.contact_number)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 transition-all active:scale-[0.99] disabled:opacity-50">
                          {otpSending ? (
                            <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                          ) : (
                            <IonIcon icon={shieldOutline} className="text-indigo-500 text-base" />
                          )}
                          <span className="text-xs font-bold text-indigo-600">
                            {otpSending ? "Sending OTP..." : "Verify Phone Number"}
                          </span>
                        </button>
                      ) : (
                        <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                          <div className="flex items-center gap-2">
                            <IonIcon icon={callOutline} className="text-indigo-500 text-base" />
                            <p className="text-xs font-bold text-indigo-700">Enter OTP sent to +91 {values.contact_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <input type="text" inputMode="numeric" value={otpCode} maxLength={6}
                              onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(null); }}
                              placeholder="6-digit OTP"
                              className="flex-1 px-3 py-2.5 text-sm text-center font-mono tracking-[0.3em] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                            <button type="button" disabled={otpCode.length !== 6 || otpVerifying}
                              onClick={() => handleVerifyOtp(values.contact_number)}
                              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition-all">
                              {otpVerifying ? "..." : "Verify"}
                            </button>
                          </div>
                          {otpError && (
                            <p className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                              <IonIcon icon={alertCircleOutline} className="text-xs" /> {otpError}
                            </p>
                          )}
                          <button type="button" disabled={otpCooldown > 0 || otpSending}
                            onClick={() => handleSendOtp(values.contact_number)}
                            className="text-[11px] font-semibold text-indigo-600 disabled:text-slate-400">
                            {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend OTP"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Women-Led Business Toggle */}
                    <div className="px-4 mb-4">
                      <div className={`p-4 rounded-2xl border-2 transition-colors ${
                        isWomenLed
                          ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600"
                          : "border-slate-200 bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700"
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base">♀</span>
                              <h4 className="text-sm font-bold text-gray-800 dark:text-white">Women-Led Business</h4>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                              Mark this if your business is owned or led by a woman. Women-led businesses get extra visibility, featured placement, and bonus free leads on Tijarah.
                            </p>
                            {isWomenLed && (
                              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1.5 font-medium">
                                ✓ Admin verification required — your badge will appear once approved
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsWomenLed(!isWomenLed)}
                            className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${
                              isWomenLed ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                              isWomenLed ? "left-[26px]" : "left-0.5"
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <SectionHeader
                      icon={timeOutline}
                      title="Business Hours"
                      subtitle="Optional — shown on your profile"
                    />
                    <List strongIos insetIos className="!mt-0">
                      <TimePicker
                        label="Open Time"
                        value={values.open_time}
                        onChange={(val) => setFieldValue("open_time", val)}
                      />
                      <TimePicker
                        label="Close Time"
                        value={values.close_time}
                        onChange={(val) => setFieldValue("close_time", val)}
                      />
                    </List>
                  </>
                )}

                {/* ======================================================= */}
                {/* STEP 2 — Location Details                               */}
                {/* ======================================================= */}
                {currentStep === 2 && (
                  <>
                    <TipBanner
                      icon={locationOutline}
                      text="Pin your exact business location on the map or search by name. This helps customers find you accurately."
                      color="emerald"
                    />
                    <MapLocationPicker
                      coords={detectedCoords}
                      onLocationSelect={handleMapLocationSelect}
                      onDetectGPS={handleDetectLocation}
                      isDetecting={isDetectingLocation}
                      detectedLabel={detectedLocationLabel}
                    />

                    <SectionHeader
                      icon={locationOutline}
                      title="Address Details"
                      subtitle="Auto-filled from map pin — cannot be edited manually"
                    />
                    <List strongIos insetIos>
                      <FormikInput
                        name="address"
                        label="Full Address"
                        type="text"
                        placeholder="Auto-filled from map"
                        readonly
                      />
                      <FormikInput
                        name="city"
                        label="City"
                        type="text"
                        placeholder="Auto-filled from map"
                        readonly
                      />
                      <FormikInput
                        name="area"
                        label="Area / Locality"
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
                  </>
                )}

                {/* ======================================================= */}
                {/* STEP 3 — Categories & Branding                          */}
                {/* ======================================================= */}
                {currentStep === 3 && (
                  <>
                    <TipBanner
                      icon={layersOutline}
                      text="Select the categories your business falls under so customers can find you. You can also add photos to make your profile stand out."
                    />
                    <SectionHeader
                      icon={layersOutline}
                      title="Service Categories"
                      subtitle="What services do you offer?"
                    />
                    <CategorySelector
                      categories={categories}
                      selectedIds={selectedCategoryIds}
                      maxSelect={2}
                      onToggle={(id) =>
                        setSelectedCategoryIds((prev) =>
                          prev.includes(id)
                            ? prev.filter((x) => x !== id)
                            : prev.length >= 2
                              ? prev
                              : [...prev, id],
                        )
                      }
                    />

                    <SectionHeader
                      icon={imagesOutline}
                      title="Business Photos"
                      subtitle="Optional — upload a banner and profile photo"
                    />
                    <PhotoFileUpload
                      label="Banner Image"
                      icon={imageOutline}
                      file={bannerFile}
                      onChange={setBannerFile}
                      hint="Wide cover photo for your profile (JPEG, PNG, WebP)"
                    />
                    <PhotoFileUpload
                      label="Profile Photo"
                      icon={cameraOutline}
                      file={profileFile}
                      onChange={setProfileFile}
                      hint="Your logo or shop photo (JPEG, PNG, WebP)"
                    />
                  </>
                )}

                {/* ======================================================= */}
                {/* STEP 4 — Products & Services                            */}
                {/* ======================================================= */}
                {currentStep === 4 && (
                  <>
                    <TipBanner
                      icon={bagHandleOutline}
                      text="Add your products or services so customers can see what you offer. You can always add more later from your dashboard."
                      color="emerald"
                    />
                    <SectionHeader
                      icon={pricetagOutline}
                      title="Your Products / Services"
                      subtitle="List what you offer with prices"
                    />
                    <div className="px-4 space-y-3 pb-2">
                      {productItems.map((item, idx) => (
                        <ProductFormCard
                          key={idx}
                          product={item}
                          index={idx}
                          onUpdate={(p) => {
                            const next = [...productItems];
                            next[idx] = p;
                            setProductItems(next);
                          }}
                          onRemove={() => {
                            if (productItems.length <= 1) {
                              setProductItems([emptyProduct()]);
                            } else {
                              setProductItems(productItems.filter((_, i) => i !== idx));
                            }
                          }}
                        />
                      ))}

                      {productItems.length < 20 && (
                        <button
                          type="button"
                          onClick={() => setProductItems([...productItems, emptyProduct()])}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 hover:border-indigo-400 transition-all active:scale-[0.99]"
                        >
                          <IonIcon icon={addCircleOutline} className="text-indigo-500 text-lg" />
                          <span className="text-xs font-bold text-indigo-600">Add Another Product</span>
                        </button>
                      )}
                    </div>
                    <div className="mx-4 mt-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-medium">
                        This step is optional — you can add products later from your provider dashboard.
                      </p>
                    </div>
                  </>
                )}

                {/* ======================================================= */}
                {/* STEP 5 — Verification (optional)                        */}
                {/* ======================================================= */}
                {currentStep === 5 && (
                  <>
                    <TipBanner
                      icon={shieldCheckmarkOutline}
                      text="Upload a government-issued identity document for verification. This builds customer trust and improves your search ranking."
                      color="amber"
                    />
                    <div className="mx-4 mb-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-[10px] text-amber-600 font-medium">
                        This step is optional — you can always verify later
                        from your dashboard.
                      </p>
                    </div>

                    <SectionHeader
                      icon={imageOutline}
                      title="Identity Verification"
                      subtitle="Upload any one of the accepted documents"
                    />
                    <DocumentTypeSelector
                      selected={docType}
                      onChange={(id) => {
                        setDocType(id);
                        if (values.identity_doc)
                          setFieldValue("identity_doc", null);
                      }}
                    />
                    <DocFilePicker
                      file={values.identity_doc}
                      error={errors.identity_doc as string}
                      touched={touched.identity_doc as boolean}
                      docType={docType}
                      onChange={(file) =>
                        setFieldValue("identity_doc", file)
                      }
                    />
                    <DocumentGuidelines />
                    <WhatHappensNext />
                  </>
                )}

                {/* Error banner */}
                {submitError && (
                  <Block>
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-2xl p-3 mt-2">
                      <IonIcon
                        icon={alertCircleOutline}
                        className="text-red-500 text-lg shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-red-600 font-medium leading-relaxed">
                        {submitError}
                      </p>
                    </div>
                  </Block>
                )}
              </div>

              {/* Bottom action bar */}
              <div className="fixed bottom-0 left-0 w-full z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-700 px-4 pt-3 pb-6">
                <p className="text-[10px] text-center text-slate-400 font-medium tracking-wide uppercase mb-3">
                  Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
                </p>
                <div className="flex gap-3">
                  {/* Back / Exit */}
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-1.5 h-12 px-5 rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm disabled:opacity-40 transition-all active:scale-[0.97]"
                  >
                    <IonIcon icon={arrowBack} className="text-base shrink-0" />
                    {currentStep === 1 ? "Exit" : "Back"}
                  </button>

                  {/* Continue / Submit */}
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => handleNext(validateForm, setTouched)}
                      disabled={!canAdvance[currentStep] || isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97] shadow-md shadow-amber-200"
                    >
                      {(["Set Location", "Choose Categories", "Add Products", "Verify Identity"] as const)[currentStep - 1]}
                      <IonIcon icon={arrowForwardOutline} className="text-base shrink-0" />
                    </button>
                  ) : isStep5HasDoc ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-violet-600 text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97] shadow-md shadow-violet-200"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={checkmarkCircle} className="text-base shrink-0" />
                          Submit Application
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        pendingSubmitRef.current = submitForm;
                        setShowSkipConfirm(true);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 h-12 rounded-2xl bg-violet-600 text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-[0.97] shadow-md shadow-violet-200"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={arrowForwardOutline} className="text-base shrink-0" />
                          Skip &amp; Submit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </Form>
          );
        }}
      </Formik>

      {/* Skip Verification Confirmation */}
      <AppDialog
        open={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        icon={informationCircleOutline}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        title="Skip Verification?"
        description="You can always verify later from your dashboard, but verified providers get better visibility and trust from customers."
        confirmLabel="Skip for Now"
        cancelLabel="Add Verification"
        onConfirm={() => {
          setShowSkipConfirm(false);
          pendingSubmitRef.current?.();
          pendingSubmitRef.current = null;
        }}
        confirmColor="gray"
      />
    </Page>
  );
};

export default function ProviderOnboardingExport() {
  return (
    <PrivateRoute
      title="Become a Provider"
      description="Sign in to register your business and start reaching customers on Tijarah Connect."
    >
      <FeatureGate flag="provider_onboarding_enabled">
        <ProviderOnboardingPage />
      </FeatureGate>
    </PrivateRoute>
  );
}
