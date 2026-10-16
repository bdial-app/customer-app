"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IonIcon } from "@ionic/react";
import { logoWhatsapp } from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import { useAppSelector } from "@/hooks/useAppStore";
import { useAppContext } from "@/app/context/AppContext";
import {
  useSetWhatsAppConsent,
  useWhatsAppConsent,
  useWhatsAppConsentLater,
} from "@/hooks/useWhatsAppConsent";
import { hasOpenOverlay, subscribeBackStack } from "@/hooks/useBackDismiss";
import { readBusinessTour, subscribeBusinessTour } from "@/utils/business-tour";

/** Give the app a moment to settle before asking anything. */
const SETTLE_MS = 4000;

/**
 * Asks a business owner, once they're signed in and the app is quiet, whether
 * Tijarah may send customer enquiries to their WhatsApp. If our team already
 * recorded a yes when onboarding them, it asks them to confirm it. The server
 * decides when to ask (never after a no; "Not now" asks again after 30 days,
 * at most three times).
 */
export default function WhatsAppConsentPrompter() {
  const user = useAppSelector((s) => s.auth.user);
  const { providerStatus, providerStatusResolved, userMode } = useAppContext();
  const pathname = usePathname();
  const isOwner =
    !!user?.id && providerStatusResolved && providerStatus !== "not_applied" && userMode === "provider";
  const onboarding = pathname?.startsWith("/provider-onboarding");

  const { data } = useWhatsAppConsent(isOwner && !onboarding);
  const setConsent = useSetWhatsAppConsent();
  const later = useWhatsAppConsentLater();
  const [open, setOpen] = useState(false);
  const answered = useRef(false);

  // Wait until nothing else is on screen and the business tour is out of the way.
  useEffect(() => {
    if (!isOwner || onboarding || !data?.shouldPrompt || open || answered.current || !user?.id) return;
    const userId = user.id;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tourDone = () => {
      const t = readBusinessTour(userId);
      return !!t.dismissed || t.chapters.length > 0;
    };
    const tryOpen = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!hasOpenOverlay() && tourDone()) setOpen(true);
      }, SETTLE_MS);
    };
    tryOpen();
    const offStack = subscribeBackStack(tryOpen);
    const offTour = subscribeBusinessTour(tryOpen);
    return () => {
      if (timer) clearTimeout(timer);
      offStack();
      offTour();
    };
  }, [isOwner, onboarding, data?.shouldPrompt, open, user?.id]);

  if (!data?.applicable) return null;
  const confirm = data.promptKind === "confirm";
  const business = data.brandName ?? "your business";
  const busy = setConsent.isPending || later.isPending;

  const close = () => {
    setOpen(false);
    answered.current = true;
  };
  const answerYes = () => {
    setConsent.mutate({ consent: "opted_in", source: "app_prompt" });
    close();
  };
  const answerNo = () => {
    // "Turn off" when confirming our team's record; "Not now" asks again later.
    if (confirm) setConsent.mutate({ consent: "opted_out", source: "app_prompt" });
    else later.mutate();
    close();
  };
  const dismiss = () => {
    if (answered.current) return; // closed by one of the buttons
    later.mutate();
    close();
  };

  return (
    <Sheet
      open={open}
      onClose={dismiss}
      label="WhatsApp alerts"
      zIndex={10000}
      wideWidth="max-w-sm"
      className="bg-white dark:bg-slate-800"
    >
      <div className="px-6 pt-3 pb-6 sm:pt-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-sm">
          <IonIcon icon={logoWhatsapp} className="text-white text-3xl" />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-800 dark:text-white mb-2">
          {confirm ? "Keep WhatsApp alerts on?" : "Get customer enquiries on WhatsApp"}
        </h3>
        <p className="text-sm text-center text-slate-600 dark:text-slate-300 leading-relaxed">
          {confirm
            ? `When ${business} joined Tijarah, you told our team you'd like customer enquiries on WhatsApp. Please confirm that's still okay.`
            : `When a customer enquires about ${business}, we'll send it straight to your WhatsApp so you never miss one. You'll also get your monthly report and free-lead updates.`}
        </p>
        {data.phoneMasked && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">
            Messages go to <span className="font-semibold tabular-nums">{data.phoneMasked}</span>
          </p>
        )}
        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
          From Tijarah, the business app of the Dawoodi Bohra community. Reply STOP anytime, or change it in
          Notification Settings.
        </p>
        <div className="flex flex-col gap-2 mt-5">
          <button
            onClick={answerYes}
            disabled={busy}
            className="w-full py-3 bg-[#25D366] text-white font-bold text-sm rounded-xl active:scale-95 transition-transform disabled:opacity-60"
          >
            {confirm ? "Yes, keep them on" : "Yes, alert me on WhatsApp"}
          </button>
          <button
            onClick={answerNo}
            disabled={busy}
            className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium text-sm rounded-xl active:scale-95 transition-transform"
          >
            {confirm ? "Turn them off" : "Not now"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
