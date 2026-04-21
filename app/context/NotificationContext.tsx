"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type NotificationVariant = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  title: string;
  subtitle?: string | string[];
  variant?: NotificationVariant;
  duration?: number;
}

interface NotificationContextValue {
  notify: (options: NotificationOptions) => void;
  options: (NotificationOptions & { subtitle?: string }) | null;
  open: boolean;
  dismiss: () => void;
  progress: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const AUTO_DISMISS_MS = 3000;
const PROGRESS_INTERVAL_MS = 50;

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [options, setOptions] = useState<(NotificationOptions & { subtitle?: string }) | null>(null);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(AUTO_DISMISS_MS);
  const startRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    timerRef.current = null;
    progressRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    clearTimers();
  }, [clearTimers]);

  const notify = useCallback((opts: NotificationOptions) => {
    clearTimers();
    const resolvedSubtitle = Array.isArray(opts.subtitle)
      ? opts.subtitle[0] ?? ""
      : opts.subtitle;
    const duration = opts.duration ?? AUTO_DISMISS_MS;
    durationRef.current = duration;
    startRef.current = Date.now();

    setOptions({
      title: opts.title,
      subtitle: resolvedSubtitle,
      variant: opts.variant ?? "info",
      duration,
    });
    setOpen(true);
    setProgress(100);

    // Progress countdown
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0 && progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    }, PROGRESS_INTERVAL_MS);

    timerRef.current = setTimeout(() => {
      setOpen(false);
      clearTimers();
    }, duration);
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <NotificationContext.Provider value={{ notify, options, open, dismiss, progress }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
};
