"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  rocketOutline,
  checkmarkCircle,
  closeCircleOutline,
  diamondOutline,
  starOutline,
  flashOutline,
  infiniteOutline,
  cardOutline,
  calendarOutline,
  arrowForwardOutline,
  ticketOutline,
  refreshOutline,
} from "ionicons/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  createSubscriptionCheckout,
  cancelSubscription,
  resumeSubscription,
  getCustomerPortalUrl,
  validateVoucher,
  type SubscriptionPlan,
  type SubscriptionInfo,
} from "@/services/payment.service";

const planIcons: Record<string, string> = {
  free: starOutline,
  starter: flashOutline,
  growth: rocketOutline,
  pro: diamondOutline,
};

const planColors: Record<string, string> = {
  free: "from-slate-400 to-slate-500",
  starter: "from-blue-500 to-blue-600",
  growth: "from-emerald-500 to-teal-600",
  pro: "from-amber-500 to-orange-500",
};

const ProviderSubscriptionTab = () => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [showConfirm, setShowConfirm] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<any>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: getSubscriptionPlans,
  });

  const { data: currentSub, isLoading: subLoading } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: getCurrentSubscription,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["current-subscription"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["current-subscription"] }),
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.slug === "free") return;
    setSelectedPlan(plan);
    setShowConfirm(true);
    setVoucherCode("");
    setVoucherResult(null);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim() || !selectedPlan) return;
    setIsCheckingVoucher(true);
    try {
      const price = billingInterval === "yearly" ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
      const result = await validateVoucher(voucherCode, "subscription", price);
      setVoucherResult(result);
    } catch {
      setVoucherResult({ valid: false, message: "Failed to validate voucher" });
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setIsRedirecting(true);
    try {
      const result = await createSubscriptionCheckout(
        selectedPlan.id,
        billingInterval,
        voucherResult?.valid ? voucherCode : undefined,
      );
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      setIsRedirecting(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await getCustomerPortalUrl();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  const isLoading = plansLoading || subLoading;

  if (isLoading) {
    return (
      <div className="px-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
        ))}
      </div>
    );
  }

  const currentPlan = currentSub?.plan;
  const activePlans = plans?.filter((p) => p.slug !== "free") ?? [];

  return (
    <div className="px-4 space-y-6 pb-8">
      {/* Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-400 px-4 py-1.5 rounded-full text-xs font-semibold border border-purple-100 dark:border-purple-800">
          <IonIcon icon={diamondOutline} className="text-sm" />
          Subscription Plans
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Unlock premium features for your business</p>
      </div>

      {/* Current Subscription */}
      {currentSub && currentSub.status === "active" && currentPlan && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${planColors[currentPlan.slug] ?? planColors.starter} flex items-center justify-center`}>
              <IonIcon icon={planIcons[currentPlan.slug] ?? diamondOutline} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold">{currentPlan.name} Plan</h3>
              <p className="text-xs text-slate-300">
                {currentSub.billingInterval === "yearly" ? "Yearly" : "Monthly"} · Renews{" "}
                {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>

          {currentSub.cancelAtPeriodEnd && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-200">
                Your plan will be cancelled on {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}.
              </p>
              <button
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
                className="mt-2 text-xs font-semibold text-amber-100 underline"
              >
                {resumeMutation.isPending ? "Resuming..." : "Resume subscription"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{currentPlan.maxActiveDeals === -1 ? "∞" : currentPlan.maxActiveDeals}</p>
              <p className="text-[10px] text-slate-300">Active Deals</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">
                {currentPlan.monthlyLeadUnlocks === -1 ? "∞" : `${currentPlan.monthlyLeadUnlocks - (currentSub.leadUnlocksUsed ?? 0)}`}
              </p>
              <p className="text-[10px] text-slate-300">Lead Unlocks Left</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManageBilling}
              className="flex-1 py-2.5 bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <IonIcon icon={cardOutline} className="text-sm" />
              Manage Billing
            </button>
            {!currentSub.cancelAtPeriodEnd && (
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="py-2.5 px-4 bg-red-500/20 text-red-300 rounded-xl text-xs font-semibold"
              >
                {cancelMutation.isPending ? "..." : "Cancel"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-full p-1">
        <button
          onClick={() => setBillingInterval("monthly")}
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            billingInterval === "monthly" ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval("yearly")}
          className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all ${
            billingInterval === "yearly" ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          Yearly
          <span className="ml-1 text-[10px] text-emerald-500 font-bold">Save 17%</span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="space-y-3">
        {activePlans.map((plan) => {
          const price = billingInterval === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const perMonth = billingInterval === "yearly" ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          const isCurrent = currentPlan?.slug === plan.slug;

          return (
            <motion.div
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isCurrent && handleSelectPlan(plan)}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl border p-4 cursor-pointer transition-all ${
                isCurrent
                  ? "border-teal-300 bg-teal-50/50 dark:bg-teal-900/30 ring-1 ring-teal-200 dark:ring-teal-800"
                  : plan.slug === "growth"
                  ? "border-emerald-200 shadow-lg shadow-emerald-100/50 dark:border-emerald-700 dark:shadow-emerald-900/30"
                  : "border-slate-100 dark:border-slate-700 hover:border-slate-200"
              }`}
            >
              {plan.slug === "growth" && !isCurrent && (
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  BEST VALUE
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-2.5 right-4 bg-teal-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  CURRENT PLAN
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${planColors[plan.slug] ?? planColors.starter} flex items-center justify-center flex-shrink-0`}>
                  <IonIcon icon={planIcons[plan.slug] ?? diamondOutline} className="text-white text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{plan.name}</h4>
                    <div className="text-right">
                      <span className="text-base font-bold text-teal-600">₹{perMonth}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">/mo</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <FeatureChip label={`${plan.maxActiveDeals === -1 ? "∞" : plan.maxActiveDeals} active deals`} />
                    <FeatureChip label={`${plan.monthlyLeadUnlocks === -1 ? "∞" : plan.monthlyLeadUnlocks} lead unlocks/mo`} />
                    {plan.sponsorshipTypes && <FeatureChip label={`${plan.sponsorshipTypes.length} boost types`} />}
                  </div>
                  {billingInterval === "yearly" && (
                    <p className="text-[10px] text-slate-400 mt-1">₹{price} billed yearly</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Checkout Confirm Sheet */}
      <AnimatePresence>
        {showConfirm && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center"
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
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${planColors[selectedPlan.slug] ?? planColors.starter} flex items-center justify-center mx-auto mb-3`}>
                  <IonIcon icon={planIcons[selectedPlan.slug] ?? diamondOutline} className="text-white text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedPlan.name} Plan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{billingInterval === "yearly" ? "Yearly billing" : "Monthly billing"}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Price</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
                    ₹{billingInterval === "yearly" ? selectedPlan.priceYearly : selectedPlan.priceMonthly}
                  </span>
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
                    ₹{voucherResult?.valid ? voucherResult.finalAmount : (billingInterval === "yearly" ? selectedPlan.priceYearly : selectedPlan.priceMonthly)}
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
                  <p className={`text-[11px] mt-1.5 ${voucherResult.valid ? "text-emerald-600" : "text-red-500"}`}>
                    {voucherResult.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isRedirecting}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isRedirecting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Subscribe <IonIcon icon={arrowForwardOutline} className="text-base" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FeatureChip = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full">
    <IonIcon icon={checkmarkCircle} className="text-emerald-400 text-[10px]" />
    {label}
  </span>
);

export default ProviderSubscriptionTab;
