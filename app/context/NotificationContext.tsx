"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface NotificationOptions {
  title: string;
  subtitle: string | string[];
  duration?: number;
}

interface NotificationContextValue {
  notify: (options: NotificationOptions) => void;
  options: NotificationOptions | null;
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
  const [options, setOptions] = useState<NotificationOptions | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const notify = useCallback((opts: NotificationOptions) => {
    // Reset if already showing
    if (timerRef.current) clearTimeout(timerRef.current);
    const resolvedSubtitle = Array.isArray(opts.subtitle)
      ? opts.subtitle[0] ?? ""
      : opts.subtitle;
    setOptions({ title: opts.title, subtitle: resolvedSubtitle });
    setOpen(true);
    timerRef.current = setTimeout(() => setOpen(false), opts.duration ?? AUTO_DISMISS_MS);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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
