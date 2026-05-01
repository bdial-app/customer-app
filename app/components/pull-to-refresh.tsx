"use client";
import { useRef, useState, useCallback, ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  /** Threshold in px to trigger refresh */
  threshold?: number;
  /** Whether pull-to-refresh is enabled */
  enabled?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  enabled = true,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing) return;
      const el = containerRef.current;
      // Only activate when scrolled to top
      if (el && el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [enabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || !enabled || isRefreshing) return;
      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      // Apply resistance — diminishing returns past threshold
      const resistedDistance = distance > threshold
        ? threshold + (distance - threshold) * 0.3
        : distance;
      setPullDistance(resistedDistance);
    },
    [enabled, isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || !enabled) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Hold at indicator position
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, enabled]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative h-full overflow-auto"
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{
            top: 0,
            height: `${pullDistance}px`,
            transition: isPulling.current ? "none" : "height 0.3s ease",
          }}
        >
          <div
            className={`w-8 h-8 rounded-full border-[2.5px] border-amber-400 border-t-transparent ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              opacity: progress,
              transform: `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
              transition: isPulling.current ? "none" : "all 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling.current ? "none" : "transform 0.3s ease",
          willChange: pullDistance > 0 ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
