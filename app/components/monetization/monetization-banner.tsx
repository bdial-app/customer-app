"use client";

import { IonIcon } from "@ionic/react";
import { diamondOutline, arrowForwardOutline } from "ionicons/icons";
import { motion } from "framer-motion";

interface MonetizationBannerProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  icon?: string;
  gradient?: "amber" | "teal" | "emerald" | "purple";
}

const gradientMap = {
  amber: "from-amber-500 to-orange-500",
  teal: "from-teal-500 to-teal-600",
  emerald: "from-emerald-500 to-teal-500",
  purple: "from-purple-500 to-indigo-500",
};

const borderMap = {
  amber: "border-l-amber-500",
  teal: "border-l-teal-500",
  emerald: "border-l-emerald-500",
  purple: "border-l-purple-500",
};

export function MonetizationBanner({
  title,
  description,
  ctaLabel = "Upgrade Now",
  onCtaClick,
  icon = diamondOutline,
  gradient = "amber",
}: MonetizationBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-l-4 ${borderMap[gradient]} p-4 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientMap[gradient]} flex items-center justify-center flex-shrink-0`}>
          <IonIcon icon={icon} className="text-white text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
          {onCtaClick && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onCtaClick}
              className={`mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${gradientMap[gradient]} text-white text-xs font-semibold shadow-sm`}
            >
              {ctaLabel}
              <IonIcon icon={arrowForwardOutline} className="text-xs" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
