"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { updateUser } from "@/services/user.service";
import { getItemSync, setItemSync, removeItemSync } from "@/utils/storage";

export type ProviderStatus =
  | "not_applied"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "disabled"
  | "deleted"
  | "suspended"
  | "unverified";
export type UserMode = "customer" | "provider";

const USER_MODE_KEY = "tijarah_user_mode";
const PROVIDER_STATUS_KEY = "tijarah_provider_status";

function readStoredMode(): UserMode {
  if (typeof window === "undefined") return "customer";
  try {
    const v = getItemSync(USER_MODE_KEY);
    return v === "provider" ? "provider" : "customer";
  } catch {
    return "customer";
  }
}

function readStoredProviderStatus(): ProviderStatus {
  if (typeof window === "undefined") return "not_applied";
  try {
    const v = getItemSync(PROVIDER_STATUS_KEY);
    if (v && ["not_applied", "pending", "in_review", "approved", "rejected", "disabled", "deleted", "suspended", "unverified"].includes(v)) {
      return v as ProviderStatus;
    }
    return "not_applied";
  } catch {
    return "not_applied";
  }
}

interface ProviderInfo {
  id: string;
  brandName: string;
}

interface AppContextType {
  providerStatus: ProviderStatus;
  userMode: UserMode;
  providerInfo: ProviderInfo | null;
  /**
   * True once the real provider status is known for the current session —
   * either restored from a prior resolved session (localStorage) or fetched
   * from the server after login. While false for a logged-in user, mode-dependent
   * UI should render a skeleton instead of the default ("not_applied" / customer)
   * state, which would otherwise flash before the server response arrives.
   */
  providerStatusResolved: boolean;
  setProviderStatus: (status: ProviderStatus) => void;
  setProviderStatusResolved: (resolved: boolean) => void;
  setUserMode: (mode: UserMode) => void;
  /** Temporarily override mode without persisting to storage (for unauthenticated state). */
  setUserModeNoSync: (mode: UserMode) => void;
  setProviderInfo: (info: ProviderInfo | null) => void;
  toggleMode: () => void;
  resetProviderState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [providerStatus, _setProviderStatus] =
    useState<ProviderStatus>(readStoredProviderStatus);
  const [userMode, _setUserMode] = useState<UserMode>("customer");
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  // Optimistically "resolved" when a status was persisted by a prior session,
  // so returning users render instantly. Fresh logins (logout clears storage)
  // start unresolved and gate on the server fetch — see ProviderStatusBootstrap.
  const [providerStatusResolved, setProviderStatusResolved] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return getItemSync(PROVIDER_STATUS_KEY) != null; } catch { return false; }
  });
  const lastToggleRef = useRef(0);
  const hydratedRef = useRef(false);

  const setProviderStatus = useCallback((status: ProviderStatus) => {
    _setProviderStatus(status);
    try { setItemSync(PROVIDER_STATUS_KEY, status); } catch {}
  }, []);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = readStoredMode();
    if (stored === "provider") _setUserMode("provider");
    hydratedRef.current = true;
  }, []);

  const setUserMode = useCallback((mode: UserMode) => {
    _setUserMode(mode);
    try { setItemSync(USER_MODE_KEY, mode); } catch {}
    updateUser({ preferredMode: mode }).catch(() => {});
  }, []);

  // Sets mode in memory only — used when forcing guest users to customer mode
  // so their saved "provider" preference in localStorage is not overwritten.
  const setUserModeNoSync = useCallback((mode: UserMode) => {
    _setUserMode(mode);
  }, []);

  const toggleMode = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleRef.current < 400) return;
    lastToggleRef.current = now;
    if (providerStatus === "approved" || providerStatus === "in_review" || providerStatus === "suspended" || providerStatus === "unverified" || providerStatus === "rejected") {
      _setUserMode((prev) => {
        const next = prev === "customer" ? "provider" : "customer";
        try { setItemSync(USER_MODE_KEY, next); } catch {}
        updateUser({ preferredMode: next }).catch(() => {});
        return next;
      });
    }
  }, [providerStatus]);

  const resetProviderState = useCallback(() => {
    setProviderStatus("not_applied");
    _setUserMode("customer");
    setProviderInfo(null);
    // Re-gate the next login: storage is cleared, so the default status is no
    // longer trustworthy until the server fetch resolves it again.
    setProviderStatusResolved(false);
    try { removeItemSync(USER_MODE_KEY); removeItemSync(PROVIDER_STATUS_KEY); } catch {}
  }, [setProviderStatus]);

  return (
    <AppContext.Provider
      value={{
        providerStatus,
        userMode,
        providerInfo,
        providerStatusResolved,
        setProviderStatus,
        setProviderStatusResolved,
        setUserMode,
        setUserModeNoSync,
        setProviderInfo,
        toggleMode,
        resetProviderState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
