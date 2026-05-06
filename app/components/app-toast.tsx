"use client";
import React from "react";
import { useNotification } from "@/app/context/NotificationContext";
import { AnimatePresence, motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

type Variant = "success" | "error" | "warning" | "info";

const VARIANT_CONFIG: Record<Variant, { accent: string; iconBg: string; icon: React.ReactNode }> = {
  success: {
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 4L12 14.01l-3-3" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    accent: "bg-red-500",
    iconBg: "bg-red-50 dark:bg-red-900/30",
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <circle cx={12} cy={12} r={10} stroke="#EF4444" strokeWidth={2} />
        <path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  warning: {
    accent: "bg-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9v4m0 4h.01" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    accent: "bg-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <circle cx={12} cy={12} r={10} stroke="#3B82F6" strokeWidth={2} />
        <path d="M12 16v-4m0-4h.01" stroke="#3B82F6" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
};

export const AppToast = () => {
  const { open, options, dismiss } = useNotification();
  const variant = options?.variant ?? "info";
  const config = VARIANT_CONFIG[variant];
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-60, 0], [0, 1]);

  const handleDragEnd = (_: never, info: PanInfo) => {
    if (info.offset.y < -30) dismiss();
  };

  return (
    <AnimatePresence>
      {open && options && (
        <motion.div
          key="toast"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 440, damping: 32, mass: 0.8 }}
          drag="y"
          dragConstraints={{ top: -80, bottom: 0 }}
          dragElastic={0.18}
          onDragEnd={handleDragEnd}
          style={{ y, opacity }}
          className="fixed top-0 inset-x-0 z-[9999] flex justify-center px-4 pt-[calc(var(--sat,0px)+10px)]"
        >
          <div
            className="w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-slate-700 overflow-hidden cursor-grab active:cursor-grabbing"
            onClick={dismiss}
          >
            {/* Grab indicator */}
            <div className="flex justify-center pt-1.5">
              <div className="w-9 h-[3.5px] rounded-full bg-gray-200 dark:bg-slate-600" />
            </div>

            <div className="flex items-start gap-3.5 px-4 pt-2.5 pb-3.5">
              {/* Left accent bar */}
              <div className={`w-1 self-stretch rounded-full ${config.accent} flex-shrink-0`} />

              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                {config.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white leading-tight">
                  {options.title}
                </p>
                {options.subtitle && (
                  <p className="text-[13px] text-gray-500 dark:text-slate-400 leading-snug mt-1 line-clamp-2">
                    {Array.isArray(options.subtitle) ? options.subtitle.join(", ") : options.subtitle}
                  </p>
                )}
              </div>

              {/* Dismiss X */}
              <button
                type="button"
                className="flex-shrink-0 mt-0.5 p-1 -mr-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
