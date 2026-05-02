"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { IonIcon } from "@ionic/react";
import {
  pricetagsOutline,
  ticketOutline,
  rocketOutline,
  closeOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { validateVoucher } from "@/services/payment.service";

interface DealPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (voucherCode?: string) => void;
  price: number;
  originalPrice?: number;
  freeRemaining: number;
  freeTotal: number;
  isProSubscriber: boolean;
  isGrowthSubscriber: boolean;
  monetizationEnabled: boolean;
  activeDeals: number;
  maxActiveDeals: number;
  isLoading?: boolean;
}

export function DealPaymentSheet({
  open,
  onClose,
  onConfirm,
  price,
  originalPrice,
  freeRemaining,
  freeTotal,
  isProSubscriber,
  isGrowthSubscriber,
  monetizationEnabled,
  activeDeals,
  maxActiveDeals,
  isLoading,
}: DealPaymentSheetProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherResult, setVoucherResult] = useState<{ valid: boolean; discount?: number; finalAmount?: number; message: string } | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const isFree = !monetizationEnabled || isProSubscriber || freeRemaining > 0;
  const finalPrice = voucherResult?.valid ? voucherResult.finalAmount! : price;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setApplyingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, "deal_creation", price);
      setVoucherResult(result);
    } catch {
      setVoucherResult({ valid: false, message: "Invalid voucher code" });
    } finally {
      setApplyingVoucher(false);
    }
  };

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
            className="bg-white dark:bg-slate-800 rounded-t-3xl w-full max-w-lg p-6 pb-8 shadow-xl"
          >
            {/* Handle */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                  <IonIcon icon={pricetagsOutline} className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Deal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeDeals}/{maxActiveDeals === -1 ? "∞" : maxActiveDeals} active deals
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={closeOutline} className="text-slate-500 text-lg" />
              </button>
            </div>

            {/* Free method */}
            {isFree && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <IonIcon icon={checkmarkCircleOutline} className="text-white text-xs" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {!monetizationEnabled
                      ? "Deal creation is free during our launch period"
                      : isProSubscriber
                      ? "Unlimited deals with Pro plan"
                      : `Free deal (${freeRemaining} of ${freeTotal} remaining)`}
                  </span>
                </div>
              </div>
            )}

            {/* Slot usage info — always shown */}
            <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <IonIcon icon={informationCircleOutline} className="text-slate-400 text-sm" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deal Slots</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Active deals</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {activeDeals} / {maxActiveDeals === -1 ? "∞" : maxActiveDeals}
                </span>
              </div>
              {maxActiveDeals !== -1 && (
                <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      activeDeals >= maxActiveDeals ? "bg-red-400" : "bg-teal-500"
                    }`}
                    style={{ width: `${Math.min(100, (activeDeals / maxActiveDeals) * 100)}%` }}
                  />
                </div>
              )}
              {activeDeals >= maxActiveDeals && maxActiveDeals !== -1 && (
                <p className="text-[10px] text-red-500 dark:text-red-400 mt-1.5">
                  All slots full — deactivate or delete an existing deal first
                </p>
              )}
            </div>

            {/* Paid pricing */}
            {!isFree && (
              <>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Deal Creation Fee</span>
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
                  <p className="text-[10px] text-slate-400 mt-2">
                    You&apos;ve used all {freeTotal} free deals. Additional deals require a one-time fee.
                  </p>
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
                    <span className="font-bold">Growth plan</span> includes 10 deals + 50% off extras
                  </p>
                </div>
              </>
            )}

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onConfirm(voucherCode || undefined)}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 ${
                isFree
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : isFree ? (
                "Create Deal"
              ) : (
                `Pay ₹${finalPrice} & Create Deal`
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
