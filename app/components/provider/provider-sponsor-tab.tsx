"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  rocketOutline,
  flashOutline,
  trendingUpOutline,
  checkmarkCircle,
  closeCircleOutline,
  timeOutline,
  eyeOutline,
  fingerPrintOutline,
  walletOutline,
  sparklesOutline,
  arrowForwardOutline,
  shieldCheckmarkOutline,
  ticketOutline,
  informationCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
} from "ionicons/icons";
import {
  useSponsorshipPlans,
  useMySponsorships,
  useCreateSponsorship,
  useUpdateSponsorship,
} from "@/hooks/useMyProvider";
import { createSponsorshipCheckout, validateVoucher } from "@/services/payment.service";
import type { SponsorshipPlan, SponsoredListing, CreateSponsorshipPayload } from "@/services/provider.service";

const typeLabels: Record<string, string> = {
  carousel: "Carousel",
  inline: "In-Feed",
  top_result: "Top Result",
};

const typeIcons: Record<string, string> = {
  carousel: flashOutline,
  inline: trendingUpOutline,
  top_result: rocketOutline,
};

const typeColors: Record<string, string> = {
  carousel: "from-blue-500 to-blue-600",
  inline: "from-emerald-500 to-emerald-600",
  top_result: "from-amber-500 to-orange-500",
};

