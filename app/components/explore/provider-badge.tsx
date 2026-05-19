"use client";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  ribbonOutline,
  starOutline,
  flashOutline,
  shieldCheckmarkOutline,
  trendingUpOutline,
} from "ionicons/icons";
import type { ProviderBadge as BadgeType } from "@/services/explore.service";

const BADGE_CONFIG: Record<BadgeType["type"], { label: string; icon: string; color: string; bg: string }> = {
  gold_seller: { label: "Gold Seller", icon: ribbonOutline, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30" },
  top_rated: { label: "Top Rated", icon: starOutline, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  express_service: { label: "Express", icon: flashOutline, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/30" },
  trusted: { label: "Trusted", icon: shieldCheckmarkOutline, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/30" },
  rising_star: { label: "Rising Star", icon: trendingUpOutline, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/30" },
};

export default function ProviderBadgeList({ badges }: { badges: BadgeType[] }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.slice(0, 2).map((badge) => {
        const cfg = BADGE_CONFIG[badge.type];
        if (!cfg) return null;
        return (
          <span key={badge.type} className={`inline-flex items-center gap-0.5 ${cfg.bg} px-1.5 py-0.5 rounded-md`}>
            <IonIcon icon={cfg.icon} className={`text-[8px] ${cfg.color}`} />
            <span className={`text-[8px] font-bold ${cfg.color}`}>{cfg.label}</span>
          </span>
        );
      })}
    </div>
  );
}
