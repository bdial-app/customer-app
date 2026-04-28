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
  trendingUpOutline,
} from "ionicons/icons";
import type { SearchSuggestion } from "@/services/search.service";

interface Props {
  suggestions: SearchSuggestion[];
  query: string;
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  trending?: { query: string; count: number }[];
  onTrendingTap?: (query: string) => void;
}

const TYPE_CONFIG = {
  provider: {
    icon: storefrontOutline,
    color: "text-blue-500",
    bg: "bg-blue-50",
    ring: "ring-blue-100",
    label: "Business",
    labelBg: "bg-blue-50",
    labelText: "text-blue-600",
  },
  product: {
    icon: cubeOutline,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
    label: "Product",
    labelBg: "bg-emerald-50",
    labelText: "text-emerald-600",
  },
  category: {
    icon: gridOutline,
    color: "text-purple-500",
    bg: "bg-purple-50",
    ring: "ring-purple-100",
    label: "Category",
    labelBg: "bg-purple-50",
    labelText: "text-purple-600",
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
      <span className="font-bold text-gray-900">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
};

const SuggestionList = ({ suggestions, query, isLoading, onSelect, trending, onTrendingTap }: Props) => {
  const grouped = {
    provider: suggestions.filter((s) => s.type === "provider"),
    product: suggestions.filter((s) => s.type === "product"),
    category: suggestions.filter((s) => s.type === "category"),
  };

  const sections = (
    ["category", "provider", "product"] as const
  ).filter((t) => grouped[t].length > 0);

  if (isLoading && suggestions.length === 0) {
    return (
      <div className="px-4 pt-3 space-y-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-100 rounded-full w-3/5" />
              <div className="h-2.5 bg-gray-50 rounded-full w-2/5" />
            </div>
            <div className="h-5 w-14 bg-gray-50 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0 && !isLoading) {
    return (
      <div className="px-4 pt-6">
        <div className="flex flex-col items-center text-center px-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <IonIcon icon={searchOutline} className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-[13px] font-semibold text-gray-600 mb-0.5">
            No suggestions for &ldquo;{query}&rdquo;
          </p>
          <p className="text-[11px] text-gray-400">
            Tap Search to see all results
          </p>
        </div>
        {trending && trending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <IonIcon icon={trendingUpOutline} className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-[12px] font-bold text-gray-500">Try these popular searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map((t, i) => (
                <motion.button
                  key={t.query}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onTrendingTap?.(t.query)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 active:bg-gray-50 active:scale-95 transition-all shadow-sm"
                >
                  <IonIcon icon={trendingUpOutline} className="w-3.5 h-3.5 text-gray-400" />
                  <span className="capitalize">{t.query}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
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
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {type === "provider"
                    ? "Businesses"
                    : type === "product"
                      ? "Products"
                      : "Categories"}
                </span>
              </div>
            )}
            {items.map((suggestion, i) => {
              const isCategoryCard = suggestion.type === "category";
              return (
              <motion.button
                key={`${suggestion.type}-${suggestion.id}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.2 }}
                onClick={() => onSelect(suggestion)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isCategoryCard
                    ? "bg-purple-50/50 active:bg-purple-100/50 border-b border-purple-100/50"
                    : "active:bg-gray-50"
                }`}
              >
                {/* Thumbnail or Icon */}
                {suggestion.imageUrl ? (
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <img
                      src={suggestion.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-100"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-md ${config.bg} flex items-center justify-center ring-2 ring-white`}>
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
                  <p className="text-[14px] text-gray-700 truncate leading-tight">
                    <HighlightedText text={suggestion.text} query={query} />
                  </p>
                  {suggestion.subtitle && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                      {isCategoryCard ? `Browse all → ${suggestion.subtitle}` : suggestion.subtitle}
                    </p>
                  )}
                </div>

                {/* Type badge */}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${config.labelBg} ${config.labelText} flex-shrink-0`}
                >
                  {config.label}
                </span>

                <IonIcon
                  icon={arrowForward}
                  className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 -rotate-45"
                />
              </motion.button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default SuggestionList;
