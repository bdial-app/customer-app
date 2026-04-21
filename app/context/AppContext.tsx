"use client";
import { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { updateUser } from "@/services/user.service";

export type ProviderStatus =
  | "not_applied"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected";
export type UserMode = "customer" | "provider";

const USER_MODE_KEY = "tijarah_user_mode";

function readStoredMode(): UserMode {
  if (typeof window === "undefined") return "customer";
  try {
    const v = localStorage.getItem(USER_MODE_KEY);
    return v === "provider" ? "provider" : "customer";
  } catch {
    return "customer";
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
  const [providerStatus, setProviderStatus] =
    useState<ProviderStatus>("not_applied");
  const [userMode, _setUserMode] = useState<UserMode>("customer");
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const lastToggleRef = useRef(0);
  const hydratedRef = useRef(false);

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
    if (providerStatus === "approved" || providerStatus === "pending" || providerStatus === "in_review") {
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
    try { localStorage.removeItem(USER_MODE_KEY); } catch {}
  }, []);

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
