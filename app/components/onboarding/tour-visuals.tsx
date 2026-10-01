"use client";

import { IonIcon } from "@ionic/react";
import { search, checkmarkCircle, star, call, logoWhatsapp, navigate } from "ionicons/icons";

/**
 * Pictures for the customer half of the tour. Built from the app's own card
 * shapes rather than stock illustrations, so what someone sees here is what
 * they meet a moment later on the real screen. The business half lives in
 * business-visuals.tsx.
 */

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full max-w-[280px] mx-auto rounded-3xl p-3.5 bg-white dark:bg-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-700">
    {children}
  </div>
);

const Tile = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-amber-100 to-orange-50 dark:from-slate-700 dark:to-slate-600 ${className}`} />
);

/** Searching and browsing: the bar, the categories, a result with a distance. */
export function FindVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 mb-2.5">
        <IonIcon icon={search} className="text-slate-400 text-sm" />
        <span className="text-[11px] text-slate-400">Mehndi, tiffin, tailor…</span>
      </div>
      <div className="flex gap-1.5 mb-2.5">
        {["Food", "Fashion", "Home"].map((c) => (
          <span key={c} className="text-[9px] font-semibold px-2 py-1 rounded-full bg-amber-50 dark:bg-slate-700 text-amber-700 dark:text-amber-300">
            {c}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Tile className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-2.5 w-24 rounded-full bg-slate-200 dark:bg-slate-600 mb-1.5" />
          <div className="h-2 w-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-2" />
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/80 text-white">
            <IonIcon icon={navigate} className="text-[9px]" /> 2.4 km
          </span>
        </div>
      </div>
    </Frame>
  );
}

/** Trust: the verified badge, real reviews, the women-led mark. */
export function TrustVisual() {
  return (
    <Frame>
      <div className="flex items-center gap-2.5 mb-3">
        <Tile className="w-11 h-11 rounded-full shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-20 rounded-full bg-slate-200 dark:bg-slate-600" />
            <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-sm shrink-0" />
          </div>
          <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300">
            WOMEN-LED
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <IonIcon key={i} icon={star} className={`text-[11px] ${i <= 4 ? "text-amber-400" : "text-slate-200 dark:text-slate-600"}`} />
        ))}
        <span className="text-[9px] text-slate-400 ml-1">28 reviews</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
        <div className="h-2 w-4/5 rounded-full bg-slate-100 dark:bg-slate-700" />
      </div>
    </Frame>
  );
}

/** Connecting: the three things a listing actually does. */
export function ConnectVisual() {
  const actions = [
    { icon: call, label: "Call", bg: "bg-emerald-500" },
    { icon: logoWhatsapp, label: "WhatsApp", bg: "bg-green-500" },
    { icon: navigate, label: "Directions", bg: "bg-blue-500" },
  ];
  return (
    <Frame>
      <Tile className="w-full h-16 rounded-xl mb-2.5" />
      <div className="h-2.5 w-24 rounded-full bg-slate-200 dark:bg-slate-600 mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {actions.map((a) => (
          <div key={a.label} className="flex flex-col items-center gap-1">
            <span className={`w-9 h-9 rounded-full ${a.bg} flex items-center justify-center`}>
              <IonIcon icon={a.icon} className="text-white text-sm" />
            </span>
            <span className="text-[8px] font-semibold text-slate-500 dark:text-slate-400">{a.label}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

