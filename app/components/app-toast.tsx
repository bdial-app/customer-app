"use client";
import { useNotification } from "@/app/context/NotificationContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  checkmarkCircle,
  alertCircle,
  warningOutline,
  informationCircle,
  close,
} from "ionicons/icons";
import dynamic from "next/dynamic";

const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);

const VARIANT_CONFIG = {
  success: {
    icon: checkmarkCircle,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-900",
    subtitleColor: "text-emerald-600",
    progressColor: "bg-emerald-400",
  },
  error: {
    icon: alertCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-900",
    subtitleColor: "text-red-600",
    progressColor: "bg-red-400",
  },
  warning: {
    icon: warningOutline,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    titleColor: "text-amber-900",
    subtitleColor: "text-amber-600",
    progressColor: "bg-amber-400",
  },
  info: {
    icon: informationCircle,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-900",
    subtitleColor: "text-blue-600",
    progressColor: "bg-blue-400",
  },
};

export const AppToast = () => {
  const { open, options, dismiss, progress } = useNotification();
  const variant = options?.variant ?? "info";
  const config = VARIANT_CONFIG[variant];

  return (
    <AnimatePresence>
      {open && options && (
        <motion.div
          key="toast"
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-[9999] px-4 pt-[calc(env(safe-area-inset-top)+8px)]"
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`${config.bg} ${config.border} border rounded-2xl shadow-lg shadow-black/5 overflow-hidden`}
            style={{ pointerEvents: "auto" }}
          >
            <div className="flex items-start gap-3 px-4 py-3.5">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <IonIcon
                  icon={config.icon}
                  className={`w-5 h-5 ${config.iconColor}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] font-semibold ${config.titleColor} leading-tight`}
                >
                  {options.title}
                </p>
                {options.subtitle && (
                  <p
                    className={`text-[12px] ${config.subtitleColor} mt-0.5 leading-snug`}
                  >
                    {options.subtitle}
                  </p>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors -mr-1 -mt-0.5"
              >
                <IonIcon
                  icon={close}
                  className="w-3.5 h-3.5 text-gray-400"
                />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] bg-black/5">
              <motion.div
                className={`h-full ${config.progressColor}`}
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
