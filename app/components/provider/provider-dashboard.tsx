"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  sparklesOutline,
  chevronForwardOutline,
  imageOutline,
  cubeOutline,
  chatbubbleOutline,
  megaphoneOutline,
  star,
  trendingUpOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  alertCircleOutline,
  closeCircleOutline,
  personCircleOutline,
  calendarOutline,
  flashOutline,
  ribbonOutline,
  shieldCheckmarkOutline,
  searchOutline,
  peopleOutline,
  pricetagOutline,
  storefrontOutline,
  timeOutline,
  cameraOutline,
  brushOutline,
  diamondOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import ProviderHeader from "./provider-header";
import ProviderQuickStats from "./provider-quick-stats";
import { ActivePlanBanner, ActiveBoostBanner } from "./active-status-cards";
import { useMyProvider, useMySponsorships } from "@/hooks/useMyProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import OfflineFallback from "../offline-fallback";
import { useProviderDetails } from "@/hooks/useProvider";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription } from "@/services/payment.service";
import { shareProvider } from "@/utils/sharing";
import {
  ProviderDetailsPhoto,
  ProviderDetailsProduct,
  ProviderDetailsReview,
  ProviderDetailsOffer,
} from "@/services/provider.service";
import { getWarningsUnreadCount, getMyWarnings } from "@/services/report.service";
import ProviderWarningsSheet from "./provider-warnings-sheet";

// ─── Verification Prompt Card ───────────────────────────────────────

