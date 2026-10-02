import { isNativePlatform, getNativePlatform } from "./platform";
import { APP_STORE_URL, PLAY_STORE_URL, detectDevicePlatform, storeLinksText, storeUrlFor } from "./store-links";

// Older imports read the store links from here.
export { APP_STORE_URL, PLAY_STORE_URL };

/**
 * The store for the phone in someone's hand: Capacitor knows inside the app,
 * the user agent decides in a browser. Never the website — a link to the web
 * app is not where we want a new user to land.
 */
export function getAppDownloadLink(): string {
  return storeUrlFor(detectDevicePlatform(getNativePlatform()));
}

/**
 * Look a place up by name on Maps, for businesses we have no exact pin for.
 * Better than navigating someone to a city centre we guessed.
 */
export function openPlaceSearch(query: string) {
  const q = encodeURIComponent(query.trim());
  if (!q) return;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    window.location.href = `maps://maps.apple.com/?q=${q}`;
  } else {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
}

/**
 * Open directions to a location in Google Maps.
 * On mobile: tries to open the native Maps app.
 * On desktop: opens Google Maps in a new tab.
 */
export function openDirections(lat: number, lng: number, label?: string) {
  const destination = `${lat},${lng}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isAndroid) {
    window.location.href = `google.navigation:q=${destination}`;
  } else if (isIOS) {
    window.location.href = `maps://maps.apple.com/?daddr=${destination}&dirflg=d`;
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving`,
      "_blank",
      "noopener,noreferrer",
    );
  }
}

/**
 * Share content using Capacitor Share plugin on native, Web Share API on web,
 * with clipboard fallback.
 */
export async function shareContent(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<"shared" | "copied" | "failed"> {
  // Without a url the message is shared as text alone (share targets would
  // otherwise append one), and the clipboard fallback copies the whole text.
  const payload = data.url ? data : { title: data.title, text: data.text };
  const fallbackText = data.url ?? data.text;

  // Native: use Capacitor Share plugin for reliable native share sheet
  if (isNativePlatform()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ ...payload, dialogTitle: data.title });
      return "shared";
    } catch {
      // User cancelled or plugin error — fallback to clipboard
    }
    try {
      await navigator.clipboard.writeText(fallbackText);
      return "copied";
    } catch {
      return "failed";
    }
  }

  // Web: use Web Share API with clipboard fallback
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch {
      // User cancelled or error — fallback to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(fallbackText);
    return "copied";
  } catch {
    return "failed";
  }
}

// ── Sharing with an image ────────────────────────────────

export interface RichShare {
  title: string;
  caption: string;
  /** The branded card, or null when it could not be made — the caption still goes. */
  image: Blob | null;
  filename: string;
}

export interface RichShareResult {
  status: "shared" | "copied" | "cancelled" | "failed";
  withImage: boolean;
  /** The caption was also put on the clipboard, for apps that drop it. */
  captionCopied: boolean;
}

const isCancel = (err: unknown) => {
  const e = err as { name?: string; message?: string } | null;
  return e?.name === "AbortError" || /cancel|abort|dismiss/i.test(e?.message ?? "");
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * The native share sheet only takes files on disk, so the card is written to
 * the app's cache first. Returns null on an app build that predates the
 * Filesystem plugin, so the share quietly falls back to text.
 */
async function writeShareFile(blob: Blob, filename: string): Promise<string | null> {
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { uri } = await Filesystem.writeFile({
      path: `share/${filename}`,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
      recursive: true,
    });
    return uri;
  } catch {
    return null;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Share a branded card with its caption: native sheet in the app, the Web
 * Share API in a browser, the clipboard when neither can take it.
 *
 * WhatsApp on iPhone keeps an image but drops the text that came with it, so
 * there the caption is copied first and the caller tells the person to paste.
 */
export async function shareRich(share: RichShare): Promise<RichShareResult> {
  const platform = getNativePlatform();
  const onIOS = detectDevicePlatform(platform) === "ios";

  if (isNativePlatform()) {
    const { Share } = await import("@capacitor/share");
    const uri = share.image ? await writeShareFile(share.image, share.filename) : null;
    const captionCopied = uri && onIOS ? await copyText(share.caption) : false;
    try {
      await Share.share({
        title: share.title,
        text: share.caption,
        ...(uri ? { files: [uri] } : {}),
        dialogTitle: share.title,
      });
      return { status: "shared", withImage: !!uri, captionCopied };
    } catch (err) {
      if (isCancel(err)) return { status: "cancelled", withImage: !!uri, captionCopied };
    }
    return { status: (await copyText(share.caption)) ? "copied" : "failed", withImage: false, captionCopied: true };
  }

  // Browser. Files are only offered where the browser says it can send them.
  if (typeof navigator !== "undefined" && navigator.share) {
    const file = share.image ? new File([share.image], share.filename, { type: share.image.type || "image/jpeg" }) : null;
    const canSendFile = !!file && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
    const captionCopied = canSendFile && onIOS ? await copyText(share.caption) : false;
    try {
      await navigator.share(
        canSendFile ? { title: share.title, text: share.caption, files: [file!] } : { title: share.title, text: share.caption },
      );
      return { status: "shared", withImage: canSendFile, captionCopied };
    } catch (err) {
      if (isCancel(err)) return { status: "cancelled", withImage: canSendFile, captionCopied };
      // NotAllowedError: the tap that started this expired while the card was
      // being drawn. The clipboard below still gets the message out.
    }
  }

  return { status: (await copyText(share.caption)) ? "copied" : "failed", withImage: false, captionCopied: true };
}

/** A filename people will recognise in their gallery. */
export const shareFilename = (name: string) =>
  `tijarah-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "share"}.jpg`;

/**
 * Open WhatsApp with pre-filled text. Works on both native and web.
 */
export function openWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  window.open(
    `https://wa.me/?text=${encoded}`,
    "_blank",
    "noopener,noreferrer",
  );
}

/** The pitch every "invite a friend" message carries, with both store links. */
export const inviteMessage = (referrerName?: string) =>
  `${referrerName ? `${referrerName} invites you to` : "Come"} discover trusted local businesses on Tijarah Connect — ` +
  `shops, services, deals and home businesses near you, all in one free app.\n\n${storeLinksText()}`;

/**
 * Share an invite to join the app. Both store links go in the message: the
 * person reading it may not use the same phone as the person sending it.
 */
export async function shareInvite(referrerName?: string): Promise<"shared" | "copied" | "failed"> {
  return shareContent({ title: "Join Tijarah Connect", text: inviteMessage(referrerName) });
}
