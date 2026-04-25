"use client";
import { IonIcon } from "@ionic/react";
import { notificationsOutline } from "ionicons/icons";
import { useAppSelector } from "@/hooks/useAppStore";

interface NotificationBellProps {
  onClick?: () => void;
  className?: string;
}

export default function NotificationBell({ onClick, className = "" }: NotificationBellProps) {
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full active:bg-white/10 transition-colors ${className}`}
      aria-label="Notifications"
    >
      <IonIcon icon={notificationsOutline} className="text-xl text-white" />
      {unreadCount > 0 && (
        <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1 border-2 border-slate-900">
          <span className="text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </button>
  );
}
