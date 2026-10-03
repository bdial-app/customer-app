"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  cameraOutline,
  shareSocialOutline,
  checkmarkCircle,
  timeOutline,
  alertCircleOutline,
  warningOutline,
  helpCircleOutline,
} from "ionicons/icons";
import { ProviderData } from "@/services/provider.service";
import { useUpdateProvider } from "@/hooks/useMyProvider";
import NotificationBell from "../notification-center/NotificationBell";
import NotificationDropdown from "../notification-center/NotificationDropdown";
import { useShareBusiness } from "@/hooks/useShare";
import { openBusinessTour } from "@/utils/business-tour";
import ViewModeSwitch from "./view-mode-switch";

interface ProviderHeaderProps {
  provider: ProviderData | null;
  verificationStatus: string | null;
  warningCount?: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  active: { label: "Active", color: "text-emerald-700 dark:text-white", bg: "bg-emerald-50 dark:bg-emerald-500/30 border-emerald-200 dark:border-emerald-400/40", icon: checkmarkCircle },
  pending: { label: "In Review", color: "text-amber-700 dark:text-white", bg: "bg-amber-50 dark:bg-amber-500/25 border-amber-200 dark:border-amber-400/40", icon: timeOutline },
  in_review: { label: "In Review", color: "text-blue-700 dark:text-white", bg: "bg-blue-50 dark:bg-blue-500/25 border-blue-200 dark:border-blue-400/40", icon: timeOutline },
  suspended: { label: "Suspended", color: "text-red-700 dark:text-white", bg: "bg-red-50 dark:bg-red-500/25 border-red-200 dark:border-red-400/40", icon: alertCircleOutline },
  unverified: { label: "Unverified", color: "text-slate-600 dark:text-white/80", bg: "bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/20", icon: alertCircleOutline },
  verification_in_review: { label: "Verification In Review", color: "text-blue-700 dark:text-white", bg: "bg-blue-50 dark:bg-blue-500/25 border-blue-200 dark:border-blue-400/40", icon: timeOutline },
  rejected: { label: "Verification Rejected", color: "text-red-700 dark:text-white", bg: "bg-red-50 dark:bg-red-500/25 border-red-200 dark:border-red-400/40", icon: alertCircleOutline },
  disabled: { label: "Disabled", color: "text-red-700 dark:text-white", bg: "bg-red-50 dark:bg-red-500/25 border-red-200 dark:border-red-400/40", icon: alertCircleOutline },
};

const ProviderHeader = ({ provider, verificationStatus, warningCount = 0 }: ProviderHeaderProps) => {
  const updateMutation = useUpdateProvider();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  // The owner speaking for their own business: "We're on Tijarah Connect!"
  // Above the early return: hooks run on every render.
  const { share: shareBusiness, busy: sharing } = useShareBusiness(provider?.id, { asOwner: true, prefetch: false });

  if (!provider) return null;

  // Verification status takes priority over provider.status for the badge
  let effectiveStatus: string;
  if (verificationStatus === "approved") {
    effectiveStatus = "active";
  } else if (verificationStatus === "in_review") {
    effectiveStatus = "verification_in_review";
  } else if (verificationStatus === "rejected") {
    effectiveStatus = "rejected";
  } else {
    effectiveStatus = provider.status;
  }
  const status = statusConfig[effectiveStatus] || statusConfig.unverified;
  const initials = (provider.brandName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleToggleAvailability = () => {
    updateMutation.mutate({
      id: provider.id,
      payload: { isAvailable: !provider.isAvailable },
    });
  };

  return (
    <>
    <div data-tour="home-header" className="relative overflow-hidden">
      {/* Indigo gradient hero — the business skin */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-600 px-5 pb-5" style={{ paddingTop: "calc(var(--sat,0px) + 12px)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          {/* Business ⇄ Customer: see the app the way customers do */}
          <ViewModeSwitch />
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => openBusinessTour()}
              aria-label="How the business side works"
              data-tour="home-help"
              className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
            >
              <IonIcon icon={helpCircleOutline} className="text-white text-[19px]" />
            </motion.button>
            <div onClick={(e) => e.stopPropagation()}>
              <NotificationBell
                onClick={() => setNotifOpen((v) => !v)}
                className="!w-9 !h-9 !rounded-full !bg-white/15 !backdrop-blur-sm !p-0 [&_ion-icon]:!text-white [&_ion-icon]:!text-lg"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => void shareBusiness()}
              disabled={sharing}
              aria-busy={sharing}
              aria-label="Share your business"
              className={`w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ${sharing ? "opacity-60 animate-pulse" : ""}`}
            >
              <IonIcon icon={shareSocialOutline} className="text-white text-lg" />
            </motion.button>
          </div>
        </div>

        {/* Profile section */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 overflow-hidden">
              {provider.profilePhotoUrl && !avatarError ? (
                <img
                  src={provider.profilePhotoUrl}
                  alt={provider.brandName}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-2xl font-bold text-white">{initials}</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {provider.brandName || "My Business"}
            </h1>
            <p className="text-white/70 text-sm mt-0.5">
              {provider.area && provider.city
                ? `${provider.area}, ${provider.city}`
                : provider.city || "Location not set"}
            </p>
            {/* Status + Availability */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.color}`}>
                <IonIcon icon={status.icon} className="text-xs" />
                {status.label}
              </span>
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  <IonIcon icon={warningOutline} className="text-xs" />
                  {warningCount} warning{warningCount > 1 ? "s" : ""}
                </span>
              )}
              {/* Availability inline toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                data-tour="home-open-toggle"
                onClick={handleToggleAvailability}
                disabled={updateMutation.isPending}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                  provider.isAvailable
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${provider.isAvailable ? "bg-emerald-500" : "bg-red-400"}`} />
                {provider.isAvailable ? "Open" : "Closed"}
              </motion.button>
              {verificationStatus === "approved" && effectiveStatus !== "active" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/15 text-white/80 border border-white/20">
                  Verified
                </span>
              )}
              {verificationStatus === "in_review" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-200 border border-amber-400/20">
                  Pending Verification
                </span>
              )}
              {effectiveStatus !== "unverified" && (!verificationStatus || verificationStatus === "rejected") && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-200 border border-red-400/20">
                  Not Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};

export default ProviderHeader;
