"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppSelector } from "@/hooks/useAppStore";
import { onUnauthorized } from "@/utils/axios";
import { useQueryClient } from "@tanstack/react-query";

interface AuthGateContextValue {
  /** Wraps an action that requires authentication.
   *  If the user is logged in the callback runs immediately.
   *  Otherwise the login sheet opens and the callback runs after successful auth.
   */
  requireAuth: (callback?: () => void) => void;
  /** Whether the login sheet is currently visible */
  isAuthGateOpen: boolean;
  /** Programmatically close the sheet (e.g. on cancel) */
  closeAuthGate: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export const useAuthGateContext = () => {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGateContext must be inside AuthGateProvider");
  return ctx;
};

export const AuthGateProvider = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user) as any;
  const [isOpen, setIsOpen] = useState(false);
  const pendingCallbackRef = useRef<(() => void) | null>(null);
  // Cooldown: prevent the 401 listener from reopening the sheet right after dismissal
  const lastDismissedRef = useRef<number>(0);
  // Track whether the gate was opened due to a 401 (session recovery)
  const was401Ref = useRef(false);
  const queryClient = useQueryClient();

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (user) {
        callback?.();
      } else {
        pendingCallbackRef.current = callback ?? null;
        setIsOpen(true);
      }
    },
    [user],
  );

  const closeAuthGate = useCallback(() => {
    setIsOpen(false);
    pendingCallbackRef.current = null;
    lastDismissedRef.current = Date.now();
    was401Ref.current = false;
  }, []);

  // When user becomes truthy while the sheet is open → auth succeeded
  // Only auto-close if the user has a complete profile (has a name).
  // New signups get a user object after OTP verify but no name yet —
  // the sheet must stay open for the details step.
  useEffect(() => {
    if (user && user.name && isOpen) {
      const wasSessionRecovery = was401Ref.current;
      setIsOpen(false);
      was401Ref.current = false;
      const cb = pendingCallbackRef.current;
      pendingCallbackRef.current = null;

      // After session recovery (401 → re-auth), invalidate all queries
      // so provider tabs, analytics, etc. refetch with the new token
      if (wasSessionRecovery) {
        queryClient.invalidateQueries();
      }

      // Defer so the sheet close animation starts before the callback fires
      if (cb) setTimeout(cb, 100);
    }
  }, [user, isOpen, queryClient]);

  // Listen for 401/403 from the axios interceptor
  useEffect(() => {
    return onUnauthorized(() => {
      // Don't stack multiple sheets, and respect a 5-second cooldown after dismissal
      const cooldownMs = 5000;
      if (!isOpen && Date.now() - lastDismissedRef.current > cooldownMs) {
        pendingCallbackRef.current = null;
        was401Ref.current = true;
        setIsOpen(true);
      }
    });
  }, [isOpen]);

  return (
    <AuthGateContext.Provider
      value={{ requireAuth, isAuthGateOpen: isOpen, closeAuthGate }}
    >
      {children}
    </AuthGateContext.Provider>
  );
};
