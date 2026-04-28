"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { setSoftPromptShown } from "@/store/slices/notificationSlice";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { notificationsOutline, close } from "ionicons/icons";

const SHOW_DELAY_MS = 3000;

/**
 * A soft prompt that slides up from the bottom asking the user
 * to enable push notifications. Shown once per session for
 * authenticated users whose permission status is still "default".
 */
export default function PushNotificationPrompt() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.token !== null);
  const { permissionStatus, softPromptShown } = useAppSelector(
    (s) => s.notification,
  );
  const { requestPermission, isSupported } = usePushNotifications();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const shouldShow =
    isAuthenticated &&
    isSupported &&
    permissionStatus === "default" &&
    !softPromptShown;

  // Delay showing the prompt so it doesn't interrupt the initial load
  useEffect(() => {
    if (!shouldShow) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  const handleEnable = async () => {
    setLoading(true);
    await requestPermission();
    setLoading(false);
    dispatch(setSoftPromptShown());
    setVisible(false);
  };

  const handleDismiss = () => {
    dispatch(setSoftPromptShown());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-3 right-3 z-[200] rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:opacity-50"
            aria-label="Dismiss"
          >
            <IonIcon icon={close} className="text-lg" />
          </button>

          <div className="flex items-start gap-3 p-4 pr-10">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <IonIcon
                icon={notificationsOutline}
                className="text-xl text-amber-500"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Stay in the loop
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Get notified about new messages, reviews, and important updates
                — even when the app is closed.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold active:bg-amber-600 transition-colors disabled:opacity-60"
                >
                  {loading ? "Enabling…" : "Enable Notifications"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
