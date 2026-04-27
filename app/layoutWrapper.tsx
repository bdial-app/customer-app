"use client";
import { App } from "konsta/react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppToast } from "./components/app-toast";
import { hydrateAuth, clearUser, setProfile } from "@/store/slices/authSlice";
import { useLanguageSync } from "./context/LanguageContext";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { onAccountPaused, onInappropriateContent } from "@/utils/axios";
import { AuthGateProvider } from "./context/AuthGateContext";
import AuthGateSheet from "./components/auth-gate-sheet";
import { resumeMyAccount } from "@/services/user.service";
import { useRouter } from "next/navigation";
import { useNotification } from "./context/NotificationContext";
import { AppDialog } from "./components/app-dialog";
import { pauseCircleOutline } from "ionicons/icons";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePostHogIdentify } from "@/hooks/usePostHogIdentify";

function LanguageSyncBridge() {
  useLanguageSync();
  useServiceWorker();
  return null;
}

function PostHogIdentifyBridge() {
  usePostHogIdentify();
  return null;
}

function PushNotificationBridge() {
  usePushNotifications();
  const router = useRouter();

  useEffect(() => {
    // Listen for foreground push notification events (dispatched by usePushNotifications)
    const handlePush = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.title) {
        // Could integrate with NotificationContext here if needed
        // For now, foreground messages are handled by the onMessage callback in usePushNotifications
      }
    };
    window.addEventListener("push-notification", handlePush);

    // Listen for notification click messages from service worker (deep link navigation)
    const handleSWMessage = (e: MessageEvent) => {
      if (e.data?.type === "NOTIFICATION_CLICK" && e.data?.url) {
        router.push(e.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      window.removeEventListener("push-notification", handlePush);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [router]);

  return null;
}

function InappropriateContentHandler() {
  const { notify } = useNotification();

  useEffect(() => {
    return onInappropriateContent((message) => {
      notify({
        title: "Inappropriate Language",
        subtitle: message,
        variant: "error",
      });
    });
  }, [notify]);

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
      const msg =
        err?.response?.data?.message ||
        "Failed to reactivate. Please try again.";
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
    router.push("/");
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
        <ThemeProvider>
          <LanguageProvider>
            <AppProvider>
              <AuthGateProvider>
              <LanguageSyncBridge />
              <PushNotificationBridge />
              <NotificationProvider>
                <App theme="ios">
                  <AppToast />
                  <PostHogIdentifyBridge />
                  <InappropriateContentHandler />
                  <AccountPausedHandler />
                  <AuthGateSheet />
                  {children}
                </App>
              </NotificationProvider>
              </AuthGateProvider>
            </AppProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};
