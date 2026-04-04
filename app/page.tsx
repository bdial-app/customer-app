"use client";
import { IonIcon } from "@ionic/react";
import { search } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Page, Navbar } from "konsta/react";
import BottomBar from "./components/bottom-bar";
import ProfileContent from "./components/profile-content";
import MessagesContent from "./components/messages-content";
import MessagesPage from "./components/messages-page";
import UserHome from "./components/user-home";
import ProviderHome from "./components/provider-home";
import { useAppContext } from "./context/AppContext";

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { userMode } = useAppContext();

  const getPageTitle = () => {
    switch (activeTab) {
      case "home":
        return userMode === "customer" ? "Bohri Connect" : "Provider Dashboard";
      case "chats":
        return "Messages";
      case "profile":
        return "My Profile";
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
      <Navbar
        centerTitle={false}
        large={activeTab !== "home"}
        title={getPageTitle()}
        className="mb-0!"
      />

      {activeTab === "home" && (
        userMode === "customer" ? <UserHome /> : <ProviderHome />
      )}

      {activeTab === "chats" && (
        <MessagesContent onChatClick={(name) => setActiveChat(name)} />
      )}

      {activeTab === "profile" && <ProfileContent />}

      <div className="h-20"></div>

      <BottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </Page>
  );
}
