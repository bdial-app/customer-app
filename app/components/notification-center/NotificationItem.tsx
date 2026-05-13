"use client";
import { useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  chatbubbleOutline,
  starOutline,
  storefrontOutline,
  shieldCheckmarkOutline,
  calendarOutline,
  megaphoneOutline,
  informationCircleOutline,
  flagOutline,
  mailOutline,
  trashOutline,
  chevronDownOutline,
  chevronUpOutline,
} from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";
import type { NotificationItem, NotificationType } from "@/services/notification.service";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; iconColor: string; iconBg: string }
> = {
  chat_message: { icon: chatbubbleOutline, iconColor: "text-blue-500", iconBg: "bg-blue-50" },
  review_received: { icon: starOutline, iconColor: "text-amber-500", iconBg: "bg-amber-50" },
  provider_status: { icon: storefrontOutline, iconColor: "text-teal-500", iconBg: "bg-teal-50" },
  verification_update: { icon: shieldCheckmarkOutline, iconColor: "text-green-500", iconBg: "bg-green-50" },
  booking_update: { icon: calendarOutline, iconColor: "text-purple-500", iconBg: "bg-purple-50" },
  promotional: { icon: megaphoneOutline, iconColor: "text-pink-500", iconBg: "bg-pink-50" },
  system_announcement: { icon: informationCircleOutline, iconColor: "text-indigo-500", iconBg: "bg-indigo-50" },
  report_update: { icon: flagOutline, iconColor: "text-red-500", iconBg: "bg-red-50" },
  new_enquiry: { icon: mailOutline, iconColor: "text-orange-500", iconBg: "bg-orange-50" },
};

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

interface NotificationItemCardProps {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
  onDelete: (id: string) => void;
}

// Long body threshold — expand toggle shown when body exceeds this
const TRUNCATE_THRESHOLD = 80;

export default function NotificationItemCard({
  notification,
  onPress,
  onDelete,
}: NotificationItemCardProps) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system_announcement;
  const isLong = (notification.body?.length ?? 0) > TRUNCATE_THRESHOLD;
  const [expanded, setExpanded] = useState(false);

  const handleTap = () => {
    if (isLong && !expanded) {
      // First tap on long notification expands it rather than navigating
      setExpanded(true);
      onPress(notification); // still marks as read
      return;
    }
    onPress(notification);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={handleTap}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
        notification.isRead ? "bg-white dark:bg-slate-900" : "bg-amber-50/40 dark:bg-amber-900/10"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}
      >
        <IonIcon icon={config.icon} className={`text-lg ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold truncate ${notification.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-800 dark:text-white"}`}>
            {notification.title}
          </span>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          )}
        </div>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.p
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`text-xs mt-0.5 leading-relaxed ${notification.isRead ? "text-slate-400" : "text-slate-500"}`}
            >
              {notification.body}
            </motion.p>
          ) : (
            <motion.p
              key="collapsed"
              className={`text-xs mt-0.5 line-clamp-2 ${notification.isRead ? "text-slate-400" : "text-slate-500"}`}
            >
              {notification.body}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-400">
            {timeAgo(notification.createdAt)}
          </span>
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-500 active:opacity-60"
            >
              <IonIcon icon={expanded ? chevronUpOutline : chevronDownOutline} className="text-xs" />
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
      >
        <IonIcon icon={trashOutline} className="text-sm" />
      </button>
    </motion.div>
  );
}
