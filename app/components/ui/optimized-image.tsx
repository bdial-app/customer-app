"use client";
import { useState, useRef, useEffect, memo } from "react";
import { getOptimizedImageUrl, IMAGE_SIZES } from "@/utils/image-optimization";

export type ImagePreset = keyof typeof IMAGE_SIZES | "none";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallback?: React.ReactNode;
  /** Apply Supabase image transform preset for server-side resizing */
  preset?: ImagePreset;
}

/**
 * Production-ready image component with:
 * - Supabase server-side image transforms (resize/format/quality)
 * - Native lazy loading + async decoding
 * - Blur-up fade-in on load
 * - Skeleton placeholder while loading
 * - Error fallback
 * - Priority flag for above-fold images
 * - srcSet for 1x/2x density
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  fallback,
  preset = "none",
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If image is already cached by browser, mark loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (error || !src) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        className={`bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center ${className}`}
      >
        <span className="text-3xl font-bold text-slate-200 dark:text-slate-600">
          {alt?.charAt(0)?.toUpperCase() || "?"}
        </span>
      </div>
    );
  }

  // Apply Supabase image transforms for optimized delivery
  const transformOptions = preset !== "none" ? IMAGE_SIZES[preset] : undefined;
  const optimizedSrc = transformOptions
    ? getOptimizedImageUrl(src, transformOptions)
    : src;

  // Generate srcSet for 2x displays if using a preset with width
  const srcSet = transformOptions?.width
    ? `${optimizedSrc} 1x, ${getOptimizedImageUrl(src, { ...transformOptions, width: transformOptions.width * 2 })} 2x`
    : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={optimizedSrc}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
});

export default OptimizedImage;
