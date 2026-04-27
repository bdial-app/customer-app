"use client";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { shieldCheckmarkOutline, ribbonOutline, starOutline, navigateOutline } from "ionicons/icons";

export interface QuickFilters {
  verifiedOnly: boolean;
  womenLedOnly: boolean;
  topRated: boolean;    // minRating >= 4
  nearby: boolean;      // radius <= 5
}

interface QuickFilterPillsProps {
  filters: QuickFilters;
  onToggle: (key: keyof QuickFilters) => void;
}

const PILLS: { key: keyof QuickFilters; label: string; icon: string; activeColor: string; activeBg: string }[] = [
  { key: "verifiedOnly", label: "Verified", icon: shieldCheckmarkOutline, activeColor: "text-emerald-700", activeBg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700" },
  { key: "topRated", label: "Top Rated", icon: starOutline, activeColor: "text-amber-700", activeBg: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700" },
  { key: "womenLedOnly", label: "Women-Led", icon: ribbonOutline, activeColor: "text-purple-700", activeBg: "bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700" },
  { key: "nearby", label: "Under 5 km", icon: navigateOutline, activeColor: "text-blue-700", activeBg: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700" },
];

const QuickFilterPills = ({ filters, onToggle }: QuickFilterPillsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {PILLS.map((pill) => {
        const active = filters[pill.key];
        return (
          <motion.button
            key={pill.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(pill.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
              active
                ? `${pill.activeBg} ${pill.activeColor}`
                : "bg-white dark:bg-slate-800 border-gray-150 dark:border-slate-700 text-gray-600 dark:text-slate-300"
            }`}
          >
            <IonIcon icon={pill.icon} className="w-3.5 h-3.5" />
            {pill.label}
          </motion.button>
        );
      })}
    </div>
  );
};

export default QuickFilterPills;
