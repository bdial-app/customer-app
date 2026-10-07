"use client";
/**
 * The editors behind the Details tab. Every form sheet edits a slice of the
 * one shared Formik form owned by ProviderDetailsTab, so validation and the
 * saved payload are exactly the same whichever sheet the owner saves from.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  alertCircleOutline,
  cameraOutline,
  checkmarkCircle,
  checkmarkOutline,
  closeCircle,
  globeOutline,
  imageOutline,
  locationOutline,
  logoFacebook,
  logoInstagram,
  logoYoutube,
  mapOutline,
  navigateOutline,
  searchOutline,
  shieldCheckmark,
  timeOutline,
  trashOutline,
} from "ionicons/icons";
import type { FormikProps } from "formik";
import { GoogleMap, Marker } from "@react-google-maps/api";
import WhatsAppPhoneInput from "../../whatsapp-phone-input";
import LinkedInInput from "../../linkedin-input";
import { PhoneOtpVerifier } from "../phone-otp-verifier";
import { FieldBlock, ManageSheet, PrimaryButton, SecondaryButton, inputCls, textareaCls } from "./kit";
import { formatTime } from "./details-parts";

export interface DetailsFormValues {
  brandName: string;
  description: string;
  address: string;
  city: string;
  area: string;
  pincode: string;
  openTime: string;
  closeTime: string;
  websiteUrl: string;
  instagramHandle: string;
  facebookHandle: string;
  youtubeHandle: string;
  whatsappNumber: string;
  linkedinHandle: string;
}

type Formik = FormikProps<DetailsFormValues>;
type Field = keyof DetailsFormValues;

const SECTION_OF: Record<Field, string> = {
  brandName: "Name & description",
  description: "Name & description",
  address: "Location",
  city: "Location",
  area: "Location",
  pincode: "Location",
  openTime: "Opening hours",
  closeTime: "Opening hours",
  websiteUrl: "Online links",
  instagramHandle: "Online links",
  facebookHandle: "Online links",
  youtubeHandle: "Online links",
  whatsappNumber: "Online links",
  linkedinHandle: "Online links",
};

/** Sheet footer: problems that block saving, then the one Save button. */
function SaveFooter({ formik, fields, saveError }: { formik: Formik; fields: Field[]; saveError: boolean }) {
  const { isValid, dirty, isSubmitting, errors, submitForm } = formik;
  const elsewhere = (Object.keys(errors) as Field[]).filter((k) => !fields.includes(k));
  return (
    <div className="flex flex-col gap-2">
      {elsewhere.length > 0 && (
        <p className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400 leading-snug">
          <IonIcon icon={alertCircleOutline} className="text-[15px] shrink-0 mt-px" />
          <span>
            Can’t save yet: {elsewhere.map((k) => `${errors[k]} (${SECTION_OF[k]})`).join(" · ")}
          </span>
        </p>
      )}
      {saveError && !isSubmitting && (
        <p className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400 leading-snug">
          <IonIcon icon={alertCircleOutline} className="text-[15px] shrink-0 mt-px" />
          Couldn’t save. Check your internet and try again.
        </p>
      )}
      <PrimaryButton full icon={checkmarkOutline} loading={isSubmitting} disabled={!isValid || !dirty} onClick={() => void submitForm()}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </PrimaryButton>
    </div>
  );
}

const Counter = ({ n, max }: { n: number; max: number }) => (
  <span className={`tabular-nums ${n > max ? "text-rose-500" : ""}`}>
    {n}/{max}
  </span>
);

// ─── Name & description ─────────────────────────────────────────────────

