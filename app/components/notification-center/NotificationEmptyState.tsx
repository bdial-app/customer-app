"use client";
import { IonIcon } from "@ionic/react";
import { notificationsOffOutline } from "ionicons/icons";

export default function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <IonIcon icon={notificationsOffOutline} className="text-3xl text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">
        No notifications yet
      </h3>
      <p className="text-sm text-slate-400 max-w-[250px]">
        When you receive messages, reviews, or updates, they&apos;ll appear here.
      </p>
    </div>
  );
}
