"use client";
import { createContext, useContext, useState, useRef, ReactNode } from "react";

export type ProviderStatus =
  | "not_applied"
  | "pending"
  | "in_review"
  | "approved"
  | "rejected";
export type UserMode = "customer" | "provider";

interface AppContextType {
  providerStatus: ProviderStatus;
  userMode: UserMode;
  setProviderStatus: (status: ProviderStatus) => void;
  setUserMode: (mode: UserMode) => void;
  toggleMode: () => void;
  resetProviderState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [providerStatus, setProviderStatus] =
    useState<ProviderStatus>("not_applied");
  const [userMode, setUserMode] = useState<UserMode>("customer");
  const lastToggleRef = useRef(0);

  const toggleMode = () => {
    const now = Date.now();
    if (now - lastToggleRef.current < 400) return;
    lastToggleRef.current = now;
    if (providerStatus === "approved") {
      setUserMode((prev) => (prev === "customer" ? "provider" : "customer"));
    }
  };

  const resetProviderState = () => {
    setProviderStatus("not_applied");
    setUserMode("customer");
  };

  return (
    <AppContext.Provider
      value={{
        providerStatus,
        userMode,
        setProviderStatus,
        setUserMode,
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
