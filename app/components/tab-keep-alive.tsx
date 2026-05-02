"use client";
import { useRef, useEffect, useCallback, ReactNode } from "react";

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
}

/**
 * Keeps tab content mounted but hidden when inactive.
 * Preserves scroll position per tab, restoring on re-activation.
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
      className="tab-panel"
      style={{
        display: isActive ? "block" : "none",
        height: "100%",
        overflow: isActive ? "auto" : "hidden",
        // Prevent layout recalculation while hidden
        containIntrinsicSize: isActive ? undefined : "auto 100vh",
        contentVisibility: isActive ? "visible" : "hidden",
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
  const hasMounted = useRef(false);
  const isActive = activeTab === id;

  if (isActive && !hasMounted.current) {
    hasMounted.current = true;
  }

  // Don't render anything until first visit
  if (mountOnFirstVisit && !hasMounted.current) {
    return null;
  }

  return (
    <TabPanel id={id} activeTab={activeTab}>
      {children}
    </TabPanel>
  );
}
