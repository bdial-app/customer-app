"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, star, starOutline, storefront } from "ionicons/icons";
import { useIsClient } from "@/hooks/useIsClient";
import { isNativePlatform } from "@/utils/platform";
import { APP_STORE_URL } from "@/utils/store-links";
import { androidIntentUrl, detectHandoffDevice, type HandoffDevice } from "@/utils/handoff";
import { markReviewFromLink, reviewRoute } from "@/utils/app-links";
import { getProviderById } from "@/services/provider.service";
import { startReviewOnWeb } from "@/services/links.service";

interface Shop {
  name: string;
  place: string | null;
  photo: string | null;
  rating: number | null;
  verified: boolean;
}

/**
 * tijarahapp.in/r?b=<business> — the review link owners share with their
 * customers. Reviews are written in the app (so they come from real community
 * members): in the app it opens the review; on a phone without the app the
 * customer picks stars and gives their number, then installs; signing in with
 * that number opens their review with the stars filled in.
 */
export default function ReviewLinkPage() {
  const isClient = useIsClient();
  const router = useRouter();
  const params = useMemo(() => (isClient ? new URLSearchParams(window.location.search) : null), [isClient]);
  const providerId = params?.get("b") ?? "";
  const [stars, setStars] = useState(() => {
    const n = Number(params?.get("stars"));
    return n >= 1 && n <= 5 ? n : 0;
  });
  // Which phone (or computer) this is, read once in the browser; null inside the app.
  const device = useMemo<HandoffDevice | null>(() => (isClient && !isNativePlatform() ? detectHandoffDevice() : null), [isClient]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!isClient || started.current) return;
    started.current = true;
    if (!providerId) {
      router.replace("/");
      return;
    }
    markReviewFromLink(providerId);
    const initialStars = Number(params?.get("stars")) || null;
    if (isNativePlatform()) {
      router.replace(reviewRoute(providerId, initialStars));
      return;
    }
    if (device === "desktop") {
      window.location.replace(reviewRoute(providerId, initialStars));
      return;
    }
    void getProviderById(providerId)
      .then((p) =>
        setShop({
          name: p.brandName,
          place: [p.area, p.city].filter(Boolean).join(", ") || null,
          photo: p.profilePhotoUrl ?? null,
          rating: typeof p.combinedRating === "number" && p.combinedRating > 0 ? p.combinedRating : null,
          verified: p.status === "active",
        }),
      )
      .catch(() => setShop({ name: "This business", place: null, photo: null, rating: null, verified: false }));
  }, [isClient, providerId, params, device, router]);

  const digits = phone.replace(/\D/g, "").slice(-10);
  const deepPath = `/r?b=${encodeURIComponent(providerId)}${stars ? `&stars=${stars}` : ""}`;

  const continueInApp = async () => {
    setError("");
    if (digits.length !== 10) {
      setError("Enter your 10-digit mobile number. You'll sign in with it in the app.");
      return;
    }
    setBusy(true);
    try {
      await startReviewOnWeb({ phone: digits, providerId, stars: stars || undefined });
    } catch {
      // Still send them on: they can find the shop in the app.
    }
    window.location.href = device === "android" ? androidIntentUrl(deepPath, "review_link") : APP_STORE_URL;
    setBusy(false);
  };

  const alreadyHaveApp = () => {
    window.location.href = device === "android" ? androidIntentUrl(deepPath, "review_link") : `tijarah:/${deepPath}`;
  };

  if (!device || device === "desktop") return <div className="min-h-screen bg-white dark:bg-slate-900" />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="flex items-center gap-2.5 mb-7">
          <Image src="/icons/512.png" alt="Tijarah" width={40} height={40} className="rounded-xl shadow-md" priority />
          <span className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">Tijarah</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-amber-900/5 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-amber-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
              {shop?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote listing photo, any host
                <img src={shop.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <IonIcon icon={storefront} className="text-2xl text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              {shop ? (
                <>
                  <div className="flex items-center gap-1">
                    <p className="text-[16px] font-bold text-slate-900 dark:text-white truncate">{shop.name}</p>
                    {shop.verified && <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-base shrink-0" />}
                  </div>
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400 truncate">
                    {[shop.place, shop.rating ? `★ ${shop.rating.toFixed(1)}` : null].filter(Boolean).join(" · ")}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                  <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            <p className="text-[15px] font-bold text-slate-900 dark:text-white text-center">How was your experience?</p>
            <div className="flex justify-center gap-1.5 mt-3" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setStars(n)} className="p-1 active:scale-90 transition-transform">
                  <IonIcon icon={n <= stars ? star : starOutline} className="text-[34px] text-amber-400" />
                </button>
              ))}
            </div>

            <label htmlFor="review-phone" className="block mt-5 text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">Your mobile number</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus-within:border-amber-400">
              <span className="pl-3 pr-1 text-[15px] text-slate-500">+91</span>
              <input
                id="review-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98765 43210"
                className="flex-1 min-w-0 h-12 bg-transparent px-2 text-[15px] text-slate-900 dark:text-white outline-none"
              />
            </div>
            <p className="text-[11.5px] text-slate-400 mt-1.5">Sign in to the app with this number and your review opens with your stars.</p>
            {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}

            <button
              onClick={() => void continueInApp()}
              disabled={busy}
              className="mt-5 w-full h-12 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              {device === "ios" ? "Continue on the App Store" : "Continue in the app"}
            </button>
            <button onClick={alreadyHaveApp} className="mt-3 w-full text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
              Already have Tijarah? Open it
            </button>
          </div>
        </motion.div>

        <p className="max-w-sm text-center text-[11.5px] text-slate-400 mt-5 leading-relaxed">
          Reviews are written in the Tijarah app, the business app of the Dawoodi Bohra community, so every review comes from a real member.
        </p>
      </div>
    </div>
  );
}
