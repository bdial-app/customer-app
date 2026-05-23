"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

interface InfoTipProps {
  /** Short explanation shown in the tooltip */
  text: string;
  /** Optional size of the icon — defaults to 13 */
  size?: number;
  /** Optional custom class for the trigger */
  className?: string;
}

/**
 * A lightweight info icon (ⓘ) that shows a tooltip on tap/hover.
 * Designed for mobile — tapping anywhere else dismisses it.
 */
export const InfoTip = ({ text, size = 13, className = "" }: InfoTipProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: "50%", placement: "above" as "above" | "below" });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 220;
    const tooltipHeight = 60; // approximate
    const gap = 8;

    // Center horizontally on the trigger
    const triggerCenterX = rect.left + rect.width / 2;
    let left = triggerCenterX - tooltipWidth / 2;

    // Keep within viewport horizontally
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;

    // Arrow position relative to tooltip (track where trigger center is)
    const arrowLeft = `${Math.max(12, Math.min(tooltipWidth - 12, triggerCenterX - left))}px`;

    // Decide above or below based on available space
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceAbove >= tooltipHeight + gap) {
      // Position above the trigger
      setPos({ top: rect.top - gap, left, arrowLeft, placement: "above" });
    } else {
      // Position below the trigger
      setPos({ top: rect.bottom + gap, left, arrowLeft, placement: "below" });
    }
  }, []);

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!open) updatePos();
    setOpen((v) => !v);
  };

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("touchstart", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("touchstart", handleClose);
    };
  }, [open]);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none ${className}`}
        style={{ width: size + 4, height: size + 4 }}
        aria-label="More info"
      >
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <text x="8" y="12" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="currentColor">i</text>
        </svg>
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, y: pos.placement === "above" ? 6 : -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.placement === "above" ? 4 : -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] pointer-events-auto"
                style={{
                  top: pos.top,
                  left: pos.left,
                  ...(pos.placement === "above" ? { transform: "translateY(-100%)" } : {}),
                }}
              >
                <div className="relative bg-slate-800 dark:bg-slate-700 text-white text-[11.5px] leading-snug px-3 py-2.5 rounded-xl shadow-lg max-w-[220px]">
                  {text}
                  {/* Arrow pointing to trigger */}
                  <div
                    className={`absolute w-2.5 h-2.5 bg-slate-800 dark:bg-slate-700 rotate-45 rounded-[2px] ${
                      pos.placement === "above" ? "-bottom-1" : "-top-1"
                    }`}
                    style={{ left: pos.arrowLeft, transform: "translateX(-50%) rotate(45deg)" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
