"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  diamondOutline,
  rocketOutline,
  flashOutline,
  starOutline,
  checkmarkCircle,
  megaphoneOutline,
  trendingUpOutline,
  eyeOutline,
  peopleOutline,
  pricetagOutline,
  pulseOutline,
  chevronForwardOutline,
  calendarOutline,
} from "ionicons/icons";
import type { SubscriptionInfo } from "@/services/payment.service";
import type { SponsoredListing } from "@/services/provider.service";

// ─── Plan Config ────────────────────────────────────────────────────
const planMeta: Record<string, { icon: string; gradient: string; accent: string }> = {
  starter: { icon: flashOutline, gradient: "from-blue-500 via-blue-600 to-indigo-600", accent: "blue" },
  growth: { icon: rocketOutline, gradient: "from-emerald-500 via-teal-500 to-cyan-600", accent: "teal" },
  pro: { icon: diamondOutline, gradient: "from-amber-500 via-orange-500 to-rose-500", accent: "amber" },
};

const boostMeta: Record<string, { label: string; color: string; bg: string }> = {
  carousel: { label: "Carousel", color: "text-blue-400", bg: "bg-blue-500/20" },
  inline: { label: "Inline", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  top_result: { label: "Top Result", color: "text-amber-400", bg: "bg-amber-500/20" },
};

// ─── Active Plan Banner ─────────────────────────────────────────────
interface ActivePlanBannerProps {
  subscription: SubscriptionInfo;
  /** compact mode for analytics header */
  compact?: boolean;
  onManage?: () => void;
}

export const ActivePlanBanner = ({ subscription, compact, onManage }: ActivePlanBannerProps) => {
  const plan = subscription.plan;
  if (!plan) return null;

  const meta = planMeta[plan.slug] ?? planMeta.starter;
  const renewDate = new Date(subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const leadsLeft = plan.monthlyLeadUnlocks === -1
    ? "∞"
    : `${Math.max(0, plan.monthlyLeadUnlocks - (subscription.leadUnlocksUsed ?? 0))}`;
  const dealsLimit = plan.maxActiveDeals === -1 ? "∞" : plan.maxActiveDeals;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 bg-gradient-to-r ${meta.gradient} rounded-xl px-3 py-2`}
        onClick={onManage}
      >
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
          <IonIcon icon={meta.icon} className="text-white text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-white">{plan.name}</span>
            <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full">
              <div className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[8px] font-bold text-white/90">ACTIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] text-white/60">{leadsLeft} leads left</span>
            <span className="text-[9px] text-white/40">·</span>
            <span className="text-[9px] text-white/60">Renews {renewDate}</span>
          </div>
        </div>
        <IonIcon icon={chevronForwardOutline} className="text-white/40 text-xs" />
      </motion.div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} p-5`}
      >
        {/* Decorative rings */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-10 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative z-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <IonIcon icon={meta.icon} className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{plan.name} Plan</h3>
                <p className="text-[10px] text-white/60">
                  {subscription.billingInterval === "yearly" ? "Yearly" : "Monthly"} · Renews {renewDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Active</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <IonIcon icon={peopleOutline} className="text-white/70 text-xs" />
              </div>
              <p className="text-lg font-bold text-white">{leadsLeft}</p>
              <p className="text-[9px] text-white/50">Leads Left</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <IonIcon icon={pricetagOutline} className="text-white/70 text-xs" />
              </div>
              <p className="text-lg font-bold text-white">{dealsLimit}</p>
              <p className="text-[9px] text-white/50">Deal Slots</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 mb-1">
                <IonIcon icon={trendingUpOutline} className="text-white/70 text-xs" />
              </div>
              <p className="text-lg font-bold text-white">
                {plan.sponsorshipTypes?.length ?? 0}
              </p>
              <p className="text-[9px] text-white/50">Boost Types</p>
            </div>
          </div>

          {/* Perks row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
              <IonIcon icon={checkmarkCircle} className="text-emerald-300 text-[10px]" />
              <span className="text-[9px] text-white/80 font-medium">Priority listing</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
              <IonIcon icon={checkmarkCircle} className="text-emerald-300 text-[10px]" />
              <span className="text-[9px] text-white/80 font-medium">Higher search rank</span>
            </div>
            {plan.slug === "pro" && (
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                <IonIcon icon={checkmarkCircle} className="text-emerald-300 text-[10px]" />
                <span className="text-[9px] text-white/80 font-medium">Unlimited access</span>
              </div>
            )}
          </div>

          {/* Manage button */}
          {onManage && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onManage}
              className="w-full mt-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/20 active:bg-white/25 transition-colors flex items-center justify-center gap-1.5"
            >
              Manage Plan
              <IonIcon icon={chevronForwardOutline} className="text-xs" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Active Boost Banner ────────────────────────────────────────────
interface ActiveBoostBannerProps {
  sponsorships: SponsoredListing[];
  /** compact mode for analytics header */
  compact?: boolean;
  onManage?: () => void;
}

export const ActiveBoostBanner = ({ sponsorships, compact, onManage }: ActiveBoostBannerProps) => {
  const now = new Date();
  const active = sponsorships.filter(
    (s) => s.isActive && new Date(s.endsAt) > now,
  );

  if (active.length === 0) return null;

  // Nearest expiry
  const nearest = [...active].sort(
    (a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
  )[0];
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(nearest.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl px-3 py-2 mt-2"
        onClick={onManage}
      >
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
          <IonIcon icon={megaphoneOutline} className="text-white text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-white">
              {active.length} Boost{active.length > 1 ? "s" : ""} Live
            </span>
            <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full">
              <div className="w-1 h-1 rounded-full bg-yellow-200 animate-pulse" />
              <span className="text-[8px] font-bold text-white/90">BOOSTED</span>
            </div>
          </div>
          <span className="text-[9px] text-white/60">{daysLeft}d remaining · {active.map(s => boostMeta[s.type]?.label ?? s.type).join(", ")}</span>
        </div>
        <IonIcon icon={chevronForwardOutline} className="text-white/40 text-xs" />
      </motion.div>
    );
  }

  return (
    <div className="px-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5"
      >
        {/* Decorative elements */}
        <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute right-4 -bottom-8 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <IonIcon icon={megaphoneOutline} className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  You&apos;re Boosted!
                </h3>
                <p className="text-[10px] text-white/60">
                  {active.length} active boost{active.length > 1 ? "s" : ""} · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" />
              <span className="text-[9px] font-bold text-white uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Active boost slots */}
          <div className="space-y-2 mb-4">
            {active.map((s) => {
              const meta = boostMeta[s.type] ?? { label: s.type, color: "text-white/80", bg: "bg-white/10" };
              const endDate = new Date(s.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              const slotDaysLeft = Math.max(0, Math.ceil((new Date(s.endsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

              return (
                <div key={s.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center`}>
                    <IonIcon icon={megaphoneOutline} className={`text-base ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{meta.label}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/60">₹{s.budgetAmount} budget</span>
                      <span className="text-[10px] text-white/40">·</span>
                      <span className="text-[10px] text-white/60">Ends {endDate}</span>
                      {slotDaysLeft <= 3 && (
                        <>
                          <span className="text-[10px] text-white/40">·</span>
                          <span className="text-[10px] text-yellow-200 font-semibold">{slotDaysLeft}d left</span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full"
                      style={{ width: `${Math.max(5, (slotDaysLeft / 30) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* What boosting does */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
              <IonIcon icon={eyeOutline} className="text-yellow-200 text-[10px]" />
              <span className="text-[9px] text-white/80 font-medium">5× more views</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
              <IonIcon icon={pulseOutline} className="text-yellow-200 text-[10px]" />
              <span className="text-[9px] text-white/80 font-medium">Featured placement</span>
            </div>
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
              <IonIcon icon={trendingUpOutline} className="text-yellow-200 text-[10px]" />
              <span className="text-[9px] text-white/80 font-medium">Higher conversions</span>
            </div>
          </div>

          {/* Manage button */}
          {onManage && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onManage}
              className="w-full py-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/20 active:bg-white/25 transition-colors flex items-center justify-center gap-1.5"
            >
              Manage Boosts
              <IonIcon icon={chevronForwardOutline} className="text-xs" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
