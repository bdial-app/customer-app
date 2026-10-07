"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import Image from "next/image";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { logoApple, logoGooglePlaystore, globeOutline, storefront, bagHandle, checkmarkCircle, book } from "ionicons/icons";
import { isNativePlatform } from "@/utils/platform";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/utils/store-links";
import { detailsRouteFor, readShareLink, type ShareLinkKind } from "@/utils/share-links";
import { getProviderById } from "@/services/provider.service";
import { getProductById } from "@/services/product.service";
import { getSellerCatalogue } from "@/services/catalog.service";

type Device = "android" | "ios" | "desktop";

interface Preview {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  verified: boolean;
}

/** On iPhone, how long the page shows itself (and its "Open in the app" button) before the App Store. */
const IOS_HANDOFF_MS = 2400;
const ANDROID_PACKAGE = "com.pronttera.tijarah";

const detectDevice = (): Device => {
  const ua = navigator.userAgent;
  const isIpad = /Macintosh/.test(ua) && "ontouchend" in document;
  if (/iPhone|iPad|iPod/.test(ua) || isIpad) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
};

/**
 * Android's "open the app if it's there, otherwise the Play Store" in one
 * link. Chrome resolves it itself: the installed app opens on this listing,
 * or the browser goes to the fallback. The store link carries the listing in
 * its referrer, ready for opening it after install.
 */
const androidIntentUrl = (deepPath: string) => {
  const store = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`utm_source=share_link&deep_link=${deepPath}`)}`;
  return (
    `intent://${window.location.host}${deepPath}` +
    `#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(store)};end`
  );
};

/** tijarah://b/<id> etc. — opens the installed app straight on the listing (registered in both apps). */
const appSchemeUrl = (link: { kind: ShareLinkKind; id: string }) =>
  `tijarah://${link.kind === "business" ? "b" : link.kind === "catalogue" ? "c" : "p"}/${encodeURIComponent(link.id)}`;

const GENERIC_TITLE: Record<ShareLinkKind, string> = {
  business: "A business on Tijarah Connect",
  product: "A listing on Tijarah Connect",
  catalogue: "A catalogue on Tijarah Connect",
};

