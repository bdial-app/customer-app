"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Page } from "konsta/react";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  chatbubblesOutline,
  arrowForwardOutline,
  storefrontOutline,
} from "ionicons/icons";
import BottomBar from "./components/bottom-bar";
import ProfileContent from "./components/profile-content";
import MessagesContent from "./components/messages-content";
import MessagesPage from "./components/messages-page";
import UserHome from "./components/user-home";
import ProviderDashboard from "./components/provider/provider-dashboard";
import ProviderListingsManager from "./components/provider/provider-listings-manager";
import ProviderMessagesContent from "./components/provider/provider-messages-content";
import ProviderSuspendedOverlay from "./components/provider/provider-suspended-overlay";
import AnalyticsContent from "./components/analytics-content";
import ExploreContent from "./components/explore-content";
import SavedContent from "./components/saved-content";
import { useAppContext } from "./context/AppContext";
import GeoLocation from "./components/geo-location";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useChatSubscription } from "@/hooks/useChatSubscription";
import { useHeartbeat } from "@/hooks/useChat";
import { clearPendingChat } from "@/store/slices/chatSlice";
import { useUnreadCount } from "@/hooks/useNotifications";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("home");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [listingsSubTab, setListingsSubTab] = useState<string | null>(null);
  const { userMode, setUserMode, providerStatus } = useAppContext();
  const providerUnreadCount = useAppSelector((state) => state.chat.providerUnreadCount);
  const { user } = useAppSelector((state) => state.auth);
  const { requireAuth } = useAuthGate();
  const pendingChatOpen = useAppSelector((state) => state.chat.pendingChatOpen);
  const prevUserMode = useRef(userMode);

  // Global chat subscription for unread badge
  useChatSubscription();
  // Heartbeat for online presence
  useHeartbeat();
  // Poll notification unread count
  useUnreadCount();

  // Handle deep-link query params (e.g. /?tab=chats&conversationId=xxx from notifications)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const conversationId = searchParams.get("conversationId");
    if (tab) {
      setActiveTab(tab);
      if (conversationId) {
        setActiveChat(conversationId);
      }
      // Clear query params after consuming them
      router.replace("/", { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force customer mode for guests — provider mode requires authentication
  // Also reset to home tab when user logs out while on a protected tab
  useEffect(() => {
    if (!user) {
      if (userMode === "provider") setUserMode("customer");
      if (activeTab === "chats" || activeTab === "saved" || activeTab === "listings" || activeTab === "analytics") {
        setActiveTab("home");
      }
    }
  }, [user, userMode, setUserMode, activeTab]);

  // Open a specific chat when dispatched from another page (e.g. provider-details, product-details)
  useEffect(() => {
    if (pendingChatOpen) {
      setActiveTab("chats");
      setActiveChat(pendingChatOpen);
      dispatch(clearPendingChat());
    }
  }, [pendingChatOpen, dispatch]);

  // When provider/customer mode CHANGES (not on initial mount), go to home tab
  useEffect(() => {
    if (prevUserMode.current !== userMode) {
      prevUserMode.current = userMode;
      setActiveTab("home");
    }
  }, [userMode]);

  const handleTabChange = (tab: string) => {
    if (!user && (tab === "chats" || tab === "saved")) {
      requireAuth(() => setActiveTab(tab));
      return;
    }
    setActiveTab(tab);
  };

  const handleNavigateToListings = (subTab: string) => {
    setListingsSubTab(subTab);
    setActiveTab("listings");
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return userMode === "customer" ? "Tijarah" : "Dashboard";
      case "explore":
        return "Explore";
      case "saved":
        return "Saved";
      case "listings":
        return "My Business";
      case "chats":
        return "Messages";
      case "profile":
        return "My Profile";
      case "analytics":
        return "Analytics";
      default:
        return "Tijarah";
    }
  };

  if (activeTab === "chats" && activeChat) {
    return (
      <MessagesPage
        conversationId={activeChat}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  return (
    <Page
      className="!overflow-x-hidden dark:!bg-slate-900"
      style={{
        background:
          activeTab === "home" && userMode === "customer"
            ? undefined
            : undefined,
      }}
    >
      {/* Modern header for non-home tabs (skip for provider views which have own headers) */}
      {activeTab !== "home" &&
        !(
          userMode === "provider" &&
          (activeTab === "listings" || activeTab === "analytics")
        ) && (
          <div
            className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100/60 dark:border-slate-800/60"
            style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        )}

      {activeTab === "home" && userMode === "customer" && <GeoLocation />}

      {activeTab === "home" &&
        (userMode === "customer" ? (
          <UserHome />
        ) : (
          <ProviderDashboard onNavigateToListings={handleNavigateToListings} />
        ))}

      {activeTab === "explore" && <ExploreContent />}

      {activeTab === "saved" && <SavedContent />}

      {activeTab === "listings" && (
        <ProviderListingsManager
          initialSubTab={listingsSubTab}
          onSubTabConsumed={() => setListingsSubTab(null)}
        />
      )}

      {activeTab === "chats" &&
        (userMode === "provider" ? (
          <ProviderMessagesContent onChatClick={(id) => setActiveChat(id)} />
        ) : (
          <MessagesContent onChatClick={(id) => setActiveChat(id)} />
        ))}

      {activeTab === "profile" && <ProfileContent />}

      {activeTab === "analytics" && <AnalyticsContent />}

      {/* Provider Suspended Overlay — covers all provider views */}
      {userMode === "provider" && providerStatus === "suspended" && (
        <ProviderSuspendedOverlay />
      )}

      {/* Spacer for floating bottom bar */}
      <div className="h-24"></div>

      {/* Provider notification nudge — only shown in customer mode for logged-in users */}
      <AnimatePresence>
        {user && userMode === "customer" && providerUnreadCount > 0 && (
          <motion.button
            key="provider-nudge"
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => {
              setUserMode("provider");
              handleTabChange("chats");
            }}
            className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-teal-500 text-white active:scale-95 transition-transform"
          >
            <IonIcon icon={storefrontOutline} className="text-base shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">
              {providerUnreadCount === 1
                ? "1 new business message"
                : `${providerUnreadCount} new business messages`}
            </span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/25 text-[10px] font-bold shrink-0">
              {providerUnreadCount > 99 ? "99+" : providerUnreadCount}
            </span>
            <IonIcon icon={arrowForwardOutline} className="text-sm shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      <BottomBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </Page>
  );
}
