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
  receiptOutline,
  receipt,
} from "ionicons/icons";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";

interface BottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  iconOutline: string;
  iconFilled: string;
  mode?: "provider";
}

const TABS: TabItem[] = [
  { id: "home", label: "Home", iconOutline: homeOutline, iconFilled: home },
  {
    id: "explore",
    label: "Explore",
    iconOutline: compassOutline,
    iconFilled: compass,
  },
  {
    id: "orders",
    label: "Orders",
    iconOutline: receiptOutline,
    iconFilled: receipt,
  },
  {
    id: "analytics",
    label: "Analytics",
    iconOutline: analyticsOutline,
    iconFilled: analyticsSharp,
    mode: "provider",
  },
  {
    id: "chats",
    label: "Chats",
    iconOutline: chatbubblesOutline,
    iconFilled: chatbubbles,
  },
  {
    id: "profile",
    label: "Profile",
    iconOutline: personOutline,
    iconFilled: person,
  },
];

const BottomBar = ({ activeTab, setActiveTab }: BottomBarProps) => {
  const { userMode } = useAppContext();

  const visibleTabs = TABS.filter(
    (tab) => !tab.mode || tab.mode === userMode
  );

  return (
    <div className="fixed left-0 right-0 bottom-0 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Frosted glass bar */}
      <div className="mx-3 mb-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_-2px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around py-1.5">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.85 }}
                className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-2.5 min-w-[48px] outline-none"
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-xl bg-amber-50"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={{ y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative z-10"
                >
                  <IonIcon
                    icon={isActive ? tab.iconFilled : tab.iconOutline}
                    className={`text-[22px] transition-colors duration-200 ${
                      isActive ? "text-amber-600" : "text-slate-400"
                    }`}
                  />
                </motion.div>

                <span
                  className={`relative z-10 text-[10px] font-semibold transition-colors duration-200 ${
                    isActive ? "text-amber-600" : "text-slate-400"
                  }`}
                >
                  {tab.label}
                </span>

                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-amber-500"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
