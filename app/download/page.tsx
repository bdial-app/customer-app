import { APP_STORE_URL, PLAY_STORE_URL } from "@/utils/store-links";

/**
 * tijarahapp.in/download — one link (and one QR code) for both stores, for
 * print: pamphlets, posters, stickers. iPhone → App Store, Android → Google
 * Play, a computer sees both buttons. `?src=` tags where it came from
 * (e.g. src=pamphlet) and is passed on to Google Play as the install referrer.
 * Inside the app there is nothing to install, so it goes home.
 *
 * The redirect is an inline script in the page itself, so it runs as soon as
 * the HTML arrives — a cold visit from a QR scan must not wait for the whole
 * app bundle to load and hydrate.
 */
const REDIRECT = `(function () {
  try {
    var C = window.Capacitor;
    if (C && C.isNativePlatform && C.isNativePlatform()) { location.replace("/"); return; }
    var ua = navigator.userAgent;
    var src = (new URLSearchParams(location.search).get("src") || "download").slice(0, 40);
    var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
    if (ios) location.replace(${JSON.stringify(APP_STORE_URL)});
    else if (/Android/i.test(ua)) location.replace(${JSON.stringify(PLAY_STORE_URL)} + "&referrer=" + encodeURIComponent("utm_source=" + src + "&utm_medium=qr"));
  } catch (e) {}
})();`;

export default function DownloadPage() {
  // Shown on a computer, and for a moment on a phone before the store opens.
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-amber-50 to-violet-50 dark:from-slate-900 dark:to-slate-950">
      <script dangerouslySetInnerHTML={{ __html: REDIRECT }} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static page, no image optimisation needed */}
      <img src="/icons/512.png" alt="Tijarah" width={96} height={96} className="rounded-3xl shadow-lg" />
      <h1 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-white">Get Tijarah</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        The Dawoodi Bohra community&apos;s businesses, in one app. Free on iPhone and Android.
      </p>
      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
        <a
          href={APP_STORE_URL}
          className="py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold active:scale-[0.98]"
        >
          Download on the App Store
        </a>
        <a
          href={`${PLAY_STORE_URL}&referrer=${encodeURIComponent("utm_source=download&utm_medium=qr")}`}
          className="py-3.5 rounded-2xl bg-white text-slate-900 border border-slate-200 text-sm font-bold active:scale-[0.98]"
        >
          Get it on Google Play
        </a>
      </div>
    </div>
  );
}
