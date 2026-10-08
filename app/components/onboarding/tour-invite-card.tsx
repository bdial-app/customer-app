"use client";
import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { closeOutline, compassOutline, play } from "ionicons/icons";
import { useStorageReady } from "@/hooks/useStorageReady";
import { closeInvite, countInviteOpen, INVITE_MAX_OPENS, readInvite, subscribeInvite, type InviteScope } from "@/utils/tour-invite";
import { useAppSelector } from "@/hooks/useAppStore";
import { openCustomerTour, readCustomerTour, subscribeCustomerTour } from "@/utils/customer-tour";
import { openBusinessTour, readBusinessTour, subscribeBusinessTour } from "@/utils/business-tour";

/**
 * A quiet invitation to the guided tour, inline on the screen — never a
 * pop-up. Shown on the first few app opens until waved off or taken.
 */
export default function TourInviteCard({
  scope,
  alreadyToured,
  title,
  body,
  onStart,
  className = "",
}: {
  scope: InviteScope;
  /** Already took (or dismissed) the tour before this card existed. */
  alreadyToured: boolean;
  title: string;
  body: string;
  onStart: () => void;
  className?: string;
}) {
  const storageReady = useStorageReady();
  const snapshot = useSyncExternalStore(
    subscribeInvite,
    () => JSON.stringify(readInvite(scope)),
    () => JSON.stringify({ opens: 0, done: true, lastAt: 0 }),
  );
  const record = JSON.parse(snapshot) as { opens: number; done: boolean };
  const eligible = storageReady && !alreadyToured && !record.done;

  // Count this app open once the card can show.
  useEffect(() => {
    if (eligible) countInviteOpen(scope);
  }, [eligible, scope]);

  const show = eligible && record.opens > 0 && record.opens <= INVITE_MAX_OPENS;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="tour-invite"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className={`overflow-hidden ${className}`}
        >
          <div className="relative flex items-center gap-3 rounded-2xl p-3.5 pr-10 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/60 dark:to-violet-950/50 ring-1 ring-indigo-100 dark:ring-indigo-900/60">
            <span className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <IonIcon icon={compassOutline} className="text-[22px] text-white" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-snug">{title}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{body}</p>
              <button
                type="button"
                onClick={() => {
                  closeInvite(scope);
                  onStart();
                }}
                className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-indigo-600 text-white text-[12px] font-bold active:scale-[0.97] transition-transform"
              >
                <IonIcon icon={play} className="text-[11px]" />
                Show me around
              </button>
            </div>
            <button
              type="button"
              onClick={() => closeInvite(scope)}
              aria-label="Not now"
              className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 active:bg-white/60 dark:active:bg-slate-800"
            >
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── The two places it appears ──────────────────────────────────────────

const toured = (r: { chapters: string[]; dismissed?: boolean }) => !!r.dismissed || r.chapters.length > 0;

/** Home: the app tour, once per device (signing in or out doesn't bring it back). */
export function CustomerTourInvite({ className }: { className?: string }) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const alreadyToured = useSyncExternalStore(
    subscribeCustomerTour,
    () => toured(readCustomerTour("guest")) || (!!userId && toured(readCustomerTour(userId))),
    () => true,
  );
  return (
    <TourInviteCard
      scope="customer"
      alreadyToured={alreadyToured}
      title="New to Tijarah? Take a 1-minute tour"
      body="See how to find businesses, products and offers near you."
      onStart={() => openCustomerTour()}
      className={className}
    />
  );
}

/** Business dashboard: the owner tour, once per account on this device. */
export function BusinessTourInvite({ className }: { className?: string }) {
  const userId = useAppSelector((s) => s.auth.user?.id);
  const alreadyToured = useSyncExternalStore(
    subscribeBusinessTour,
    () => !userId || toured(readBusinessTour(userId)),
    () => true,
  );
  if (!userId) return null;
  return (
    <TourInviteCard
      scope={`business.${userId}`}
      alreadyToured={alreadyToured}
      title="New to your dashboard? Take a quick tour"
      body="See where to add products, offers and photos, and how to get more customers."
      onStart={() => openBusinessTour()}
      className={className}
    />
  );
}