const ProviderSponsorTab = () => {
  const { data: plans, isLoading: plansLoading } = useSponsorshipPlans();
  const { data: sponsorships, isLoading: sponsorshipsLoading } = useMySponsorships();
  const createMutation = useCreateSponsorship();
  const updateMutation = useUpdateSponsorship();
  const [selectedPlan, setSelectedPlan] = useState<SponsorshipPlan | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<{ valid: boolean; discount?: number; finalAmount?: number; message: string } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const activeSponsorships = sponsorships?.filter((s) => s.isActive && new Date(s.endsAt) > new Date()) ?? [];
  const pastSponsorships = sponsorships?.filter((s) => !s.isActive || new Date(s.endsAt) <= new Date()) ?? [];

  const handleSelectPlan = (plan: SponsorshipPlan) => {
    setSelectedPlan(plan);
    setShowConfirm(true);
    setVoucherCode("");
    setVoucherResult(null);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !selectedPlan) return;
    setIsCheckingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, 'sponsorship', selectedPlan.price);
      setVoucherResult(result);
    } catch {
      setVoucherResult({ valid: false, message: 'Failed to validate voucher' });
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleCreateSponsorship = async () => {
    if (!selectedPlan) return;
    setIsRedirecting(true);
    try {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + selectedPlan.duration);

      const result = await createSponsorshipCheckout({
        type: selectedPlan.type,
        budgetAmount: selectedPlan.price,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        voucherCode: voucherResult?.valid ? voucherCode : undefined,
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsRedirecting(false);
    }
  };

  const handleToggleActive = (sponsorship: SponsoredListing) => {
    updateMutation.mutate({
      id: sponsorship.id,
      payload: { isActive: !sponsorship.isActive },
    });
  };

  const isLoading = plansLoading || sponsorshipsLoading;

  if (isLoading) {
    return (
      <div className="px-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6 pb-8">
      {/* Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold border border-amber-100 dark:border-amber-800">
          <IonIcon icon={rocketOutline} className="text-sm" />
          Boost Your Visibility
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Get more customers by sponsoring your listing
        </p>
      </div>

      {/* Active Sponsorships */}
      {activeSponsorships.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <IonIcon icon={checkmarkCircle} className="text-emerald-500" />
            Active Sponsorships
          </h3>
          <div className="space-y-3">
            {activeSponsorships.map((s) => (
              <SponsorshipCard key={s.id} sponsorship={s} onToggle={handleToggleActive} isUpdating={updateMutation.isPending} />
            ))}
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
          <IonIcon icon={sparklesOutline} className="text-amber-500" />
          Choose a Plan
        </h3>
        <div className="space-y-3">
          {plans?.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
          ))}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
            <IonIcon icon={walletOutline} className="text-emerald-600 text-lg" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700">Secure Payment via Stripe</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Pay securely with UPI, cards, or netbanking. Your payment is processed by Stripe.
            </p>
          </div>
        </div>
      </div>

      {/* Past Sponsorships */}
      {pastSponsorships.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <IonIcon icon={timeOutline} className="text-slate-400" />
            Past Sponsorships
          </h3>
          <div className="space-y-2">
            {pastSponsorships.map((s) => (
              <SponsorshipCard key={s.id} sponsorship={s} onToggle={handleToggleActive} isUpdating={updateMutation.isPending} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Confirm Sheet */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {showConfirm && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-end justify-center"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mb-6" />
              
              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeColors[selectedPlan.type]} flex items-center justify-center mx-auto mb-3`}>
                  <IonIcon icon={typeIcons[selectedPlan.type]} className="text-white text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedPlan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedPlan.duration} days · {typeLabels[selectedPlan.type]} placement</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">₹{selectedPlan.price}</span>
                </div>
                {voucherResult?.valid && voucherResult.discount && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="text-sm">Voucher Discount</span>
                    <span className="text-sm font-semibold">-₹{voucherResult.discount}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total</span>
                  <span className="text-xl font-bold text-slate-800 dark:text-white">
                    ₹{voucherResult?.valid ? voucherResult.finalAmount : selectedPlan.price}
                  </span>
                </div>
              </div>

              {/* Voucher Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <IonIcon icon={ticketOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Voucher code"
                      value={voucherCode}
                      onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherResult(null); }}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-300"
                    />
                  </div>
                  <button
                    onClick={handleApplyVoucher}
                    disabled={!voucherCode.trim() || isCheckingVoucher}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    {isCheckingVoucher ? "..." : "Apply"}
                  </button>
                </div>
                {voucherResult && (
                  <p className={`text-[11px] mt-1.5 ${voucherResult.valid ? 'text-emerald-600' : 'text-red-500'}`}>
                    {voucherResult.message}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 mb-6 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <IonIcon icon={shieldCheckmarkOutline} className="text-emerald-500 text-lg flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-700">
                  You&apos;ll be redirected to Stripe&apos;s secure payment page to complete your purchase.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSponsorship}
                  disabled={isRedirecting}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isRedirecting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Pay with Stripe <IonIcon icon={arrowForwardOutline} className="text-base" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}
    </div>
  );
};

// ─── Plan Card ──────────────────────────────────────────────────────

const boostBenefits: Record<string, { where: string; benefit: string; tip: string }> = {
  carousel: {
    where: "Homepage featured carousel",
    benefit: "Your business is shown prominently on the homepage carousel — the first thing customers see when they open the app.",
    tip: "Best for brand awareness. Carousel placements typically get 3-5× more impressions than organic listings.",
  },
  inline: {
    where: "In-feed search results",
    benefit: "Your listing appears within search results marked as sponsored — customers discover you while actively browsing.",
    tip: "Best for steady traffic. In-feed ads blend naturally and get high click-through rates from motivated searchers.",
  },
  top_result: {
    where: "Top of search results",
    benefit: "Your business appears as the very first result when customers search — maximum visibility for high-intent buyers.",
    tip: "Best for conversions. Top-result placement captures customers who are ready to buy, driving up to 10× more leads.",
  },
};

const PlanCard = ({ plan, onSelect }: { plan: SponsorshipPlan; onSelect: (plan: SponsorshipPlan) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const benefits = boostBenefits[plan.type];

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`relative bg-white dark:bg-slate-800 rounded-2xl border p-4 transition-all ${
        plan.recommended ? "border-teal-200 shadow-lg shadow-teal-100/50 dark:border-teal-700 dark:shadow-teal-900/30" : "border-slate-100 dark:border-slate-700 hover:border-slate-200"
      }`}
    >
      {plan.recommended && (
        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
          RECOMMENDED
        </div>
      )}

      <div className="flex items-start gap-3" onClick={() => onSelect(plan)}>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${typeColors[plan.type]} flex items-center justify-center flex-shrink-0`}>
          <IonIcon icon={typeIcons[plan.type]} className="text-white text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">{plan.name}</h4>
            <span className="text-base font-bold text-teal-600">₹{plan.price}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{plan.duration} days · {typeLabels[plan.type]}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {plan.features.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                <IonIcon icon={checkmarkCircle} className="text-emerald-400 text-[10px]" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable "How it works" section */}
      <button
        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
        className="flex items-center gap-1 mt-3 text-[11px] font-semibold text-teal-600 dark:text-teal-400"
      >
        <IonIcon icon={informationCircleOutline} className="text-sm" />
        How it helps you
        <IonIcon icon={isExpanded ? chevronUpOutline : chevronDownOutline} className="text-xs" />
      </button>

      <AnimatePresence>
        {isExpanded && benefits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-2.5">
              <div className="flex gap-2">
                <IonIcon icon={eyeOutline} className="text-blue-500 text-sm flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Where you appear</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{benefits.where}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <IonIcon icon={trendingUpOutline} className="text-emerald-500 text-sm flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">What it does</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{benefits.benefit}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <IonIcon icon={flashOutline} className="text-amber-500 text-sm flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Pro tip</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{benefits.tip}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Active/Past Sponsorship Card ───────────────────────────────────

const SponsorshipCard = ({
  sponsorship,
  onToggle,
  isUpdating,
  isPast,
}: {
  sponsorship: SponsoredListing;
  onToggle: (s: SponsoredListing) => void;
  isUpdating: boolean;
  isPast?: boolean;
}) => {
  const daysLeft = Math.max(0, Math.ceil((new Date(sponsorship.endsAt).getTime() - Date.now()) / 86400000));
  const spent = sponsorship.spentAmount ?? 0;
  const budget = sponsorship.budgetAmount ?? 0;
  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const ctr = sponsorship.impressions > 0 ? ((sponsorship.clicks / sponsorship.impressions) * 100).toFixed(1) : "0.0";

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 ${isPast ? "border-slate-100 dark:border-slate-700 opacity-70" : "border-slate-100 dark:border-slate-700"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[sponsorship.type]} flex items-center justify-center`}>
            <IonIcon icon={typeIcons[sponsorship.type]} className="text-white text-sm" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">{typeLabels[sponsorship.type]} Sponsorship</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isPast ? "Ended" : `${daysLeft} days left`}
            </p>
          </div>
        </div>
        {!isPast && (
          <button
            onClick={() => onToggle(sponsorship)}
            disabled={isUpdating}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              sponsorship.isActive
                ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800"
                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"
            }`}
          >
            {sponsorship.isActive ? "Pause" : "Resume"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2 text-center">
          <IonIcon icon={eyeOutline} className="text-blue-500 text-sm" />
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{sponsorship.impressions}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400">Views</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2 text-center">
          <IonIcon icon={fingerPrintOutline} className="text-emerald-500 text-sm" />
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{sponsorship.clicks}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400">Clicks</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2 text-center">
          <IonIcon icon={trendingUpOutline} className="text-amber-500 text-sm" />
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{ctr}%</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400">CTR</p>
        </div>
      </div>

      {/* Budget Progress */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-slate-500 dark:text-slate-400">Budget Used</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">₹{spent} / ₹{budget}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ProviderSponsorTab;
