"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { updateUser } from "@/services/user.service";

export type ProviderStatus =
  | "not_applied"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "disabled"
  | "deleted"
  | "suspended";
export type UserMode = "customer" | "provider";

const USER_MODE_KEY = "tijarah_user_mode";
const PROVIDER_STATUS_KEY = "tijarah_provider_status";

function readStoredMode(): UserMode {
  if (typeof window === "undefined") return "customer";
  try {
    const v = localStorage.getItem(USER_MODE_KEY);
    return v === "provider" ? "provider" : "customer";
  } catch {
    return "customer";
  }
}

function readStoredProviderStatus(): ProviderStatus {
  if (typeof window === "undefined") return "not_applied";
  try {
    const v = localStorage.getItem(PROVIDER_STATUS_KEY);
    if (v && ["not_applied", "pending", "in_review", "approved", "rejected", "disabled", "deleted", "suspended"].includes(v)) {
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
  setProviderStatus: (status: ProviderStatus) => void;
  setUserMode: (mode: UserMode) => void;
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
  const lastToggleRef = useRef(0);
  const hydratedRef = useRef(false);

  const setProviderStatus = useCallback((status: ProviderStatus) => {
    _setProviderStatus(status);
    try { localStorage.setItem(PROVIDER_STATUS_KEY, status); } catch {}
  }, []);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = readStoredMode();
    if (stored === "provider") _setUserMode("provider");
    hydratedRef.current = true;
  }, []);

  const setUserMode = useCallback((mode: UserMode) => {
    _setUserMode(mode);
    try { localStorage.setItem(USER_MODE_KEY, mode); } catch {}
    updateUser({ preferredMode: mode }).catch(() => {});
  }, []);

  const toggleMode = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleRef.current < 400) return;
    lastToggleRef.current = now;
    if (providerStatus === "approved" || providerStatus === "pending" || providerStatus === "in_review" || providerStatus === "suspended") {
      _setUserMode((prev) => {
        const next = prev === "customer" ? "provider" : "customer";
        try { localStorage.setItem(USER_MODE_KEY, next); } catch {}
        updateUser({ preferredMode: next }).catch(() => {});
        return next;
      });
    }
  }, [providerStatus]);

  const resetProviderState = useCallback(() => {
    setProviderStatus("not_applied");
    _setUserMode("customer");
    setProviderInfo(null);
    try { localStorage.removeItem(USER_MODE_KEY); localStorage.removeItem(PROVIDER_STATUS_KEY); } catch {}
  }, [setProviderStatus]);

  return (
    <AppContext.Provider
      value={{
        providerStatus,
        userMode,
        providerInfo,
        setProviderStatus,
        setUserMode,
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
