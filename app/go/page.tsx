"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { chatbubblesOutline, logoApple, logoGooglePlaystore, globeOutline, statsChartOutline, starOutline, storefrontOutline } from "ionicons/icons";
import { useIsClient } from "@/hooks/useIsClient";
import { isNativePlatform } from "@/utils/platform";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/utils/store-links";
import { androidIntentUrl, detectHandoffDevice } from "@/utils/handoff";
import { splitAppTarget } from "@/utils/app-links";
import { openGoLink, resolveGoLink } from "@/services/links.service";
import { useAppContext } from "@/app/context/AppContext";

const IOS_HANDOFF_MS = 2400;

/** What the message was about, from the screen it opens. */
function describe(path: string, mode: string | null): { icon: string; title: string } {
  if (path.includes("tab=chats")) {
    return mode === "customer"
      ? { icon: chatbubblesOutline, title: "A business replied to you" }
      : { icon: chatbubblesOutline, title: "A customer is waiting for your reply" };
  }
  if (path.includes("subTab=reviews")) return { icon: starOutline, title: "You have a new review" };
  if (path.includes("tab=analytics")) return { icon: statsChartOutline, title: "Your shop's numbers are ready" };
  return { icon: storefrontOutline, title: "Your shop on Tijarah" };
}

/**
 * tijarahapp.in/go?c=<code> — the button in our WhatsApp messages.
 * In the app: opens the screen. On a phone without the app: the right store
 * (the screen opens after they install and sign in). On a computer: the web page.
 */
export default function GoPage() {
  const isClient = useIsClient();
  const router = useRouter();
  const { setUserMode, providerStatus } = useAppContext();
  const code = useMemo(() => (isClient ? new URLSearchParams(window.location.search).get("c") ?? "" : ""), [isClient]);
  const [target, setTarget] = useState<{ path: string; mode: "provider" | "customer" | null } | null>(null);
  // Which phone (or computer) this is, read once in the browser; null inside the app.
  const device = useMemo(() => (isClient && !isNativePlatform() ? detectHandoffDevice() : null), [isClient]);
  const [failed, setFailed] = useState(false);
  const [stayed, setStayed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isClient || started.current) return;
    started.current = true;
    if (!code) {
      router.replace("/");
      return;
    }
    const native = isNativePlatform();
    const d = device;
    void (async () => {
      try {
        const res = native || d === "desktop" ? await resolveGoLink(code) : await openGoLink(code, true);
        const t = splitAppTarget(res.target);
        if (native || d === "desktop") {
          void openGoLink(code, false).catch(() => undefined);
          if (t.mode === "provider" && providerStatus !== "not_applied") setUserMode("provider");
          if (t.mode === "customer") setUserMode("customer");
          if (native) router.replace(t.path);
          else window.location.replace(t.path);
          return;
        }
        setTarget(t);
        if (d === "android") {
          window.location.href = androidIntentUrl(`/go?c=${encodeURIComponent(code)}`, "whatsapp");
        } else {
          timer.current = setTimeout(() => {
            window.location.href = APP_STORE_URL;
          }, IOS_HANDOFF_MS);
        }
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isClient, code, device, router, setUserMode, providerStatus]);

  const stay = () => {
    if (timer.current) clearTimeout(timer.current);
    setStayed(true);
  };
  const openApp = () => {
    stay();
    window.location.href =
      device === "android" ? androidIntentUrl(`/go?c=${encodeURIComponent(code)}`, "whatsapp") : `tijarah://go?c=${encodeURIComponent(code)}`;
  };
  const getApp = () => {
    stay();
    window.location.href = device === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
  };

  if (failed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white dark:bg-slate-900">
        <Image src="/icons/512.png" alt="Tijarah" width={48} height={48} className="rounded-xl shadow-md mb-4" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">This link has expired</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Open the Tijarah app to see everything about your shop.</p>
        <button onClick={() => window.location.assign("/")} className="mt-5 h-11 px-6 rounded-2xl bg-indigo-600 text-white font-semibold text-sm">Open Tijarah</button>
      </div>
    );
  }
  if (!target || !device) return <div className="min-h-screen bg-white dark:bg-slate-900" />;

  const about = describe(target.path, target.mode);
  const isIOS = device === "ios";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 mb-8">
          <Image src="/icons/512.png" alt="Tijarah" width={40} height={40} className="rounded-xl shadow-md" priority />
          <span className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">Tijarah</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl shadow-indigo-900/5 p-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
            <IonIcon icon={about.icon} className="text-2xl text-indigo-600 dark:text-indigo-300" />
          </div>
          <h1 className="mt-4 text-[19px] font-extrabold text-slate-900 dark:text-white leading-tight">{about.title}</h1>
          <p className="mt-2 text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
            It&apos;s waiting in the Tijarah app, the business app of the Dawoodi Bohra community. Sign in with your WhatsApp number and it opens right where you need it.
          </p>
        </motion.div>

        <div className="w-full max-w-sm mt-6">
          {isIOS && !stayed ? (
            <div className="text-center">
              <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">Taking you to the App Store…</p>
              <div className="mt-3 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <motion.div className="h-full bg-indigo-600" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: IOS_HANDOFF_MS / 1000, ease: "linear" }} />
              </div>
              <button onClick={openApp} className="mt-4 w-full h-12 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #4F46E5, #312E81)" }}>
                Already have the app? Open it
              </button>
              <button onClick={stay} className="mt-3 text-[12px] font-semibold text-slate-400">Stay here instead</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button onClick={openApp} className="w-full h-12 rounded-2xl text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-transform" style={{ background: "linear-gradient(135deg, #4F46E5, #312E81)" }}>
                Open in the Tijarah app
              </button>
              <button onClick={getApp} className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[13.5px]">
                <IonIcon icon={isIOS ? logoApple : logoGooglePlaystore} className="text-base" />
                {isIOS ? "Get it on the App Store" : "Get it on Google Play"}
              </button>
              <button onClick={() => window.location.assign(target.path)} className="w-full flex items-center justify-center gap-2 h-10 text-slate-500 dark:text-slate-400 font-semibold text-[13px]">
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
