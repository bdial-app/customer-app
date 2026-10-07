"use client";
/** Presentational pieces of the Catalogue section (list card + form controls). */
import type { ChangeEvent, ReactNode, RefObject } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  alertCircleOutline,
  cameraOutline,
  closeOutline,
  constructOutline,
  cubeOutline,
  eyeOffOutline,
  eyeOutline,
  imagesOutline,
  star,
  starOutline,
} from "ionicons/icons";
import type { ProviderDetailsProduct } from "@/services/provider.service";
import { Pill } from "./kit";

export const MAX_PHOTOS = 5;
export const MAX_HERO = 3;

export function formatPrice(price: number | null | undefined, currency: string | undefined) {
  if (price == null) return null;
  const isInr = currency === "INR";
  return `${isInr ? "₹" : "$"}${Number(price).toLocaleString(isInr ? "en-IN" : "en-US")}`;
}

// ─── List card ──────────────────────────────────────────────────────────

export function CatalogueItemCard({
  product: p,
  index,
  heroFull,
  busy,
  onEdit,
  onToggleHero,
  onToggleActive,
}: {
  product: ProviderDetailsProduct;
  index: number;
  heroFull: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggleHero: () => void;
  onToggleActive: () => void;
}) {
  const cover = p.photoUrl || p.photoUrls?.[0];
  const isService = p.productType === "service";
  const extraPhotos = (p.photoUrls?.length ?? 0) - 1;
  const price = formatPrice(p.price, p.currency);
  const starDisabled = busy || (!p.isHero && heroFull);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.03 }}
      className={`rounded-2xl bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden ring-1 ${
        p.isHero ? "ring-amber-300/80 dark:ring-amber-500/40" : "ring-slate-200/70 dark:ring-slate-800"
      }`}
    >
      <button type="button" onClick={onEdit} className="w-full flex items-center gap-3.5 p-3 text-left active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors" aria-label={`Edit ${p.name}`}>
        <div className={`relative w-[72px] h-[72px] rounded-xl shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 ${p.isActive ? "" : "opacity-50 grayscale"}`}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-indigo-950 dark:to-violet-950">
              <IonIcon icon={isService ? constructOutline : cubeOutline} className="text-[26px] text-indigo-400 dark:text-indigo-300" />
            </div>
          )}
          {extraPhotos > 0 && (
            <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-md bg-slate-950/65 text-white text-[10px] font-bold px-1 py-px">
              <IonIcon icon={imagesOutline} className="text-[10px]" />
              {extraPhotos + 1}
            </span>
          )}
          {p.isHero && (
            <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
              <IonIcon icon={star} className="text-[11px] text-white" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-bold leading-snug line-clamp-2 ${p.isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{p.name}</p>
          <p className={`mt-0.5 text-[14px] ${price ? "font-extrabold text-slate-900 dark:text-white" : "font-medium text-slate-400 dark:text-slate-500"}`}>
            {price ?? "Price on request"}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <Pill tone={isService ? "indigo" : "slate"}>{isService ? "Service" : "Product"}</Pill>
            {p.isHero && (
              <Pill tone="amber">
                <IonIcon icon={star} className="text-[10px]" />
                Starred
              </Pill>
            )}
            {!p.isActive && (
              <Pill tone="rose">
                <IonIcon icon={eyeOffOutline} className="text-[11px]" />
                Hidden
              </Pill>
            )}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
        <QuickAction
          onClick={onToggleHero}
          disabled={starDisabled}
          icon={p.isHero ? star : starOutline}
          tone={p.isHero ? "amber" : "slate"}
          label={p.isHero ? "Starred" : heroFull ? "3 already starred" : "Star it"}
        />
        <QuickAction
          onClick={onToggleActive}
          disabled={busy}
          icon={p.isActive ? eyeOffOutline : eyeOutline}
          tone={p.isActive ? "slate" : "indigo"}
          label={p.isActive ? "Hide" : "Show again"}
        />
      </div>
    </motion.div>
  );
}

function QuickAction({ onClick, disabled, icon, label, tone }: { onClick: () => void; disabled?: boolean; icon: string; label: string; tone: "amber" | "slate" | "indigo" }) {
  const tones = {
    amber: "text-amber-600 dark:text-amber-300",
    slate: "text-slate-600 dark:text-slate-300",
    indigo: "text-indigo-600 dark:text-indigo-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-11 flex items-center justify-center gap-1.5 text-[13px] font-bold active:bg-slate-50 dark:active:bg-slate-800/60 disabled:opacity-40 transition-colors ${tones[tone]}`}
    >
      <IonIcon icon={icon} className="text-[16px]" />
      {label}
    </button>
  );
}

// ─── Form controls ──────────────────────────────────────────────────────

/** Big two-way choice for Product vs Service. */
export function TypeChoice({ value, onChange }: { value: string; onChange: (v: "product" | "service") => void }) {
  const options = [
    { v: "product" as const, icon: cubeOutline, title: "Product", body: "Something you sell" },
    { v: "service" as const, icon: constructOutline, title: "Service", body: "Work you do or book" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Type">
      {options.map((o) => {
        const on = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.v)}
            className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
              on
                ? "bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500"
                : "bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
            }`}
          >
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${on ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300"}`}>
              <IonIcon icon={o.icon} className="text-[18px]" />
            </span>
            <span className="min-w-0">
              <span className={`block text-[14px] font-bold ${on ? "text-indigo-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>{o.title}</span>
              <span className="block text-[11.5px] text-slate-500 dark:text-slate-400 leading-tight">{o.body}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Up to 5 photos; the first is the cover. */
export function PhotoPicker({
  previews,
  error,
  inputRef,
  onSelect,
  onRemove,
}: {
  previews: string[];
  error: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}) {
  const input = <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onSelect} />;
  return (
    <div className="flex flex-col gap-2">
      {previews.length === 0 ? (
        <label className="flex items-center gap-3.5 p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 cursor-pointer active:scale-[0.99] transition-transform">
          {input}
          <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <IonIcon icon={cameraOutline} className="text-[22px] text-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-bold text-indigo-900 dark:text-indigo-100">Add photos</span>
            <span className="block text-[12px] text-indigo-900/60 dark:text-indigo-200/60 leading-snug">Up to 5 — you can pick several at once</span>
          </span>
        </label>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover rounded-xl ring-1 ring-slate-200 dark:ring-slate-700" loading="lazy" decoding="async" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute -top-1.5 -right-1.5 z-10 w-7 h-7 rounded-full bg-slate-900/80 dark:bg-slate-950/90 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center active:scale-90 transition-transform"
              >
                <IonIcon icon={closeOutline} className="text-white text-[15px]" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded-md bg-slate-950/65 text-white text-[10px] font-bold px-1.5 py-px">Cover</span>
              )}
            </div>
          ))}
          {previews.length < MAX_PHOTOS && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-transform">
              {input}
              <IonIcon icon={cameraOutline} className="text-[20px] text-indigo-500 dark:text-indigo-300" />
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">Add</span>
            </label>
          )}
        </div>
      )}
      {error && (
        <p className="text-[11.5px] font-medium text-rose-500 flex items-center gap-1">
          <IonIcon icon={alertCircleOutline} className="text-[13px]" />
          {error}
        </p>
      )}
    </div>
  );
}

/** A setting that saves the moment you flip it (star, show/hide). */
export function InstantToggle({
  icon,
  tone,
  title,
  body,
  checked,
  disabled,
  onChange,
}: {
  icon: string;
  tone: "amber" | "emerald";
  title: string;
  body: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const tones = {
    amber: { chip: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300", track: "bg-amber-500" },
    emerald: { chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300", track: "bg-emerald-500" },
  }[tone];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-3 min-h-14 text-left disabled:opacity-50"
    >
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tones.chip}`}>
        <IonIcon icon={icon} className="text-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold text-slate-800 dark:text-slate-100">{title}</span>
        <span className="block text-[12px] text-slate-500 dark:text-slate-400 leading-snug">{body}</span>
      </span>
      <span className={`relative w-11 h-[26px] rounded-full shrink-0 transition-colors ${checked ? tones.track : "bg-slate-200 dark:bg-slate-700"}`}>
        <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : ""}`} />
      </span>
    </button>
  );
}
