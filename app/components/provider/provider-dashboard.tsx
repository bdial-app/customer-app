"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
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
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import ProviderHeader from "./provider-header";
import ProviderQuickStats from "./provider-quick-stats";
import { useMyProvider } from "@/hooks/useMyProvider";
import { useProviderDetails } from "@/hooks/useProvider";
import { ProviderDetailsPhoto, ProviderDetailsProduct, ProviderDetailsReview } from "@/services/provider.service";

// ─── Verification Prompt Card ───────────────────────────────────────
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
            <IonIcon icon={shieldCheckmarkOutline} className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Get Verified</h3>
            <p className="text-white/60 text-[10px]">Boost your visibility</p>
          </div>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-3">
          Verified providers get higher search rankings and build more customer trust. Complete verification to stand out.
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

  const config: Record<string, { label: string; desc: string; icon: string; bg: string; border: string; text: string; iconColor: string }> = {
    pending: {
      label: "Verification Pending",
      desc: "Your documents are being reviewed. This usually takes 1-2 business days.",
      icon: hourglassOutline,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-800",
      iconColor: "text-amber-500",
    },
    approved: {
      label: "Verified Provider",
      desc: "Your identity has been verified. You have a verified badge on your profile.",
      icon: checkmarkCircleOutline,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
      iconColor: "text-emerald-500",
    },
    rejected: {
      label: "Verification Rejected",
      desc: "Your documents were not accepted. Please resubmit with valid documents.",
      icon: closeCircleOutline,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      iconColor: "text-red-500",
    },
  };

  const cfg = config[status];
  if (!cfg) return null;

  return (
    <div className="px-4 mb-4">
      <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
            <IonIcon icon={cfg.icon} className={`text-lg ${cfg.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</h4>
            <p className={`text-[11px] ${cfg.text} opacity-70 mt-0.5 leading-relaxed`}>{cfg.desc}</p>
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
        <h3 className="text-sm font-bold text-slate-800">Today's Activity</h3>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <IonIcon icon={calendarOutline} className="text-xs" />
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center">
          <p className="text-xl font-bold text-teal-600">{todayReviews.length}</p>
          <p className="text-[10px] text-slate-500">New Reviews</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center">
          <p className="text-xl font-bold text-amber-600">{stats.products.length}</p>
          <p className="text-[10px] text-slate-500">Products</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center">
          <p className="text-xl font-bold text-blue-600">{stats.photos.length}</p>
          <p className="text-[10px] text-slate-500">Photos</p>
        </div>
      </div>
    </div>
  );
};

// ─── Growth Tips ────────────────────────────────────────────────────
const GrowthTips = ({ stats }: { stats: ProviderStats }) => {
  const totalPhotos = stats.photos.length;
  const totalProducts = stats.products.length;
  const unrepliedReviews = stats.reviews.filter((r) => r.status === "active" && !r.replyText).length;

  const tips = [
    totalPhotos < 5 && {
      icon: imageOutline,
      title: "Add more photos",
      desc: "Profiles with 5+ photos get 3× more views",
      priority: "high" as const,
    },
    totalProducts === 0 && {
      icon: cubeOutline,
      title: "Add your first product",
      desc: "Show customers what you offer with photos & prices",
      priority: "high" as const,
    },
    unrepliedReviews > 0 && {
      icon: chatbubbleOutline,
      title: `Reply to ${unrepliedReviews} review${unrepliedReviews > 1 ? "s" : ""}`,
      desc: "Responding boosts trust & search ranking",
      priority: "medium" as const,
    },
    {
      icon: megaphoneOutline,
      title: "Share your profile",
      desc: "Get 20% more reach with WhatsApp sharing",
      priority: "low" as const,
    },
  ].filter(Boolean) as { icon: string; title: string; desc: string; priority: "high" | "medium" | "low" }[];

  if (tips.length === 0) return null;

  const priorityBadge = {
    high: "bg-red-50 text-red-600",
    medium: "bg-amber-50 text-amber-600",
    low: "bg-slate-50 text-slate-500",
  };

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <IonIcon icon={sparklesOutline} className="text-amber-500 text-sm" />
          <h3 className="text-sm font-bold text-slate-800">Growth Tips</h3>
        </div>
        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          {tips.filter((t) => t.priority === "high").length} urgent
        </span>
      </div>
      <div className="space-y-2">
        {tips.slice(0, 3).map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 active:bg-slate-50"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <IonIcon icon={tip.icon} className="text-base text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{tip.title}</span>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase ${priorityBadge[tip.priority]}`}>
                  {tip.priority}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{tip.desc}</p>
            </div>
            <IonIcon icon={chevronForwardOutline} className="text-slate-300 text-sm shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── Recent Reviews ─────────────────────────────────────────────────
const RecentReviewsList = ({ stats }: { stats: ProviderStats }) => {
  const allReviews = [...stats.reviews]
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, 3);

  if (allReviews.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-slate-800">Recent Reviews</h3>
      </div>
      <div className="space-y-2">
        {allReviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-3.5 border border-slate-100"
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0">
                <IonIcon icon={personCircleOutline} className="text-white text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {r.reviewer?.name || "Customer"}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(r.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IonIcon
                      key={s}
                      icon={star}
                      className={`text-[9px] ${s <= r.starRating ? "text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {r.reviewText && (
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
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
        <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <IonIcon icon={ribbonOutline} className="text-2xl text-teal-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">No products yet</h4>
          <p className="text-xs text-slate-500 mb-3">Add products to showcase to customers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-slate-800">My Products</h3>
        <span className="text-[10px] font-medium text-slate-400">{stats.products.length} total</span>
      </div>
      <div className="space-y-2">
        {stats.products.slice(0, 3).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-3.5 border border-slate-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-800 truncate flex-1 mr-2">
                {p.name}
              </p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                p.isActive ? "text-emerald-700 bg-emerald-50" : "text-slate-600 bg-slate-50"
              }`}>
                {p.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {p.price && (
              <p className="text-[11px] text-slate-500">{p.currency === "INR" ? "₹" : p.currency}{p.price.toLocaleString()}</p>
            )}
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
}: {
  provider: any;
  stats: ProviderStats;
}) => {
  const checks = [
    { label: "Brand name", done: !!provider?.brandName },
    { label: "Description", done: !!provider?.description },
    { label: "Contact number", done: !!provider?.contactNumber },
    { label: "Address", done: !!provider?.address },
    { label: "Operating hours", done: !!provider?.openTime && !!provider?.closeTime },
    { label: "Profile photo", done: !!provider?.profilePhotoUrl },
    { label: "At least 1 product", done: stats.products.length > 0 },
    { label: "At least 3 photos", done: stats.photos.length >= 3 },
  ];

  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="px-4 mb-4">
      <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm">Complete Your Profile</h3>
              <p className="text-white/60 text-[11px] mt-0.5">{done}/{checks.length} steps done</p>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(pct / 100) * 2 * Math.PI * 20} ${2 * Math.PI * 20}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {pct}%
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            {checks
              .filter((c) => !c.done)
              .slice(0, 3)
              .map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-white/70 text-[11px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  {c.label}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard (Home Tab) ──────────────────────────────────────
const ProviderDashboard = () => {
  const router = useRouter();
  const { data: providerData, isLoading: providerLoading } = useMyProvider();

  const provider = providerData?.provider ?? null;
  const providerId = provider?.id ?? "";
  const { data: details, isLoading: detailsLoading } = useProviderDetails(providerId);
  const verificationStatus = providerData?.verificationStatus ?? null;
  const isLoading = providerLoading || detailsLoading;

  const providerStats: ProviderStats = {
    photos: details?.photos ?? [],
    products: details?.products ?? [],
    reviews: details?.reviews ?? [],
  };

  const needsVerification = !verificationStatus || verificationStatus === "rejected";

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
            <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-4 w-8 bg-slate-100 rounded animate-pulse" />
              <div className="h-2 w-12 bg-slate-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <ProviderHeader provider={provider} verificationStatus={verificationStatus} />
      <ProviderQuickStats stats={providerStats} />
      {needsVerification && (
        <VerificationPrompt onVerify={() => router.push("/provider-onboarding/verify")} />
      )}
      {verificationStatus && verificationStatus !== "approved" && !needsVerification && (
        <VerificationStatusCard status={verificationStatus} />
      )}
      {verificationStatus === "approved" && (
        <VerificationStatusCard status={verificationStatus} />
      )}
      <ProfileCompleteness provider={provider} stats={providerStats} />
      <TodayActivity stats={providerStats} />
      <GrowthTips stats={providerStats} />
      <ProductsOverview stats={providerStats} />
      <RecentReviewsList stats={providerStats} />
    </div>
  );
};

export default ProviderDashboard;
