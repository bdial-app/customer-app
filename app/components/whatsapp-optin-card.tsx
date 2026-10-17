"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, checkmarkDone, close, logoWhatsapp } from "ionicons/icons";
import { useAppSelector } from "@/hooks/useAppStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useSetWhatsAppConsent, useWhatsAppConsent } from "@/hooks/useWhatsAppConsent";
import { useNotification } from "@/app/context/NotificationContext";

type Variant = "customer" | "business";

/** How long "×" hides the card before it may come back. */
const HIDE_DAYS: Record<Variant, number> = { customer: 21, business: 14 };
const hideKey = (variant: Variant, userId: string | undefined) => `wa_card_hidden_${variant}_${userId ?? "guest"}`;

function hiddenUntil(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

/** The pretend WhatsApp message, so people see exactly what they'd get. */
function MessagePreview({ variant, brandName }: { variant: Variant; brandName: string | null }) {
  const lines =
    variant === "business"
      ? {
          from: "Tijarah",
          body: `New enquiry for ${brandName ?? "your business"} 👋\n"Hi, do you deliver to Kondhwa this weekend?"`,
          button: "Reply in Tijarah",
        }
      : {
          from: "Tijarah",
          body: "🏷️ This weekend near you: 20% off at Burhani Sweets, and a new tiffin service in Kondhwa.",
          button: "See deals",
        };
  return (
    <div className="relative rounded-2xl bg-[#ECE5DD] dark:bg-[#0B141A] p-3 overflow-hidden">
      <div className="max-w-[92%] rounded-xl rounded-tl-sm bg-white dark:bg-[#202C33] shadow-sm px-3 py-2">
        <p className="text-[11px] font-bold text-[#128C7E] dark:text-[#25D366]">{lines.from}</p>
        <p className="text-[12.5px] text-slate-800 dark:text-slate-100 leading-snug whitespace-pre-line mt-0.5">{lines.body}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-slate-400">10:42</span>
          <IonIcon icon={checkmarkDone} className="text-[13px] text-sky-500" />
        </div>
        <div className="-mx-3 -mb-2 mt-1.5 border-t border-slate-100 dark:border-slate-700 py-1.5 text-center text-[12px] font-semibold text-sky-600 dark:text-sky-400">
          {lines.button}
        </div>
      </div>
    </div>
  );
}

/**
 * Invites people to get Tijarah on WhatsApp: customers on the home screen
 * (replies from businesses and deals near them), owners on their dashboard
 * (customer enquiries the moment they arrive). One tap turns it on, with
 * the number it goes to and how to stop shown up front. It only appears to
 * people who haven't decided; "×" hides it for a few weeks.
 */
export default function WhatsAppOptInCard({ variant, className = "" }: { variant: Variant; className?: string }) {
  const user = useAppSelector((s) => s.auth.user);
  const { requireAuth } = useAuthGate();
  const { notify } = useNotification();
  const { data } = useWhatsAppConsent(!!user?.id);
  const setConsent = useSetWhatsAppConsent();
  const [hidden, setHidden] = useState(true);
  const [justTurnedOn, setJustTurnedOn] = useState(false);
  const key = hideKey(variant, user?.id);

  // Read the "×" choice after mount (localStorage isn't there on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage once mounted
    setHidden(hiddenUntil(key) > Date.now());
  }, [key]);

  const isGuest = !user?.id;
  const role = data?.role;
  const relevant =
    variant === "business"
      ? role === "owner" && data?.applicable && data.consent !== "opted_in"
      : isGuest || (role === "customer" && data?.applicable && data.consent === "unknown");

  const show = (relevant && !hidden) || justTurnedOn;
  const turnedOff = variant === "business" && data?.consent === "opted_out";

  const dismiss = () => {
    try {
      localStorage.setItem(key, String(Date.now() + HIDE_DAYS[variant] * 86_400_000));
    } catch {
      // Private mode: it just shows again next time.
    }
    setHidden(true);
    setJustTurnedOn(false);
  };

  const turnOn = () => {
    const run = () =>
      setConsent.mutate(
        { consent: "opted_in", source: variant === "business" ? "app_dashboard_card" : "app_home_card" },
        {
          onSuccess: (status) => {
            if (status.consent !== "opted_in") return;
            setJustTurnedOn(true);
            setTimeout(() => setJustTurnedOn(false), 6000);
          },
          onError: () =>
            notify({ title: "Couldn't turn it on", subtitle: "Check your connection and try again.", variant: "error" }),
        },
      );
    // Guests sign in first; it turns on as soon as they're in.
    requireAuth(run);
  };

  const title =
    variant === "business"
      ? turnedOff
        ? "WhatsApp alerts are off"
        : "Never miss a customer enquiry"
      : "Get Tijarah on WhatsApp";
  const body =
    variant === "business"
      ? turnedOff
        ? `New enquiries for ${data?.brandName ?? "your business"} only show when you open the app. Turn alerts back on to reply while customers are still looking.`
        : `Get every enquiry for ${data?.brandName ?? "your business"} on WhatsApp the moment it arrives, plus your monthly report and free-lead updates.`
      : "Replies from businesses and the best deals near you, straight to your WhatsApp.";

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          key="wa-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
          transition={{ duration: 0.25 }}
          className={className}
          aria-label={title}
        >
          <div className="relative rounded-3xl overflow-hidden border border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-teal-950/40 shadow-sm">
            {!justTurnedOn && (
              <button
                onClick={dismiss}
                aria-label="Hide"
                className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-black/5 dark:active:bg-white/10"
              >
                <IonIcon icon={close} className="text-lg" />
              </button>
            )}

            {justTurnedOn ? (
              <div className="flex items-center gap-3 p-4">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0"
                >
                  <IonIcon icon={checkmarkCircle} className="text-white text-2xl" />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-slate-900 dark:text-white">You&apos;re all set</p>
                  <p className="text-[12.5px] text-slate-600 dark:text-slate-300 leading-snug">
                    {variant === "business" ? "Enquiries will" : "Updates will"} come to{" "}
                    <span className="font-semibold tabular-nums">{setConsent.data?.phoneMasked ?? "your WhatsApp"}</span>.
                    Change it anytime in Notification Settings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start gap-3 pr-8">
                  <div className="w-11 h-11 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                    <IonIcon icon={logoWhatsapp} className="text-white text-2xl" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
                    <p className="text-[12.5px] text-slate-600 dark:text-slate-300 leading-snug mt-1">{body}</p>
                  </div>
                </div>

                <div className="mt-3.5">
                  <MessagePreview variant={variant} brandName={data?.brandName ?? null} />
                </div>

                <button
                  onClick={turnOn}
                  disabled={setConsent.isPending}
                  className="mt-3.5 w-full h-11 rounded-2xl bg-[#25D366] text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  <IonIcon icon={logoWhatsapp} className="text-lg" />
                  {setConsent.isPending
                    ? "Turning on…"
                    : isGuest
                      ? "Sign in to turn on"
                      : variant === "business"
                        ? turnedOff
                          ? "Turn alerts back on"
                          : "Turn on WhatsApp alerts"
                        : "Turn on WhatsApp updates"}
                </button>
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
                  {data?.phoneMasked ? (
                    <>
                      To <span className="font-medium tabular-nums">{data.phoneMasked}</span> ·{" "}
                    </>
                  ) : null}
                  No spam · Reply STOP anytime
                </p>
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
