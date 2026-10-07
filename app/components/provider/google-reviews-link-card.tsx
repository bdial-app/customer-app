"use client";
import { useEffect, useRef, useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  callOutline,
  checkmarkCircle,
  chevronForwardOutline,
  closeOutline,
  lockClosedOutline,
  logoWhatsapp,
  refreshOutline,
  shieldCheckmarkOutline,
  starOutline,
  trashOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import { isAxiosError } from "axios";
import {
  connectGoogleBusiness,
  verifyGoogleConnectCode,
  unlinkGooglePlace,
  type GoogleConnectResult,
} from "@/services/google-reviews.service";
import { useQueryClient } from "@tanstack/react-query";
import { PROVIDER_STATUS_KEY } from "@/hooks/useMyProvider";
import { Sheet } from "@/app/components/ui/sheet";
import { useNotification } from "@/app/context/NotificationContext";

const SUPPORT_WHATSAPP = "https://wa.me/919834174885?text=" +
  encodeURIComponent("Hi Tijarah, I need help connecting my Google Business listing.");

const apiMessage = (err: unknown, fallback: string) =>
  (isAxiosError<{ message?: string | string[] }>(err) &&
    [err.response?.data?.message].flat()[0]) ||
  fallback;

// ─── Google "G" Logo (inline SVG, no external deps) ────────────────
export const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09A6.97 6.97 0 015.5 12c0-.72.13-1.43.35-2.09V7.07H2.18A11.01 11.01 0 001 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ─── Trust level config ─────────────────────────────────────────────
const trustConfig: Record<string, { label: string; gradient: string; icon: string }> = {
  trusted:  { label: "Trusted",  gradient: "from-emerald-500 to-indigo-600", icon: shieldCheckmarkOutline },
  verified: { label: "Verified", gradient: "from-blue-500 to-indigo-600",  icon: shieldCheckmarkOutline },
  basic:    { label: "Basic",    gradient: "from-amber-500 to-orange-500", icon: starOutline },
};

interface Props {
  providerId: string;
  googlePlaceId?: string | null;
  trustLevel?: string;
  googleRating?: number | null;
  googleReviewCount?: number | null;
}

/** What the card says when Connect could not link straight away. */
type Notice = Extract<GoogleConnectResult, { status: "not_found" | "ambiguous" | "taken" }> | { status: "error"; message: string };
type CodeStep = Extract<GoogleConnectResult, { status: "otp_required" }>;

export default function GoogleReviewsLinkCard({
  providerId,
  googlePlaceId,
  trustLevel,
  googleRating,
  googleReviewCount,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [codeStep, setCodeStep] = useState<CodeStep | null>(null);
  const [justLinked, setJustLinked] = useState(false);
  const queryClient = useQueryClient();
  const { notify } = useNotification();

  const isLinked = !!googlePlaceId;
  // "Google Verified" already heads the card; a chip only adds news at "Trusted".
  const trust = trustLevel === "trusted" ? trustConfig.trusted : null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: PROVIDER_STATUS_KEY });
    queryClient.invalidateQueries({ queryKey: ["combined-reviews"] });
  };

  const onLinked = () => {
    setCodeStep(null);
    setNotice(null);
    setJustLinked(true);
    refresh();
    notify({ title: "Google Verified", subtitle: "Your Google reviews are now on your profile", variant: "success" });
  };

  /** One tap: find the listing under the business's number and start verifying it. */
  const handleConnect = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const r = await connectGoogleBusiness(providerId);
      if (r.status === "linked") onLinked();
      else if (r.status === "already_linked") refresh();
      else if (r.status === "otp_required") setCodeStep(r);
      else setNotice(r);
    } catch (err) {
      setNotice({ status: "error", message: apiMessage(err, "Could not reach Google right now. Please try again in a moment.") });
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
      refresh();
    } catch {
      setConfirmUnlink(false);
      setNotice({ status: "error", message: "Failed to remove the link. Please try again." });
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
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-indigo-400 to-cyan-400" />

          <div className="bg-white dark:bg-slate-800 p-4 pt-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-indigo-50 dark:from-emerald-900/40 dark:to-indigo-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30">
                  <GoogleLogo size={22} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  <IonIcon icon={checkmarkCircle} className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">
                    Google Verified
                  </p>
                  {trust && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-white bg-gradient-to-r ${trust.gradient}`}>
                      <IonIcon icon={trust.icon} className="w-2.5 h-2.5" />
                      {trust.label}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  Your listing is confirmed as yours, and its reviews show on your profile
                </p>
              </div>
            </div>

            {/* Stats row */}
            {(googleRating || googleReviewCount) && (
              <div className="flex gap-2 mb-3">
                {googleRating != null && (
                  <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{Number(googleRating).toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className="w-2.5 h-2.5" viewBox="0 0 20 20" fill={s <= Math.round(Number(googleRating)) ? "#FBBF24" : "#E5E7EB"}>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-[9px] text-gray-400 dark:text-slate-500 mt-1 font-medium">Google Rating</p>
                  </div>
                )}
                {googleReviewCount != null && (
                  <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{Number(googleReviewCount).toLocaleString("en-IN")}</p>
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

        <Sheet
          open={confirmUnlink}
          onClose={() => setConfirmUnlink(false)}
          label="Remove Google link"
          wideWidth="max-w-sm"
          dismissible={!unlinking}
          className="bg-white dark:bg-slate-800"
        >
          <div className="px-5 pt-2 pb-5 sm:pt-5">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                    <IonIcon icon={trashOutline} className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white text-center mb-1">
                    Remove Google Link?
                  </h3>
                  <p className="text-[12px] text-gray-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
                    Google reviews will no longer appear on your profile, and you will lose the Google Verified badge. You can connect again any time.
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
          </div>
        </Sheet>
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
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/[0.06]" />
        <div className="absolute -left-4 -bottom-8 w-24 h-24 rounded-full bg-white/[0.04]" />

        <div className="relative z-10 p-5">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <GoogleLogo size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-white leading-snug">
                Get Google Verified
              </h3>
              <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                Show your Google rating and reviews on Tijarah, with a verified badge customers trust.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 mb-4 space-y-2">
            {[
              { n: "1", text: "We find your Google listing by your business phone number" },
              { n: "2", text: "You confirm it is yours with a code sent to that number" },
              { n: "3", text: "Your Google reviews appear on your profile" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                  {step.n}
                </span>
                <p className="text-[11px] text-white/85 leading-snug">{step.text}</p>
              </div>
            ))}
            <div className="flex items-start gap-2 pt-1.5 border-t border-white/10">
              <IonIcon icon={lockClosedOutline} className="w-3 h-3 text-white/60 mt-0.5 shrink-0" />
              <p className="text-[10px] text-white/65 leading-relaxed">
                Only someone with the number on the Google listing can connect it, so no one can claim your business. Only public ratings and reviews are shown.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <ConnectNotice notice={notice} onClose={() => setNotice(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-white text-blue-600 text-[14px] font-bold active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-blue-900/20"
          >
            {loading ? (
              <>
                <div className="w-4.5 h-4.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span>Looking up your number on Google…</span>
              </>
            ) : (
              <>
                <GoogleLogo size={18} />
                <span>{notice && notice.status !== "error" ? "Check again" : "Connect Google Business"}</span>
                <IonIcon icon={chevronForwardOutline} className="w-4 h-4 text-blue-400" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      <CodeSheetHost
        providerId={providerId}
        step={codeStep}
        onResent={setCodeStep}
        onLinked={onLinked}
        onClose={() => setCodeStep(null)}
        onNotMine={() => {
          setCodeStep(null);
          setNotice({ status: "taken" });
        }}
      />
    </>
  );
}

/* ── Why Connect did not link, and what to do next ──────────────────── */
function ConnectNotice({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const copy =
    notice.status === "not_found"
      ? {
          title: "No Google listing uses your number yet",
          body: notice.numbersChecked.length
            ? `We checked ${notice.numbersChecked.join(" and ")}. Add one of these numbers to your Google Business Profile (Google Maps → your business → Edit profile → Contact), then tap Check again. Google can take a day or two to update.`
            : "Add your business phone number to your Tijarah profile and to your Google Business Profile, then tap Check again.",
          support: false,
        }
      : notice.status === "ambiguous"
        ? {
            title: "More than one Google listing uses your number",
            body: "To be sure we connect the right one, our team will do it for you. Message us and we will set it up.",
            support: true,
          }
        : notice.status === "taken"
          ? {
              title: "This listing needs a quick check",
              body: "It is already connected to another business on Tijarah, or you said it is not yours. Message us and we will sort it out.",
              support: true,
            }
          : { title: "Something went wrong", body: notice.message, support: false };

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 rounded-xl p-3.5 mb-3">
      <div className="flex items-start gap-2">
        <p className="flex-1 text-[12px] font-bold text-gray-900 dark:text-white leading-snug">{copy.title}</p>
        <button onClick={onClose} className="shrink-0 p-0.5 -mr-1 -mt-0.5" aria-label="Dismiss">
          <IonIcon icon={closeOutline} className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <p className="text-[11px] text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">{copy.body}</p>
      {copy.support && (
        <a
          href={SUPPORT_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold active:bg-emerald-600"
        >
          <IonIcon icon={logoWhatsapp} className="w-3.5 h-3.5" />
          Message support
        </a>
      )}
    </div>
  );
}

/* ── Confirm with the code sent to the listing's number ─────────────── */
type CodeSheetProps = {
  providerId: string;
  step: CodeStep;
  onResent: (s: CodeStep) => void;
  onLinked: () => void;
  onClose: () => void;
  onNotMine: () => void;
};

/** Keeps the last step on screen while the sheet slides away. */
function CodeSheetHost({ step, ...rest }: Omit<CodeSheetProps, "step"> & { step: CodeStep | null }) {
  const [shown, setShown] = useState(step);
  if (step && step !== shown) setShown(step);
  return (
    <Sheet open={!!step} onClose={rest.onClose} label="Confirm it is your business" maxHeight="90dvh">
      {shown && <CodeSheet step={shown} {...rest} />}
    </Sheet>
  );
}

function CodeSheet({
  providerId,
  step,
  onResent,
  onLinked,
  onClose,
  onNotMine,
}: CodeSheetProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  const submit = async (value: string) => {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    setError("");
    try {
      await verifyGoogleConnectCode(providerId, value);
      onLinked();
    } catch (err) {
      setError(apiMessage(err, "That code did not work. Please try again."));
      setCode("");
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      const r = await connectGoogleBusiness(providerId);
      if (r.status === "otp_required") {
        onResent(r);
        setCountdown(60);
        setCode("");
      } else if (r.status === "linked" || r.status === "already_linked") onLinked();
      else setError("We could not send a new code. Close this and tap Connect again.");
    } catch (err) {
      setError(apiMessage(err, "Could not send a new code. Please wait a moment and try again."));
    } finally {
      setResending(false);
    }
  };

  const place = step.place;
  return (
    <div className="pb-5">
        <div className="px-5 pt-1 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">We found your business</h3>
              <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5">Confirm it is yours to connect it</p>
            </div>
            <button onClick={onClose} className="p-1.5 -mr-1.5 rounded-full active:bg-gray-100 dark:active:bg-slate-800" aria-label="Close">
              <IonIcon icon={closeOutline} className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* The listing Google has under this number — shown, never chosen */}
          <div className="mt-4 flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 border border-gray-100 dark:border-slate-600">
              <GoogleLogo size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{place?.name ?? "Your Google listing"}</p>
              {place?.address && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{place.address}</p>
              )}
              {place?.rating != null && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                  <span className="text-amber-500">★</span> {Number(place.rating).toFixed(1)}
                  {place.userRatingCount != null && ` · ${place.userRatingCount} reviews`}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[12px] text-gray-600 dark:text-slate-300">
            <IonIcon icon={callOutline} className="w-4 h-4 text-blue-500 shrink-0" />
            <p>
              Enter the 6-digit code we sent to <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{step.maskedPhone}</span>, the number on this listing.
            </p>
          </div>

          {step.devCode && (
            <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">Dev code: <b>{step.devCode}</b></p>
          )}

          {/* One real input under six boxes: SMS autofill and paste just work */}
          <label className="relative mt-3 flex justify-center gap-2" onClick={() => inputRef.current?.focus()}>
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                setError("");
                if (v.length === 6) submit(v);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-label="6-digit code"
              className="absolute inset-0 w-full h-full opacity-0"
            />
            {Array.from({ length: 6 }).map((_, i) => {
              const active = i === Math.min(code.length, 5);
              return (
                <span
                  key={i}
                  className={`w-11 h-13 flex items-center justify-center rounded-xl border-2 text-[20px] font-bold text-gray-900 dark:text-white transition-colors ${
                    error
                      ? "border-red-300 dark:border-red-500/60"
                      : active
                        ? "border-blue-500 dark:border-blue-400"
                        : "border-gray-200 dark:border-slate-600"
                  }`}
                >
                  {code[i] ?? ""}
                </span>
              );
            })}
          </label>

          {error && <p className="mt-2 text-center text-[12px] text-red-500">{error}</p>}

          <button
            onClick={() => submit(code)}
            disabled={code.length !== 6 || verifying}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white text-[14px] font-bold active:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {verifying ? (
              <div className="w-4.5 h-4.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <IonIcon icon={shieldCheckmarkOutline} className="w-4.5 h-4.5" />
                Verify &amp; Connect
              </>
            )}
          </button>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={resend}
              disabled={countdown > 0 || resending}
              className="flex items-center gap-1.5 text-[12px] font-medium text-blue-600 dark:text-blue-400 disabled:text-gray-400 dark:disabled:text-slate-500 py-1"
            >
              <IonIcon icon={refreshOutline} className="w-3.5 h-3.5" />
              {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </button>
            <button onClick={onNotMine} className="text-[12px] font-medium text-gray-500 dark:text-slate-400 py-1">
              Not my business
            </button>
          </div>
        </div>
    </div>
  );
}
