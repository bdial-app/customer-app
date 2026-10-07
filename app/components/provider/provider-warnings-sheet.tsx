"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet } from "@/app/components/ui/sheet";
import { motion } from "framer-motion";
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

  // Fetched while open; React Query owns loading and error state, and a cached
  // list shows instantly on reopen while it refreshes.
  const {
    data: warnings = [],
    isLoading: loading,
    isError,
  } = useQuery({
    queryKey: ["my-warnings"],
    queryFn: async (): Promise<Warning[]> => {
      const data = await getMyWarnings();
      return Array.isArray(data) ? data : data?.data ?? [];
    },
    enabled: isOpen,
    staleTime: 0,
  });
  const error = isError ? "Failed to load warnings" : null;

  // Mark unread warnings as read once each — a refetch or a parent re-render
  // must not send the same request again.
  const markedRef = useRef(new Set<string>());
  useEffect(() => {
    if (!isOpen) return;
    const unread = warnings.filter((w) => !w.isRead && !markedRef.current.has(w.id));
    if (unread.length === 0) return;
    unread.forEach((w) => markedRef.current.add(w.id));
    Promise.all(unread.map((w) => markWarningRead(w.id).catch(() => {}))).then(() => onRead?.());
  }, [isOpen, warnings, onRead]);

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

  return (
    <Sheet open={isOpen} onClose={onClose} label="Warnings" maxHeight="80dvh">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 pb-3 sm:pt-5 border-b border-slate-100 dark:border-slate-800">
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
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
              {loading && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
    </Sheet>
  );
}
