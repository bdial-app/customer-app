"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  storefrontOutline,
  cubeOutline,
  gridOutline,
  arrowForward,
  searchOutline,
} from "ionicons/icons";
import type { SearchSuggestion } from "@/services/search.service";

interface Props {
  suggestions: SearchSuggestion[];
  query: string;
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
}

const TYPE_CONFIG = {
  provider: {
    icon: storefrontOutline,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    ring: "ring-blue-100",
    label: "Business",
    labelBg: "bg-blue-50 dark:bg-blue-900/30",
    labelText: "text-blue-600 dark:text-blue-400",
  },
  product: {
    icon: cubeOutline,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    ring: "ring-emerald-100",
    label: "Product",
    labelBg: "bg-emerald-50 dark:bg-emerald-900/30",
    labelText: "text-emerald-600 dark:text-emerald-400",
  },
  category: {
    icon: gridOutline,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/30",
    ring: "ring-purple-100",
    label: "Category",
    labelBg: "bg-purple-50 dark:bg-purple-900/30",
    labelText: "text-purple-600 dark:text-purple-400",
  },
};

const HighlightedText = ({
  text,
  query,
}: {
  text: string;
  query: string;
}) => {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-gray-900 dark:text-white">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
};

const SuggestionList = ({ suggestions, query, isLoading, onSelect }: Props) => {
  const grouped = {
    provider: suggestions
      .filter((s) => s.type === "provider")
      .sort((a, b) => {
        const aScore = (a.isSponsored ? 2 : 0) + (a.hasActiveOffer ? 1 : 0);
        const bScore = (b.isSponsored ? 2 : 0) + (b.hasActiveOffer ? 1 : 0);
        return bScore - aScore;
      }),
    product: suggestions.filter((s) => s.type === "product"),
    category: suggestions.filter((s) => s.type === "category"),
  };

  const sections = (
    ["provider", "product", "category"] as const
  ).filter((t) => grouped[t].length > 0);

  if (isLoading && suggestions.length === 0) {
    return (
      <div className="px-4 pt-3 space-y-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-100 dark:bg-slate-700 rounded-full w-3/5" />
              <div className="h-2.5 bg-gray-50 dark:bg-slate-800 rounded-full w-2/5" />
            </div>
            <div className="h-5 w-14 bg-gray-50 dark:bg-slate-800 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center pt-16 text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <IonIcon icon={searchOutline} className="w-6 h-6 text-gray-400 dark:text-slate-500" />
        </div>
        <p className="text-[14px] font-semibold text-gray-600 dark:text-slate-300 mb-1">
          No suggestions for &ldquo;{query}&rdquo;
        </p>
        <p className="text-[12px] text-gray-400 dark:text-slate-500">
          Tap Search to see all results
        </p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {sections.map((type) => {
        const config = TYPE_CONFIG[type];
        const items = grouped[type];
        return (
          <div key={type}>
            {/* Section header */}
            {sections.length > 1 && (
              <div className="px-4 pt-4 pb-1">
                <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {type === "provider"
                    ? "Businesses"
                    : type === "product"
                      ? "Products"
                      : "Categories"}
                </span>
              </div>
            )}
            {items.map((suggestion, i) => (
              <motion.button
                key={`${suggestion.type}-${suggestion.id}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                onClick={() => onSelect(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-gray-50 dark:active:bg-slate-800 transition-colors"
              >
                {/* Thumbnail or Icon */}
                {suggestion.imageUrl ? (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <img
                      src={suggestion.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-100 dark:ring-slate-700"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md ${config.bg} flex items-center justify-center ring-2 ring-white dark:ring-slate-900`}>
                      <IonIcon icon={config.icon} className={`w-2.5 h-2.5 ${config.color}`} />
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <IonIcon
                      icon={config.icon}
                      className={`w-5 h-5 ${config.color}`}
                    />
                  </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[14px] text-gray-700 dark:text-slate-200 truncate leading-tight">
                    <HighlightedText text={suggestion.text} query={query} />
                  </p>
                  {suggestion.subtitle && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
                      {suggestion.subtitle}
                    </p>
                  )}
                </div>

                {/* Type badge */}
                {suggestion.isSponsored ? (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex-shrink-0 flex items-center gap-0.5"
                  >
                    <span className="text-[8px]">⚡</span> Sponsored
                  </span>
                ) : suggestion.hasActiveOffer ? (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 flex-shrink-0 flex items-center gap-0.5"
                  >
                    <span className="text-[8px]">🏷️</span> Deals
                  </span>
                ) : (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${config.labelBg} ${config.labelText} flex-shrink-0`}
                  >
                    {config.label}
                  </span>
                )}

                <IonIcon
                  icon={arrowForward}
                  className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 flex-shrink-0 -rotate-45"
                />
              </motion.button>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default SuggestionList;
