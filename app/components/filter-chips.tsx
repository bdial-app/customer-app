"use client";
import { useAllCategories } from "@/hooks/useCategories";
import type { AllServicesFilters } from "./filter-sheet";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import { close } from "ionicons/icons";

interface FilterChipsProps {
  filters: AllServicesFilters;
  onRemoveCategory: (id: string) => void;
  onRemoveRating: () => void;
  onRemoveDistance: () => void;
  onRemoveVerified: () => void;
  onRemoveWomenLed: () => void;
  onClearAll: () => void;
}

const FilterChips = ({
  filters,
  onRemoveCategory,
  onRemoveRating,
  onRemoveDistance,
  onRemoveVerified,
  onRemoveWomenLed,
  onClearAll,
}: FilterChipsProps) => {
  const { data: categoryResponse } = useAllCategories(1, 100);

  const chips: { key: string; label: string; color: string; onRemove: () => void }[] = [];

  // Rating chip
  if (filters.minRating) {
    chips.push({
      key: "rating",
      label: `⭐ ${filters.minRating}+`,
      color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-700/40",
      onRemove: onRemoveRating,
    });
  }

  // Distance chip
  if (filters.maxDistance) {
    chips.push({
      key: "distance",
      label: `Within ${filters.maxDistance} km`,
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-700/40",
      onRemove: onRemoveDistance,
    });
  }

  // Verified chip
  if (filters.verifiedOnly) {
    chips.push({
      key: "verified",
      label: "✓ Verified",
      color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40",
      onRemove: onRemoveVerified,
    });
  }

  // Women-led chip
  if (filters.womenLedOnly) {
    chips.push({
      key: "womenLed",
      label: "♀ Women-Led",
      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200/60 dark:border-purple-700/40",
      onRemove: onRemoveWomenLed,
    });
  }

  // Category chips
  const getCatLabel = (id: string) => {
    for (const cat of categoryResponse?.data ?? []) {
      if (cat.id === id) return cat.name;
      for (const child of cat.children ?? []) {
        if (child.id === id) return child.name;
      }
    }
    return id;
  };

  for (const catId of filters.categoryIds) {
    chips.push({
      key: catId,
      label: getCatLabel(catId),
      color: "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200/60 dark:border-slate-600/40",
      onRemove: () => onRemoveCategory(catId),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors ${chip.color}`}
        >
          {chip.label}
          <IonIcon icon={close} className="w-3.5 h-3.5" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 whitespace-nowrap px-2 py-1 active:text-gray-600 dark:active:text-slate-300"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default FilterChips;
