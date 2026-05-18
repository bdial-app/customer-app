"use client";
import { useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  checkmarkCircle,
  chevronForwardOutline,
  closeOutline,
  locationOutline,
  shieldCheckmarkOutline,
  starOutline,
  trashOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  verifyGooglePlace,
  confirmGooglePlace,
  unlinkGooglePlace,
  type GooglePlaceCandidate,
} from "@/services/google-reviews.service";
import { useQueryClient } from "@tanstack/react-query";
import { PROVIDER_STATUS_KEY } from "@/hooks/useMyProvider";

// ─── Google "G" Logo (inline SVG, no external deps) ────────────────
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09A6.97 6.97 0 015.5 12c0-.72.13-1.43.35-2.09V7.07H2.18A11.01 11.01 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ─── Trust level config ─────────────────────────────────────────────
const trustConfig: Record<string, { label: string; gradient: string; icon: string }> = {
  trusted:  { label: "Trusted",  gradient: "from-emerald-500 to-teal-600", icon: shieldCheckmarkOutline },
  verified: { label: "Verified", gradient: "from-blue-500 to-indigo-600",  icon: shieldCheckmarkOutline },
  basic:    { label: "Basic",    gradient: "from-amber-500 to-orange-500", icon: starOutline },
};

interface Props {
  providerId: string;
  providerPhone?: string;
  googlePlaceId?: string | null;
  trustLevel?: string;
  googleRating?: number | null;
  googleReviewCount?: number | null;
}

