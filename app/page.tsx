"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Page, Navbar } from "konsta/react";
import BottomBar from "./components/bottom-bar";
import ProfileContent from "./components/profile-content";
import MessagesContent from "./components/messages-content";
import MessagesPage from "./components/messages-page";
import UserHome from "./components/user-home";
import ProviderHome from "./components/provider-home";
import AnalyticsContent from "./components/analytics-content";
import ExploreContent from "./components/explore-content";
import OrdersContent from "./components/orders-content";
import { useAppContext } from "./context/AppContext";
import GeoLocation from "./components/geo-location";
import { useAppSelector } from "@/hooks/useAppStore";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { userMode } = useAppContext();
  const { user, hasSkippedAuth } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user && !hasSkippedAuth) {
      router.push("/auth/login");
    }
  }, [user, hasSkippedAuth, router]);

  // When provider/customer mode changes, go to home tab
  useEffect(() => {
    setActiveTab("home");
  }, [userMode]);

  const handleTabChange = (tab: string) => {
    if (!user && (tab === "chats" || tab === "profile" || tab === "orders")) {
      router.push("/auth/login");
      return;
    }
    setActiveTab(tab);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return userMode === "customer" ? "Bohri Connect" : "Home";
      case "explore":
        return "Explore";
      case "orders":
        return "My Orders";
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
      <MessagesPage chatName={activeChat} onBack={() => setActiveChat(null)} />
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
      {/* Modern header for non-home tabs */}
      {activeTab !== "home" && (
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
        (userMode === "customer" ? <UserHome /> : <ProviderHome />)}

      {activeTab === "explore" && <ExploreContent />}

      {activeTab === "orders" && <OrdersContent />}

      {activeTab === "chats" && (
        <MessagesContent onChatClick={(name) => setActiveChat(name)} />
      )}

      {activeTab === "profile" && <ProfileContent />}

      {activeTab === "analytics" && <AnalyticsContent />}

      {/* Spacer for floating bottom bar */}
      <div className="h-24"></div>

      <BottomBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </Page>
  );
}
