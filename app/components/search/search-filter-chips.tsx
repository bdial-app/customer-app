"use client";

import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { close } from "ionicons/icons";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { useAllCategories } from "@/hooks/useCategories";
import {
  setCategoryIds,
  setMinRating,
  setMaxDistance,
  setVerifiedOnly,
  setWomenLedOnly,
} from "@/store/slices/searchSlice";

const SearchFilterChips = () => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((s) => s.search);
  const { data: catResponse, isLoading: catsLoading } = useAllCategories(1, 200);

  const getCatName = (id: string): string => {
    if (catsLoading) return "…";
    for (const cat of catResponse?.data ?? []) {
      if (cat.id === id) return cat.name;
      for (const child of cat.children ?? []) {
        if (child.id === id) return child.name;
      }
    }
    return "Category";
  };

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  // Category chips
  for (const id of filters.categoryIds) {
    chips.push({
      key: `cat-${id}`,
      label: getCatName(id),
      onRemove: () =>
        dispatch(setCategoryIds(filters.categoryIds.filter((c) => c !== id))),
    });
  }

  // Rating chip
  if (filters.minRating) {
    chips.push({
      key: "rating",
      label: `★ ${filters.minRating}+`,
      onRemove: () => dispatch(setMinRating(null)),
    });
  }

  // Distance chip
  if (filters.maxDistance) {
    chips.push({
      key: "distance",
      label: `< ${filters.maxDistance} km`,
      onRemove: () => dispatch(setMaxDistance(null)),
    });
  }

  // Verified chip
  if (filters.verifiedOnly) {
    chips.push({
      key: "verified",
      label: "Verified",
      onRemove: () => dispatch(setVerifiedOnly(false)),
    });
  }

  // Women-led chip
  if (filters.womenLedOnly) {
    chips.push({
      key: "womenled",
      label: "Women-Led",
      onRemove: () => dispatch(setWomenLedOnly(false)),
    });
  }

  if (chips.length === 0 && !filters.womenLedOnly) {
    // Show standalone Women-Led quick toggle even when no filters active
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => dispatch(setWomenLedOnly(true))}
          className="inline-flex items-center gap-1 px-3 h-8 rounded-xl text-[11px] font-bold whitespace-nowrap bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50 active:bg-purple-100 transition-colors shadow-sm"
        >
          ♀ Women-Led
        </button>
      </div>
    );
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {/* Women-Led quick toggle at the start */}
      {!filters.womenLedOnly && (
        <button
          onClick={() => dispatch(setWomenLedOnly(true))}
          className="inline-flex items-center gap-1 px-3 h-8 rounded-xl text-[11px] font-bold whitespace-nowrap bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50 active:bg-purple-100 transition-colors shadow-sm"
        >
          ♀ Women-Led
        </button>
      )}
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className={`inline-flex items-center gap-1 pl-3 pr-1.5 h-8 rounded-xl text-[11px] font-bold whitespace-nowrap active:opacity-80 transition-colors shadow-sm ${
            chip.key === "womenled"
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50"
              : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50"
          }`}
        >
          {chip.key === "womenled" ? `♀ ${chip.label}` : chip.label}
          <span className={`w-5 h-5 rounded-full flex items-center justify-center ml-0.5 ${
            chip.key === "womenled" ? "bg-purple-200/40 dark:bg-purple-800/40" : "bg-amber-200/40 dark:bg-amber-800/40"
          }`}>
            <IonIcon icon={close} className="w-3 h-3" />
          </span>
        </button>
      ))}
    </div>
  );
};

export default SearchFilterChips;