async function loadPreview(kind: ShareLinkKind, id: string): Promise<Preview | null> {
  try {
    if (kind === "catalogue") {
      const c = await getSellerCatalogue(id);
      const counts = [
        c.counts.products > 0 && `${c.counts.products} ${c.counts.products === 1 ? "product" : "products"}`,
        c.counts.services > 0 && `${c.counts.services} ${c.counts.services === 1 ? "service" : "services"}`,
      ].filter(Boolean);
      return {
        title: `${c.provider.name} — catalogue`,
        subtitle: [counts.join(" · "), [c.provider.area, c.provider.city].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || null,
        imageUrl: c.items.find((i) => i.photoUrl)?.photoUrl ?? c.provider.logoUrl,
        verified: c.provider.verified,
      };
    }
    if (kind === "business") {
      const p = await getProviderById(id);
      return {
        title: p.brandName,
        subtitle: [p.area, p.city].filter(Boolean).join(", ") || null,
        imageUrl: p.profilePhotoUrl ?? null,
        verified: p.status === "active",
      };
    }
    const { product, provider } = await getProductById(id);
    const price = product.price != null ? `₹${Number(product.price).toLocaleString("en-IN")}` : null;
    return {
      title: product.name,
      subtitle: [price, provider?.brandName].filter(Boolean).join(" · ") || null,
      imageUrl: product.photoUrls?.find(Boolean) ?? product.photoUrl ?? null,
      verified: !!provider?.communityVerified,
    };
  } catch {
    return null;
  }
}

/**
 * Where a shared /b/<id> or /p/<id> link lands when the app didn't open it
 * (it isn't installed, or the link was opened inside another app's browser).
 * Phones are handed to the app or their store; a computer gets the web page.
 */
export default function OpenInApp({ kind: fallbackKind }: { kind: ShareLinkKind }) {
  const isClient = useIsClient();

  // Everything about where we are is read once, in the browser.
  const where = useMemo(() => {
    if (!isClient) return null;
    const link =
      readShareLink(window.location.pathname, window.location.search) ??
      (() => {
        const id = new URLSearchParams(window.location.search).get("id");
        return id ? { kind: fallbackKind, id } : null;
      })();
    const device = detectDevice();
    const deepPath = `${window.location.pathname}${window.location.search}`;
    // Hand over once per link per tab: coming back from the store shouldn't bounce you there again.
    let handedOffBefore = false;
    try {
      handedOffBefore = sessionStorage.getItem(`share-handoff:${deepPath}`) === "1";
    } catch {}
    return { link, device, deepPath, handedOffBefore };
  }, [isClient, fallbackKind]);

  const [preview, setPreview] = useState<Preview | null>(null);
  // The API can be slow or down; never leave the card loading forever.
  const [previewFailed, setPreviewFailed] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const link = where?.link ?? null;
  const device = where?.device ?? null;
  // In the app or on a computer, the listing itself is the right page.
  const redirectNow = !!where && (!link || isNativePlatform() || device === "desktop");
  const handoff: "pending" | "cancelled" = cancelled || where?.handedOffBefore ? "cancelled" : "pending";

  useEffect(() => {
    if (!where) return;
    if (redirectNow) {
      window.location.replace(link ? detailsRouteFor(link) : "/");
      return;
    }
    if (!link) return;
    let alive = true;
    void loadPreview(link.kind, link.id).then((p) => {
      if (!alive) return;
      if (p) setPreview(p);
      else setPreviewFailed(true);
    });
    if (!where.handedOffBefore) {
      try {
        sessionStorage.setItem(`share-handoff:${where.deepPath}`, "1");
      } catch {}
      if (where.device === "android") {
        // Straight away, while the tap that opened the link still counts: Chrome
        // opens the installed app on this listing, or goes to Google Play.
        window.location.href = androidIntentUrl(where.deepPath);
      } else {
        // An iPhone with the app installed opens these links in the app before
        // this page ever loads, so whoever is here most likely needs the app.
        timer.current = setTimeout(() => {
          window.location.href = APP_STORE_URL;
        }, IOS_HANDOFF_MS);
      }
    }
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [where, redirectNow, link]);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setCancelled(true);
  };

  /** Open the installed app on this listing (Android also falls back to Google Play). */
  const openApp = () => {
    cancel();
    if (!link) return;
    const deepPath = `${window.location.pathname}${window.location.search}`;
    window.location.href = device === "android" ? androidIntentUrl(deepPath) : appSchemeUrl(link);
  };

  const getApp = () => {
    cancel();
    window.location.href = device === "android" ? PLAY_STORE_URL : APP_STORE_URL;
  };

  if (!where || redirectNow || !device || !link) {
    return <div className="min-h-screen bg-white dark:bg-slate-900" />;
  }

  const isIOS = device === "ios";
  const KindIcon = link.kind === "business" ? storefront : link.kind === "catalogue" ? book : bagHandle;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 mb-8">
          <Image src="/icons/512.png" alt="Tijarah" width={40} height={40} className="rounded-xl shadow-md" priority />
          <span className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">Tijarah Connect</span>
        </motion.div>

        {/* The listing that was shared */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-indigo-900/5 overflow-hidden"
        >
          <div className="relative aspect-[16/10] bg-gradient-to-br from-indigo-100 to-amber-100 dark:from-slate-700 dark:to-slate-800">
            {preview?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote listing photo, any host
              <img src={preview.imageUrl} alt={preview.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IonIcon icon={KindIcon} className="text-5xl text-indigo-300 dark:text-slate-500" />
              </div>
            )}
          </div>
          <div className="p-4">
            {previewFailed && !preview ? (
              <>
                <h1 className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-tight">{GENERIC_TITLE[link.kind]}</h1>
                <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Open it in the app to see everything.</p>
              </>
            ) : preview ? (
              <>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2">{preview.title}</h1>
                  {preview.verified && <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-lg shrink-0" />}
                </div>
                {preview.subtitle && <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{preview.subtitle}</p>}
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
                <div className="h-3 w-1/2 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse" />
              </div>
            )}
          </div>
        </motion.div>

        {/* What happens next */}
        <div className="w-full max-w-sm mt-6">
          {isIOS && handoff === "pending" ? (
            <div className="text-center">
              <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">Taking you to the App Store…</p>
              <div className="mt-3 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: IOS_HANDOFF_MS / 1000, ease: "linear" }}
                />
              </div>
              <button
                onClick={openApp}
                className="mt-4 w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg, #4F46E5, #312E81)" }}
              >
                Already have the app? Open it
              </button>
              <button onClick={cancel} className="mt-3 text-[12px] font-semibold text-slate-400">
                Stay here instead
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                onClick={openApp}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg, #4F46E5, #312E81)" }}
              >
                <IonIcon icon={KindIcon} className="text-lg" />
                Open in the Tijarah app
              </button>
              <button
                onClick={getApp}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[13.5px] active:scale-[0.98] transition-transform"
              >
                <IonIcon icon={isIOS ? logoApple : logoGooglePlaystore} className="text-base" />
                {isIOS ? "Get it on the App Store" : "Get it on Google Play"}
              </button>
              <button
                onClick={() => window.location.assign(detailsRouteFor(link))}
                className="w-full flex items-center justify-center gap-2 h-10 text-slate-500 dark:text-slate-400 font-semibold text-[13px]"
              >
                <IonIcon icon={globeOutline} className="text-base" />
                Continue in the browser
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="pb-6 text-center text-[11px] text-slate-400">Businesses from the community, in one place.</p>
    </div>
  );
}
