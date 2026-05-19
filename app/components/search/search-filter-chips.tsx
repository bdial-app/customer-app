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
  setListingType,
} from "@/store/slices/searchSlice";

const SearchFilterChips = () => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((s) => s.search);
  const { data: catResponse, isLoading: catsLoading } = useAllCategories(1, 100);

  const getCatName = (id: string): string | null => {
    if (catsLoading) return "…";
    for (const cat of catResponse?.data ?? []) {
      if (cat.id === id) return cat.name;
      for (const child of cat.children ?? []) {
        if (child.id === id) return child.name;
      }
    }
    return null; // not found — don't show chip
  };

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  // Category chips — skip if name can't be resolved
  for (const id of filters.categoryIds) {
    const name = getCatName(id);
    if (!name) continue;
    chips.push({
      key: `cat-${id}`,
      label: name,
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

  // Listing type chip
  if (filters.listingType && filters.listingType !== "all") {
    chips.push({
      key: "listingType",
      label: filters.listingType === "services" ? "🛠️ Services only" : "📦 Products only",
      onRemove: () => dispatch(setListingType("all")),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 pl-3 pr-1.5 h-8 rounded-xl text-[11px] font-bold whitespace-nowrap active:opacity-80 transition-colors shadow-sm bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50"
        >
          {chip.label}
          <span className="w-5 h-5 rounded-full flex items-center justify-center ml-0.5 bg-amber-200/40 dark:bg-amber-800/40">
            <IonIcon icon={close} className="w-3 h-3" />
          </span>
        </button>
      ))}
    </div>
  );
};

export default SearchFilterChips;
