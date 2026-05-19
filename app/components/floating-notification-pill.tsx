"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  notificationsOutline,
  chevronForwardOutline,
  closeOutline,
} from "ionicons/icons";

interface FloatingNotificationPillProps {
  /** Whether another pill (e.g. provider nudge) is already showing below */
  hasOtherPill?: boolean;
  /** Called when user taps the pill */
  onTap: () => void;
}

interface PushEvent {
  title: string;
  body?: string;
  data?: Record<string, any>;
}

const AUTO_DISMISS_MS = 6000;

export default function FloatingNotificationPill({
  hasOtherPill = false,
  onTap,
}: FloatingNotificationPillProps) {
  const [visible, setVisible] = useState(false);
  const [event, setEvent] = useState<PushEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handlePush = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.title) return;

      setEvent({
        title: detail.title,
        body: detail.body,
        data: detail.data,
      });
      setVisible(true);

      // Auto-dismiss
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    };

    window.addEventListener("push-notification", handlePush);
    return () => {
      window.removeEventListener("push-notification", handlePush);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const bottomOffset = hasOtherPill ? "bottom-[136px]" : "bottom-[88px]";

  return (
    <AnimatePresence>
      {visible && event && (
        <motion.div
          key="notif-pill"
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className={`fixed ${bottomOffset} left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-[380px]`}
        >
          <div
            onClick={() => {
              dismiss();
              onTap();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer active:scale-[0.97] transition-transform"
          >
            {/* Icon */}
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <IonIcon
                icon={notificationsOutline}
                className="text-lg text-amber-500"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate leading-tight">
                {event.title}
              </p>
              {event.body && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">
                  {event.body}
                </p>
              )}
            </div>

            {/* Actions */}
            <IonIcon
              icon={chevronForwardOutline}
              className="text-sm text-slate-400 shrink-0"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="p-1 rounded-full text-slate-300 hover:text-slate-500 shrink-0"
            >
              <IonIcon icon={closeOutline} className="text-sm" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
