"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface BottomSheetProps {
  opened: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Optional title shown in a built-in header bar */
  title?: string;
  /** Optional left element (e.g. close/back button) */
  headerLeft?: ReactNode;
  /** Optional right element */
  headerRight?: ReactNode;
}

export const BottomSheet = ({
  opened,
  onClose,
  children,
  className = "",
  title,
  headerLeft,
  headerRight,
}: BottomSheetProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <AnimatePresence>
      {opened && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={`fixed bottom-0 inset-x-0 z-[9999] bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden flex flex-col ${className}`}
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full" />
            </div>

            {/* Optional header */}
            {title && (
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100 dark:border-slate-700">
                <div className="w-10 flex justify-start">{headerLeft}</div>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white flex-1 text-center">
                  {title}
                </h3>
                <div className="w-10 flex justify-end">{headerRight}</div>
              </div>
            )}

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default BottomSheet;
