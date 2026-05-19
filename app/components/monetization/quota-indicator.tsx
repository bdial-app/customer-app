"use client";

import { IonIcon } from "@ionic/react";
import { lockOpenOutline, infiniteOutline } from "ionicons/icons";

interface QuotaIndicatorProps {
  used: number;
  total: number;
  label?: string;
  /** -1 means unlimited */
  unlimited?: boolean;
}

export function QuotaIndicator({ used, total, label, unlimited }: QuotaIndicatorProps) {
  if (unlimited) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
        <IonIcon icon={infiniteOutline} className="text-[10px]" />
        Unlimited
      </span>
    );
  }

  const remaining = Math.max(0, total - used);
  const percentage = total > 0 ? remaining / total : 0;

  let colorClass = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
  if (percentage <= 0.25) {
    colorClass = "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
  } else if (percentage <= 0.5) {
    colorClass = "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>
      <IonIcon icon={lockOpenOutline} className="text-[10px]" />
      {remaining}/{total} {label || "free"}
    </span>
  );
}
