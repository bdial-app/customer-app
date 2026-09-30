"use client";

import { IonIcon } from "@ionic/react";
import {
  search, checkmarkCircle, star, logoWhatsapp, moon, people,
  chatbubbleEllipses, trendingUp, pricetag, storefront, helpCircle,
} from "ionicons/icons";

/**
 * Pictures for the business half of the tour. Same rule as the customer side:
 * built from the app's own shapes, and nothing here promises a result the
 * product cannot deliver.
 */

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-[280px] mx-auto rounded-3xl p-3.5 bg-white dark:bg-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-700">
    {children}
  </div>
);

const Tile = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-amber-100 to-orange-50 dark:from-slate-700 dark:to-slate-600 ${className}`} />
);

/** The problem: your name travels only as far as the group it was posted in. */
export function ClosedCircleVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-1.5 mb-3">
        <IonIcon icon={logoWhatsapp} className="text-green-500 text-sm" />
        <span className="text-[10px] font-semibold text-slate-400">Forwarded many times</span>
      </div>
      <div className="space-y-1.5 mb-3">
        {["Anyone knows a good tiffin?", "I'll ask my cousin…", "Someone had a number…"].map((t, i) => (
          <div
            key={t}
            className={`text-[9px] px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 ${i === 1 ? "ml-5" : ""}`}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-600">
        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <IonIcon icon={people} className="text-slate-400 text-xs" />
        </span>
        <span className="text-[9px] text-slate-400">your groups</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="w-7 h-7 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
          <IonIcon icon={helpCircle} className="text-slate-300 dark:text-slate-600 text-xs" />
        </span>
        <span className="text-[9px] text-slate-400">everyone else</span>
      </div>
    </Frame>
  );
}

/** Found at an hour you were not working. */
export function AlwaysOpenVisual() {
  return (
    <Frame>
      <div className="flex items-center justify-between mb-2.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <IonIcon icon={moon} className="text-[10px]" /> 11:47 pm
        </span>
        <span className="text-[9px] text-slate-400">You: asleep</span>
      </div>
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 mb-2.5">
        <IonIcon icon={search} className="text-slate-400 text-sm" />
        <span className="text-[11px] text-slate-400">tiffin near me</span>
      </div>
      <div className="flex gap-2 p-2 rounded-xl border-2 border-amber-400 bg-amber-50/60 dark:bg-amber-900/10">
        <span className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <IonIcon icon={storefront} className="text-white text-sm" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="h-2.5 w-20 rounded-full bg-amber-300/70 dark:bg-amber-500/50 mb-1.5" />
          <div className="h-2 w-14 rounded-full bg-amber-200/70 dark:bg-amber-600/30" />
        </div>
        <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300 self-center">OPEN</span>
      </div>
      <p className="text-[9px] text-center text-slate-400 mt-2">Your listing answered for you</p>
    </Frame>
  );
}

/** The questions a good listing answers before anyone types them. */
export function AnswersVisual() {
  const rows = [
    { q: "What do you make?", a: "Photos" },
    { q: "How much is it?", a: "₹ on each" },
    { q: "Where are you?", a: "Map" },
    { q: "Are you open?", a: "Timings" },
  ];
  return (
    <Frame>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Asked before every order</p>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.q} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{r.q}</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              <IonIcon icon={checkmarkCircle} className="text-[10px]" />
              {r.a}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-center text-slate-400 mt-2.5">Answered once, not forty times</p>
    </Frame>
  );
}

/** Why a stranger would risk the first order. */
export function VouchVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-2.5 mb-3">
        <Tile className="w-11 h-11 rounded-full shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-20 rounded-full bg-slate-200 dark:bg-slate-600" />
            <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-sm shrink-0" />
          </div>
          <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Verified community member
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <IonIcon key={i} icon={star} className="text-[11px] text-amber-400" />
        ))}
        <span className="text-[9px] text-slate-400 ml-1">from people they know</span>
      </div>
      <div className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/50">
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-600 mb-1" />
        <div className="h-1.5 w-3/4 rounded-full bg-slate-100 dark:bg-slate-700" />
      </div>
    </Frame>
  );
}

/** Interest arriving as something you can act on. */
export function EnquiryVisual() {
  return (
    <Frame>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Enquiries</span>
        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">2 new</span>
      </div>
      {[1, 0.55].map((o, i) => (
        <div
          key={i}
          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 mb-1.5"
          style={{ opacity: o }}
        >
          <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
            <IonIcon icon={chatbubbleEllipses} className="text-white text-xs" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="h-2 w-20 rounded-full bg-slate-200 dark:bg-slate-600 mb-1" />
            <div className="h-1.5 w-28 rounded-full bg-slate-100 dark:bg-slate-700" />
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        </div>
      ))}
      <div className="flex items-center justify-center gap-1 mt-2 px-2 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
        <IonIcon icon={logoWhatsapp} className="text-green-500 text-xs" />
        <span className="text-[9px] font-semibold text-green-700 dark:text-green-400">They message you directly</span>
      </div>
    </Frame>
  );
}

/** The two levers for a quiet week. */
export function LeversVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 mb-1.5">
        <IonIcon icon={pricetag} className="text-rose-500 text-sm shrink-0" />
        <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">20% off this week</span>
      </div>
      <p className="text-[9px] text-slate-400 mb-3 pl-1">Shows in the Deals tab — free</p>
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 mb-1.5">
        <IonIcon icon={trendingUp} className="text-white text-sm shrink-0" />
        <span className="text-[10px] font-bold text-white">Boost — sit at the top</span>
      </div>
      <p className="text-[9px] text-slate-400 pl-1">Only when you want it. Never required.</p>
    </Frame>
  );
}
