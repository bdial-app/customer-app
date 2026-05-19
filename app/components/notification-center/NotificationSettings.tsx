"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { Toggle } from "konsta/react";
import {
  useNotificationPreferences,
  useUpdatePreferences,
} from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

function SettingRow({
  label,
  sublabel,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${disabled ? "text-slate-400" : "text-slate-800 dark:text-white"}`}>
          {label}
        </span>
        {sublabel && (
          <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
        )}
      </div>
      <Toggle
        component="label"
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
        className="konsta-color-primary"
      />
    </div>
  );
}

export default function NotificationSettings({ open, onClose }: NotificationSettingsProps) {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdatePreferences();
  const { permissionStatus, requestPermission, isSupported, pushError } = usePushNotifications();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleToggle = (field: string, value: boolean) => {
    updatePrefs.mutate({ [field]: value });
  };

  const handleEnablePush = async () => {
    const success = await requestPermission();
    if (success) {
      handleToggle("pushEnabled", true);
    }
  };

  const masterEnabled = prefs?.pushEnabled ?? true;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 overflow-y-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800"
            style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={onClose}
                className="text-blue-500 font-semibold text-sm active:opacity-50 flex items-center gap-1"
              >
                <IonIcon icon={arrowBack} className="text-lg" />
                Back
              </button>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Notification Settings</h2>
              <div className="w-12" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="px-4 py-4 space-y-3">
              {/* Push Permission Banner */}
              {isSupported && permissionStatus !== "granted" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-2">
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                    Enable Push Notifications
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                    Get notified about new messages, reviews, and important updates
                    even when the app is closed.
                  </p>
                  <button
                    onClick={handleEnablePush}
                    className="w-full py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold active:bg-amber-600 transition-colors"
                  >
                    {permissionStatus === "denied"
                      ? "Permission Blocked — Check Browser Settings"
                      : "Enable Push Notifications"}
                  </button>
                  {permissionStatus === "denied" && (
                    <p className="text-[10px] text-amber-500 mt-2 text-center">
                      You previously blocked notifications. Please enable them in your browser settings.
                    </p>
                  )}
                  {pushError && (
                    <p className="text-[11px] text-red-600 mt-2 text-center bg-red-50 rounded-lg p-2">
                      {pushError}
                    </p>
                  )}
                </div>
              )}

              {/* Master Toggle */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <SettingRow
                  label="Push Notifications"
                  sublabel="Receive push notifications on this device"
                  checked={masterEnabled}
                  onChange={(val) => handleToggle("pushEnabled", val)}
                />
              </div>

              {/* Category Toggles */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Notification Types
                  </span>
                </div>
                <SettingRow
                  label="Chat Messages"
                  sublabel="New messages and enquiries"
                  checked={prefs?.chatMessages ?? true}
                  onChange={(val) => handleToggle("chatMessages", val)}
                  disabled={!masterEnabled}
                />
                <SettingRow
                  label="Reviews"
                  sublabel="New reviews on your business"
                  checked={prefs?.reviewsReceived ?? true}
                  onChange={(val) => handleToggle("reviewsReceived", val)}
                  disabled={!masterEnabled}
                />
                <SettingRow
                  label="Provider Updates"
                  sublabel="Approval, suspension, and status changes"
                  checked={prefs?.providerStatusUpdates ?? true}
                  onChange={(val) => handleToggle("providerStatusUpdates", val)}
                  disabled={!masterEnabled}
                />
                <SettingRow
                  label="Verification Updates"
                  sublabel="Document verification status"
                  checked={prefs?.verificationUpdates ?? true}
                  onChange={(val) => handleToggle("verificationUpdates", val)}
                  disabled={!masterEnabled}
                />
                <SettingRow
                  label="Booking Updates"
                  sublabel="Booking confirmations and changes"
                  checked={prefs?.bookingUpdates ?? true}
                  onChange={(val) => handleToggle("bookingUpdates", val)}
                  disabled={!masterEnabled}
                />
                <SettingRow
                  label="Promotions"
                  sublabel="Deals, offers, and marketing"
                  checked={prefs?.promotional ?? true}
                  onChange={(val) => handleToggle("promotional", val)}
                  disabled={!masterEnabled}
                />
                <SettingRow
                  label="System Announcements"
                  sublabel="App updates and important notices"
                  checked={prefs?.systemAnnouncements ?? true}
                  onChange={(val) => handleToggle("systemAnnouncements", val)}
                  disabled={!masterEnabled}
                />
              </div>

              {/* Quiet Hours */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quiet Hours
                  </span>
                </div>
                <SettingRow
                  label="Quiet Hours"
                  sublabel="Mute push notifications during specific hours"
                  checked={prefs?.quietHoursEnabled ?? false}
                  onChange={(val) => handleToggle("quietHoursEnabled", val)}
                  disabled={!masterEnabled}
                />
                {prefs?.quietHoursEnabled && (
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 block mb-1">Start</label>
                      <input
                        type="time"
                        value={prefs?.quietHoursStart || "22:00"}
                        onChange={(e) => handleToggle("quietHoursStart" as any, e.target.value as any)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 block mb-1">End</label>
                      <input
                        type="time"
                        value={prefs?.quietHoursEnd || "07:00"}
                        onChange={(e) => handleToggle("quietHoursEnd" as any, e.target.value as any)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
