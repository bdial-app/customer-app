"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  giftOutline,
  timeOutline,
  chevronForwardOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircle,
  sparkles,
} from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";

/** A live offer as the business and item pages receive it. */
export interface OfferLike {
  id: string;
  title: string;
  description: string | null;
  discountType: string;
  discountValue: number | string;
  minOrderAmount?: number | string | null;
  maxDiscount?: number | string | null;
  endsAt: string;
}

const DAY = 24 * 60 * 60 * 1000;
const inr = (v: number | string) => `₹${Number(v).toLocaleString("en-IN")}`;

/** "10%" or "₹200" — the number on the ticket. */
export const discountValueLabel = (type: string | undefined, value: number | string) =>
  type === "percentage" ? `${Number(value)}%` : inr(value);

export const offerValue = (o: OfferLike) => discountValueLabel(o.discountType, o.discountValue);

/** "10% OFF" / "₹200 OFF". */
export const offerHeadline = (o: OfferLike) => `${offerValue(o)} OFF`;

const daysLeft = (endsAt: string) => {
  const end = new Date(endsAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  return Math.round((endDay.getTime() - today.getTime()) / DAY);
};

/** Countdown wording: urgent close to the end, a date further out. */
export const endsLabel = (endsAt: string) => {
  const d = daysLeft(endsAt);
  if (d <= 0) return "Ends today";
  if (d === 1) return "Ends tomorrow";
  if (d <= 7) return `Ends in ${d} days`;
  return `Valid till ${new Date(endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
};

export const endingSoon = (endsAt: string) => daysLeft(endsAt) <= 3;

/** The small print: minimum order and cap, when the business set them. */
const conditions = (o: OfferLike) =>
  [
    o.minOrderAmount != null && Number(o.minOrderAmount) > 0 ? `On orders above ${inr(o.minOrderAmount)}` : null,
    o.discountType === "percentage" && o.maxDiscount != null && Number(o.maxDiscount) > 0
      ? `Save up to ${inr(o.maxDiscount)}`
      : null,
  ].filter((c): c is string => !!c);

/* ── Coupon ticket: discount stub, perforation, details ── */
export function OfferTicket({ offer, onOpen }: { offer: OfferLike; onOpen: (o: OfferLike) => void }) {
  const soon = endingSoon(offer.endsAt);
  const fine = conditions(offer)[0];
  return (
    <button
      type="button"
      onClick={() => onOpen(offer)}
      className="relative w-full flex items-stretch text-left rounded-2xl bg-white dark:bg-slate-800 shadow-[0_2px_10px_rgba(244,63,94,0.10)] dark:shadow-none border border-rose-100 dark:border-rose-900/40 active:scale-[0.98] transition-transform"
    >
      {/* Discount stub */}
      <div className="w-[84px] shrink-0 rounded-l-2xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 flex flex-col items-center justify-center py-3 text-white">
        <span className="text-[22px] font-extrabold leading-none tracking-tight">{offerValue(offer)}</span>
        <span className="mt-1 text-[10px] font-bold tracking-[0.18em]">OFF</span>
      </div>

      {/* Perforation with notches */}
      <div className="relative w-0 border-l-2 border-dashed border-rose-200 dark:border-rose-900/60 my-2">
        <span className="absolute -top-[17px] -left-[9px] w-4 h-4 rounded-full bg-[var(--offer-notch,#fff1f2)] dark:bg-[var(--offer-notch-dark,#1c1a2e)]" />
        <span className="absolute -bottom-[17px] -left-[9px] w-4 h-4 rounded-full bg-[var(--offer-notch,#fff1f2)] dark:bg-[var(--offer-notch-dark,#1c1a2e)]" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 px-3.5 py-3">
        <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">{offer.title}</p>
        {offer.description && (
          <p className="mt-0.5 text-[11.5px] text-gray-500 dark:text-slate-400 leading-snug line-clamp-2">{offer.description}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
              soon
                ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            <IonIcon icon={timeOutline} className="text-[11px]" />
            {endsLabel(offer.endsAt)}
          </span>
          {fine && <span className="text-[10.5px] font-medium text-gray-400 dark:text-slate-500 truncate">{fine}</span>}
        </div>
      </div>

      <div className="flex items-center pr-3">
        <IonIcon icon={chevronForwardOutline} className="text-gray-300 dark:text-slate-500 text-base" />
      </div>
    </button>
  );
}

/* ── Business page section ── */
export function OffersSection({
  offers,
  brandName,
  onOpen,
}: {
  offers: OfferLike[];
  brandName: string;
  onOpen: (o: OfferLike) => void;
}) {
  if (offers.length === 0) return null;
  return (
    <section
      data-tour="biz-page-offers"
      className="relative overflow-hidden rounded-3xl p-4 border border-rose-100/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50 via-orange-50/70 to-amber-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-900 [--offer-notch:#fff1f2] dark:[--offer-notch-dark:#1a1626]"
    >
      <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-rose-200/30 dark:bg-rose-500/10 blur-2xl pointer-events-none" />
      <div className="relative flex items-start gap-2.5 mb-3.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-sm shadow-rose-200 dark:shadow-none shrink-0">
          <IonIcon icon={giftOutline} className="text-white text-[18px]" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[16px] font-extrabold text-gray-900 dark:text-white leading-tight">
            {offers.length > 1 ? `${offers.length} offers running now` : "Offer running now"}
          </h3>
          <p className="text-[11.5px] text-gray-500 dark:text-slate-400 mt-0.5">
            {`Save when you buy from ${brandName} — tap an offer to claim it`}
          </p>
        </div>
      </div>
      <div className="relative space-y-2.5">
        {offers.map((o) => (
          <OfferTicket key={o.id} offer={o} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

/* ── Item page banner: the business has an offer on ── */
export function OfferBanner({
  offers,
  brandName,
  onOpen,
}: {
  offers: OfferLike[];
  brandName: string;
  onOpen: (o: OfferLike) => void;
}) {
  if (offers.length === 0) return null;
  // Lead with the biggest saving.
  const best = [...offers].sort((a, b) => Number(b.discountValue) - Number(a.discountValue))[0];
  const soon = endingSoon(best.endsAt);
  return (
    <button
      type="button"
      data-tour="product-offer"
      aria-label={`${brandName} has an offer: ${best.title}, ${offerHeadline(best)}`}
      onClick={() => onOpen(best)}
      className="relative w-full overflow-hidden flex items-center gap-3 rounded-2xl p-3 text-left bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 shadow-md shadow-rose-200/60 dark:shadow-none active:scale-[0.99] transition-transform"
    >
      <div className="absolute -right-6 -top-8 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      <div className="w-12 h-12 shrink-0 rounded-xl bg-white/95 flex flex-col items-center justify-center">
        <span className="text-[15px] font-extrabold text-rose-600 leading-none">{offerValue(best)}</span>
        <span className="text-[8px] font-bold tracking-[0.16em] text-rose-500 mt-0.5">OFF</span>
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/80 whitespace-nowrap overflow-hidden">
          <IonIcon icon={sparkles} className="text-[10px] shrink-0" />
          <span className="truncate">This business has an offer</span>
        </p>
        <p className="text-[14px] font-bold text-white leading-snug line-clamp-1">{best.title}</p>
        <p className="text-[11px] font-medium text-white/85">
          {soon ? `⏳ ${endsLabel(best.endsAt)}` : endsLabel(best.endsAt)}
          {offers.length > 1 ? ` · +${offers.length - 1} more offer${offers.length > 2 ? "s" : ""}` : ""}
        </p>
      </div>
      <span className="relative shrink-0 text-[11px] font-bold text-rose-600 bg-white px-2.5 py-1.5 rounded-full">
        View
      </span>
    </button>
  );
}

/* ── Detail sheet with how-to-claim and a chat CTA ── */
export function OfferSheet({
  offer,
  brandName,
  onClose,
  onClaim,
  claiming,
  canClaim = true,
}: {
  offer: OfferLike | null;
  brandName: string;
  onClose: () => void;
  onClaim: (o: OfferLike) => void;
  claiming?: boolean;
  /** False for the business's own page: no claiming from yourself. */
  canClaim?: boolean;
}) {
  // Keep the last offer while the sheet animates closed.
  const [shown, setShown] = useState(offer);
  if (offer && offer !== shown) setShown(offer);

  return (
    <Sheet open={!!offer} onClose={onClose} label="Offer" zIndex={9999} maxHeight="85dvh" className="bg-white dark:bg-slate-800">
      {shown && (
        <div className="px-5 pb-6 pt-1 sm:pt-6">
          {/* Coupon header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 p-4 text-white">
            <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute right-10 -bottom-10 w-20 h-20 rounded-full bg-white/10" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-white/80 truncate pr-6">{`Offer from ${brandName}`}</p>
            <p className="relative mt-1 text-[32px] font-extrabold leading-none tracking-tight">{offerHeadline(shown)}</p>
            <p className="relative mt-2 text-[15px] font-bold leading-snug">{shown.title}</p>
          </div>

          {shown.description && (
            <p className="mt-4 text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{shown.description}</p>
          )}

          {/* Terms */}
          <div className="mt-4 rounded-2xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
              <IonIcon icon={timeOutline} className={`text-base ${endingSoon(shown.endsAt) ? "text-rose-500" : "text-amber-500"}`} />
              <span className="text-[12.5px] font-semibold text-gray-800 dark:text-slate-100">{endsLabel(shown.endsAt)}</span>
              <span className="ml-auto text-[11px] text-gray-400 dark:text-slate-500">
                {new Date(shown.endsAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
            {conditions(shown).map((c) => (
              <div key={c} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <IonIcon icon={checkmarkCircle} className="text-base text-emerald-500" />
                <span className="text-[12.5px] text-gray-700 dark:text-slate-200">{c}</span>
              </div>
            ))}
          </div>

          {canClaim ? (
            <>
              {/* How to claim */}
              <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-3.5 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">How to claim</p>
                <p className="mt-1 text-[12.5px] text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
                  {`Message ${brandName} on Tijarah — we'll mention this offer for you — or show this screen when you visit.`}
                </p>
              </div>
              <button
                type="button"
                disabled={claiming}
                onClick={() => onClaim(shown)}
                className="mt-4 w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[14px] font-bold shadow-md shadow-rose-200 dark:shadow-none active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                <IonIcon icon={chatbubbleEllipsesOutline} className="text-lg" />
                {claiming ? "Opening chat…" : "Chat to claim this offer"}
              </button>
            </>
          ) : (
            <p className="mt-4 text-center text-[12px] text-gray-400 dark:text-slate-500">This is how customers see your offer.</p>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** The first message a claim opens the chat with. */
export const claimMessage = (o: OfferLike, itemName?: string) =>
  `Hi! I saw your offer "${o.title}" (${offerHeadline(o)}) on Tijarah${itemName ? ` while looking at ${itemName}` : ""}. I'd like to claim it — how do I go ahead?`;
