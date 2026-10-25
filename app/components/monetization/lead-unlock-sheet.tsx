"use client";

import { useState } from "react";
import { Sheet } from "@/app/components/ui/sheet";
import { IonIcon } from "@ionic/react";
import {
  lockOpenOutline,
  timeOutline,
  ticketOutline,
  rocketOutline,
  closeOutline,
} from "ionicons/icons";
import { motion } from "framer-motion";
import { validateVoucher } from "@/services/payment.service";
import { getNativePlatform } from "@/utils/platform";
import { LEAD_TIERS, type LeadSignal } from "@/app/components/leads/lead-insights";

// Vouchers can't be honored through Apple IAP (Apple fixes the price), so the
// voucher UI is hidden on iOS.
const IS_IOS = getNativePlatform() === "ios";

interface LeadUnlockSheetProps {
  open: boolean;
  onClose: () => void;
  onUnlock: (voucherCode?: string) => void;
  tier: "hot" | "warm" | "soft" | "cold";
  price: number;
  originalPrice?: number;
  freeRemaining: number;
  freeTotal: number;
  subscriptionCreditsRemaining: number;
  isProSubscriber: boolean;
  isGrowthSubscriber: boolean;
  monetizationEnabled: boolean;
  /** Admin voucher feature flag — when false, the voucher field is hidden. Defaults to shown. */
  vouchersEnabled?: boolean;
  isLoading?: boolean;
  /** What this customer did, so the owner sees what they're paying for. */
  why?: { line: string; signals: LeadSignal[]; score: number };
}

const tierConfig = {
  hot: { icon: LEAD_TIERS.hot.icon, label: LEAD_TIERS.hot.name, gradient: LEAD_TIERS.hot.gradient },
  warm: { icon: LEAD_TIERS.warm.icon, label: LEAD_TIERS.warm.name, gradient: LEAD_TIERS.warm.gradient },
  soft: { icon: LEAD_TIERS.soft.icon, label: LEAD_TIERS.soft.name, gradient: LEAD_TIERS.soft.gradient },
  cold: { icon: LEAD_TIERS.cold.icon, label: LEAD_TIERS.cold.name, gradient: LEAD_TIERS.cold.gradient },
};

export function LeadUnlockSheet({
  open,
  onClose,
  onUnlock,
  tier,
  price,
  originalPrice,
  freeRemaining,
  freeTotal,
  subscriptionCreditsRemaining,
  isProSubscriber,
  isGrowthSubscriber,
  monetizationEnabled,
  vouchersEnabled = true,
  isLoading,
  why,
}: LeadUnlockSheetProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<{ valid: boolean; discount?: number; finalAmount?: number; message: string } | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const config = tierConfig[tier];
  const isFreeUnlock = !monetizationEnabled || isProSubscriber || subscriptionCreditsRemaining > 0 || freeRemaining > 0;
  const finalPrice = voucherResult?.valid ? voucherResult.finalAmount! : price;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setApplyingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, "lead_unlock", price);
      setVoucherResult(result);
    } catch {
      setVoucherResult({ valid: false, message: "Invalid voucher code" });
    } finally {
      setApplyingVoucher(false);
    }
  };

  const getUnlockMethod = () => {
    if (!monetizationEnabled) return "All lead unlocks are free during our launch period";
    if (isProSubscriber) return "Unlimited unlocks with Pro plan";
    if (subscriptionCreditsRemaining > 0) return `Subscription credit (${subscriptionCreditsRemaining} remaining)`;
    if (freeRemaining > 0) return `Free unlock (${freeRemaining} of ${freeTotal} remaining this month)`;
    return null;
  };

  const freeMethod = getUnlockMethod();

  return (
    <Sheet open={open} onClose={onClose} label="Unlock contact" zIndex={9990} maxHeight="90dvh" dismissible={!isLoading} className="bg-white dark:bg-slate-800">
      <div className="px-6 pt-2 sm:pt-6 pb-6">
            {/* Header with tier badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                  <IonIcon icon={config.icon} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Contact this customer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {config.label}{why ? ` · Buying intent ${why.score}%` : ""}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={closeOutline} className="text-slate-500 text-lg" />
              </button>
            </div>

            {/* What they did — the reason to reach out */}
            {why && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Why they&apos;re worth a call</p>
                <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug">{why.line}</p>
                {why.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {why.signals.slice(0, 4).map((s) => (
                      <span key={s.key} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        <IonIcon icon={s.icon} className="text-[11px]" />
                        {s.label}
                      </span>
                    ))}
                  </div>
                )}
                <p className="flex items-center gap-1 mt-2 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <IonIcon icon={timeOutline} className="text-[11px]" />
                  Reply today — the business that replies first often wins the order
                </p>
              </div>
            )}

            {/* Free unlock method */}
            {isFreeUnlock && freeMethod && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <IonIcon icon={lockOpenOutline} className="text-white text-xs" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{freeMethod}</span>
                </div>
              </div>
            )}

            {/* Paid unlock pricing */}
            {!isFreeUnlock && (
              <>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Phone number & chat</span>
                    <div className="flex items-baseline gap-2">
                      {originalPrice && originalPrice !== price && (
                        <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                      )}
                      <span className="text-lg font-bold text-slate-900 dark:text-white">₹{finalPrice}</span>
                    </div>
                  </div>
                  {isGrowthSubscriber && originalPrice && originalPrice !== price && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      Growth subscriber discount applied
                    </p>
                  )}
                  {voucherResult?.valid && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      Voucher discount: -₹{voucherResult.discount}
                    </p>
                  )}
                </div>

                {/* Voucher input — hidden on iOS (Apple IAP controls the price)
                    and when the admin voucher feature flag is off */}
                {!IS_IOS && vouchersEnabled && (
                  <>
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 relative">
                        <IonIcon icon={ticketOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => { setVoucherCode(e.target.value); setVoucherResult(null); }}
                          placeholder="Enter voucher or promo code"
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                      <button
                        onClick={handleApplyVoucher}
                        disabled={!voucherCode.trim() || applyingVoucher}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium disabled:opacity-50"
                      >
                        {applyingVoucher ? "..." : "Apply"}
                      </button>
                    </div>
                    {voucherResult && !voucherResult.valid && (
                      <p className="text-[11px] text-red-500 -mt-2 mb-3">{voucherResult.message}</p>
                    )}
                  </>
                )}

                {/* Subscription upsell */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl mb-4">
                  <IonIcon icon={rocketOutline} className="text-amber-500 text-base" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Subscribe from <span className="font-bold">₹299/mo</span> for monthly lead credits
                  </p>
                </div>
              </>
            )}

            {/* CTA Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onUnlock(voucherResult?.valid ? voucherCode : undefined)}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 ${
                isFreeUnlock
                  ? "bg-gradient-to-r from-emerald-500 to-indigo-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : isFreeUnlock ? (
                <span className="flex items-center justify-center gap-2">
                  <IonIcon icon={lockOpenOutline} className="text-base" />
                  Get contact free
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <IonIcon icon={lockOpenOutline} className="text-base" />
                  Get contact for ₹{finalPrice}
                </span>
              )}
            </motion.button>
      </div>
    </Sheet>
  );
}
