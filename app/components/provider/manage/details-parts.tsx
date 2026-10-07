"use client";
/**
 * Read-only building blocks for the Details tab: the "how customers see you"
 * preview, the profile checklist, the open/closed switch and the tappable
 * rows that open each editor.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  cameraOutline,
  checkmarkCircle,
  chevronForwardOutline,
  imageOutline,
  storefrontOutline,
} from "ionicons/icons";
import type { ProviderData } from "@/services/provider.service";
import { Card } from "./kit";

export type DetailsEditor = "basics" | "phone" | "location" | "hours" | "links" | "photos";

/** "09:00" / "09:00:00" → "9:00 AM". */
export const formatTime = (time: string | null | undefined) => {
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

// ─── Icon tile ──────────────────────────────────────────────────────────

export type TileTone = "indigo" | "violet" | "emerald" | "amber" | "sky" | "pink" | "facebook" | "youtube" | "whatsapp" | "linkedin";

const TILE: Record<TileTone, string> = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  pink: "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
  facebook: "bg-blue-50 text-[#1877F2] dark:bg-blue-500/15 dark:text-blue-300",
  youtube: "bg-red-50 text-[#FF0000] dark:bg-red-500/15 dark:text-red-400",
  whatsapp: "bg-green-50 text-[#1DAA53] dark:bg-green-500/15 dark:text-green-400",
  linkedin: "bg-sky-50 text-[#0A66C2] dark:bg-sky-500/15 dark:text-sky-300",
};

export function IconTile({ icon, tone = "indigo", size = "md" }: { icon: string; tone?: TileTone; size?: "md" | "sm" }) {
  return (
    <span className={`${size === "sm" ? "w-8 h-8 rounded-lg text-[16px]" : "w-10 h-10 rounded-xl text-[19px]"} flex items-center justify-center shrink-0 ${TILE[tone]}`}>
      <IonIcon icon={icon} />
    </span>
  );
}

// ─── Rows ───────────────────────────────────────────────────────────────

/**
 * One fact about the shop. Tapping it opens the editor for it. When the value
 * is missing, the row says what to add instead of "Not set".
 */
export function DetailRow({
  icon,
  tone = "indigo",
  label,
  value,
  missing,
  badge,
  onClick,
  extra,
}: {
  icon: string;
  tone?: TileTone;
  label: string;
  value?: ReactNode;
  missing: string;
  badge?: ReactNode;
  onClick: () => void;
  extra?: ReactNode;
}) {
  const has = value !== null && value !== undefined && value !== "";
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-start gap-3 px-4 py-3.5 min-h-[64px] text-left active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors"
      >
        <IconTile icon={icon} tone={tone} />
        <div className="flex-1 min-w-0 pt-px">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            {badge}
          </div>
          {has ? (
            <div className="text-[14.5px] font-medium text-slate-900 dark:text-white mt-0.5 leading-snug break-words">{value}</div>
          ) : (
            <p className="text-[13.5px] font-semibold text-indigo-600 dark:text-indigo-300 mt-0.5 leading-snug">{missing}</p>
          )}
        </div>
        <span
          className={`mt-2 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            has ? "text-slate-300 dark:text-slate-600" : "bg-indigo-600 text-white dark:bg-indigo-500"
          }`}
        >
          <IonIcon icon={has ? chevronForwardOutline : addOutline} className={has ? "text-[18px]" : "text-[15px]"} />
        </span>
      </button>
      {extra && <div className="pl-[68px] pr-4 -mt-2 pb-3.5">{extra}</div>}
    </div>
  );
}

/** Small text-style button used under a row ("See on map", "Read all"). */
export function RowLink({ icon, children, onClick }: { icon?: string; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 h-9 -my-1 pr-2 text-[13px] font-bold text-indigo-600 dark:text-indigo-300"
    >
      {icon && <IonIcon icon={icon} className="text-[15px]" />}
      {children}
    </button>
  );
}

// ─── Preview hero ───────────────────────────────────────────────────────

