"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { IonIcon } from "@ionic/react";
import {
  lockOpenOutline,
  flameOutline,
  thermometerOutline,
  snowOutline,
  leafOutline,
  ticketOutline,
  rocketOutline,
  closeOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { validateVoucher } from "@/services/payment.service";

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
  isLoading?: boolean;
}

const tierConfig = {
  hot: { icon: flameOutline, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", label: "Hot Lead", gradient: "from-red-500 to-orange-500" },
  warm: { icon: thermometerOutline, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20", label: "Warm Lead", gradient: "from-amber-400 to-orange-400" },
  soft: { icon: leafOutline, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", label: "Soft Lead", gradient: "from-emerald-400 to-teal-400" },
  cold: { icon: snowOutline, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", label: "Cold Lead", gradient: "from-blue-400 to-indigo-400" },
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
  isLoading,
}: LeadUnlockSheetProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<{ valid: boolean; discount?: number; finalAmount?: number; message: string } | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const keyboardOffset = useKeyboardOffset();

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

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-lg p-6 shadow-xl overflow-y-auto"
            style={{
              marginBottom: keyboardOffset,
              maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : "90vh",
              paddingBottom: keyboardOffset > 0 ? 12 : 32,
              transition: "margin-bottom 0.15s ease-out, max-height 0.15s ease-out",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header with tier badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                  <IonIcon icon={config.icon} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Unlock {config.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reveal contact info & chat</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={closeOutline} className="text-slate-500 text-lg" />
              </button>
            </div>

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
                    <span className="text-sm text-slate-600 dark:text-slate-300">{config.label} Unlock</span>
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

                {/* Voucher input */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <IonIcon icon={ticketOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => { setVoucherCode(e.target.value); setVoucherResult(null); }}
                      placeholder="Voucher code"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30"
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
              onClick={() => onUnlock(voucherCode || undefined)}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 ${
                isFreeUnlock
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
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
                  Unlock for Free
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <IonIcon icon={lockOpenOutline} className="text-base" />
                  Unlock for ₹{finalPrice}
                </span>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
