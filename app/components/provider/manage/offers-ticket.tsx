"use client";
/**
 * Offers section pieces: the coupon-style offer card, its status rules and the
 * plan-usage meter. Kept separate so the tab file stays about behaviour.
 */
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  createOutline,
  trashOutline,
  timeOutline,
  peopleOutline,
  cartOutline,
  calendarOutline,
} from "ionicons/icons";
import type { ProviderOfferFull } from "@/services/provider.service";
import { Pill } from "./kit";

// ─── Status rules (unchanged from the original tab) ─────────────────────

export const isOfferActive = (offer: ProviderOfferFull) => {
  const now = new Date();
  return offer.isActive && new Date(offer.startsAt) <= now && new Date(offer.endsAt) > now;
};

export const isOfferExpired = (offer: ProviderOfferFull) => {
  return new Date(offer.endsAt) <= new Date();
};

export const isOfferUpcoming = (offer: ProviderOfferFull) => {
  return offer.isActive && new Date(offer.startsAt) > new Date();
};

export type OfferStatus = "live" | "scheduled" | "paused" | "expired";

export function offerStatus(offer: ProviderOfferFull): OfferStatus {
  if (isOfferExpired(offer)) return "expired";
  if (isOfferActive(offer)) return "live";
  if (isOfferUpcoming(offer)) return "scheduled";
  return "paused";
}

// ─── Wording ────────────────────────────────────────────────────────────

const DAY = 86_400_000;

export const formatDate = (iso: string, withYear = true) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });

