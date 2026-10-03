"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { chevronBack } from "ionicons/icons";
import { triggerHaptic } from "@/utils/haptics";
import { useIsClient } from "@/hooks/useIsClient";

/** A drag must start this close to the left edge to count as "back". */
const EDGE_PX = 28;
/** How far the finger must travel to go back on release. */
const TRIGGER_PX = 80;

/**
 * iOS-style edge swipe: drag from the left edge to go back. An arrow follows
 * the finger and fills in once releasing will navigate. Mount it on any
 * pushed page; it listens on the window and renders nothing until used.
 */
export default function SwipeBackGesture({ onBack }: { onBack: () => void }) {
  const mounted = useIsClient();
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const active = useRef(false);
  const armed = useRef(false);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    const reset = () => {
      start.current = null;
      active.current = false;
      armed.current = false;
      setDrag(0);
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || t.clientX > EDGE_PX) return;
      start.current = { x: t.clientX, y: t.clientY };
      active.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      // Decide once whether this is a sideways swipe or a scroll.
      if (!active.current) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) return reset();
        if (dx < 10) return;
        active.current = true;
      }
      // Keep the page (or a photo carousel) from moving under the gesture.
      if (e.cancelable) e.preventDefault();
      const d = Math.max(0, dx);
      const nowArmed = d >= TRIGGER_PX;
      if (nowArmed && !armed.current) triggerHaptic("light");
      armed.current = nowArmed;
      setDrag(d);
    };

    const onEnd = () => {
      const go = active.current && armed.current;
      reset();
      if (go) onBackRef.current();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", reset);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, []);

  if (!mounted || drag <= 0) return null;

  const progress = Math.min(1, drag / TRIGGER_PX);
  const ready = progress >= 1;

  return createPortal(
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Edge shade grows with the drag */}
      <div
        className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/15 to-transparent"
        style={{ opacity: progress }}
      />
      <div
        className={`absolute top-1/2 w-11 h-11 -mt-[22px] rounded-full flex items-center justify-center shadow-lg transition-colors ${
          ready ? "bg-amber-500 text-white" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        }`}
        style={{
          left: -44 + Math.min(drag, TRIGGER_PX + 24) * 0.9,
          transform: `scale(${0.7 + progress * 0.3})`,
        }}
      >
        <IonIcon icon={chevronBack} className="text-xl" />
      </div>
    </div>,
    document.body,
  );
}
