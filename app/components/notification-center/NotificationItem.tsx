"use client";
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
} from "ionicons/icons";
import { motion } from "framer-motion";
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

export default function NotificationItemCard({
  notification,
  onPress,
  onDelete,
}: NotificationItemCardProps) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system_announcement;
  const isWarning = notification.type === 'provider_status' && notification.title?.toLowerCase().includes('warning');

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onPress(notification)}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
        isWarning
          ? "bg-amber-50/50 dark:bg-amber-900/15 border-l-3 border-amber-500"
          : notification.isRead ? "bg-white dark:bg-slate-900" : "bg-amber-50/40 dark:bg-amber-900/10"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isWarning ? "bg-amber-100 dark:bg-amber-900/40" : config.iconBg
        }`}
      >
        <IonIcon icon={config.icon} className={`text-lg ${isWarning ? "text-amber-600" : config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${notification.isRead ? "text-slate-600 dark:text-slate-400" : "text-slate-800 dark:text-white"}`}>
            {notification.title}
          </span>
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          )}
        </div>
        <p className={`text-xs mt-0.5 leading-relaxed ${
          isWarning ? "text-amber-700 dark:text-amber-300" : notification.isRead ? "text-slate-400" : "text-slate-500"
        }`}>
          {notification.body}
        </p>
        <span className="text-[10px] text-slate-400 mt-1 block">
          {timeAgo(notification.createdAt)}
        </span>
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
