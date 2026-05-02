"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import {
  closeOutline,
  checkmarkOutline,
  rocketOutline,
  diamondOutline,
  sparklesOutline,
  starOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceYearly: number;
  monthlyLeadUnlocks: number;
  maxActiveDeals: number;
  sponsorshipTypes: string[] | null;
  features?: Record<string, any>;
}

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  plans: PricingPlan[];
  currentPlan?: string;
  onSelectPlan: (planId: string, billingInterval: "monthly" | "yearly") => void;
  highlightFeature?: "leads" | "deals" | "boost";
}

const planIcons: Record<string, string> = {
  free: starOutline,
  starter: sparklesOutline,
  growth: rocketOutline,
  pro: diamondOutline,
};

const planGradients: Record<string, string> = {
  free: "from-slate-400 to-slate-500",
  starter: "from-blue-500 to-indigo-500",
  growth: "from-emerald-500 to-teal-500",
  pro: "from-amber-500 to-orange-500",
};

const planBadges: Record<string, string | null> = {
  free: null,
  starter: "POPULAR",
  growth: "BEST VALUE",
  pro: "ULTIMATE",
};

export function PricingModal({
  open,
  onClose,
  plans,
  currentPlan,
  onSelectPlan,
  highlightFeature,
}: PricingModalProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const paidPlans = plans.filter((p) => p.slug !== "free");

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-5 pb-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <IonIcon icon={closeOutline} className="text-white text-lg" />
              </button>
              <h2 className="text-lg font-bold text-white">Upgrade Your Plan</h2>
              <p className="text-sm text-white/80 mt-1">
                {highlightFeature === "leads"
                  ? "Get more lead unlocks with a subscription"
                  : highlightFeature === "deals"
                  ? "Create unlimited deals with a paid plan"
                  : highlightFeature === "boost"
                  ? "Boost your visibility with sponsorships"
                  : "Grow your business faster"}
              </p>

              {/* Billing toggle */}
              <div className="flex items-center gap-2 mt-4 bg-white/10 rounded-full p-1 w-fit">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    billingInterval === "monthly" ? "bg-white text-teal-600" : "text-white/80"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    billingInterval === "yearly" ? "bg-white text-teal-600" : "text-white/80"
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-[9px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                    -17%
                  </span>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {paidPlans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.slug;
                const price = billingInterval === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
                const icon = planIcons[plan.slug] || rocketOutline;
                const gradient = planGradients[plan.slug] || "from-teal-500 to-emerald-500";
                const badge = planBadges[plan.slug];

                return (
                  <motion.div
                    key={plan.id}
                    whileTap={{ scale: 0.98 }}
                    className={`relative rounded-2xl border-2 p-4 transition-all ${
                      isCurrentPlan
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/10"
                        : "border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {badge && (
                      <span className={`absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r ${gradient}`}>
                        {badge}
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full text-[9px] font-bold text-teal-700 bg-teal-100">
                        CURRENT
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <IonIcon icon={icon} className="text-white text-lg" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">₹{price}</span>
                          <span className="text-xs text-slate-400">/mo</span>
                          {billingInterval === "yearly" && (
                            <span className="text-[10px] text-slate-400 line-through ml-1">₹{plan.priceMonthly}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <FeatureChip
                        label={plan.monthlyLeadUnlocks === -1 ? "Unlimited leads" : `${plan.monthlyLeadUnlocks} leads/mo`}
                        highlight={highlightFeature === "leads"}
                      />
                      <FeatureChip
                        label={plan.maxActiveDeals === -1 ? "Unlimited deals" : `${plan.maxActiveDeals} active deals`}
                        highlight={highlightFeature === "deals"}
                      />
                      <FeatureChip
                        label={
                          plan.sponsorshipTypes?.length
                            ? `${plan.sponsorshipTypes.length} boost type${plan.sponsorshipTypes.length > 1 ? "s" : ""}`
                            : "No boosts"
                        }
                        highlight={highlightFeature === "boost"}
                      />
                      {plan.slug === "growth" && <FeatureChip label="50% off extras" highlight={false} />}
                      {plan.slug === "pro" && <FeatureChip label="Priority placement" highlight={false} />}
                    </div>

                    {/* Select button */}
                    {!isCurrentPlan && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelectPlan(plan.id, billingInterval)}
                        className={`w-full mt-3 py-2.5 rounded-xl text-white text-xs font-bold bg-gradient-to-r ${gradient}`}
                      >
                        {plan.slug === "pro" ? "Go Pro" : `Choose ${plan.name}`}
                      </motion.button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-center text-slate-400">
                Cancel anytime • 7-day money-back guarantee • Secure payment via Stripe
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

function FeatureChip({ label, highlight }: { label: string; highlight: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
        highlight
          ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800"
          : "bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"
      }`}
    >
      <IonIcon icon={checkmarkOutline} className="text-[10px]" />
      {label}
    </div>
  );
}
