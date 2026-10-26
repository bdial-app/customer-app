"use client";
import { useState } from "react";
import { IonIcon } from "@ionic/react";
import { bulbOutline, chevronForwardOutline } from "ionicons/icons";
import { SellingGuideScreen, type GuideDestination, type GuideSection } from "./selling-guide-screen";

/**
 * The way into the Selling guide from the business dashboard. Always shown:
 * a page can always sell better, and the guide is useful long after setup.
 */
export function SellingGuideCard({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: (to: GuideDestination) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-indigo-50 p-4 text-left ring-1 ring-amber-200/70 active:scale-[0.99] transition-transform dark:from-amber-500/10 dark:via-slate-900 dark:to-indigo-500/10 dark:ring-amber-500/20"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/25">
          <IonIcon icon={bulbOutline} className="text-[22px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-bold text-slate-900 dark:text-white">Selling guide</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-slate-500 dark:text-slate-400">
            What photos and words bring more customers, with ready-to-copy templates
          </span>
        </span>
        <IonIcon icon={chevronForwardOutline} className="shrink-0 text-[18px] text-slate-400" />
      </button>
      <SellingGuideScreen open={open} onClose={() => setOpen(false)} onNavigate={onNavigate} />
    </div>
  );
}

/** A one-line link into one part of the guide, for the editing screens. */
export function SellingGuideLink({ section, children }: { section: GuideSection; children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo-600 active:opacity-70 dark:text-indigo-400"
      >
        <IonIcon icon={bulbOutline} className="text-[15px]" />
        {children}
        <IonIcon icon={chevronForwardOutline} className="text-[13px]" />
      </button>
      <SellingGuideScreen open={open} onClose={() => setOpen(false)} section={section} />
    </>
  );
}