export function ProfilePreview({
  provider,
  bannerSrc,
  logoSrc,
  bannerUploading,
  logoUploading,
  onBannerError,
  onLogoError,
  hoursText,
  onEditPhotos,
}: {
  provider: ProviderData;
  bannerSrc: string | null;
  logoSrc: string | null;
  bannerUploading: boolean;
  logoUploading: boolean;
  onBannerError: () => void;
  onLogoError: () => void;
  hoursText: string | null;
  onEditPhotos: () => void;
}) {
  const place = [provider.area, provider.city].filter(Boolean).join(", ");
  const initial = (provider.brandName || "?").trim().charAt(0).toUpperCase();
  return (
    <Card padded={false} className="overflow-hidden">
      {/* Cover */}
      <button
        type="button"
        onClick={onEditPhotos}
        aria-label={bannerSrc ? "Change cover photo" : "Add a cover photo"}
        className="relative block w-full h-[150px] text-left overflow-hidden"
      >
        {bannerSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerSrc}
              alt="Cover photo"
              className={`w-full h-full object-cover transition-opacity ${bannerUploading ? "opacity-60" : ""}`}
              onError={onBannerError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-50 dark:from-indigo-950 dark:via-violet-950 dark:to-slate-900 flex flex-col items-center justify-center gap-1.5 pb-6">
            <span className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm">
              <IonIcon icon={imageOutline} className="text-[22px] text-indigo-600 dark:text-indigo-300" />
            </span>
            <span className="text-[13px] font-bold text-indigo-700 dark:text-indigo-200">Add a cover photo</span>
          </div>
        )}
        {bannerUploading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-7 h-7 border-[3px] border-white/80 border-t-transparent rounded-full animate-spin" />
          </span>
        )}
        {bannerSrc && !bannerUploading && (
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/45 backdrop-blur-md text-white text-[12px] font-bold">
            <IonIcon icon={cameraOutline} className="text-[15px]" />
            Edit photos
          </span>
        )}
      </button>

      {/* Logo + name */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between gap-3 -mt-10">
          <button
            type="button"
            onClick={onEditPhotos}
            aria-label={logoSrc ? "Change logo" : "Add your logo"}
            className="relative w-[84px] h-[84px] rounded-[22px] ring-4 ring-white dark:ring-slate-900 bg-white dark:bg-slate-800 shadow-lg shadow-slate-900/10 shrink-0"
          >
            <span className="absolute inset-0 rounded-[22px] overflow-hidden">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt={provider.brandName}
                  className={`w-full h-full object-cover transition-opacity ${logoUploading ? "opacity-60" : ""}`}
                  onError={onLogoError}
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[30px] font-extrabold">
                  {initial}
                </span>
              )}
              {logoUploading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-6 h-6 border-[3px] border-white/80 border-t-transparent rounded-full animate-spin" />
                </span>
              )}
            </span>
            <span className="absolute -right-1.5 -bottom-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 ring-[3px] ring-white dark:ring-slate-900 flex items-center justify-center text-white">
              <IonIcon icon={cameraOutline} className="text-[14px]" />
            </span>
          </button>
          <span
            className={`mb-1 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-bold ${
              provider.isAvailable
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${provider.isAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
            {provider.isAvailable ? "Open now" : "Closed"}
          </span>
        </div>
        <h3 className="mt-3 text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight break-words">
          {provider.brandName}
        </h3>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
          {[place, hoursText].filter(Boolean).join("  ·  ") || "Add your location and hours below"}
        </p>
      </div>
    </Card>
  );
}

// ─── Profile checklist ──────────────────────────────────────────────────

export type ChecklistItem = { key: string; done: boolean; todo: string; icon: string; editor: DetailsEditor };

export function ProfileChecklist({ items, onOpen }: { items: ChecklistItem[]; onOpen: (e: DetailsEditor) => void }) {
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const missing = items.filter((i) => !i.done);
  const pct = total ? done / total : 1;
  const R = 19;
  const C = 2 * Math.PI * R;

  if (missing.length === 0) {
    return (
      <Card className="flex items-center gap-3 !py-3.5">
        <span className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
          <IonIcon icon={checkmarkCircle} className="text-[24px] text-emerald-500" />
        </span>
        <div className="min-w-0">
          <p className="text-[14.5px] font-extrabold text-slate-900 dark:text-white">Your profile is complete</p>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug">Customers see everything they need. Keep it up to date.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-3.5">
        <div className="relative w-[52px] h-[52px] shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="details-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r={R} fill="none" strokeWidth="5" className="stroke-slate-100 dark:stroke-slate-800" />
            <motion.circle
              cx="24"
              cy="24"
              r={R}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              stroke="url(#details-ring)"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - pct) }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-slate-900 dark:text-white tabular-nums">
            {done}/{total}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-slate-900 dark:text-white leading-tight">
            {missing.length === 1 ? "One step left" : `${missing.length} steps left`}
          </p>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            Complete profiles get more calls and visits. Tap a step to finish it.
          </p>
        </div>
      </div>
      <div className="mt-3.5 flex flex-col gap-2">
        {missing.map((m) => (
          <motion.button
            key={m.key}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onOpen(m.editor)}
            className="w-full flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 ring-1 ring-slate-100 dark:ring-slate-800 text-left"
          >
            <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-700 flex items-center justify-center shrink-0">
              <IonIcon icon={m.icon} className="text-[16px] text-indigo-600 dark:text-indigo-300" />
            </span>
            <span className="flex-1 min-w-0 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 leading-snug">{m.todo}</span>
            <IonIcon icon={chevronForwardOutline} className="text-[16px] text-slate-400 shrink-0" />
          </motion.button>
        ))}
      </div>
    </Card>
  );
}

// ─── Open / closed switch ───────────────────────────────────────────────

export function AvailabilityCard({ available, onToggle }: { available: boolean; onToggle: () => void }) {
  return (
    <Card padded={false}>
      <button
        type="button"
        role="switch"
        aria-checked={available}
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[72px] text-left"
      >
        <IconTile icon={storefrontOutline} tone={available ? "emerald" : "amber"} />
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-bold text-slate-900 dark:text-white">Open for business</p>
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {available
              ? "Customers see “Open Now” on your shop. Turn off when you’re away."
              : "Customers see “Closed” right now. Turn on when you’re back."}
          </p>
        </div>
        <span
          className={`relative w-[52px] h-8 rounded-full shrink-0 transition-colors ${
            available ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-slate-200 dark:bg-slate-700"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md ${available ? "right-1" : "left-1"}`}
          />
        </span>
      </button>
    </Card>
  );
}
