/**
 * Supabase Storage image transform helper.
 * Appends resize/quality params to Supabase storage URLs.
 * Falls back to original URL for non-Supabase images.
 */

const SUPABASE_STORAGE_HOST = "uisrqgvmwnswishxelou.supabase.co";

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

  // Only transform Supabase storage URLs
  if (!url.includes(SUPABASE_STORAGE_HOST) || !url.includes("/storage/v1/object/public/")) {
    return url;
  }

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
  banner: { width: 600, height: 300, quality: 75 },
  avatar: { width: 100, height: 100, quality: 70 },
  hero: { width: 800, height: 400, quality: 80 },
  full: { width: 1200, quality: 80 },
} as const;
