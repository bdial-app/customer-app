"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { getMyWarnings } from "@/services/report.service";

const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), {
  ssr: false,
});
import {
  closeOutline,
  warningOutline,
  alertCircleOutline,
  shieldHalfOutline,
  timeOutline,
  chevronForwardOutline,
} from "ionicons/icons";

interface Warning {
  id: string;
  warningType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ProviderWarningModalProps {
  /** If true, modal was triggered manually (e.g. from warnings sheet) */
  forced?: boolean;
  onViewAll: () => void;
}

const SESSION_KEY = "tijarah_warning_modal_seen";

export default function ProviderWarningModal({
  forced = false,
  onViewAll,
}: ProviderWarningModalProps) {
  const [open, setOpen] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Only auto-show once per session
    if (!forced && sessionStorage.getItem(SESSION_KEY)) return;

    getMyWarnings()
      .then((data) => {
        const list: Warning[] = Array.isArray(data) ? data : data?.data ?? [];
        if (list.length > 0) {
          setWarnings(list);
          setOpen(true);
          if (!forced) sessionStorage.setItem(SESSION_KEY, "1");
        }
      })
      .catch(() => {});
  }, [mounted, forced]);

  const handleClose = () => setOpen(false);
  const handleViewAll = () => {
    setOpen(false);
    onViewAll();
  };

  if (!mounted) return null;

  const totalWarnings = warnings.length;
  // Determine severity level for messaging
  const isCritical = totalWarnings >= 3;
  const mostRecent = warnings[0];

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[9990]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 z-[9991] rounded-3xl overflow-hidden"
            style={{ top: "50%", transform: "translate(0, -50%)", maxWidth: 420, margin: "auto" }}
          >
            {/* Header gradient */}
            <div
              className={`relative px-5 pt-5 pb-4 ${
                isCritical
                  ? "bg-gradient-to-br from-red-600 to-rose-700"
                  : "bg-gradient-to-br from-amber-500 to-orange-600"
              }`}
            >
              {/* Decorative circle */}
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/5" />

              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 z-10"
              >
                <IonIcon icon={closeOutline} className="text-white text-lg" />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <IonIcon icon={warningOutline} className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight">
                      {isCritical ? "Account at Risk" : "Account Warning"}
                    </h2>
                    <p className="text-white/70 text-[11px]">
                      {totalWarnings} warning{totalWarnings > 1 ? "s" : ""} on your account
                    </p>
                  </div>
                </div>

                {/* Warning count pills */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        step <= totalWarnings
                          ? "bg-white"
                          : "bg-white/25"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-white/80 shrink-0">
                    {totalWarnings}/5
                  </span>
                </div>
                <p className="text-white/60 text-[10px] mt-1">
                  {isCritical
                    ? "Further violations will result in account suspension"
                    : "Continued violations may lead to suspension"}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 space-y-4">
              {/* Most recent warning */}
              {mostRecent && (
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <IonIcon icon={alertCircleOutline} className="text-amber-500 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {mostRecent.title}
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                        {mostRecent.message}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-500">
                        <IonIcon icon={timeOutline} className="text-xs" />
                        {new Date(mostRecent.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next step message */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <IonIcon icon={shieldHalfOutline} className="text-slate-500 text-base" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      What happens next?
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {totalWarnings >= 4
                        ? "Your account is one warning away from suspension. Any further policy violation will result in your business being suspended."
                        : totalWarnings >= 3
                        ? "You have received multiple warnings. Please review and correct any policy violations immediately to avoid suspension."
                        : "Please review your content and ensure it complies with our community guidelines. Repeated violations will lead to suspension."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleViewAll}
                  className={`w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 ${
                    isCritical
                      ? "bg-red-600"
                      : "bg-amber-500"
                  }`}
                >
                  View All {totalWarnings} Warning{totalWarnings > 1 ? "s" : ""}
                  <IonIcon icon={chevronForwardOutline} className="text-sm" />
                </motion.button>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 active:opacity-70"
                >
                  I understand, dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
