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
  const { data: catResponse } = useAllCategories(1, 100);

  const getCatName = (id: string) => {
    for (const cat of catResponse?.data ?? []) {
      if (cat.id === id) return cat.name;
      for (const child of cat.children ?? []) {
        if (child.id === id) return child.name;
      }
    }
    return id.slice(0, 8);
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

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 pl-3 pr-1.5 h-8 rounded-xl text-[11px] font-bold whitespace-nowrap bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 active:bg-amber-100 dark:active:bg-amber-900/50 transition-colors shadow-sm"
        >
          {chip.label}
          <span className="w-5 h-5 rounded-full bg-amber-200/40 dark:bg-amber-800/40 flex items-center justify-center ml-0.5">
            <IonIcon icon={close} className="w-3 h-3" />
          </span>
        </button>
      ))}
    </div>
  );
};

export default SearchFilterChips;
