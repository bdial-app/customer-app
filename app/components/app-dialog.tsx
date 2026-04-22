"use client";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";

const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), {
  ssr: false,
});

export interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmColor?: "amber" | "red" | "emerald" | "blue" | "gray";
  isLoading?: boolean;
  loadingLabel?: string;
}

const CONFIRM_COLORS = {
  amber:
    "bg-amber-500 text-white shadow-sm shadow-amber-200 active:bg-amber-600",
  red: "bg-red-500 text-white shadow-sm shadow-red-200 active:bg-red-600",
  emerald:
    "bg-emerald-500 text-white shadow-sm shadow-emerald-200 active:bg-emerald-600",
  blue: "bg-blue-500 text-white shadow-sm shadow-blue-200 active:bg-blue-600",
  gray: "bg-gray-100 text-gray-700 active:bg-gray-200",
};

export const AppDialog = ({
  open,
  onClose,
  icon,
  iconColor = "text-amber-600",
  iconBg = "bg-amber-50",
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  confirmColor = "amber",
  isLoading = false,
  loadingLabel,
}: AppDialogProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 inset-x-0 sm:inset-x-auto z-[9999] sm:max-w-sm sm:w-full"
          >
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-xl"
              style={{
                paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
              }}
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="px-6 pt-4 sm:pt-6 pb-5">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-2">
                  {icon && (
                    <div
                      className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <IonIcon
                        icon={icon}
                        className={`w-[22px] h-[22px] ${iconColor}`}
                      />
                    </div>
                  )}
                  <h3 className="text-[17px] font-bold text-gray-900 leading-tight">
                    {title}
                  </h3>
                </div>

                {/* Description */}
                {description && (
                  <p
                    className={`text-[13px] text-gray-500 leading-relaxed mt-1 ${icon ? "ml-[56px]" : ""}`}
                  >
                    {description}
                  </p>
                )}

                {/* Actions */}
                <div
                  className={`flex flex-col gap-3 mt-5 ${icon ? "ml-[56px]" : ""}`}
                >
                  {onConfirm && (
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${CONFIRM_COLORS[confirmColor]}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                          {loadingLabel || confirmLabel}
                        </span>
                      ) : (
                        confirmLabel
                      )}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 text-sm font-semibold transition-colors active:scale-[0.98] active:bg-gray-200 disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
