"use client";
import { useState, useMemo } from "react";
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
  analyticsOutline,
  pulseOutline,
  trophyOutline,
  ribbonOutline,
  statsChartOutline,
  megaphoneOutline,
  warningOutline,
} from "ionicons/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useNotification } from "@/app/context/NotificationContext";
import { InfoTip } from "../info-tip";
import {
  useSponsorshipPlans,
  useMySponsorships,
  useCreateSponsorship,
} from "@/hooks/useMyProvider";
import { createSponsorshipCheckout, validateVoucher } from "@/services/payment.service";
import { payWithRazorpay } from "@/services/razorpay.service";
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
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const { data: plans, isLoading: plansLoading } = useSponsorshipPlans();
  const { data: sponsorships, isLoading: sponsorshipsLoading } = useMySponsorships();
  const createMutation = useCreateSponsorship();
  const [selectedPlan, setSelectedPlan] = useState<SponsorshipPlan | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<{ valid: boolean; discount?: number; finalAmount?: number; message: string } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const now = new Date();
  const activeSponsorships = sponsorships?.filter((s) => s.isActive && new Date(s.endsAt) > now && Number(s.spentAmount) < Number(s.budgetAmount)) ?? [];
  const pastSponsorships = sponsorships?.filter((s) => !s.isActive || new Date(s.endsAt) <= now || Number(s.spentAmount) >= Number(s.budgetAmount)) ?? [];

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
    setIsProcessing(true);
    try {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + selectedPlan.duration);

      const orderResponse = await createSponsorshipCheckout({
        type: selectedPlan.type,
        budgetAmount: selectedPlan.price,
        startsAt: now.toISOString(),
        endsAt: end.toISOString(),
        voucherCode: voucherResult?.valid ? voucherCode : undefined,
      });

      await payWithRazorpay(orderResponse);
      setShowConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      notify({ title: "Boost activated!", subtitle: "Your listing is now being promoted.", variant: "success" });
    } catch (error) {
      console.error('Checkout failed:', error);
      notify({ title: "Payment failed", subtitle: "Please try again.", variant: "error" });
    } finally {
      setIsProcessing(false);
    }
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

      {/* ═══ BOOST ANALYTICS DASHBOARD ═══ */}
      {activeSponsorships.length > 0 && (
        <BoostAnalyticsDashboard sponsorships={activeSponsorships} />
      )}

      {/* No Active Boosts — Upsell CTA */}
      {activeSponsorships.length === 0 && sponsorships && sponsorships.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={megaphoneOutline} className="text-white text-lg" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Reactivate Your Boost</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Your previous boosts generated {sponsorships.reduce((s, b) => s + (b.clicks ?? 0), 0)} clicks. Start a new boost to keep the momentum going!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Sponsorships */}
      {activeSponsorships.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <IonIcon icon={checkmarkCircle} className="text-emerald-500" />
            Active Sponsorships
          </h3>
          <div className="space-y-3">
            {activeSponsorships.map((s) => (
              <SponsorshipCard key={s.id} sponsorship={s} />
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
            <p className="text-xs font-semibold text-emerald-700">Secure Payment via Razorpay</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Pay securely with UPI, cards, or netbanking. Your payment is processed by Razorpay.
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
              <SponsorshipCard key={s.id} sponsorship={s} isPast />
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
                  You&apos;ll complete payment through Razorpay&apos;s secure checkout.
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
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Pay Now <IonIcon icon={arrowForwardOutline} className="text-base" />
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

// ─── Boost Analytics Dashboard ──────────────────────────────────────

const BoostAnalyticsDashboard = ({ sponsorships }: { sponsorships: SponsoredListing[] }) => {
  const totalImpressions = useMemo(() => sponsorships.reduce((s, b) => s + (b.impressions ?? 0), 0), [sponsorships]);
  const totalClicks = useMemo(() => sponsorships.reduce((s, b) => s + (b.clicks ?? 0), 0), [sponsorships]);
  const totalSpent = useMemo(() => sponsorships.reduce((s, b) => s + Number(b.spentAmount ?? 0), 0), [sponsorships]);
  const totalBudget = useMemo(() => sponsorships.reduce((s, b) => s + Number(b.budgetAmount ?? 0), 0), [sponsorships]);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const budgetUsedPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const remainingBudget = totalBudget - totalSpent;

  // Calculate burn rate and days until exhausted
  const oldestStart = useMemo(() => {
    const dates = sponsorships.map(s => new Date(s.startsAt).getTime());
    return Math.min(...dates);
  }, [sponsorships]);
  const daysRunning = Math.max(1, Math.ceil((Date.now() - oldestStart) / 86400000));
  const dailyBurnRate = totalSpent / daysRunning;
  const daysUntilExhausted = dailyBurnRate > 0 ? Math.ceil(remainingBudget / dailyBurnRate) : Infinity;

  // Find soonest expiring boost
  const soonestExpiry = useMemo(() => {
    const daysArr = sponsorships.map(s => Math.max(0, Math.ceil((new Date(s.endsAt).getTime() - Date.now()) / 86400000)));
    return Math.min(...daysArr);
  }, [sponsorships]);

  // CTR performance rating
  const getCtrRating = () => {
    if (ctr >= 5) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/40" };
    if (ctr >= 2) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/40" };
    if (ctr >= 1) return { label: "Average", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/40" };
    return { label: "Low", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/40" };
  };
  const ctrRating = getCtrRating();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <IonIcon icon={statsChartOutline} className="text-white text-base" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Performance Dashboard</h3>
              <p className="text-[9px] text-white/80">
                {sponsorships.length} active boost{sponsorships.length > 1 ? "s" : ""} · Running {daysRunning}d
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-[8px] font-bold text-white">LIVE</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-700">
        {[
          { label: "Impressions", value: totalImpressions.toLocaleString(), icon: eyeOutline, color: "text-blue-500", sublabel: `${Math.round(totalImpressions / daysRunning)}/day`, tip: "How many times your ad was shown to customers" },
          { label: "Clicks", value: totalClicks.toLocaleString(), icon: fingerPrintOutline, color: "text-emerald-500", sublabel: `${Math.round(totalClicks / daysRunning)}/day`, tip: "How many customers tapped on your ad" },
          { label: "CTR", value: `${ctr.toFixed(1)}%`, icon: trendingUpOutline, color: "text-amber-500", sublabel: ctrRating.label, tip: "Click-Through Rate — % of people who saw your ad and tapped on it. Higher is better" },
          { label: "Avg CPC", value: `₹${avgCpc.toFixed(1)}`, icon: walletOutline, color: "text-violet-500", sublabel: `₹${dailyBurnRate.toFixed(0)}/day`, tip: "Cost Per Click — average amount you pay each time someone taps your ad" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-3 text-center">
            <IonIcon icon={stat.icon} className={`text-base ${stat.color}`} />
            <div className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{stat.value}</div>
            <div className="text-[9px] text-slate-400 font-medium flex items-center justify-center gap-0.5">{stat.label} <InfoTip text={stat.tip} size={10} /></div>
            <div className="text-[8px] text-slate-400 mt-0.5">{stat.sublabel}</div>
          </div>
        ))}
      </div>

      {/* Budget Utilization */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <IonIcon icon={walletOutline} className="text-sm text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Budget Utilization</span>
            <InfoTip text="Shows how much of your total ad budget has been spent so far" size={11} />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-white">
            ₹{totalSpent.toLocaleString()} / ₹{totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              budgetUsedPct > 85
                ? "bg-gradient-to-r from-red-400 to-red-500"
                : budgetUsedPct > 60
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-violet-400 to-purple-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(budgetUsedPct, 2)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-slate-400">
            {budgetUsedPct.toFixed(0)}% used · ₹{remainingBudget.toLocaleString()} remaining
          </span>
          {daysUntilExhausted < Infinity && (
            <span className={`text-[9px] font-semibold ${daysUntilExhausted <= 3 ? "text-red-500" : "text-slate-500"}`}>
              ~{daysUntilExhausted}d until exhausted
            </span>
          )}
        </div>
      </div>

      {/* Per-Boost Breakdown */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Boost Breakdown
        </div>
        <div className="space-y-2">
          {sponsorships.map((b) => {
            const bCtr = b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : "0.0";
            const bBudgetPct = Number(b.budgetAmount) > 0 ? Math.min(100, (Number(b.spentAmount) / Number(b.budgetAmount)) * 100) : 0;
            const bDaysLeft = Math.max(0, Math.ceil((new Date(b.endsAt).getTime() - Date.now()) / 86400000));
            const typeColor = b.type === "carousel" ? "bg-blue-500" : b.type === "inline" ? "bg-emerald-500" : "bg-amber-500";
            return (
              <div key={b.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${typeColor}`} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {typeLabels[b.type] ?? b.type}
                    </span>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                    bDaysLeft <= 2 ? "bg-red-100 text-red-600 dark:bg-red-900/30" : "bg-slate-100 text-slate-500 dark:bg-slate-600 dark:text-slate-300"
                  }`}>
                    {bDaysLeft}d left
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                  <span className="flex items-center gap-0.5">
                    <IonIcon icon={eyeOutline} className="text-[10px]" /> {b.impressions.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <IonIcon icon={fingerPrintOutline} className="text-[10px]" /> {b.clicks}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <IonIcon icon={trendingUpOutline} className="text-[10px]" /> {bCtr}%
                  </span>
                  <span className="flex items-center gap-0.5">
                    <IonIcon icon={walletOutline} className="text-[10px]" /> ₹{Number(b.spentAmount)}/₹{Number(b.budgetAmount)}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${typeColor}`} style={{ width: `${Math.max(bBudgetPct, 1)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement Insights */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Insights & Tips
        </div>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${ctrRating.bg}`}>
            <IonIcon icon={pulseOutline} className={`text-sm ${ctrRating.color}`} />
            <span className={`text-[11px] font-medium ${ctrRating.color}`}>
              {ctr >= 5
                ? "Outstanding CTR! Your boosts are performing above industry average."
                : ctr >= 2
                  ? "Good engagement! Consider increasing budget to capture more clicks."
                  : ctr >= 1
                    ? "Average performance. Try a Top Result boost for better visibility."
                    : "Low CTR. Consider updating your profile photos and description to attract more clicks."}
            </span>
          </div>
          {soonestExpiry <= 3 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <IonIcon icon={warningOutline} className="text-sm text-orange-600" />
              <span className="text-[11px] font-medium text-orange-600">
                A boost expires in {soonestExpiry} day{soonestExpiry !== 1 ? "s" : ""}. Renew to keep your visibility!
              </span>
            </div>
          )}
          {budgetUsedPct > 80 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20">
              <IonIcon icon={walletOutline} className="text-sm text-red-500" />
              <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                Budget nearly exhausted ({budgetUsedPct.toFixed(0)}% used). Top up to avoid downtime.
              </span>
            </div>
          )}
        </div>
      </div>
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
  isPast,
}: {
  sponsorship: SponsoredListing;
  isPast?: boolean;
}) => {
  const daysLeft = Math.max(0, Math.ceil((new Date(sponsorship.endsAt).getTime() - Date.now()) / 86400000));
  const spent = Number(sponsorship.spentAmount ?? 0);
  const budget = Number(sponsorship.budgetAmount ?? 0);
  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const ctr = sponsorship.impressions > 0 ? ((sponsorship.clicks / sponsorship.impressions) * 100).toFixed(1) : "0.0";
  const isExpired = new Date(sponsorship.endsAt) <= new Date();
  const isExhausted = spent >= budget;

  // Status badge text
  const getStatusLabel = () => {
    if (isExhausted) return "Budget Exhausted";
    if (isExpired) return "Expired";
    if (!sponsorship.isActive) return "Inactive";
    return `${daysLeft} days left`;
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 ${isPast ? "border-slate-100 dark:border-slate-700 opacity-70" : "border-slate-100 dark:border-slate-700"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[sponsorship.type]} flex items-center justify-center`}>
            <IonIcon icon={typeIcons[sponsorship.type]} className="text-white text-sm" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">{typeLabels[sponsorship.type]} Sponsorship</p>
            <p className={`text-[10px] ${isExhausted ? "text-red-500" : isExpired ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
              {getStatusLabel()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2 text-center">
          <IonIcon icon={eyeOutline} className="text-blue-500 text-sm" />
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{sponsorship.impressions}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">Views <InfoTip text="Times your ad was shown to customers" size={9} /></p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2 text-center">
          <IonIcon icon={fingerPrintOutline} className="text-emerald-500 text-sm" />
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{sponsorship.clicks}</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">Clicks <InfoTip text="Number of customers who tapped your ad" size={9} /></p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-2 text-center">
          <IonIcon icon={trendingUpOutline} className="text-amber-500 text-sm" />
          <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{ctr}%</p>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">CTR <InfoTip text="Click-Through Rate — % of viewers who tapped your ad" size={9} /></p>
        </div>
      </div>

      {/* Budget Progress */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-slate-500 dark:text-slate-400">Budget Used</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">₹{spent} / ₹{budget}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isExhausted ? "bg-red-500" : "bg-gradient-to-r from-teal-400 to-teal-500"}`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ProviderSponsorTab;
