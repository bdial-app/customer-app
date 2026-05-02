"use client";
import { App } from "konsta/react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
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
import { persistQueryCache, restoreQueryCache } from "@/utils/query-cache-persist";
import OfflineBanner from "./components/offline-banner";
import AppUpdatePrompt from "./components/app-update-prompt";
import MaintenanceGate from "./components/maintenance-gate";

function LanguageSyncBridge() {
  useLanguageSync();
  useServiceWorker();
  return null;
}

function PostHogIdentifyBridge() {
  usePostHogIdentify();
  return null;
}

/**
 * Prevents the Android hardware back button from closing the PWA when the user
 * is on the first page of the history stack. Pushes a sentinel entry so that
 * `popstate` fires before the app would close, letting us push the entry again.
 */
function PwaHistoryGuard() {
  const pathname = usePathname();

  useEffect(() => {
    // Only activate in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    if (!isStandalone) return;

    // Push a sentinel state so the back button triggers popstate instead of closing the app
    const SENTINEL = "__pwa_guard__";
    if (!window.history.state?.[SENTINEL]) {
      window.history.replaceState({ ...window.history.state, [SENTINEL]: true }, "");
    }

    const handlePopState = () => {
      // Re-push sentinel when back pops to prevent the app from closing
      if (!window.history.state?.[SENTINEL]) {
        window.history.pushState({ [SENTINEL]: true }, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname]);

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

    // Listen for native notification taps (Capacitor) — deep link navigation
    const handleNativeTap = (e: Event) => {
      const data = (e as CustomEvent).detail || {};
      let targetUrl = "/";

      if (data.route) {
        const params = data.params ? (typeof data.params === "string" ? JSON.parse(data.params) : data.params) : {};

        switch (data.route) {
          case "/provider-details":
            if (params.id) {
              targetUrl = `/provider-details?id=${params.id}`;
              if (params.tab) targetUrl += `&tab=${params.tab}`;
            }
            break;
          case "/product-details":
            if (params.id) targetUrl = `/product-details?id=${params.id}`;
            break;
          case "/chat":
            if (params.conversationId) {
              targetUrl = `/?tab=chats&conversationId=${params.conversationId}`;
            } else {
              targetUrl = "/?tab=chats";
            }
            break;
          case "/provider-onboarding/verify":
            targetUrl = "/provider-onboarding/verify";
            break;
          default:
            targetUrl = data.route.startsWith("/") ? data.route : "/";
        }
      }

      router.push(targetUrl);
    };
    window.addEventListener("native-notification-tap", handleNativeTap);

    // Listen for notification click messages from service worker (deep link navigation)
    const handleSWMessage = (e: MessageEvent) => {
      if (e.data?.type === "NOTIFICATION_CLICK" && e.data?.url) {
        router.push(e.data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      window.removeEventListener("push-notification", handlePush);
      window.removeEventListener("native-notification-tap", handleNativeTap);
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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // one minute default stale time
            gcTime: 5 * 60 * 1000, // 5 minutes default garbage collection
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Prevent refetch on component remount (tab switch)
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    store.dispatch(hydrateAuth());
    // Restore persisted query cache for instant load
    restoreQueryCache(queryClient);
  }, [queryClient]);

  // Persist critical query data when app goes to background or unloads
  useEffect(() => {
    const handlePersist = () => persistQueryCache(queryClient);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") handlePersist();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handlePersist);
    // Also persist periodically (every 2 min) for safety
    const interval = setInterval(handlePersist, 2 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handlePersist);
      clearInterval(interval);
    };
  }, [queryClient]);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AppProvider>
              <AuthGateProvider>
              <LanguageSyncBridge />
              <PushNotificationBridge />
              <PwaHistoryGuard />
              <NotificationProvider>
                <App theme="ios">
                  <MaintenanceGate>
                  <OfflineBanner />
                  <AppUpdatePrompt />
                  <AppToast />
                  <PostHogIdentifyBridge />
                  <InappropriateContentHandler />
                  <AccountPausedHandler />
                  <AuthGateSheet />
                  {children}
                  </MaintenanceGate>
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
