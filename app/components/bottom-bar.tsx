"use client";
import { IonIcon } from "@ionic/react";
import {
  analyticsOutline,
  chatbubblesOutline,
  chatbubbles,
  homeOutline,
  home,
  personOutline,
  person,
  analyticsSharp,
  compassOutline,
  compass,
  bookmarkOutline,
  bookmark,
  gridOutline,
  grid,
  layersOutline,
  layers,
} from "ionicons/icons";
import { memo } from "react";
import { useAppContext } from "../context/AppContext";
import { useAppSelector } from "@/hooks/useAppStore";
import { useNativePlatform } from "@/hooks/useNativePlatform";

interface BottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  iconOutline: string;
  iconFilled: string;
  mode?: "customer" | "provider";
  /** Tab requires authentication — hidden when user is not logged in */
  requiresAuth?: boolean;
}

const TABS: TabItem[] = [
  // Shared
  { id: "home", label: "Home", iconOutline: homeOutline, iconFilled: home },
  // Customer-only
  {
    id: "explore",
    label: "Explore",
    iconOutline: compassOutline,
    iconFilled: compass,
    mode: "customer",
  },
  {
    id: "saved",
    label: "Saved",
    iconOutline: bookmarkOutline,
    iconFilled: bookmark,
    mode: "customer",
    requiresAuth: true,
  },
  // Provider-only
  {
    id: "listings",
    label: "Business",
    iconOutline: layersOutline,
    iconFilled: layers,
    mode: "provider",
    requiresAuth: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    iconOutline: analyticsOutline,
    iconFilled: analyticsSharp,
    mode: "provider",
    requiresAuth: true,
  },
  // Shared
  {
    id: "chats",
    label: "Chats",
    iconOutline: chatbubblesOutline,
    iconFilled: chatbubbles,
    requiresAuth: true,
  },
  {
    id: "profile",
    label: "Profile",
    iconOutline: personOutline,
    iconFilled: person,
    requiresAuth: true,
  },
];

const BottomBar = memo(({ activeTab, setActiveTab }: BottomBarProps) => {
  const { userMode } = useAppContext();
  const user = useAppSelector((state) => state.auth.user);
  const customerUnreadCount = useAppSelector(
    (state) => state.chat.customerUnreadCount,
  );
  const providerUnreadCount = useAppSelector(
    (state) => state.chat.providerUnreadCount,
  );
  const badgeCount =
    userMode === "provider" ? providerUnreadCount : customerUnreadCount;

  const visibleTabs = TABS.filter(
    (tab) =>
      (!tab.mode || tab.mode === userMode) &&
      // Provider-only tabs still hidden for guests; customer tabs always visible
      (!tab.requiresAuth || !!user || tab.mode !== "provider"),
  );

  const isProvider = userMode === "provider";
  const { platform, isIOS, isAndroid } = useNativePlatform();

  // iOS PWA (home screen) also needs the same bottom offset as Capacitor
  // to account for env(safe-area-inset-bottom) on the home indicator
  const isIOSPlatform = isIOS || platform === "ios";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-30"
    >
      {/* Provider mode indicator */}
      {isProvider && (
        <div className="flex justify-center mb-1">
          <span className="px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-teal-500 text-white rounded-full shadow-sm">
            Provider Mode
          </span>
        </div>
      )}

      {/* Frosted glass bar */}
      <div
        className="w-full bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/50 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.3)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-around py-1.5">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[48px] outline-none active:scale-90 transition-transform duration-100"
              >
                {/* Active pill background — CSS transition instead of Framer Motion layoutId */}
                <div
                  className={`absolute inset-0 rounded-xl transition-all duration-200 ease-out ${
                    isActive
                      ? isProvider
                        ? "bg-teal-50 dark:bg-teal-900/30 scale-100 opacity-100"
                        : "bg-amber-50 dark:bg-amber-900/30 scale-100 opacity-100"
                      : "scale-75 opacity-0"
                  }`}
                />

                <div className="relative z-10">
                  <IonIcon
                    icon={isActive ? tab.iconFilled : tab.iconOutline}
                    className={`text-[22px] transition-colors duration-200 ${
                      isActive
                        ? isProvider
                          ? "text-teal-600"
                          : "text-amber-600"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  {/* Unread badge */}
                  {tab.id === "chats" && badgeCount > 0 && (
                    <div
                      className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-800 shadow-sm ${
                        isProvider ? "bg-teal-500" : "bg-red-500"
                      }`}
                    >
                      <span className="text-[9px] font-bold text-white leading-none">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    </div>
                  )}
                </div>

                <span
                  className={`relative z-10 text-[10px] font-semibold transition-colors duration-200 ${
                    isActive
                      ? isProvider
                        ? "text-teal-600"
                        : "text-amber-600"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active dot indicator — CSS transition */}
                <div
                  className={`absolute -bottom-0.5 w-1 h-1 rounded-full transition-all duration-200 ease-out ${
                    isActive
                      ? isProvider
                        ? "bg-teal-500 scale-100 opacity-100"
                        : "bg-amber-500 scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

BottomBar.displayName = "BottomBar";

export default BottomBar;
