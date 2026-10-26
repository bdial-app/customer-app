import { APP_STORE_URL, PLAY_STORE_URL } from "./store-links";

/**
 * Inline <head> script for tijarahapp.in/download (the QR code on print).
 * Runs before anything else loads: iPhone → App Store, Android → Google Play
 * with ?src= as the install referrer, inside the app → home. Any other path,
 * and a computer, are left alone (the page shows both store buttons).
 */
export const DOWNLOAD_REDIRECT_SCRIPT = `(function(){try{
if(!/^\\/download\\/?$/.test(location.pathname))return;
var C=window.Capacitor;if(C&&C.isNativePlatform&&C.isNativePlatform()){location.replace("/");return;}
var ua=navigator.userAgent;
var src=(new URLSearchParams(location.search).get("src")||"download").slice(0,40);
var ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&"ontouchend" in document);
if(ios)location.replace(${JSON.stringify(APP_STORE_URL)});
else if(/Android/i.test(ua))location.replace(${JSON.stringify(PLAY_STORE_URL)}+"&referrer="+encodeURIComponent("utm_source="+src+"&utm_medium=qr"));
}catch(e){}})();`;