// ─── Warning Modal ──────────────────────────────────────────────────
const WarningModal = ({
  totalWarnings,
  onClose,
  onViewAll,
}: {
  totalWarnings: number;
  onClose: () => void;
  onViewAll: () => void;
}) => {
  if (totalWarnings <= 0) return null;

  const isEscalation = totalWarnings >= 3;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center px-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-sm rounded-3xl overflow-hidden ${
            isEscalation
              ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950"
              : "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950"
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 pt-6 pb-4 text-center ${
              isEscalation
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-yellow-400 to-amber-500"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <IonIcon
                icon={alertCircleOutline}
                className="text-white text-3xl"
              />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isEscalation ? "Action Required" : "Account Warning"}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {totalWarnings} warning{totalWarnings > 1 ? "s" : ""} on your account
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <div className="space-y-3">
              {/* Warning count bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isEscalation
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : "bg-gradient-to-r from-yellow-400 to-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, (totalWarnings / 5) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${isEscalation ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {totalWarnings}/5
                </span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isEscalation
                  ? "Your account has received multiple warnings. Continued violations will result in account suspension. Please review and address the issues immediately."
                  : "Your account has received a warning due to a report from a user. Please review your listings and ensure they comply with our community guidelines."}
              </p>

              {isEscalation && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-100/60 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                  <IonIcon icon={alertCircleOutline} className="text-red-500 text-base mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">
                    Your next warning may result in automatic account suspension.
                  </p>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-5 space-y-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onViewAll}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white ${
                  isEscalation
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : "bg-gradient-to-r from-yellow-400 to-amber-500"
                }`}
              >
                View All Warnings
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
              >
                I Understand
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Warnings Banner ────────────────────────────────────────────────
const WarningsBanner = ({
  unreadCount,
  onTap,
  onDismiss,
}: {
  unreadCount: number;
  onTap: () => void;
  onDismiss: () => void;
}) => {
  if (unreadCount <= 0) return null;
  return (
    <div className="px-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 p-4"
      >
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <div
            onClick={onTap}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <IonIcon
              icon={alertCircleOutline}
              className="text-white text-xl"
            />
          </div>
          <div onClick={onTap} className="flex-1 min-w-0 cursor-pointer">
            <h4 className="text-sm font-bold text-white">
              {unreadCount} Unread Warning{unreadCount > 1 ? "s" : ""}
            </h4>
            <p className="text-[11px] text-white/70 mt-0.5">
              Tap to view details. Repeated violations may lead to suspension.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0"
          >
            <span className="text-white text-sm font-bold leading-none">&times;</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const VerificationPrompt = ({ onVerify }: { onVerify: () => void }) => (
  <div className="px-4 mb-4">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-5"
    >
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
      <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <IonIcon
              icon={shieldCheckmarkOutline}
              className="text-white text-lg"
            />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Get Verified</h3>
            <p className="text-white/60 text-[10px]">Boost your visibility</p>
          </div>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-3">
          Verified providers get higher search rankings and build more customer
          trust. Complete verification to stand out.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
            <IonIcon icon={searchOutline} className="text-xs" />
            Higher ranking
          </div>
          <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
            <IonIcon icon={peopleOutline} className="text-xs" />
            More trust
          </div>
          <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
            <IonIcon icon={checkmarkCircleOutline} className="text-xs" />
            Verified badge
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onVerify}
          className="w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/20 active:bg-white/30 transition-colors"
        >
          Verify Now
        </motion.button>
      </div>
    </motion.div>
  </div>
);

// ─── Verification Status Card ───────────────────────────────────────
const VerificationStatusCard = ({ status }: { status: string | null }) => {
  if (!status) return null;

  const config: Record<
    string,
    {
      label: string;
      desc: string;
      icon: string;
      bg: string;
      border: string;
      text: string;
      iconColor: string;
    }
  > = {
    pending: {
      label: "Verification in Review",
      desc: "Your documents are being reviewed. This usually takes 1-2 business days.",
      icon: hourglassOutline,
      bg: "bg-amber-50 dark:bg-amber-900/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-300",
      iconColor: "text-amber-500",
    },
    approved: {
      label: "Verified Provider",
      desc: "Your identity has been verified. You have a verified badge on your profile.",
      icon: checkmarkCircleOutline,
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-300",
      iconColor: "text-emerald-500",
    },
    rejected: {
      label: "Verification Rejected",
      desc: "Your documents were not accepted. Please resubmit with valid documents.",
      icon: closeCircleOutline,
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
      iconColor: "text-red-500",
    },
  };

  const cfg = config[status];
  if (!cfg) return null;

  return (
    <div className="px-4 mb-4">
      <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4`}>
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
          >
            <IonIcon icon={cfg.icon} className={`text-lg ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</h4>
            <p
              className={`text-[11px] ${cfg.text} opacity-70 mt-0.5 leading-relaxed`}
            >
              {cfg.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Today's Activity Card ─────────────────────────────────────────
interface ProviderStats {
  photos: ProviderDetailsPhoto[];
  products: ProviderDetailsProduct[];
  reviews: ProviderDetailsReview[];
  activeOffers: ProviderDetailsOffer[];
}

const TodayActivity = ({ stats }: { stats: ProviderStats }) => {
  const todayReviews = stats.reviews.filter((r) => {
    const posted = new Date(r.postedAt);
    const today = new Date();
    return posted.toDateString() === today.toDateString();
  });

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Today's Activity
        </h3>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <IonIcon icon={calendarOutline} className="text-xs" />
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
            {todayReviews.length}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            New Reviews
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats.products.length}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Products
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 text-center">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {stats.photos.length}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Photos
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Growth Tips ────────────────────────────────────────────────────
interface GrowthTipsProps {
  stats: ProviderStats;
  provider: any;
  verificationStatus: string | null;
  onNavigate: (subTab: string) => void;
  onVerify: () => void;
}

const GrowthTips = ({
  stats,
  provider,
  verificationStatus,
  onNavigate,
  onVerify,
}: GrowthTipsProps) => {
  const totalPhotos = stats.photos.length;
  const totalProducts = stats.products.length;
  const totalOffers = stats.activeOffers.length;
  const unrepliedReviews = stats.reviews.filter(
    (r) => r.status === "active" && !r.replyText,
  ).length;
  const needsVerification =
    !verificationStatus || verificationStatus === "rejected";

  const tips = [
    (!provider?.description || !provider?.address) && {
      icon: storefrontOutline,
      title: "Complete your brand profile",
      desc: "Add description & address to be found by customers",
      priority: "high" as const,
      action: () => onNavigate("details"),
    },
    (!provider?.openTime || !provider?.closeTime) && {
      icon: timeOutline,
      title: "Add operating hours",
      desc: "Let customers know when you're open",
      priority: "high" as const,
      action: () => onNavigate("details"),
    },
    !provider?.profilePhotoUrl && {
      icon: cameraOutline,
      title: "Upload a profile photo",
      desc: "Profiles with photos get 2× more enquiries",
      priority: "high" as const,
      action: () => onNavigate("details"),
    },
    totalPhotos < 5 && {
      icon: imageOutline,
      title: "Add more photos",
      desc: `${totalPhotos}/5 photos — profiles with 5+ get 3× more views`,
      priority: "high" as const,
      action: () => onNavigate("photos"),
    },
    totalProducts === 0 && {
      icon: cubeOutline,
      title: "Add your first product",
      desc: "Show customers what you offer with photos & prices",
      priority: "high" as const,
      action: () => onNavigate("products"),
    },
    totalOffers === 0 && {
      icon: pricetagOutline,
      title: "Create a deal",
      desc: "Attract more customers with special offers",
      priority: "medium" as const,
      action: () => onNavigate("deals"),
    },
    unrepliedReviews > 0 && {
      icon: chatbubbleOutline,
      title: `Reply to ${unrepliedReviews} review${
        unrepliedReviews > 1 ? "s" : ""
      }`,
      desc: "Responding boosts trust & search ranking",
      priority: "medium" as const,
      action: () => onNavigate("reviews"),
    },
    needsVerification && {
      icon: shieldCheckmarkOutline,
      title: "Get verified",
      desc: "Verified providers rank higher & build more trust",
      priority: "medium" as const,
      action: onVerify,
    },
    {
      icon: megaphoneOutline,
      title: "Share your profile",
      desc: "Get 20% more reach with WhatsApp sharing",
      priority: "low" as const,
      action: () => {
        if (provider) {
          shareProvider({
            id: provider.id,
            brandName: provider.brandName || "My Business",
            description: provider.description,
          });
        }
      },
    },
  ].filter(Boolean) as {
    icon: string;
    title: string;
    desc: string;
    priority: "high" | "medium" | "low";
    action: () => void;
  }[];

  if (tips.length === 0) return null;

  const priorityBadge = {
    high: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    medium:
      "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    low: "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  };

  const urgentCount = tips.filter((t) => t.priority === "high").length;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <IonIcon icon={sparklesOutline} className="text-amber-500 text-sm" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Growth Tips
          </h3>
        </div>
        {urgentCount > 0 && (
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
            {urgentCount} urgent
          </span>
        )}
      </div>
      <div className="space-y-2">
        {tips.slice(0, 4).map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={tip.action}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
              <IonIcon
                icon={tip.icon}
                className="text-base text-teal-600 dark:text-teal-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {tip.title}
                </span>
                <span
                  className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                    priorityBadge[tip.priority]
                  }`}
                >
                  {tip.priority}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {tip.desc}
              </p>
            </div>
            <IonIcon
              icon={chevronForwardOutline}
              className="text-slate-300 dark:text-slate-600 text-sm shrink-0"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Recent Reviews ─────────────────────────────────────────────────
const RecentReviewsList = ({ stats }: { stats: ProviderStats }) => {
  const allReviews = [...stats.reviews]
    .sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
    )
    .slice(0, 3);

  if (allReviews.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Recent Reviews
        </h3>
      </div>
      <div className="space-y-2">
        {allReviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0">
                <IonIcon
                  icon={personCircleOutline}
                  className="text-white text-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {r.reviewer?.name || "Customer"}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">
                    {new Date(r.postedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IonIcon
                      key={s}
                      icon={star}
                      className={`text-[9px] ${
                        s <= r.starRating ? "text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {r.reviewText && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {r.reviewText}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Products Overview ──────────────────────────────────────────────
const ProductsOverview = ({ stats }: { stats: ProviderStats }) => {
  if (stats.products.length === 0) {
    return (
      <div className="px-4 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <IonIcon icon={ribbonOutline} className="text-2xl text-teal-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
            No products yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Add products to showcase to customers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          My Products
        </h3>
        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
          {stats.products.length} total
        </span>
      </div>
      <div className="space-y-2">
        {stats.products.slice(0, 3).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex"
          >
            {/* Product photo */}
            <div className="w-16 h-16 shrink-0 bg-slate-100 dark:bg-slate-700 overflow-hidden">
              {p.photoUrl ? (
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IonIcon
                    icon={cubeOutline}
                    className="text-lg text-slate-300"
                  />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate flex-1 mr-2">
                  {p.name}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                    p.isActive
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                      : "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700"
                  }`}
                >
                  {p.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {p.price != null && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {p.currency === "INR" ? "₹" : p.currency}
                  {Number(p.price).toLocaleString()}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Profile Completeness ───────────────────────────────────────────
const ProfileCompleteness = ({
  provider,
  stats,
  onNavigate,
}: {
  provider: any;
  stats: ProviderStats;
  onNavigate: (subTab: string) => void;
}) => {
  const checks = [
    { label: "Brand name", done: !!provider?.brandName, target: "details" },
    { label: "Description", done: !!provider?.description, target: "details" },
    {
      label: "Contact number",
      done: !!provider?.contactNumber,
      target: "details",
    },
    { label: "Address", done: !!provider?.address, target: "details" },
    {
      label: "Operating hours",
      done: !!provider?.openTime && !!provider?.closeTime,
      target: "details",
    },
    {
      label: "Profile photo",
      done: !!provider?.profilePhotoUrl,
      target: "details",
    },
    {
      label: "At least 1 product",
      done: stats.products.length > 0,
      target: "products",
    },
    {
      label: "At least 3 photos",
      done: stats.photos.length >= 3,
      target: "photos",
    },
  ];

  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  if (pct === 100) return null;

  const incomplete = checks.filter((c) => !c.done);

  return (
    <div className="px-4 mb-4">
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm">Complete Your Profile</h3>
              <p className="text-white/60 text-[11px] mt-0.5">
                {done}/{checks.length} steps done
              </p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="4"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 2 * Math.PI * 20} ${
                    2 * Math.PI * 20
                  }`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {pct}%
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {incomplete.slice(0, 3).map((c, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(c.target)}
                className="flex items-center justify-between gap-2 text-white/80 text-[11px] bg-white/10 rounded-lg px-2.5 py-1.5 cursor-pointer active:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                  {c.label}
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  className="text-white/40 text-xs"
                />
              </motion.div>
            ))}
          </div>
          {incomplete.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(incomplete[0].target)}
              className="w-full mt-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/20 active:bg-white/30 transition-colors"
            >
              Complete Now
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Subscription Upsell Card ───────────────────────────────────────
const SubscriptionUpsell = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  return (
    <div className="px-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-5"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-400/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-teal-400/10 translate-y-6 -translate-x-6" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <IonIcon
              icon={diamondOutline}
              className="text-amber-400 text-base"
            />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Upgrade Your Plan
            </span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Get More Leads & Deals
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Unlock unlimited lead access, more deal slots, and exclusive
            sponsorship placements with a premium plan.
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
              <IonIcon icon={peopleOutline} className="text-teal-400 text-xs" />
              <span className="text-[10px] text-white font-medium">
                More Leads
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
              <IonIcon
                icon={pricetagOutline}
                className="text-emerald-400 text-xs"
              />
              <span className="text-[10px] text-white font-medium">
                More Deals
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2.5 py-1.5">
              <IonIcon
                icon={megaphoneOutline}
                className="text-amber-400 text-xs"
              />
              <span className="text-[10px] text-white font-medium">Boost</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate("plans")}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-slate-900 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
          >
            View Plans
            <IonIcon icon={chevronForwardOutline} className="text-xs" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Revenue Boosters Section ───────────────────────────────────────
const RevenueBoosters = ({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) => {
  const boosters = [
    {
      id: "deals",
      title: "Create a Deal",
      subtitle: "Attract new customers with limited-time offers",
      icon: pricetagOutline,
      gradient: "from-rose-500 to-pink-600",
      iconBg: "bg-rose-50 dark:bg-rose-900/30",
      iconColor: "text-rose-500",
      action: () => onNavigate("deals"),
      cta: "Create Deal",
    },
    {
      id: "boost",
      title: "Get Featured",
      subtitle: "Appear in sponsored slots on the home page",
      icon: megaphoneOutline,
      gradient: "from-amber-400 to-orange-500",
      iconBg: "bg-amber-50 dark:bg-amber-900/30",
      iconColor: "text-amber-500",
      action: () => onNavigate("boost"),
      cta: "Boost Now",
    },
    {
      id: "analytics",
      title: "Unlock Leads",
      subtitle: "See who's viewing your profile and reach out",
      icon: peopleOutline,
      gradient: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-50 dark:bg-violet-900/30",
      iconColor: "text-violet-500",
      action: () => onNavigate("analytics"),
      cta: "View Leads",
    },
  ];

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center gap-1.5 mb-2.5">
        <IonIcon icon={sparklesOutline} className="text-amber-500 text-sm" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Grow Your Business
        </h3>
      </div>
      <div
        className="flex gap-3 overflow-x-auto scrollbar-none pb-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {boosters.map((b) => (
          <motion.button
            key={b.id}
            whileTap={{ scale: 0.96 }}
            onClick={b.action}
            className="flex-shrink-0 w-[160px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-3.5 text-left active:bg-slate-50 transition-colors"
          >
            <div
              className={`w-9 h-9 rounded-xl ${b.iconBg} flex items-center justify-center mb-2.5`}
            >
              <IonIcon icon={b.icon} className={`text-lg ${b.iconColor}`} />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight mb-0.5">
              {b.title}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mb-2.5">
              {b.subtitle}
            </p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold text-white px-2.5 py-1 rounded-full bg-gradient-to-r ${b.gradient}`}
            >
              {b.cta}
              <IonIcon icon={chevronForwardOutline} className="text-[9px]" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ─── Deals Overview Card ────────────────────────────────────────────
const DealsOverview = ({
  offers,
  onManage,
}: {
  offers: ProviderDetailsOffer[];
  onManage: () => void;
}) => {
  if (offers.length === 0) {
    return (
      <div className="px-4 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <IonIcon
              icon={pricetagOutline}
              className="text-xl text-amber-400"
            />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
            No active deals
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Create deals to attract more customers and boost sales
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onManage}
            className="mx-auto flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold"
          >
            <IonIcon icon={pricetagOutline} className="text-sm" />
            Create First Deal
          </motion.button>
        </div>
      </div>
    );
  }

  const nextExpiring = [...offers].sort(
    (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
  )[0];

  const daysLeft = nextExpiring
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nextExpiring.endsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <IonIcon icon={pricetagOutline} className="text-amber-500 text-sm" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Active Deals
          </h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onManage}
          className="text-[10px] font-semibold text-teal-600"
        >
          Manage All
        </motion.button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <IonIcon icon={flashOutline} className="text-lg text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                {offers.length} active deal{offers.length > 1 ? "s" : ""}
              </p>
              {nextExpiring && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Next expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <IonIcon
            icon={chevronForwardOutline}
            className="text-slate-300 text-sm"
          />
        </div>
        {nextExpiring && (
          <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex-1">
              {nextExpiring.title}
            </span>
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full ml-2 shrink-0">
              {nextExpiring.discountType === "percentage"
                ? `${Number(nextExpiring.discountValue)}% OFF`
                : `₹${Number(nextExpiring.discountValue)} OFF`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard (Home Tab) ──────────────────────────────────────
interface ProviderDashboardProps {
  onNavigateToListings?: (subTab: string) => void;
}

const ProviderDashboard = ({
  onNavigateToListings,
}: ProviderDashboardProps) => {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { data: providerData, isLoading: providerLoading, isError: providerError, refetch: refetchProvider } = useMyProvider();

  const provider = providerData?.provider ?? null;
  const providerId = provider?.id ?? "";
  const { data: details, isLoading: detailsLoading, isError: detailsError, refetch: refetchDetails } =
    useProviderDetails(providerId);
  const { data: currentSub } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: getCurrentSubscription,
    staleTime: 1000 * 60 * 2,
  });
  const { data: sponsorships } = useMySponsorships();
  const [warningsSheetOpen, setWarningsSheetOpen] = useState(false);
  const [warningModalDismissed, setWarningModalDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const dismissed = localStorage.getItem("warning-modal-dismissed-at");
    if (!dismissed) return false;
    const dismissedAt = new Date(dismissed).getTime();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < twoDaysMs;
  });
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const dismissed = localStorage.getItem("warning-banner-dismissed-at");
    if (!dismissed) return false;
    const dismissedAt = new Date(dismissed).getTime();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < twoDaysMs;
  });
  const { data: warningsUnread, refetch: refetchWarnings } = useQuery({
    queryKey: ["warnings-unread-count"],
    queryFn: getWarningsUnreadCount,
    staleTime: 1000 * 60 * 2,
  });
  const { data: allWarnings } = useQuery({
    queryKey: ["my-warnings"],
    queryFn: getMyWarnings,
    staleTime: 1000 * 60 * 2,
  });
  const unreadWarningCount = warningsUnread?.unreadCount ?? warningsUnread?.count ?? 0;
  const totalWarningCount = Array.isArray(allWarnings) ? allWarnings.length : (allWarnings?.data?.length ?? 0);
  const showWarningModal = unreadWarningCount > 0 && !warningModalDismissed;
  const showWarningBanner = unreadWarningCount > 0 && !bannerDismissed;

  const dismissWarningModal = () => {
    setWarningModalDismissed(true);
    localStorage.setItem("warning-modal-dismissed-at", new Date().toISOString());
  };
  const dismissWarningBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("warning-banner-dismissed-at", new Date().toISOString());
  };

  const providerStatus = providerData?.providerStatus ?? null;
  const verificationStatus = providerData?.verificationStatus ?? null;
  const isLoading = providerLoading || detailsLoading;

  const hasActivePlan = currentSub && currentSub.status === "active" && currentSub.plan;
  const activeSponsorships = sponsorships?.filter(
    (s) => s.isActive && new Date(s.endsAt) > new Date(),
  ) ?? [];

  // If providerStatus is "approved", the provider is fully approved by admin
  // regardless of the document verification record status
  const isApproved = providerStatus === "approved";

  const providerStats: ProviderStats = {
    photos: details?.photos ?? [],
    products: details?.products ?? [],
    reviews: details?.reviews ?? [],
    activeOffers: details?.activeOffers ?? [],
  };

  // Only show "Get Verified" prompt if NOT already approved and no verification submitted
  const needsVerification =
    !isApproved && (!verificationStatus || verificationStatus === "rejected");

  const handleNavigate = (subTab: string) => {
    onNavigateToListings?.(subTab);
  };

  const handleVerify = () => router.push("/provider-onboarding/verify");

  if (!isOnline && !providerData) {
    return <OfflineFallback message="Connect to the internet to manage your business." />;
  }

  // Error state — show retry instead of blank/eternal loading
  if ((providerError || detailsError) && !providerData) {
    return (
      <div className="pb-24">
        <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 px-5 pt-3 pb-5"
          style={{ paddingTop: "max(var(--sat,0px), 12px)" }}
        >
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <IonIcon icon={alertCircleOutline} className="text-3xl text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Unable to load dashboard</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => { refetchProvider(); refetchDetails(); }}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pb-24">
        <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 px-5 pt-3 pb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-24 h-5 bg-white/20 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-2xl bg-white/20 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-3 w-28 bg-white/15 rounded-lg animate-pulse" />
              <div className="h-5 w-32 bg-white/15 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 py-4 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-8 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-2 w-12 bg-slate-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <ProviderHeader
        provider={provider}
        verificationStatus={isApproved ? "approved" : verificationStatus}
        warningCount={unreadWarningCount}
      />
      <ProviderQuickStats stats={providerStats} />
      {showWarningBanner && (
        <WarningsBanner
          unreadCount={unreadWarningCount}
          onTap={() => setWarningsSheetOpen(true)}
          onDismiss={dismissWarningBanner}
        />
      )}
      {needsVerification && <VerificationPrompt onVerify={handleVerify} />}
      {!isApproved &&
        verificationStatus &&
        verificationStatus !== "approved" &&
        !needsVerification && (
          <VerificationStatusCard status={verificationStatus} />
        )}
      {isApproved && <VerificationStatusCard status="approved" />}
      <ProfileCompleteness
        provider={provider}
        stats={providerStats}
        onNavigate={handleNavigate}
      />
      <TodayActivity stats={providerStats} />
      {hasActivePlan ? (
        <ActivePlanBanner
          subscription={currentSub!}
          onManage={() => handleNavigate("plans")}
        />
      ) : (
        <SubscriptionUpsell onNavigate={handleNavigate} />
      )}
      {activeSponsorships.length > 0 && (
        <ActiveBoostBanner
          sponsorships={activeSponsorships}
          onManage={() => handleNavigate("boost")}
        />
      )}
      <GrowthTips
        stats={providerStats}
        provider={provider}
        verificationStatus={isApproved ? "approved" : verificationStatus}
        onNavigate={handleNavigate}
        onVerify={handleVerify}
      />
      <RevenueBoosters onNavigate={handleNavigate} />
      <DealsOverview
        offers={providerStats.activeOffers}
        onManage={() => handleNavigate("deals")}
      />
      <ProductsOverview stats={providerStats} />
      <RecentReviewsList stats={providerStats} />
      <ProviderWarningsSheet
        isOpen={warningsSheetOpen}
        onClose={() => setWarningsSheetOpen(false)}
        onRead={() => refetchWarnings()}
      />
      {showWarningModal && (
        <WarningModal
          totalWarnings={totalWarningCount}
          onClose={dismissWarningModal}
          onViewAll={() => {
            dismissWarningModal();
            setWarningsSheetOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;
