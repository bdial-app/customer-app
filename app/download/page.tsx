"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IonIcon } from "@ionic/react";
import { logoApple, logoGooglePlaystore } from "ionicons/icons";
import { useIsClient } from "@/hooks/useIsClient";
import { isNativePlatform } from "@/utils/platform";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/utils/store-links";
import { detectHandoffDevice } from "@/utils/handoff";

/**
 * tijarahapp.in/download — one link (and one QR code) for both stores, for
 * print: pamphlets, posters, stickers. iPhone → App Store, Android → Google
 * Play, a computer sees both buttons. `?src=` tags where it came from
 * (e.g. src=pamphlet) and is passed on to Google Play as the install referrer.
 * Inside the app there is nothing to install, so it goes home.
 */
export default function DownloadPage() {
  const isClient = useIsClient();
  const router = useRouter();
  const src = useMemo(
    () => (isClient ? (new URLSearchParams(window.location.search).get("src") ?? "download").slice(0, 40) : "download"),
    [isClient],
  );
  const playUrl = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(`utm_source=${src}&utm_medium=qr`)}`;
  const started = useRef(false);

  useEffect(() => {
    if (!isClient || started.current) return;
    started.current = true;
    if (isNativePlatform()) {
      router.replace("/");
      return;
    }
    const device = detectHandoffDevice();
    if (device === "ios") window.location.replace(APP_STORE_URL);
    else if (device === "android") window.location.replace(playUrl);
  }, [isClient, router, playUrl]);

  // Shown on a computer, and for a moment on a phone before the store opens.
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-amber-50 to-violet-50 dark:from-slate-900 dark:to-slate-950">
      <Image src="/icons/512.png" alt="Tijarah" width={96} height={96} className="rounded-3xl shadow-lg" priority />
      <h1 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-white">Get Tijarah</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        The Dawoodi Bohra community&apos;s businesses, in one app. Free on iPhone and Android.
      </p>
      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
        <a
          href={APP_STORE_URL}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold active:scale-[0.98]"
        >
          <IonIcon icon={logoApple} className="text-lg" />
          Download on the App Store
        </a>
        <a
          href={playUrl}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-slate-900 border border-slate-200 text-sm font-bold active:scale-[0.98]"
        >
          <IonIcon icon={logoGooglePlaystore} className="text-lg text-emerald-600" />
          Get it on Google Play
        </a>
      </div>
    </div>
  );
}
