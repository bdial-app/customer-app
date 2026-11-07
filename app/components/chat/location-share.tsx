"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  location as locationPin,
  navigateOutline,
  locateOutline,
  storefrontOutline,
  bookmarkOutline,
  searchOutline,
  copyOutline,
  mapOutline,
  closeCircle,
  chevronForward,
} from "ionicons/icons";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { Sheet } from "@/app/components/ui/sheet";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMaps";
import { useReverseGeocode, useSearchGeocode } from "@/hooks/useGeocode";
import { useSavedLocations } from "@/hooks/useSavedLocation";
import { useAppSelector } from "@/hooks/useAppStore";
import { useNotification } from "@/app/context/NotificationContext";
import { reverseGeocode } from "@/services/geocode.service";
import { requestLocationOrPrompt, LOCATION_PERMISSION_DENIED } from "@/utils/geolocation";
import { openDirections, openMapAt, mapsLinkFor } from "@/utils/sharing";
import { copyToClipboard } from "@/utils/clipboard";
import { triggerHaptic } from "@/utils/haptics";
import type { SharedLocation } from "@/services/chat.service";

const INDIA = { lat: 20.5937, lng: 78.9629 };
const MAP_STYLE = { width: "100%", height: "100%" };
const MAP_OPTIONS: google.maps.MapOptions = { disableDefaultUI: true, clickableIcons: false, gestureHandling: "greedy" };

const locationText = (loc: SharedLocation) =>
  [loc.label, loc.address && loc.address !== loc.label ? loc.address : null, mapsLinkFor(loc.lat, loc.lng)].filter(Boolean).join("\n");

const errorCode = (err: unknown) => (typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "");

// ── In the chat ──────────────────────────────────────────

/** A shared location in a bubble: a drawn map with the pin, the place and its address. Tap to open the map. */
export function LocationCard({ loc, sent, onOpen }: { loc: SharedLocation; sent: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-[240px] max-w-full text-left rounded-xl overflow-hidden -mx-0.5 mb-1 block ${sent ? "bg-white/10" : "bg-slate-50 dark:bg-slate-700/60"}`}
      aria-label={`Location: ${loc.label || loc.address || "shared location"}. Open the map`}
    >
      <span
        className="relative block h-[104px] overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(135deg, #e0f2fe 0%, #ecfccb 55%, #fef3c7 100%)",
        }}
      >
        {/* A couple of roads */}
        <span className="absolute left-[-10%] top-[58%] w-[120%] h-[9px] bg-white/90 rotate-[-8deg] shadow-sm" />
        <span className="absolute left-[38%] top-[-10%] w-[8px] h-[130%] bg-white/80 rotate-[14deg] shadow-sm" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%] flex flex-col items-center">
          <IonIcon icon={locationPin} className="text-[34px] text-rose-500 drop-shadow-md" />
          <span className="w-3 h-1 rounded-full bg-black/20 -mt-1 blur-[1px]" />
        </span>
      </span>
      <span className="block px-2.5 py-2">
        <span className={`block text-[13.5px] font-bold leading-snug line-clamp-1 ${sent ? "text-white" : "text-slate-900 dark:text-white"}`}>
          {loc.label || "Shared location"}
        </span>
        {loc.address && loc.address !== loc.label && (
          <span className={`block text-[11.5px] leading-snug line-clamp-2 mt-0.5 ${sent ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}>{loc.address}</span>
        )}
        <span className={`mt-1.5 inline-flex items-center text-[11.5px] font-bold ${sent ? "text-white/85" : "text-indigo-600 dark:text-indigo-300"}`}>
          View on map <IonIcon icon={chevronForward} className="text-[12px]" />
        </span>
      </span>
    </button>
  );
}

