"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  getMyWarnings,
  markWarningRead,
} from "@/services/report.service";

const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), {
  ssr: false,
});
import {
  closeOutline,
  warningOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  timeOutline,
} from "ionicons/icons";

interface Warning {
  id: string;
  warningType: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface ProviderWarningsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRead?: () => void;
}

export default function ProviderWarningsSheet({
  isOpen,
  onClose,
  onRead,
}: ProviderWarningsSheetProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getMyWarnings()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setWarnings(list);
        // Mark unread warnings as read
        const unread = list.filter((w: Warning) => !w.isRead);
        if (unread.length > 0) {
          Promise.all(unread.map((w: Warning) => markWarningRead(w.id).catch(() => {})))
            .then(() => onRead?.());
        }
      })
      .catch(() => setError("Failed to load warnings"))
      .finally(() => setLoading(false));
  }, [isOpen, onRead]);

  if (typeof window === "undefined") return null;

  const warningIcon = (type: string) => {
    switch (type) {
      case "report_warning":
        return alertCircleOutline;
      case "policy_violation":
        return warningOutline;
      case "content_warning":
        return warningOutline;
      default:
        return alertCircleOutline;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[9998]"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-slate-900 rounded-t-3xl max-h-[80vh] flex flex-col"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <IonIcon
                    icon={warningOutline}
                    className="text-amber-500 text-lg"
                  />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                    Warnings
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {warnings.length} total
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <IonIcon
                  icon={closeOutline}
                  className="text-slate-500 dark:text-slate-400 text-lg"
                />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 mt-3">Loading warnings…</p>
                </div>
              )}

              {error && (
                <div className="text-center py-10">
                  <IonIcon
                    icon={alertCircleOutline}
                    className="text-3xl text-red-400 mb-2"
                  />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {!loading && !error && warnings.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                    <IonIcon
                      icon={checkmarkCircleOutline}
                      className="text-2xl text-emerald-400"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                    No warnings
                  </h3>
                  <p className="text-xs text-slate-400">
                    Your account is in good standing.
                  </p>
                </div>
              )}

              {!loading && !error && warnings.length > 0 && (
                <div className="space-y-3">
                  {warnings.map((w, i) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`rounded-2xl p-4 border ${
                        w.isRead
                          ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                          : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            w.isRead
                              ? "bg-slate-100 dark:bg-slate-700"
                              : "bg-amber-100 dark:bg-amber-900/40"
                          }`}
                        >
                          <IonIcon
                            icon={warningIcon(w.warningType)}
                            className={`text-lg ${
                              w.isRead
                                ? "text-slate-400"
                                : "text-amber-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4
                              className={`text-xs font-bold truncate ${
                                w.isRead
                                  ? "text-slate-600 dark:text-slate-300"
                                  : "text-amber-800 dark:text-amber-300"
                              }`}
                            >
                              {w.title}
                            </h4>
                            {!w.isRead && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {w.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                            <IonIcon icon={timeOutline} className="text-xs" />
                            {new Date(w.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