/** Whole calendar days from today to the given date (negative = past). */
function daysFromToday(iso: string) {
  const d = new Date(iso);
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(d);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

function inDays(n: number, verb: string, iso: string) {
  if (n <= 0) return `${verb} today`;
  if (n === 1) return `${verb} tomorrow`;
  if (n <= 30) return `${verb} in ${n} days`;
  return `${verb} ${formatDate(iso)}`;
}

/** "Ends in 3 days", "Starts tomorrow", "Ended 3 Oct" … */
export function timingLabel(offer: ProviderOfferFull) {
  const s = offerStatus(offer);
  if (s === "expired") return `Ended ${formatDate(offer.endsAt, false)}`;
  if (s === "scheduled") return inDays(daysFromToday(offer.startsAt), "Starts", offer.startsAt);
  return inDays(daysFromToday(offer.endsAt), "Ends", offer.endsAt);
}

export const discountText = (type: "percentage" | "flat", value: number | string) =>
  type === "percentage" ? `${Number(value)}%` : `₹${Number(value)}`;

// ─── Coupon art ─────────────────────────────────────────────────────────

const STUB = {
  live: "from-amber-400 via-orange-500 to-rose-500",
  scheduled: "from-indigo-500 to-violet-600",
  paused: "from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600",
  expired: "from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700",
} as const;

/** The coloured left part of a coupon: the big discount number. */
export function CouponStub({
  status,
  type,
  value,
  compact,
}: {
  status: OfferStatus;
  type: "percentage" | "flat";
  value: number | string;
  compact?: boolean;
}) {
  const text = value === "" || value == null || Number.isNaN(Number(value)) ? "—" : discountText(type, value);
  const long = text.length > 5;
  return (
    <div
      className={`relative shrink-0 ${compact ? "w-[92px]" : "w-[96px]"} flex flex-col items-center justify-center bg-gradient-to-br ${STUB[status]} text-white px-1.5 py-3`}
    >
      <span className={`font-black tabular-nums leading-none tracking-tight ${long ? "text-[19px]" : "text-[26px]"}`}>{text}</span>
      <span className="mt-1 text-[11px] font-extrabold tracking-[0.2em] opacity-90">OFF</span>
    </div>
  );
}

/** Dashed tear line with the two half-circle notches cut into the card edge. */
function TearLine() {
  return (
    <div aria-hidden className="relative w-0 shrink-0">
      <span className="absolute -top-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-slate-50 dark:bg-slate-950 ring-1 ring-slate-200/70 dark:ring-slate-800" />
      <span className="absolute -bottom-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-slate-50 dark:bg-slate-950 ring-1 ring-slate-200/70 dark:ring-slate-800" />
      <span className="absolute inset-y-3 left-0 border-l-2 border-dashed border-slate-200 dark:border-slate-700" />
    </div>
  );
}

const STATUS_PILL: Record<OfferStatus, { label: string; tone: "emerald" | "indigo" | "slate" | "amber" }> = {
  live: { label: "Live", tone: "emerald" },
  scheduled: { label: "Scheduled", tone: "indigo" },
  paused: { label: "Paused", tone: "amber" },
  expired: { label: "Expired", tone: "slate" },
};

function Meta({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
      <IonIcon icon={icon} className="text-[13px] shrink-0" />
      {children}
    </span>
  );
}

// ─── Offer card ─────────────────────────────────────────────────────────

export function OfferTicket({
  offer,
  index,
  onEdit,
  onDelete,
}: {
  offer: ProviderOfferFull;
  index: number;
  onEdit: (offer: ProviderOfferFull) => void;
  onDelete: (offer: ProviderOfferFull) => void;
}) {
  const status = offerStatus(offer);
  const pill = STATUS_PILL[status];
  const ended = status === "expired";
  const soon = status === "live" && daysFromToday(offer.endsAt) <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      role="button"
      tabIndex={0}
      onClick={() => onEdit(offer)}
      onKeyDown={(e) => e.target === e.currentTarget && (e.key === "Enter" || e.key === " ") && onEdit(offer)}
      aria-label={`Edit offer: ${offer.title}`}
      className="relative flex items-stretch bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
    >
      <CouponStub status={status} type={offer.discountType} value={offer.discountValue} />
      <TearLine />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className={`flex-1 pl-4 pr-3.5 pt-3 pb-2.5 ${ended ? "opacity-70" : ""}`}>
          <div className="flex items-start gap-2">
            <p className="flex-1 min-w-0 text-[14.5px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{offer.title}</p>
            <span className="shrink-0 mt-px">
              <Pill tone={pill.tone}>
                {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {pill.label}
              </Pill>
            </span>
          </div>
          {offer.description && (
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{offer.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
                soon ? "text-rose-600 dark:text-rose-400" : ended ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"
              }`}
            >
              <IonIcon icon={status === "scheduled" ? calendarOutline : timeOutline} className="text-[13px]" />
              {timingLabel(offer)}
            </span>
            {offer.minOrderAmount != null && Number(offer.minOrderAmount) > 0 && (
              <Meta icon={cartOutline}>Min ₹{Number(offer.minOrderAmount)}</Meta>
            )}
            {offer.usageLimit ? (
              <Meta icon={peopleOutline}>
                {offer.usageCount}/{offer.usageLimit} used
              </Meta>
            ) : offer.usageCount > 0 ? (
              <Meta icon={peopleOutline}>{offer.usageCount} used</Meta>
            ) : null}
          </div>
        </div>
        <div className="flex items-center border-t border-slate-100 dark:border-slate-800 ml-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(offer);
            }}
            className="flex-1 h-11 -ml-4 pl-4 inline-flex items-center justify-start gap-1.5 text-[13px] font-semibold text-indigo-600 dark:text-indigo-300 active:bg-slate-50 dark:active:bg-slate-800/60"
          >
            <IonIcon icon={createOutline} className="text-[16px]" />
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(offer);
            }}
            aria-label={`Delete offer: ${offer.title}`}
            className="h-11 px-4 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 active:text-rose-600 active:bg-rose-50 dark:active:bg-rose-950/40"
          >
            <IonIcon icon={trashOutline} className="text-[16px]" />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Plan usage meter ───────────────────────────────────────────────────

export function UsageMeter({
  label,
  used,
  max,
  tone,
}: {
  label: string;
  used: number;
  max: number;
  tone: "brand" | "warm";
}) {
  const unlimited = max === -1;
  const full = !unlimited && used >= max;
  const pct = unlimited ? 12 : max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const bar = full
    ? "bg-rose-500"
    : tone === "warm"
    ? "bg-gradient-to-r from-amber-400 to-rose-500"
    : "bg-gradient-to-r from-indigo-500 to-violet-500";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-slate-600 dark:text-slate-300">{label}</span>
        <span className={`text-[13px] font-bold tabular-nums ${full ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
          {unlimited ? `${used} · No limit` : `${used} of ${max}`}
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