export function BasicsSheet({ open, onClose, formik, saveError }: { open: boolean; onClose: () => void; formik: Formik; saveError: boolean }) {
  const { values, errors, touched, setFieldValue, setFieldTouched } = formik;
  return (
    <ManageSheet
      open={open}
      onClose={onClose}
      title="Name & description"
      subtitle="The first thing customers read about you"
      footer={<SaveFooter formik={formik} fields={["brandName", "description"]} saveError={saveError} />}
    >
      <div className="flex flex-col gap-5">
        <FieldBlock
          label="Business name"
          error={touched.brandName && errors.brandName ? errors.brandName : undefined}
          hint="Use the name on your shop board, so customers recognise you."
        >
          <input
            type="text"
            value={values.brandName}
            onChange={(e) => setFieldValue("brandName", e.target.value)}
            onBlur={() => setFieldTouched("brandName", true)}
            placeholder="e.g. Fatema's Kitchen, Husain Motors"
            className={inputCls}
          />
        </FieldBlock>
        <FieldBlock
          label="About your business"
          optional
          error={touched.description && errors.description ? errors.description : undefined}
          hint={
            <span className="flex justify-between gap-3">
              <span>What you sell, since when, and why customers love you.</span>
              <Counter n={values.description.length} max={2000} />
            </span>
          }
        >
          <textarea
            value={values.description}
            onChange={(e) => setFieldValue("description", e.target.value)}
            onBlur={() => setFieldTouched("description", true)}
            placeholder="e.g. Family-run sweet shop since 1998. Fresh mithai daily, party orders and home delivery in Pune."
            rows={6}
            className={textareaCls}
          />
        </FieldBlock>
      </div>
    </ManageSheet>
  );
}

// ─── Opening hours ──────────────────────────────────────────────────────

const PRESETS: { open: string; close: string }[] = [
  { open: "09:00", close: "18:00" },
  { open: "10:00", close: "20:00" },
  { open: "10:00", close: "21:00" },
  { open: "11:00", close: "22:00" },
];

