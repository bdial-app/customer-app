import { useAuthGateContext } from "@/app/context/AuthGateContext";
import { useAppSelector } from "./useAppStore";

/**
 * Convenience hook that returns the auth gate helpers plus current auth state.
 */
export function useAuthGate() {
  const { requireAuth, isAuthGateOpen, closeAuthGate } = useAuthGateContext();
  const user = useAppSelector((state) => state.auth.user);

  return {
    /** Runs callback immediately if logged in; otherwise opens the login sheet first */
    requireAuth,
    /** Whether the user is currently authenticated */
    isAuthenticated: !!user,
    /** Current user object (null if not logged in) */
    user,
    /** Whether the auth gate sheet is currently open */
    isAuthGateOpen,
    /** Programmatically close the auth gate */
    closeAuthGate,
  };
}