/** The shared location on a real map, with directions, the maps app, and copy. */
export function LocationViewerSheet({ loc, onClose }: { loc: SharedLocation | null; onClose: () => void }) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const { notify } = useNotification();
  const center = useMemo(() => (loc ? { lat: loc.lat, lng: loc.lng } : INDIA), [loc]);

  const copy = async () => {
    if (!loc) return;
    const ok = await copyToClipboard(locationText(loc));
    notify(ok ? { title: "Location copied", variant: "success" } : { title: "Couldn’t copy", subtitle: "Please try again.", variant: "error" });
  };

  return (
    <Sheet open={!!loc} onClose={onClose} label="Shared location" className="bg-white dark:bg-slate-900" maxHeight="90dvh">
      {loc && (
        <div className="pb-2">
          <div className="relative h-[46dvh] min-h-[260px] bg-slate-100 dark:bg-slate-800" data-sheet-no-drag>
            {loadError ? (
              <div className="h-full flex flex-col items-center justify-center gap-1 text-center px-6">
                <IonIcon icon={mapOutline} className="text-3xl text-slate-400" />
                <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">The map couldn’t load</p>
                <p className="text-[12px] text-slate-400">You can still open it in your maps app.</p>
              </div>
            ) : isLoaded ? (
              <GoogleMap mapContainerStyle={MAP_STYLE} center={center} zoom={16} options={MAP_OPTIONS}>
                <MarkerF position={center} />
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            )}
          </div>
          <div className="px-4 pt-4">
            <p className="text-[16px] font-bold text-slate-900 dark:text-white">{loc.label || "Shared location"}</p>
            {loc.address && loc.address !== loc.label && <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{loc.address}</p>}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button onClick={() => openDirections(loc.lat, loc.lng, loc.label ?? undefined)} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-violet-600 text-white text-[12px] font-semibold active:scale-[0.97] transition-transform">
                <IonIcon icon={navigateOutline} className="text-[20px]" /> Directions
              </button>
              <button onClick={() => openMapAt(loc.lat, loc.lng, loc.label)} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[12px] font-semibold active:scale-[0.97] transition-transform">
                <IonIcon icon={mapOutline} className="text-[20px]" /> Open in Maps
              </button>
              <button onClick={copy} className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[12px] font-semibold active:scale-[0.97] transition-transform">
                <IonIcon icon={copyOutline} className="text-[20px]" /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ── Choosing what to share ───────────────────────────────

type Point = { lat: number; lng: number };
const near = (a: Point, b: Point) => Math.abs(a.lat - b.lat) < 0.00015 && Math.abs(a.lng - b.lng) < 0.00015;

function Option({ icon, tint, title, subtitle, busy, onClick }: { icon: string; tint: string; title: string; subtitle?: string | null; busy?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-800 disabled:opacity-70">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tint}`}>
        {busy ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <IonIcon icon={icon} className="text-[19px] text-white" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-slate-900 dark:text-white">{title}</span>
        {subtitle && <span className="block text-[12px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>}
      </span>
    </button>
  );
}

/**
 * Share a location: where you are now, your business, a saved address, a
 * searched place, or anywhere you drop the pin on the map. Mount it when it
 * opens, so each opening starts from where the person is.
 */
export function ShareLocationSheet({ open, onClose, onSend, business }: {
  open: boolean;
  onClose: () => void;
  onSend: (loc: SharedLocation) => Promise<void> | void;
  /** The owner's own business, when they have its location. */
  business?: SharedLocation | null;
}) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const user = useAppSelector((s) => s.auth.user);
  const guestCoords = useAppSelector((s) => s.location.guestCoords);
  const { data: saved } = useSavedLocations();
  const mapRef = useRef<google.maps.Map | null>(null);

  // Where the map starts: the person's own area, else their business, else India.
  // Fixed for this opening (the sheet mounts fresh each time); panning moves the map, not this.
  const [start] = useState<{ point: Point; zoom: number }>(() => {
    const lat = Number(user?.latitude ?? guestCoords?.lat);
    const lng = Number(user?.longitude ?? guestCoords?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) return { point: { lat, lng }, zoom: 16 };
    if (business) return { point: { lat: business.lat, lng: business.lng }, zoom: 16 };
    return { point: INDIA, zoom: 5 };
  });

  const [pin, setPin] = useState<Point>(start.point);
  const [picked, setPicked] = useState<{ point: Point; label: string; address: string } | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState<"current" | "pin" | "option" | null>(null);
  const [error, setError] = useState("");
  const moved = !near(pin, start.point) || start.zoom > 5;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);
  const { data: results, isFetching: searching } = useSearchGeocode(debounced);

  // Name the pin once the map stops moving (a searched place keeps its own name).
  const rounded = useMemo(() => ({ lat: Number(pin.lat.toFixed(5)), lng: Number(pin.lng.toFixed(5)) }), [pin]);
  const pinFromSearch = picked && near(picked.point, pin) ? picked : null;
  const { data: place, isFetching: naming } = useReverseGeocode(open && moved && !pinFromSearch ? rounded : null);
  const pinLabel = pinFromSearch?.label ?? place?.label ?? null;
  const pinAddress = pinFromSearch?.address ?? place?.fullAddress ?? null;

  const reset = () => {
    setQuery("");
    setPicked(null);
    setError("");
    setBusy(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const send = async (loc: SharedLocation, kind: "current" | "pin" | "option") => {
    setBusy(kind);
    setError("");
    try {
      await onSend(loc);
      triggerHaptic("success");
      close();
    } catch {
      setError("Couldn’t send the location. Please try again.");
      setBusy(null);
    }
  };

  const locate = async () => {
    const pos = await requestLocationOrPrompt("Sharing your location", { timeout: 10000, enableHighAccuracy: true });
    return { lat: pos.latitude, lng: pos.longitude, accuracy: pos.accuracy };
  };

  const sendCurrent = async () => {
    setBusy("current");
    setError("");
    try {
      const here = await locate();
      const named = await reverseGeocode({ lat: here.lat, lng: here.lng }).catch(() => null);
      await send({ lat: here.lat, lng: here.lng, label: named?.label ?? "My location", address: named?.fullAddress ?? null, source: "current" }, "current");
    } catch (err) {
      setBusy(null);
      if (errorCode(err) !== LOCATION_PERMISSION_DENIED) setError("Couldn’t find where you are. Check that location is on, or drop the pin on the map.");
    }
  };

  const centreOnMe = async () => {
    try {
      const here = await locate();
      mapRef.current?.panTo(here);
      mapRef.current?.setZoom(17);
    } catch (err) {
      if (errorCode(err) !== LOCATION_PERMISSION_DENIED) setError("Couldn’t find where you are right now.");
    }
  };

  const pickResult = (r: { lat: number; lng: number; mainText: string; secondaryText: string; description: string }) => {
    const point = { lat: r.lat, lng: r.lng };
    setPicked({ point, label: r.mainText || r.description, address: r.secondaryText || r.description });
    setPin(point);
    setQuery("");
    mapRef.current?.panTo(point);
    mapRef.current?.setZoom(17);
  };

  const showResults = debounced.length >= 3;
  const savedPlaces = (saved ?? []).filter((s) => Number.isFinite(Number(s.latitude)) && Number.isFinite(Number(s.longitude))).slice(0, 3);

  return (
    <Sheet open={open} onClose={close} label="Share a location" className="bg-white dark:bg-slate-900" maxHeight="94dvh" minHeight="70dvh" safeArea={false}>
      <div className="flex flex-col">
        <div className="px-4 pt-1 pb-3">
          <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Share a location</h2>
          <div className="mt-3 flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800">
            <IonIcon icon={searchOutline} className="text-slate-400 text-[16px]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a place or address" className="flex-1 bg-transparent outline-none text-[14px] text-slate-800 dark:text-white placeholder:text-slate-400" />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search"><IonIcon icon={closeCircle} className="text-slate-400 text-[17px]" /></button>}
          </div>
        </div>

        {showResults ? (
          <div className="max-h-[50dvh] overflow-y-auto pb-4">
            {searching && !results ? (
              <p className="px-4 py-6 text-center text-[13px] text-slate-400">Searching…</p>
            ) : !results?.length ? (
              <p className="px-4 py-6 text-center text-[13px] text-slate-400">No places found for “{debounced}”.</p>
            ) : (
              results.map((r) => (
                <button key={r.placeId} onClick={() => pickResult(r)} className="w-full flex items-start gap-3 px-4 py-2.5 text-left active:bg-slate-50 dark:active:bg-slate-800">
                  <IonIcon icon={locationPin} className="text-[18px] text-rose-500 mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-slate-900 dark:text-white truncate">{r.mainText}</span>
                    <span className="block text-[12px] text-slate-500 dark:text-slate-400 truncate">{r.secondaryText}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Quick picks */}
            <div className="border-y border-slate-100 dark:border-slate-800">
              <Option icon={locateOutline} tint="bg-violet-600" title="Send your current location" subtitle="Uses your phone’s location, just this once" busy={busy === "current"} onClick={sendCurrent} />
              {business && (
                <Option icon={storefrontOutline} tint="bg-amber-500" title="Send your business location" subtitle={business.address || business.label} busy={busy === "option"} onClick={() => send({ ...business, source: "business" }, "option")} />
              )}
              {savedPlaces.map((s) => (
                <Option
                  key={s.id}
                  icon={bookmarkOutline}
                  tint="bg-sky-500"
                  title={s.title || s.label || "Saved address"}
                  subtitle={s.fullAddress || s.label}
                  onClick={() => send({ lat: Number(s.latitude), lng: Number(s.longitude), label: s.title || s.label, address: s.fullAddress || s.label, source: "saved" }, "option")}
                />
              ))}
            </div>

            {/* Or anywhere on the map */}
            <p className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Or drop the pin</p>
            <div className="relative mx-4 h-[34dvh] min-h-[220px] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800" data-sheet-no-drag>
              {loadError ? (
                <div className="h-full flex items-center justify-center text-[13px] text-slate-400 px-6 text-center">The map couldn’t load. Search for a place instead.</div>
              ) : isLoaded ? (
                <GoogleMap
                  mapContainerStyle={MAP_STYLE}
                  center={start.point}
                  zoom={start.zoom}
                  options={MAP_OPTIONS}
                  onLoad={(m) => { mapRef.current = m; }}
                  onUnmount={() => { mapRef.current = null; }}
                  onIdle={() => {
                    const c = mapRef.current?.getCenter();
                    if (c) setPin({ lat: c.lat(), lng: c.lng() });
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
              )}
              {/* The pin stays in the middle; the map moves under it. */}
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <IonIcon icon={locationPin} className="text-[38px] text-rose-500 drop-shadow-lg" />
              </span>
              <button onClick={centreOnMe} aria-label="Go to my location" className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                <IonIcon icon={locateOutline} className="text-[19px] text-violet-600" />
              </button>
            </div>
            <div className="px-4 pt-3 min-h-[44px]">
              {moved ? (
                <>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{naming && !pinLabel ? "Finding the address…" : pinLabel || "Dropped pin"}</p>
                  {pinAddress && pinAddress !== pinLabel && <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2">{pinAddress}</p>}
                </>
              ) : (
                <p className="text-[13px] text-slate-500 dark:text-slate-400">Move the map to put the pin on the spot, or search above.</p>
              )}
            </div>
          </>
        )}

        {error && <p className="px-4 pt-2 text-[12.5px] text-rose-600 dark:text-rose-400">{error}</p>}

        {!showResults && (
          <div className="px-4 pt-3" style={{ paddingBottom: "max(var(--sab, env(safe-area-inset-bottom)), 14px)" }}>
            <button
              onClick={() => send({ lat: pin.lat, lng: pin.lng, label: pinLabel ?? "Dropped pin", address: pinAddress, source: "pinned" }, "pin")}
              disabled={!moved || busy !== null || (naming && !pinLabel)}
              className="w-full h-12 rounded-2xl bg-violet-600 text-white text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {busy === "pin" ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <IonIcon icon={locationPin} className="text-[17px]" />}
              Send this location
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
