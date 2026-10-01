"use client";
import { useRef, useEffect, useState, ReactNode } from "react";

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
}

/**
 * Keeps tab content mounted but hidden when inactive.
 * Each TabPanel is its own scroll container that fills the viewport.
 * Preserves scroll position per tab.
 */
export function TabPanel({ id, activeTab, children }: TabPanelProps) {
  const isActive = activeTab === id;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Save scroll position when leaving tab
  useEffect(() => {
    if (!isActive && containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
  }, [isActive]);

  // Restore scroll position when returning to tab
  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="tab-panel absolute inset-0 bg-white dark:bg-slate-900 overflow-y-auto overscroll-contain"
      style={{
        display: isActive ? "block" : "none",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
      }}
    >
      {children}
    </div>
  );
}

interface LazyTabPanelProps extends TabPanelProps {
  /** Only mount content after first activation */
  mountOnFirstVisit?: boolean;
}

/**
 * A lazy version of TabPanel that only mounts children on first visit.
 * Once mounted, keeps content alive (never unmounts).
 */
export function LazyTabPanel({ id, activeTab, children, mountOnFirstVisit = true }: LazyTabPanelProps) {
  const isActive = activeTab === id;
  // Once visited, stays mounted. State rather than a ref so render reads a
  // value React knows about; the guarded update during render is React's
  // documented way to derive state from props, applied before paint.
  const [hasMounted, setHasMounted] = useState(isActive);
  if (isActive && !hasMounted) {
    setHasMounted(true);
  }

  // Don't render anything until first visit
  if (mountOnFirstVisit && !hasMounted && !isActive) {
    return null;
  }

  return (
    <TabPanel id={id} activeTab={activeTab}>
      {children}
    </TabPanel>
  );
}
