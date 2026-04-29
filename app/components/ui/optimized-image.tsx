"use client";
import { useState, useRef, useEffect, memo } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Lightweight image component with:
 * - Native lazy loading + async decoding
 * - Blur-up fade-in on load
 * - Skeleton placeholder while loading
 * - Error fallback
 * - Priority flag for above-fold images
 */
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  fallback,
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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={src}
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
