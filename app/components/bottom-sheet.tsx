"use client";
import { type ReactNode } from "react";
import { Sheet } from "@/app/components/ui/sheet";

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

/** A sheet with an optional title bar; drags to close on phones, a dialog on wide screens. */
export const BottomSheet = ({
  opened,
  onClose,
  children,
  className = "",
  title,
  headerLeft,
  headerRight,
}: BottomSheetProps) => (
  <Sheet open={opened} onClose={onClose} label={title} className={`bg-white dark:bg-slate-900 ${className}`}>
    {title && (
      <div className="shrink-0 flex items-center justify-between px-4 pb-3 sm:pt-4 border-b border-gray-100 dark:border-slate-700">
        <div className="w-10 flex justify-start">{headerLeft}</div>
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-white flex-1 text-center">{title}</h3>
        <div className="w-10 flex justify-end">{headerRight}</div>
      </div>
    )}
    {children}
  </Sheet>
);

export default BottomSheet;