export function HoursSheet({ open, onClose, formik, saveError }: { open: boolean; onClose: () => void; formik: Formik; saveError: boolean }) {
  const { values, setFieldValue } = formik;
  const overlap = !!values.openTime && !!values.closeTime && values.closeTime <= values.openTime;
  const timeCls = `${inputCls} text-[16px] font-semibold tabular-nums [color-scheme:light] dark:[color-scheme:dark]`;
  return (
    <ManageSheet
      open={open}
      onClose={onClose}
      title="Opening hours"
      subtitle="So customers know when to call or visit"
      footer={<SaveFooter formik={formik} fields={["openTime", "closeTime"]} saveError={saveError} />}
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 mb-2">Quick pick</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const on = values.openTime === p.open && values.closeTime === p.close;
              return (
                <motion.button
                  key={p.open + p.close}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => {
                    setFieldValue("openTime", p.open);
                    setFieldValue("closeTime", p.close);
                  }}
                  className={`h-12 rounded-xl text-[13.5px] font-bold transition-colors ${
                    on
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700"
                  }`}
                >
                  {formatTime(p.open)?.replace(":00", "")} – {formatTime(p.close)?.replace(":00", "")}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200 mb-2">Or set your own</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Opens at</span>
              <input type="time" value={values.openTime} onChange={(e) => setFieldValue("openTime", e.target.value)} className={timeCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Closes at</span>
              <input type="time" value={values.closeTime} onChange={(e) => setFieldValue("closeTime", e.target.value)} className={timeCls} />
            </label>
          </div>
        </div>

        {overlap ? (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/30">
            <IonIcon icon={alertCircleOutline} className="text-rose-500 text-[18px] shrink-0" />
            <p className="text-[13px] text-rose-700 dark:text-rose-300 font-medium leading-snug">
              Closing time must be after opening time.
            </p>
          </div>
        ) : values.openTime && values.closeTime ? (
          <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10">
            <IonIcon icon={timeOutline} className="text-indigo-600 dark:text-indigo-300 text-[18px] shrink-0" />
            <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-snug">
              Customers will see <b className="font-bold">{formatTime(values.openTime)} – {formatTime(values.closeTime)}</b>
            </p>
          </div>
        ) : null}
      </div>
    </ManageSheet>
  );
}

// ─── Location ───────────────────────────────────────────────────────────

export type PlaceResult = { placeId: string; description: string; mainText: string; secondaryText: string; lat: number; lng: number };

export function LocationSheet({
  open,
  onClose,
  formik,
  saveError,
  mapsLoaded,
  mapCenter,
  mapCoords,
  onMapLoad,
  onMapSelect,
  searchQuery,
  onSearch,
  isSearching,
  searchResults,
  onPickResult,
  isDetecting,
  onDetect,
}: {
  open: boolean;
  onClose: () => void;
  formik: Formik;
  saveError: boolean;
  mapsLoaded: boolean;
  mapCenter: { lat: number; lng: number };
  mapCoords: { lat: number; lng: number } | null;
  onMapLoad: (m: google.maps.Map) => void;
  onMapSelect: (lat: number, lng: number) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  isSearching: boolean;
  searchResults: PlaceResult[];
  onPickResult: (r: PlaceResult) => void;
  isDetecting: boolean;
  onDetect: () => void;
}) {
  const { values, errors } = formik;
  const rows: { label: string; value: string; error?: string }[] = [
    { label: "Address", value: values.address, error: errors.address },
    { label: "Area", value: values.area, error: errors.area },
    { label: "City", value: values.city, error: errors.city },
    { label: "Pincode", value: values.pincode, error: errors.pincode },
  ];
  return (
    <ManageSheet
      open={open}
      onClose={onClose}
      title="Shop location"
      subtitle="Pin your exact spot so customers get directions"
      footer={<SaveFooter formik={formik} fields={["address", "city", "area", "pincode"]} saveError={saveError} />}
    >
      <div className="flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onDetect}
          disabled={isDetecting}
          className="w-full flex items-center gap-3 h-14 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-200 dark:ring-indigo-500/30 text-left disabled:opacity-60"
        >
          <span className={`w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 ${isDetecting ? "animate-pulse" : ""}`}>
            <IonIcon icon={navigateOutline} className="text-white text-[17px]" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-bold text-indigo-700 dark:text-indigo-200">
              {isDetecting ? "Finding you…" : "I’m at my shop right now"}
            </span>
            <span className="block text-[12px] text-indigo-600/70 dark:text-indigo-300/70">Use my phone’s current location</span>
          </span>
        </motion.button>

        <div className="flex items-center gap-3 my-1">
          <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500">or search</span>
          <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="relative">
          <IonIcon icon={searchOutline} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[17px] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search your shop or street name"
            className={`${inputCls} pl-10 pr-10`}
          />
          {isSearching && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          )}
        </div>
        {searchResults.length > 0 && (
          <div className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/70 overflow-hidden">
            {searchResults.map((r) => (
              <button
                key={r.placeId}
                type="button"
                onClick={() => onPickResult(r)}
                className="w-full flex items-start gap-2.5 px-3.5 py-3 min-h-[52px] text-left active:bg-indigo-50 dark:active:bg-indigo-500/10"
              >
                <IonIcon icon={locationOutline} className="text-[16px] text-indigo-500 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-slate-800 dark:text-white truncate">{r.mainText}</span>
                  {r.secondaryText && <span className="block text-[12px] text-slate-500 dark:text-slate-400 truncate">{r.secondaryText}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
          {mapsLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "220px" }}
              center={mapCenter}
              zoom={mapCoords ? 16 : 12}
              onClick={(e) => {
                if (!e.latLng) return;
                onMapSelect(e.latLng.lat(), e.latLng.lng());
              }}
              onLoad={onMapLoad}
              options={{ disableDefaultUI: true, zoomControl: true, mapTypeControl: false, streetViewControl: false, fullscreenControl: false }}
            >
              {mapCoords && (
                <Marker
                  position={mapCoords}
                  draggable
                  onDragEnd={(e) => {
                    if (!e.latLng) return;
                    onMapSelect(e.latLng.lat(), e.latLng.lng());
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="h-[220px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200/70 dark:border-slate-700">
            <IonIcon
              icon={mapCoords ? checkmarkCircle : mapOutline}
              className={`text-[16px] shrink-0 ${mapCoords ? "text-emerald-500" : "text-slate-400"}`}
            />
            <p className="text-[12.5px] text-slate-600 dark:text-slate-300 leading-snug">
              {mapCoords ? "Pin placed. Drag it or tap the map to adjust." : "Tap the map to drop a pin on your shop."}
            </p>
          </div>
        </div>

        <div className="mt-2">
          <p className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">Address customers will see</p>
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mb-2">Filled in automatically from your pin.</p>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 ring-1 ring-slate-200/70 dark:ring-slate-700 divide-y divide-slate-200/70 dark:divide-slate-700">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-3 px-3.5 py-2.5">
                <span className="w-[62px] shrink-0 text-[12px] font-semibold text-slate-500 dark:text-slate-400 pt-px">{r.label}</span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[13.5px] leading-snug break-words ${r.value ? "text-slate-900 dark:text-white font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                    {r.value || "Will fill in from the pin"}
                  </span>
                  {r.error && <span className="block text-[11.5px] font-medium text-rose-500 mt-0.5">{r.error}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ManageSheet>
  );
}

// ─── Online links ───────────────────────────────────────────────────────

function PrefixInput({
  icon,
  tile,
  prefix,
  value,
  onChange,
  onClear,
  placeholder,
}: {
  icon: string;
  tile: string;
  prefix: string;
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center h-12 rounded-xl bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow overflow-hidden">
      <span className={`ml-2 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[17px] ${tile}`}>
        <IonIcon icon={icon} />
      </span>
      <span className="pl-2 text-[13px] text-slate-400 dark:text-slate-500 shrink-0 select-none">{prefix}</span>
      <input
        type="text"
        autoCapitalize="none"
        autoCorrect="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-full bg-transparent pr-1 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
      />
      {value && (
        <button type="button" aria-label="Clear" onClick={onClear} className="w-11 h-12 flex items-center justify-center shrink-0">
          <IonIcon icon={closeCircle} className="text-[19px] text-slate-300 dark:text-slate-600" />
        </button>
      )}
    </div>
  );
}

/** Restyles the shared WhatsApp / LinkedIn inputs to sit in a FieldBlock. */
const legacyInputWrap =
  "[&>div]:!px-0 [&>div]:!mb-0 [&>div>label]:hidden [&>div>div:first-of-type]:!bg-slate-50 dark:[&>div>div:first-of-type]:!bg-slate-800 [&>div>div:first-of-type]:!rounded-xl [&_p]:!text-[11.5px] [&_p]:!ml-0 [&_input]:!text-[14px]";

export function LinksSheet({ open, onClose, formik, saveError }: { open: boolean; onClose: () => void; formik: Formik; saveError: boolean }) {
  const { values, errors, touched, setFieldValue } = formik;
  const err = (k: Field) => (values[k] && errors[k] ? errors[k] : undefined);
  return (
    <ManageSheet
      open={open}
      onClose={onClose}
      title="Online links"
      subtitle="All optional. Add the ones you use."
      footer={
        <SaveFooter
          formik={formik}
          fields={["websiteUrl", "instagramHandle", "facebookHandle", "youtubeHandle", "whatsappNumber", "linkedinHandle"]}
          saveError={saveError}
        />
      }
    >
      <div className="flex flex-col gap-5">
        <FieldBlock label="WhatsApp">
          <div className={legacyInputWrap}>
            <WhatsAppPhoneInput
              value={values.whatsappNumber}
              onChange={(val) => setFieldValue("whatsappNumber", val)}
              error={errors.whatsappNumber as string | undefined}
              touched={touched.whatsappNumber as boolean}
            />
          </div>
        </FieldBlock>
        <FieldBlock label="Instagram" error={err("instagramHandle")} hint="Just your username, without the @.">
          <PrefixInput
            icon={logoInstagram}
            tile="bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300"
            prefix="instagram.com/"
            value={values.instagramHandle.replace(/^@/, "")}
            onChange={(v) => setFieldValue("instagramHandle", v.replace(/^@/, ""))}
            onClear={() => setFieldValue("instagramHandle", "")}
            placeholder="yourbusiness"
          />
        </FieldBlock>
        <FieldBlock label="Website" error={err("websiteUrl")}>
          <PrefixInput
            icon={globeOutline}
            tile="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
            prefix="https://"
            value={values.websiteUrl.replace(/^https?:\/\//i, "")}
            onChange={(v) => {
              const raw = v.replace(/^https?:\/\//i, "");
              setFieldValue("websiteUrl", raw ? `https://${raw}` : "");
            }}
            onClear={() => setFieldValue("websiteUrl", "")}
            placeholder="www.mybusiness.com"
          />
        </FieldBlock>
        <FieldBlock label="Facebook" error={err("facebookHandle")}>
          <PrefixInput
            icon={logoFacebook}
            tile="bg-blue-50 text-[#1877F2] dark:bg-blue-500/15 dark:text-blue-300"
            prefix="facebook.com/"
            value={values.facebookHandle.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, "")}
            onChange={(v) => setFieldValue("facebookHandle", v.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, ""))}
            onClear={() => setFieldValue("facebookHandle", "")}
            placeholder="yourbusiness"
          />
        </FieldBlock>
        <FieldBlock label="YouTube" error={err("youtubeHandle")}>
          <PrefixInput
            icon={logoYoutube}
            tile="bg-red-50 text-[#FF0000] dark:bg-red-500/15 dark:text-red-400"
            prefix="youtube.com/"
            value={values.youtubeHandle.replace(/^(https?:\/\/)?(www\.)?youtube\.com\//i, "")}
            onChange={(v) => setFieldValue("youtubeHandle", v.replace(/^(https?:\/\/)?(www\.)?youtube\.com\//i, ""))}
            onClear={() => setFieldValue("youtubeHandle", "")}
            placeholder="@yourbusiness"
          />
        </FieldBlock>
        <FieldBlock label="LinkedIn">
          <div className={legacyInputWrap}>
            <LinkedInInput
              value={values.linkedinHandle}
              onChange={(val) => setFieldValue("linkedinHandle", val)}
              error={errors.linkedinHandle as string | undefined}
              touched={touched.linkedinHandle as boolean}
            />
          </div>
        </FieldBlock>
      </div>
    </ManageSheet>
  );
}

// ─── Contact number ─────────────────────────────────────────────────────

export function PhoneSheet({
  open,
  onClose,
  currentNumber,
  changing,
  onStartChange,
  onCancelChange,
  newNumber,
  onNewNumber,
  onVerified,
  verifying,
}: {
  open: boolean;
  onClose: () => void;
  currentNumber: string | null;
  changing: boolean;
  onStartChange: () => void;
  onCancelChange: () => void;
  newNumber: string;
  onNewNumber: (v: string) => void;
  onVerified: (otp: string) => void;
  verifying: boolean;
}) {
  const differs =
    newNumber.replace(/\D/g, "").slice(-10) !== (currentNumber || "").replace(/\D/g, "").slice(-10) &&
    newNumber.replace(/\D/g, "").length >= 10;
  return (
    <ManageSheet open={open} onClose={onClose} title="Contact number" subtitle="The number customers call you on">
      <div className="flex flex-col gap-4 pb-2">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/40 ring-1 ring-indigo-100 dark:ring-indigo-900/60">
          <p className="text-[12px] font-semibold text-indigo-700/70 dark:text-indigo-300/70">Current number</p>
          <p className="text-[20px] font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
            {currentNumber || "No number yet"}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
            <IonIcon icon={shieldCheckmark} className="text-[15px]" />
            Protected — changing it needs a one-time code (OTP)
          </p>
        </div>

        {!changing ? (
          <SecondaryButton full onClick={onStartChange}>
            Change number
          </SecondaryButton>
        ) : (
          <div className="flex flex-col gap-1">
            <FieldBlock label="New mobile number" hint="We’ll send a 6-digit code to this number to confirm it’s yours.">
              <input
                type="tel"
                inputMode="tel"
                value={newNumber}
                onChange={(e) => onNewNumber(e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 15))}
                placeholder="New 10-digit mobile number"
                className={inputCls}
              />
            </FieldBlock>
            {differs && <PhoneOtpVerifier phoneNumber={newNumber} onVerified={onVerified} isPending={verifying} />}
            <button type="button" onClick={onCancelChange} className="mt-2 h-11 text-[13.5px] font-bold text-slate-500 dark:text-slate-400">
              Keep my current number
            </button>
          </div>
        )}
      </div>
    </ManageSheet>
  );
}

// ─── Cover & logo ───────────────────────────────────────────────────────

function PhotoActions({
  has,
  busy,
  onUpload,
  onRemove,
  uploadLabel,
}: {
  has: boolean;
  busy: boolean;
  onUpload: () => void;
  onRemove: () => void;
  uploadLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <PrimaryButton icon={cameraOutline} onClick={onUpload} disabled={busy} className="flex-1 !h-11 !text-[13.5px]">
        {has ? "Change" : uploadLabel}
      </PrimaryButton>
      {has && (
        <SecondaryButton icon={trashOutline} onClick={onRemove} disabled={busy} className="!h-11 !text-[13.5px] !text-rose-600 dark:!text-rose-400">
          Remove
        </SecondaryButton>
      )}
    </div>
  );
}

export function PhotosSheet({
  open,
  onClose,
  brandName,
  bannerSrc,
  logoSrc,
  bannerUploading,
  logoUploading,
  bannerError,
  logoError,
  onBannerImgError,
  onLogoImgError,
  busy,
  onPickBanner,
  onPickLogo,
  onRemoveBanner,
  onRemoveLogo,
}: {
  open: boolean;
  onClose: () => void;
  brandName: string;
  bannerSrc: string | null;
  logoSrc: string | null;
  bannerUploading: boolean;
  logoUploading: boolean;
  bannerError: boolean;
  logoError: boolean;
  onBannerImgError: () => void;
  onLogoImgError: () => void;
  busy: boolean;
  onPickBanner: () => void;
  onPickLogo: () => void;
  onRemoveBanner: () => void;
  onRemoveLogo: () => void;
}) {
  const spin = <span className="w-7 h-7 border-[3px] border-white/80 border-t-transparent rounded-full animate-spin" />;
  return (
    <ManageSheet open={open} onClose={onClose} title="Cover & logo" subtitle="Clear photos make your shop look trustworthy">
      <div className="flex flex-col gap-6 pb-2">
        <Section title="Cover photo" hint="A wide photo of your shop front or best products. Shows at the top of your page.">
          <div className="relative w-full aspect-[2.4/1] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-50 dark:from-indigo-950 dark:via-violet-950 dark:to-slate-900">
            {bannerSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerSrc} alt="Cover photo" className={`w-full h-full object-cover ${bannerUploading ? "opacity-60" : ""}`} onError={onBannerImgError} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IonIcon icon={imageOutline} className="text-[34px] text-indigo-400/80 dark:text-indigo-300/60" />
              </div>
            )}
            {bannerUploading && <span className="absolute inset-0 flex items-center justify-center">{spin}</span>}
          </div>
          {bannerError && <ErrorLine>That photo didn’t upload or open. Please try another one.</ErrorLine>}
          <PhotoActions has={!!bannerSrc} busy={busy} onUpload={onPickBanner} onRemove={onRemoveBanner} uploadLabel="Add cover photo" />
        </Section>

        <Section title="Logo" hint="Square works best. Shown next to your name everywhere in the app.">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-[24px] overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt={brandName} className={`w-full h-full object-cover ${logoUploading ? "opacity-60" : ""}`} onError={onLogoImgError} />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[34px] font-extrabold">
                  {(brandName || "?").trim().charAt(0).toUpperCase()}
                </span>
              )}
              {logoUploading && <span className="absolute inset-0 flex items-center justify-center">{spin}</span>}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <PrimaryButton icon={cameraOutline} onClick={onPickLogo} disabled={busy} full className="!h-11 !text-[13.5px]">
                {logoSrc ? "Change logo" : "Add logo"}
              </PrimaryButton>
              {logoSrc && (
                <SecondaryButton icon={trashOutline} onClick={onRemoveLogo} disabled={busy} full className="!h-11 !text-[13.5px] !text-rose-600 dark:!text-rose-400">
                  Remove
                </SecondaryButton>
              )}
            </div>
          </div>
          {logoError && <ErrorLine>That logo didn’t upload or open. Please try another one.</ErrorLine>}
        </Section>
      </div>
    </ManageSheet>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[14px] font-extrabold text-slate-900 dark:text-white">{title}</p>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600 dark:text-rose-400 leading-snug">
      <IonIcon icon={alertCircleOutline} className="text-[15px] shrink-0 mt-px" />
      {children}
    </p>
  );
}
