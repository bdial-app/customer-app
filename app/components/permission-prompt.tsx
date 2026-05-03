"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { locationOutline, notificationsOutline, checkmarkCircle, closeCircle, arrowForward } from "ionicons/icons";
import { useAppPermissions, dismissPermissionPrompt, type PermissionState } from "@/hooks/useAppPermissions";
import { getNativePlatform } from "@/utils/platform";

/**
 * Full-screen overlay shown on first native app launch to request
 * geolocation and notification permissions with a friendly explanation.
 */
export default function PermissionPrompt() {
  const { permissions, needsPrompt, requestLocation, requestNotifications, requesting } = useAppPermissions();
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<"intro" | "requesting" | "done">("intro");
  const [results, setResults] = useState<{ location?: PermissionState; notifications?: PermissionState }>({});

  if (!needsPrompt || !visible) return null;

  const platform = getNativePlatform();
  const isIOS = platform === "ios";

  const handleContinue = async () => {
    setStep("requesting");

    // Request location first
    const locResult = await requestLocation();
    setResults((r) => ({ ...r, location: locResult }));

    // Small delay between permission dialogs to avoid confusion
    await new Promise((r) => setTimeout(r, 500));

    // Then notifications
    const notifResult = await requestNotifications();
    setResults((r) => ({ ...r, notifications: notifResult }));

    setStep("done");
  };

  const handleDismiss = () => {
    dismissPermissionPrompt();
    setVisible(false);
  };

  const handleDone = () => {
    dismissPermissionPrompt();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 20px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        }}
      >
        {step === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col flex-1 px-6"
          >
            {/* Header */}
            <div className="flex justify-end">
              <button
                onClick={handleDismiss}
                className="text-sm text-slate-400 active:text-slate-600 py-2 px-3"
              >
                Skip
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center -mt-10">
              {/* App icon area */}
              <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
                <span className="text-3xl font-bold text-white">T</span>
              </div>

              <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
                Welcome to Tijarah
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-10 max-w-[280px]">
                To give you the best experience, we need a couple of permissions
              </p>

              {/* Permission cards */}
              <div className="w-full space-y-3 max-w-sm">
                <PermissionCard
                  icon={locationOutline}
                  title="Location Access"
                  description="Find nearby services and providers in your area"
                  iconColor="text-blue-500"
                  iconBg="bg-blue-50 dark:bg-blue-900/30"
                />
                <PermissionCard
                  icon={notificationsOutline}
                  title="Notifications"
                  description="Get notified about messages, reviews, and updates"
                  iconColor="text-amber-500"
                  iconBg="bg-amber-50 dark:bg-amber-900/30"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="px-2 pb-4">
              <button
                onClick={handleContinue}
                className="w-full py-3.5 rounded-2xl bg-amber-500 text-white text-[15px] font-semibold active:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <IonIcon icon={arrowForward} className="text-lg" />
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-3">
                You can change these anytime in {isIOS ? "Settings" : "App Settings"}
              </p>
            </div>
          </motion.div>
        )}

        {step === "requesting" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="text-base font-semibold text-slate-700 dark:text-white">
              Setting up permissions...
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Please respond to the permission dialogs
            </p>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-6">
              <IonIcon icon={checkmarkCircle} className="text-4xl text-green-500" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
              You&apos;re all set!
            </h2>

            <div className="w-full max-w-sm space-y-2 mb-8">
              <PermissionResult
                label="Location"
                state={results.location || permissions.location}
              />
              <PermissionResult
                label="Notifications"
                state={results.notifications || permissions.notifications}
              />
            </div>

            {(results.location === "denied" || results.notifications === "denied") && (
              <p className="text-xs text-slate-400 text-center max-w-[260px] mb-6">
                Some permissions were denied. You can enable them later in your device settings for the full experience.
              </p>
            )}

            <button
              onClick={handleDone}
              className="w-full max-w-sm py-3.5 rounded-2xl bg-amber-500 text-white text-[15px] font-semibold active:bg-amber-600 transition-colors"
            >
              Get Started
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function PermissionCard({
  icon,
  title,
  description,
  iconColor,
  iconBg,
}: {
  icon: string;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <IonIcon icon={icon} className={`text-xl ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function PermissionResult({ label, state }: { label: string; state: PermissionState | "unknown" }) {
  const granted = state === "granted";
  return (
    <div className="flex items-center justify-between py-2.5 px-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="flex items-center gap-1.5">
        <IonIcon
          icon={granted ? checkmarkCircle : closeCircle}
          className={`text-lg ${granted ? "text-green-500" : "text-slate-300 dark:text-slate-600"}`}
        />
        <span className={`text-xs ${granted ? "text-green-600" : "text-slate-400"}`}>
          {granted ? "Enabled" : "Not enabled"}
        </span>
      </div>
    </div>
  );
}
