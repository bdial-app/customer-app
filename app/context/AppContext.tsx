"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type ProviderStatus =
  | "not_applied"
  | "pending"
  | "approved"
  | "rejected";
export type UserMode = "customer" | "provider";

interface AppContextType {
  providerStatus: ProviderStatus;
  userMode: UserMode;
  setProviderStatus: (status: ProviderStatus) => void;
  setUserMode: (mode: UserMode) => void;
  toggleMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [providerStatus, setProviderStatus] =
    useState<ProviderStatus>("not_applied");
  const [userMode, setUserMode] = useState<UserMode>("customer");

  const toggleMode = () => {
    if (providerStatus === "approved") {
      setUserMode((prev) => (prev === "customer" ? "provider" : "customer"));
    }
  };

  return (
    <AppContext.Provider
      value={{
        providerStatus,
        userMode,
        setProviderStatus,
        setUserMode,
        toggleMode,
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
