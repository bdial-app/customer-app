"use client";
/**
 * A full-screen page that slides in from the right, for anything you type
 * into (forms, search, codes) — the keyboard has the whole screen to work
 * with instead of squeezing a bottom sheet.
 *
 * Back (the header arrow, Android back, an iOS edge swipe, the browser's back
 * button) closes it. It sits just below sheets and dialogs, so a confirm or a
 * picker opened from a screen shows over it.
 */
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { handleBackPress, topOverlay, useBackDismiss } from "@/hooks/useBackDismiss";
import { useIsClient } from "@/hooks/useIsClient";

export interface ScreenProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Shown in the header, and the screen's accessible name. */
  title: ReactNode;
  subtitle?: ReactNode;
  /** Header actions, right of the title (e.g. "Clear all"). */
  headerRight?: ReactNode;
  /** Pinned under the body and above the keyboard, for the main action. */
  footer?: ReactNode;
  /** Accessible name when the title isn't plain text. */
  label?: string;
  /** False while something mustn't be interrupted (a payment in progress). */
  dismissible?: boolean;
  zIndex?: number;
  /** Background of the whole screen. */
  className?: string;
  /** Classes for the body. */
  bodyClassName?: string;
  /** False when the content scrolls its own panes and should fill the height. */
  scroll?: boolean;
}

export function Screen({
  open,
  onClose,
  children,
  title,
  subtitle,
  headerRight,
  footer,
  label,
  dismissible = true,
  zIndex = 9997,
  className = "bg-white dark:bg-slate-900",
  bodyClassName = "",
  scroll = true,
}: ScreenProps) {
  const mounted = useIsClient();
  const keyboard = useKeyboardOffset();
  useBackDismiss(open, onClose, { kind: "screen", dismissible });

  // Esc on the web acts like back, but only when a screen is on top (a sheet
  // over it closes itself first). One press closes one screen.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || topOverlay()?.kind !== "screen") return;
      e.preventDefault();
      handleBackPress();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  const safeBottom = "max(var(--sab, env(safe-area-inset-bottom)), 0px)";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="screen"
          role="dialog"
          aria-modal="true"
          aria-label={label ?? (typeof title === "string" ? title : undefined)}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className={`fixed inset-0 flex flex-col overflow-hidden ${className}`}
          style={{ zIndex }}
        >
          <header
            className="shrink-0 border-b border-slate-100 dark:border-slate-800"
            style={{ paddingTop: "max(var(--sat, env(safe-area-inset-top)), 8px)" }}
          >
            <div className="mx-auto flex w-full max-w-2xl items-center gap-2 px-2 py-2">
              <button
                type="button"
                onClick={() => dismissible && onClose()}
                disabled={!dismissible}
                aria-label="Back"
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center active:bg-slate-100 dark:active:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <IonIcon icon={arrowBack} className="text-[22px] text-slate-700 dark:text-slate-200" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="truncate text-[17px] font-bold text-slate-900 dark:text-white">{title}</h2>
                {subtitle && <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
              {headerRight && <div className="shrink-0 flex items-center gap-2 pr-2">{headerRight}</div>}
            </div>
          </header>

          {/* Padded above the keyboard, which doesn't resize the webview. */}
          <div
            className={`flex-1 min-h-0 ${scroll ? "overflow-y-auto overscroll-contain" : "flex flex-col overflow-hidden"}`}
            style={{ paddingBottom: footer ? undefined : keyboard > 0 ? keyboard : safeBottom }}
          >
            <div className={`mx-auto flex w-full max-w-2xl flex-col ${scroll ? "min-h-full" : "flex-1 min-h-0"} ${bodyClassName}`}>{children}</div>
          </div>

          {footer && (
            <div
              className="shrink-0 border-t border-slate-100 dark:border-slate-800"
              style={{ paddingBottom: keyboard > 0 ? keyboard : safeBottom }}
            >
              <div className="mx-auto w-full max-w-2xl">{footer}</div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Screen;
