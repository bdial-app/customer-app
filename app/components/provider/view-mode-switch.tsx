"use client";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { storefront, bagHandle } from "ionicons/icons";
import { useAppContext } from "@/app/context/AppContext";
import { useIsClient } from "@/hooks/useIsClient";
import { triggerHaptic } from "@/utils/haptics";

const HOLD_MS = 950;

// The cover outlives the business header (which unmounts the moment the mode
// flips), so its state sits in a tiny module store and the overlay is mounted
// by the always-present main page.
let switching = false;
const listeners = new Set<() => void>();
const setSwitching = (v: boolean) => {
  switching = v;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * Business ⇄ Customer switch for the business header. Tapping Customer plays a
 * short hand-off — storefront turning into a shopping bag — while the app flips
 * to the customer side underneath, so the change of scenery never feels abrupt.
 */
export default function ViewModeSwitch() {
  const { setUserMode } = useAppContext();

  const toCustomer = () => {
    if (switching) return;
    triggerHaptic("medium");
    setSwitching(true);
    // Flip under the cover, then let the cover fade off the new screen.
    setTimeout(() => setUserMode("customer"), HOLD_MS / 2);
    setTimeout(() => setSwitching(false), HOLD_MS);
  };

  return (
    <div
      data-tour="home-view-switch"
      role="tablist"
      aria-label="Switch view"
      className="relative flex items-center p-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20"
    >
      <span
        role="tab"
        aria-selected="true"
        className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full bg-white text-indigo-700 text-[11px] font-bold shadow-sm"
      >
        <IonIcon icon={storefront} className="text-[12px]" />
        Business
      </span>
      <button
        role="tab"
        aria-selected="false"
        onClick={toCustomer}
        className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full text-white/85 text-[11px] font-bold active:scale-95 transition-transform"
      >
        <IonIcon icon={bagHandle} className="text-[12px]" />
        Customer
      </button>
    </div>
  );
}

/** The full-screen hand-off shown while switching to customer view. Mount once, near the app root. */
export function ModeSwitchOverlay() {
  const mounted = useIsClient();
  const active = useSyncExternalStore(subscribe, () => switching, () => false);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          key="mode-switch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center"
          style={{ background: "linear-gradient(160deg, #312E81 0%, #4F46E5 45%, #F59E0B 100%)" }}
        >
          <div className="relative w-20 h-20">
            <motion.span
              className="absolute inset-0 rounded-3xl bg-white/15 flex items-center justify-center"
              initial={{ scale: 1, rotate: 0, opacity: 1 }}
              animate={{ scale: 0.6, rotate: -20, opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <IonIcon icon={storefront} className="text-4xl text-white" />
            </motion.span>
            <motion.span
              className="absolute inset-0 rounded-3xl bg-white flex items-center justify-center shadow-2xl"
              initial={{ scale: 0.6, rotate: 20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 18 }}
            >
              <IonIcon icon={bagHandle} className="text-4xl text-amber-500" />
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5 text-white text-[15px] font-bold"
          >
            Switching to customer view
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-1 text-white/75 text-[12px]"
          >
            Tap “Business” at the top of the home screen to come back
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
