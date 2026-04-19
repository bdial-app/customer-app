"use client";
import { IonIcon } from "@ionic/react";
import { search } from "ionicons/icons";
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

  const handleTabChange = (tab: string) => {
    if (!user && (tab === "chats" || tab === "profile")) {
      router.push("/auth/login");
      return;
    }
    setActiveTab(tab);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return userMode === "customer" ? "Bohri Connect" : "Home";
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
      style={{
        background: "radial-gradient(at 0% 10%, #f0eff4, #f0ecff)",
      }}
    >
      {activeTab !== "home" && (
        <Navbar
          centerTitle={false}
          large={activeTab !== "home"}
          title={getPageTitle()}
          className="mb-0!"
        />
      )}
      {activeTab === "home" && userMode === "customer" && <GeoLocation />}

      {activeTab === "home" &&
        (userMode === "customer" ? <UserHome /> : <ProviderHome />)}

      {activeTab === "chats" && (
        <MessagesContent onChatClick={(name) => setActiveChat(name)} />
      )}

      {activeTab === "profile" && <ProfileContent />}

      {activeTab === "analytics" && <AnalyticsContent />}

      <div className="h-20"></div>

      <BottomBar activeTab={activeTab} setActiveTab={handleTabChange} />
    </Page>
  );
}
