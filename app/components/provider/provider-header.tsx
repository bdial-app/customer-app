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
} from "ionicons/icons";
import { ProviderData } from "@/services/provider.service";
import { useUpdateProvider } from "@/hooks/useMyProvider";
import NotificationBell from "../notification-center/NotificationBell";
import NotificationDropdown from "../notification-center/NotificationDropdown";
import { shareProvider } from "@/utils/sharing";

interface ProviderHeaderProps {
  provider: ProviderData | null;
  verificationStatus: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  active: { label: "Active", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800", icon: checkmarkCircle },
  pending: { label: "Pending", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800", icon: timeOutline },
  in_review: { label: "In Review", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800", icon: timeOutline },
  suspended: { label: "Suspended", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800", icon: alertCircleOutline },
  unverified: { label: "Unverified", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600", icon: alertCircleOutline },
  disabled: { label: "Disabled", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800", icon: alertCircleOutline },
};

const ProviderHeader = ({ provider, verificationStatus }: ProviderHeaderProps) => {
  const updateMutation = useUpdateProvider();
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  if (!provider) return null;

  const status = statusConfig[provider.status] || statusConfig.unverified;
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
    <div className="relative overflow-hidden">
      {/* Teal gradient hero */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 px-5 pb-5" style={{ paddingTop: "calc(var(--sat,0px) + 12px)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white rounded-full backdrop-blur-sm border border-white/20">
              Provider Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <NotificationBell
                onClick={() => setNotifOpen((v) => !v)}
                className="!w-9 !h-9 !rounded-full !bg-white/15 !backdrop-blur-sm !p-0 [&_ion-icon]:!text-white [&_ion-icon]:!text-lg"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                shareProvider({
                  id: provider.id,
                  brandName: provider.brandName || "My Business",
                  description: provider.description,
                });
              }}
              className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
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
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.color}`}>
                <IonIcon icon={status.icon} className="text-xs" />
                {status.label}
              </span>
              {/* Availability inline toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
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
              {verificationStatus === "approved" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/15 text-white/80 border border-white/20">
                  Verified
                </span>
              )}
              {verificationStatus === "pending" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-200 border border-amber-400/20">
                  Pending Verification
                </span>
              )}
              {(!verificationStatus || verificationStatus === "rejected") && (
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