export default function GoogleReviewsLinkCard({
  providerId,
  providerPhone,
  googlePlaceId,
  trustLevel,
  googleRating,
  googleReviewCount,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [candidates, setCandidates] = useState<GooglePlaceCandidate[]>([]);
  const [showCandidates, setShowCandidates] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [error, setError] = useState("");
  const [justLinked, setJustLinked] = useState(false);
  const queryClient = useQueryClient();

  const isLinked = !!googlePlaceId;
  const trust = trustLevel && trustLevel !== "unverified" ? trustConfig[trustLevel] : null;

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const results = await verifyGooglePlace(providerId, providerPhone);
      if (results.length === 0) {
        setError("No matching Google Business listing found. Ensure your Google Business Profile uses the same phone number as your Tijarah account.");
      } else {
        setCandidates(results);
        setShowCandidates(true);
      }
    } catch {
      setError("Could not reach Google right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (placeId: string) => {
    setLoading(true);
    try {
      await confirmGooglePlace(providerId, placeId);
      setShowCandidates(false);
      setCandidates([]);
      setJustLinked(true);
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: ["combined-reviews"] });
    } catch {
      setError("Failed to link your business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      await unlinkGooglePlace(providerId);
      setConfirmUnlink(false);
      setJustLinked(false);
      queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: ["combined-reviews"] });
    } catch {
      setError("Failed to unlink. Please try again.");
    } finally {
      setUnlinking(false);
    }
  };

  /* ── Linked State ──────────────────────────────────────────────── */
  if (isLinked || justLinked) {
    return (
      <>
        <motion.div
          initial={justLinked ? { opacity: 0, scale: 0.95 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-100 dark:border-emerald-800/30"
        >
          {/* Success gradient strip */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

          <div className="bg-white dark:bg-slate-800 p-4 pt-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30">
                  <GoogleLogo size={22} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  <IonIcon icon={checkmarkCircle} className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">
                    Google Connected
                  </p>
                  {trust && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${trust.gradient}`}>
                      <IonIcon icon={trust.icon} className="w-2.5 h-2.5" />
                      {trust.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Google reviews are live on your profile
                </p>
              </div>
            </div>

            {/* Stats row */}
            {(googleRating || googleReviewCount) && (
              <div className="flex gap-2 mb-3">
                {googleRating != null && (
                  <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{googleRating.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className="w-2.5 h-2.5" viewBox="0 0 20 20" fill={s <= Math.round(googleRating) ? "#FBBF24" : "#E5E7EB"}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 font-medium">Google Rating</p>
                  </div>
                )}
                {googleReviewCount != null && (
                  <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{googleReviewCount}</p>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 font-medium">Google Reviews</p>
                  </div>
                )}
              </div>
            )}

            {/* Unlink option */}
            <button
              onClick={() => setConfirmUnlink(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium text-gray-400 dark:text-slate-500 active:bg-gray-50 dark:active:bg-slate-700/50 transition-colors"
            >
              <IonIcon icon={trashOutline} className="w-3 h-3" />
              Remove Google link
            </button>
          </div>
        </motion.div>

        {/* Unlink Confirmation Overlay */}
        <AnimatePresence>
          {confirmUnlink && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center px-6"
              onClick={() => setConfirmUnlink(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-xl border border-gray-100 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                  <IonIcon icon={trashOutline} className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white text-center mb-1">
                  Remove Google Link?
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
                  Google reviews will no longer appear on your profile. Your combined rating will be recalculated using only Tijarah reviews.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmUnlink(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-[13px] font-semibold text-gray-700 dark:text-slate-300 active:bg-gray-50 dark:active:bg-slate-700 transition-colors"
                  >
                    Keep
                  </button>
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-semibold active:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {unlinking ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ── Not Linked — CTA Card ─────────────────────────────────────── */
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700" />
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/[0.06]" />
        <div className="absolute -left-4 -bottom-8 w-24 h-24 rounded-full bg-white/[0.04]" />
        <div className="absolute right-8 bottom-2 w-16 h-16 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 p-5">
          {/* Top row */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shrink-0">
              <GoogleLogo size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-white leading-snug">
                Show your Google Reviews
              </h3>
              <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                Customers trust businesses with Google reviews. Link your listing and let your reputation shine.
              </p>
            </div>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { emoji: "⭐", label: "Build Trust" },
              { emoji: "📈", label: "More Leads" },
              { emoji: "🛡️", label: "Get Verified" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl py-2.5 px-2 text-center border border-white/10">
                <span className="text-base">{item.emoji}</span>
                <p className="text-[9px] font-semibold text-white/80 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* How it works disclosure */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px]">🔒</span>
              </div>
              <p className="text-[10px] text-white/75 leading-relaxed">
                We match your registered phone number with Google to find your business. Only your <span className="text-white font-medium">public rating &amp; reviews</span> are displayed — no private data is accessed.
              </p>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 mb-3 flex items-start gap-2">
                  <span className="text-xs mt-0.5">⚠️</span>
                  <p className="text-[11px] text-white/90 leading-relaxed flex-1">{error}</p>
                  <button onClick={() => setError("")} className="shrink-0 p-0.5">
                    <IonIcon icon={closeOutline} className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-white text-blue-600 text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-blue-900/20"
          >
            {loading ? (
              <>
                <div className="w-4.5 h-4.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span>Finding your business…</span>
              </>
            ) : (
              <>
                <GoogleLogo size={18} />
                <span>Connect Google Business</span>
                <IonIcon icon={chevronForwardOutline} className="w-4 h-4 text-blue-400" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ── Candidate Selection Bottom Sheet ─────────────────────── */}
      <AnimatePresence>
        {showCandidates && candidates.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/50"
            onClick={() => { setShowCandidates(false); setCandidates([]); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[9999] bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden"
              style={{ maxHeight: "85vh", paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 pt-3 pb-1 px-5 z-10">
                <div className="w-9 h-1 rounded-full bg-gray-200 dark:bg-slate-700 mx-auto" />
              </div>

              <div className="px-5 pb-3 pt-3">
                {/* Header */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <GoogleLogo size={20} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">
                      Select Your Business
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {candidates.length} listing{candidates.length > 1 ? "s" : ""} found matching your phone number
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidates list */}
              <div className="px-5 overflow-y-auto" style={{ maxHeight: "50vh" }}>
                <div className="space-y-2">
                  {candidates.map((c, idx) => (
                    <motion.button
                      key={c.placeId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => handleConfirm(c.placeId)}
                      disabled={loading}
                      className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-slate-700 active:border-blue-400 dark:active:border-blue-500 active:bg-blue-50/50 dark:active:bg-blue-900/20 transition-all disabled:opacity-50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0 group-active:from-blue-50 group-active:to-blue-100 dark:group-active:from-blue-900/40 dark:group-active:to-blue-800/30 transition-colors">
                          <IonIcon icon={locationOutline} className="w-5 h-5 text-gray-400 dark:text-slate-400 group-active:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {c.address}
                          </p>
                        </div>
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                          <IonIcon icon={checkmarkCircle} className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pt-3">
                <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                  <button
                    onClick={() => { setShowCandidates(false); setCandidates([]); }}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold text-gray-500 dark:text-slate-400 active:bg-gray-50 dark:active:bg-slate-800 transition-colors"
                  >
                    None of these are my business
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
