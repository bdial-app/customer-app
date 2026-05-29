"use client";
import { IonIcon } from "@ionic/react";
import { locationOutline, settingsOutline, closeOutline } from "ionicons/icons";
import { BottomSheet } from "./bottom-sheet";
import { hideLocationDeniedSheet, useLocationDeniedSheet } from "@/hooks/useLocationDeniedSheet";
import { openAppSettings } from "@/utils/geolocation";

/**
 * Global sheet shown when a feature requiring location is invoked but the
 * permission was previously denied. Provides a clear explanation and a
 * direct link to the device's app settings (per App Review guideline 5.1.1).
 */
export default function LocationDeniedSheet() {
  const { open, featureLabel } = useLocationDeniedSheet();

  const handleOpenSettings = async () => {
    await openAppSettings();
    hideLocationDeniedSheet();
  };

  return (
    <BottomSheet opened={open} onClose={hideLocationDeniedSheet}>
      <div className="px-6 pt-6 pb-8 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={hideLocationDeniedSheet}
          aria-label="Close"
          className="absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
        >
          <IonIcon icon={closeOutline} className="text-xl" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
          <IonIcon icon={locationOutline} className="text-2xl text-blue-500" />
        </div>

        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          Location access needed
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[300px] mb-6">
          {featureLabel
            ? `${featureLabel} needs your location to work. Please enable location access in Settings to continue.`
            : "This feature needs your location to work. Please enable location access in Settings to continue."}
        </p>

        <button
          onClick={handleOpenSettings}
          className="w-full max-w-sm py-3.5 rounded-2xl bg-amber-500 text-white text-[15px] font-semibold active:bg-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <IonIcon icon={settingsOutline} className="text-lg" />
          Open Settings
        </button>

        <button
          onClick={hideLocationDeniedSheet}
          className="mt-2 w-full max-w-sm py-3 text-[14px] font-medium text-slate-500 dark:text-slate-400 active:opacity-70"
        >
          Not now
        </button>
      </div>
    </BottomSheet>
  );
}
