/**
 * Supabase Storage image transform helper.
 * Appends resize/quality params to Supabase storage URLs.
 * Falls back to original URL for non-Supabase images.
 */

import type { SyntheticEvent } from "react";

// Our project's ref ("abcd" in abcd.supabase.co). Files are served from both
// abcd.supabase.co and abcd.storage.supabase.co (the S3 endpoint's host,
// which is what uploads record), so match the ref, not one hostname.
let SUPABASE_PROJECT_REF = "";
try {
  SUPABASE_PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").hostname.split(".")[0] ?? "";
} catch {
  // No Supabase URL: nothing is transformed.
}

const PUBLIC_PATH = "/storage/v1/object/public/";

/**
 * Supabase charges per image resized (beyond a small free allowance), so
 * resizing is off unless NEXT_PUBLIC_IMAGE_RESIZE=on. While it's off every
 * helper here returns the original URL unchanged.
 */
const RESIZE_ON = process.env.NEXT_PUBLIC_IMAGE_RESIZE === "on";

/** A public file in our own Supabase storage, which can be resized. */
function isOurStorageImage(url: string): boolean {
  if (!RESIZE_ON || !SUPABASE_PROJECT_REF) return false;
  try {
    const u = new URL(url);
    const ours = u.hostname === `${SUPABASE_PROJECT_REF}.supabase.co` || u.hostname === `${SUPABASE_PROJECT_REF}.storage.supabase.co`;
    // SVGs can't be resized; leave them as they are.
    return ours && u.pathname.startsWith(PUBLIC_PATH) && !/\.svg$/i.test(u.pathname);
  } catch {
    return false;
  }
}

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  /** resize mode: cover (default), contain, fill */
  resize?: "cover" | "contain" | "fill";
  /** output format */
  format?: "webp" | "avif" | "origin";
}

export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: ImageTransformOptions = {}
): string {
  if (!url) return "";

  // Only transform our own Supabase storage URLs
  if (!isOurStorageImage(url)) return url;

  const { width, height, quality = 75, resize = "cover", format = "webp" } = options;

  // Convert public URL to render URL for transforms
  // From: /storage/v1/object/public/bucket/path
  // To: /storage/v1/render/image/public/bucket/path
  const transformUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  params.set("quality", String(quality));
  params.set("resize", resize);
  if (format !== "origin") params.set("format", format);

  return `${transformUrl}?${params.toString()}`;
}

/** Common presets for image sizes */
export const IMAGE_SIZES = {
  thumbnail: { width: 80, height: 80, quality: 60 },
  card: { width: 300, height: 200, quality: 70 },
  product: { width: 400, height: 400, quality: 72 },
  banner: { width: 600, height: 300, quality: 75 },
  avatar: { width: 100, height: 100, quality: 70 },
  hero: { width: 800, height: 400, quality: 80 },
  full: { width: 1200, quality: 80 },
} as const;

/**
 * A smaller copy of one of our images, `width` pixels wide (height follows
 * the original's shape). Resized copies are cached by the phone for a year;
 * the originals are sent with no-cache, so every visit re-checks each one.
 * Anything that isn't ours is returned unchanged.
 */
export function sizedImageUrl(url: string | undefined | null, width: number, quality = 75): string {
  return getOptimizedImageUrl(url, { width, quality });
}

/**
 * onError for an <img> showing a resized copy: if the resize fails, show the
 * original once instead of a broken image. Pass the original URL.
 */
export function fallbackToOriginal(
  original: string | undefined | null,
  /** Runs when the original fails too (or there's nothing to fall back to). */
  onFinalError?: (e: SyntheticEvent<HTMLImageElement>) => void,
) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!original || img.dataset.fallback === "1" || img.src === original) {
      onFinalError?.(e);
      return;
    }
    img.dataset.fallback = "1";
    img.removeAttribute("srcset");
    img.src = original;
  };
}
