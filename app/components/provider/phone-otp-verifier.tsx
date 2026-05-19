"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { IonIcon } from "@ionic/react";
import { shieldCheckmarkOutline, refreshOutline, lockClosedOutline } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useSendProviderOtp } from "@/hooks/useMyProvider";
import { useNotification } from "@/app/context/NotificationContext";

interface PhoneOtpVerifierProps {
  phoneNumber: string;
  onVerified: (otp: string) => void;
  isPending?: boolean;
  disabled?: boolean;
}

export function PhoneOtpVerifier({
  phoneNumber,
  onVerified,
  isPending = false,
  disabled = false,
}: PhoneOtpVerifierProps) {
  const [step, setStep] = useState<"idle" | "otp">("idle");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtpMutation = useSendProviderOtp();
  const { notify } = useNotification();

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  // Reset when phone number changes
  useEffect(() => {
    setStep("idle");
    setOtp("");
    setDevOtp("");
    setCountdown(0);
  }, [phoneNumber]);

  const handleSendOtp = useCallback(async () => {
    const phone = phoneNumber.replace(/\D/g, "").slice(-10);
    if (!/^\d{10}$/.test(phone)) {
      notify({ title: "Invalid Number", subtitle: "Enter a valid 10-digit number", variant: "error" });
      return;
    }
    try {
      const result = await sendOtpMutation.mutateAsync(phone);
      setStep("otp");
      setCountdown(60);
      setOtp("");
      if (result?.data?.otp) setDevOtp(result.data.otp);
      notify({ title: "OTP Sent", subtitle: `Verification code sent to ${phone}`, variant: "success" });
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to send OTP";
      const retryAfter = err?.response?.data?.retryAfterSeconds;
      if (retryAfter) setCountdown(retryAfter);
      notify({ title: "Error", subtitle: msg, variant: "error" });
    }
  }, [phoneNumber, sendOtpMutation, notify]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = otp.split("");
    newOtp[index] = value;
    const joined = newOtp.join("").slice(0, 6);
    setOtp(joined);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtp(pasted);
      const lastIndex = Math.min(pasted.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  if (disabled) return null;

  return (
    <div className="mt-3">
      <AnimatePresence mode="wait">
        {step === "idle" ? (
          <motion.div
            key="send"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* Info banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 mb-3">
              <IonIcon icon={lockClosedOutline} className="text-amber-600 text-base mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Verification Required
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Changing your contact number requires OTP verification. A code will be sent to the new number.
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleSendOtp}
              disabled={sendOtpMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors active:bg-teal-600"
            >
              {sendOtpMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <IonIcon icon={shieldCheckmarkOutline} className="text-lg" />
                  Send OTP to Verify
                </>
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Dev OTP helper */}
            {devOtp && (
              <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  Dev OTP: <span className="font-bold">{devOtp}</span>
                </p>
              </div>
            )}

            {/* OTP Input — 6 separate boxes */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
                Enter the 6-digit code sent to <span className="font-semibold text-slate-700 dark:text-white">{phoneNumber.replace(/\D/g, "").slice(-10)}</span>
              </p>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-10 h-12 text-center text-lg font-bold rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Verify button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => { if (otp.length === 6) onVerified(otp); }}
              disabled={otp.length !== 6 || isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors active:bg-teal-600"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <IonIcon icon={shieldCheckmarkOutline} className="text-lg" />
                  Verify & Update Number
                </>
              )}
            </motion.button>

            {/* Resend */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || sendOtpMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 disabled:opacity-40"
              >
                <IonIcon icon={refreshOutline} className="text-sm" />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
