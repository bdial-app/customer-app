"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { settingsOutline, closeOutline } from "ionicons/icons";
import { usePermissionReminder } from "@/hooks/usePermissionReminder";

/**
 * Non-blocking banner that appears when native permissions are denied
 * and enough time has passed since the last prompt (3+ days).
 */
export default function PermissionReminderBanner() {
  const { showReminder, deniedPermissions, dismiss, openSettings } = usePermissionReminder();

  return (
    <AnimatePresence>
      {showReminder && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[150] px-4"
          style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
        >
          <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-3.5 mt-2 shadow-lg shadow-black/5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={settingsOutline} className="text-lg text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {deniedPermissions.join(" & ")} disabled
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Enable in settings for the best experience
              </p>
              <button
                onClick={openSettings}
                className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 underline underline-offset-2 active:opacity-60"
              >
                Open Settings
              </button>
            </div>
            <button
              onClick={dismiss}
              className="text-amber-400 active:text-amber-600 p-1 -mr-1 -mt-1"
            >
              <IonIcon icon={closeOutline} className="text-lg" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
