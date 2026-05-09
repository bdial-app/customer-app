"use client";
import { useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  checkmarkDoneOutline,
  chevronForwardOutline,
  notificationsOffOutline,
  chatbubbleOutline,
  starOutline,
  storefrontOutline,
  shieldCheckmarkOutline,
  calendarOutline,
  megaphoneOutline,
  informationCircleOutline,
  flagOutline,
  mailOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import { resolveDeepLink } from "@/utils/deep-link";
import NotificationList from "./NotificationList";
import type { NotificationItem, NotificationType } from "@/services/notification.service";
import { useAppContext } from "@/app/context/AppContext";
import { useAppSelector } from "@/hooks/useAppStore";

const TYPE_ICON: Record<NotificationType, { icon: string; color: string }> = {
  chat_message: { icon: chatbubbleOutline, color: "text-blue-500" },
  review_received: { icon: starOutline, color: "text-amber-500" },
  provider_status: { icon: storefrontOutline, color: "text-teal-500" },
  verification_update: { icon: shieldCheckmarkOutline, color: "text-green-500" },
  booking_update: { icon: calendarOutline, color: "text-purple-500" },
  promotional: { icon: megaphoneOutline, color: "text-pink-500" },
  system_announcement: { icon: informationCircleOutline, color: "text-indigo-500" },
  report_update: { icon: flagOutline, color: "text-red-500" },
  new_enquiry: { icon: mailOutline, color: "text-orange-500" },
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const { userMode } = useAppContext();
  const otherModeCount = useAppSelector((s) =>
    userMode === "provider" ? s.notification.customerUnreadCount : s.notification.providerUnreadCount,
  );

  const { data, isLoading } = useNotifications(1, undefined, "all");
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const notifications = data?.data?.slice(0, 8) || [];
  const totalUnread = data?.data?.filter((n) => !n.isRead).length || 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid the opening click
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose]);

  const handlePress = useCallback(
    (notification: NotificationItem) => {
      if (!notification.isRead) {
        markRead.mutate(notification.id);
      }
      const url = resolveDeepLink(notification.data);
      onClose();
      router.push(url);
    },
    [markRead, onClose, router]
  );

  return (
    <>
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — subtle for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/20"
            onClick={onClose}
          />

          {/* Dropdown */}
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed right-3 top-[calc(var(--sat,0px)+52px)] z-[100] w-[calc(100vw-24px)] max-w-[360px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/15 border border-slate-100 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
              {totalUnread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 active:opacity-50"
                >
                  <IonIcon icon={checkmarkDoneOutline} className="text-xs" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Cross-context notification hint */}
            {otherModeCount > 0 && (
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {otherModeCount} new notification{otherModeCount > 1 ? "s" : ""} in{" "}
                  <span className="font-bold">{userMode === "provider" ? "Customer" : "Provider"}</span> view
                </p>
              </div>
            )}

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto overscroll-contain">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <IonIcon icon={notificationsOffOutline} className="text-xl text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const config = TYPE_ICON[n.type] || TYPE_ICON.system_announcement;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handlePress(n)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors active:bg-slate-50 dark:active:bg-slate-700 ${
                        !n.isRead ? "bg-amber-50/30 dark:bg-amber-900/10" : ""
                      }`}
                    >
                      {/* Type icon */}
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <IonIcon icon={config.icon} className={`text-sm ${config.color}`} />
                      </div>

                      {/* Content — compact */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-tight line-clamp-1 ${!n.isRead ? "font-semibold text-slate-800 dark:text-white" : "font-medium text-slate-600 dark:text-slate-300"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {n.body}
                        </p>
                      </div>

                      {/* Time + unread dot */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        {!n.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer — view all */}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  setShowAll(true);
                }}
                className="w-full flex items-center justify-center gap-1 px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 text-[12px] font-semibold text-amber-600 active:bg-slate-50 dark:active:bg-slate-700 transition-colors"
              >
                View all notifications
                <IonIcon icon={chevronForwardOutline} className="text-xs" />
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Full notification list — opened via "View all" */}
    <NotificationList open={showAll} onClose={() => setShowAll(false)} />
    </>
  );
}
