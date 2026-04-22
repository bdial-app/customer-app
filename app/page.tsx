"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Page } from "konsta/react";
import BottomBar from "./components/bottom-bar";
import ProfileContent from "./components/profile-content";
import MessagesContent from "./components/messages-content";
import MessagesPage from "./components/messages-page";
import UserHome from "./components/user-home";
import ProviderDashboard from "./components/provider/provider-dashboard";
import ProviderListingsManager from "./components/provider/provider-listings-manager";
import ProviderMessagesContent from "./components/provider/provider-messages-content";
import AnalyticsContent from "./components/analytics-content";
import ExploreContent from "./components/explore-content";
import SavedContent from "./components/saved-content";
import { useAppContext } from "./context/AppContext";
import GeoLocation from "./components/geo-location";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { useChatSubscription } from "@/hooks/useChatSubscription";
import { useHeartbeat } from "@/hooks/useChat";
import { clearPendingChat } from "@/store/slices/chatSlice";

export default function Home() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("home");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { userMode } = useAppContext();
  const { user, hasSkippedAuth } = useAppSelector((state) => state.auth);
  const pendingChatOpen = useAppSelector((state) => state.chat.pendingChatOpen);
  const prevUserMode = useRef(userMode);

  // Global chat subscription for unread badge
  useChatSubscription();
  // Heartbeat for online presence
  useHeartbeat();

  // Open a specific chat when dispatched from another page (e.g. provider-details, product-details)
  useEffect(() => {
    if (pendingChatOpen) {
      setActiveTab("chats");
      setActiveChat(pendingChatOpen);
      dispatch(clearPendingChat());
    }
  }, [pendingChatOpen, dispatch]);

  useEffect(() => {
    if (!user && !hasSkippedAuth) {
      router.push("/auth/login");
    }
  }, [user, hasSkippedAuth, router]);

  // When provider/customer mode CHANGES (not on initial mount), go to home tab
  useEffect(() => {
    if (prevUserMode.current !== userMode) {
      prevUserMode.current = userMode;
      setActiveTab("home");
    }
  }, [userMode]);

  const handleTabChange = (tab: string) => {
    if (!user && (tab === "chats" || tab === "profile" || tab === "saved")) {
      router.push("/auth/login");
      return;
    }
    setActiveTab(tab);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return userMode === "customer" ? "Bohri Connect" : "Dashboard";
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
        return "Bohri Connect";
    }
  };

  if (activeTab === "chats" && activeChat) {
    return (
      <MessagesPage conversationId={activeChat} onBack={() => setActiveChat(null)} />
    );
  }

  return (
    <Page
      className="!overflow-x-hidden"
      style={{
        background:
          activeTab === "home" && userMode === "customer"
            ? "#FAFAFA"
            : "#FAFAFA",
      }}
    >
      {/* Modern header for non-home tabs (skip for provider views which have own headers) */}
      {activeTab !== "home" &&
        !(userMode === "provider" && (activeTab === "listings" || activeTab === "analytics")) && (
        <div
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/60"
          style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
        >
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-slate-800">{getPageTitle()}</h1>
          </div>
        </div>
      )}

      {activeTab === "home" && userMode === "customer" && <GeoLocation />}

      {activeTab === "home" &&
        (userMode === "customer" ? <UserHome /> : <ProviderDashboard />)}

      {activeTab === "explore" && <ExploreContent />}

      {activeTab === "saved" && <SavedContent />}

      {activeTab === "listings" && <ProviderListingsManager />}

      {activeTab === "chats" &&
        (userMode === "provider" ? (
          <ProviderMessagesContent onChatClick={(id) => setActiveChat(id)} />
        ) : (
          <MessagesContent onChatClick={(id) => setActiveChat(id)} />
        ))}

      {activeTab === "profile" && <ProfileContent />}

      {activeTab === "analytics" && <AnalyticsContent />}

      {/* Spacer for floating bottom bar */}
      <div className="h-24"></div>

      <BottomBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </Page>
  );
}
