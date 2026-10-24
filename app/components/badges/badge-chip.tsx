"use client";

import dynamic from "next/dynamic";
import { knownBadges, type BadgeRef, type BadgeStyle } from "@/utils/badges";

const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });

/** One badge as a pill: icon and name. `xs` for cards, `sm` elsewhere. */
export function BadgeChip({ badge, size = "sm" }: { badge: BadgeStyle; size?: "xs" | "sm" }) {
  const xs = size === "xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ring-1 ring-inset font-semibold whitespace-nowrap ${badge.chip} ${
        xs ? "px-1.5 py-[1px] text-[9px]" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <IonIcon icon={badge.icon} className={xs ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {badge.label}
    </span>
  );
}

/**
 * The single most important badge a business holds, for cards where only
 * one fits. Renders nothing when it holds none.
 */
export function TopBadge({ badges, className = "" }: { badges?: BadgeRef[] | null; className?: string }) {
  const top = knownBadges(badges)[0];
  if (!top) return null;
  return (
    <span className={`inline-flex ${className}`}>
      <BadgeChip badge={top} size="xs" />
    </span>
  );
}
