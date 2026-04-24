"use client";
import { App } from "konsta/react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import { NotificationProvider } from "./context/NotificationContext";
import { AppToast } from "./components/app-toast";
import { hydrateAuth, clearUser, setProfile } from "@/store/slices/authSlice";
import { useLanguageSync } from "./context/LanguageContext";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { onAccountPaused } from "@/utils/axios";
import { resumeMyAccount } from "@/services/user.service";
import { useRouter } from "next/navigation";
import { AppDialog } from "./components/app-dialog";
import { pauseCircleOutline } from "ionicons/icons";

function LanguageSyncBridge() {
  useLanguageSync();
  useServiceWorker();
  return null;
}

function AccountPausedHandler() {
  const [showDialog, setShowDialog] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    return onAccountPaused(() => setShowDialog(true));
  }, []);

  const handleResume = useCallback(async () => {
    setIsResuming(true);
    setResumeError(null);
    try {
      const updatedUser = await resumeMyAccount();
      // Update Redux store + localStorage with the now-active user — no page reload needed
      if (updatedUser) {
        store.dispatch(setProfile(updatedUser));
      }
      setShowDialog(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to reactivate. Please try again.";
      setResumeError(msg);
    } finally {
      setIsResuming(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    store.dispatch(clearUser());
    setShowDialog(false);
    setResumeError(null);
    router.push("/auth/login");
  }, [router]);

  return (
    <AppDialog
      open={showDialog}
      onClose={handleDismiss}
      icon={pauseCircleOutline}
      iconColor="text-amber-500"
      iconBg="bg-amber-50"
      title="Account Paused"
      description={
        resumeError
          ? resumeError
          : "Your account is currently paused. Would you like to reactivate it?"
      }
      confirmLabel="Yes, Reactivate"
      cancelLabel="Log Out"
      onConfirm={handleResume}
      confirmColor="blue"
      isLoading={isResuming}
      loadingLabel="Reactivating..."
    />
  );
}

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    store.dispatch(hydrateAuth());
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AppProvider>
            <LanguageSyncBridge />
            <NotificationProvider>
              <App theme="ios">
                <AppToast />
                <AccountPausedHandler />
                {children}
              </App>
            </NotificationProvider>
          </AppProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};
