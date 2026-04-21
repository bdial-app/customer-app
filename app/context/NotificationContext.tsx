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
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const AUTO_DISMISS_MS = 3000;

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [options, setOptions] = useState<(NotificationOptions & { subtitle?: string }) | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    clearTimer();
  }, [clearTimer]);

  const notify = useCallback((opts: NotificationOptions) => {
    clearTimer();
    const resolvedSubtitle = Array.isArray(opts.subtitle)
      ? opts.subtitle[0] ?? ""
      : opts.subtitle;
    const duration = opts.duration ?? AUTO_DISMISS_MS;

    setOptions({
      title: opts.title,
      subtitle: resolvedSubtitle,
      variant: opts.variant ?? "info",
      duration,
    });
    setOpen(true);

    timerRef.current = setTimeout(() => {
      setOpen(false);
      clearTimer();
    }, duration);
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <NotificationContext.Provider value={{ notify, options, open, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used inside NotificationProvider");
  return ctx;
};
