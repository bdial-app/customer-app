"use client";
import { useAllCategories } from "@/hooks/useCategories";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import { close } from "ionicons/icons";

interface FilterChipsProps {
  selectedFilters: Set<string>;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

const FilterChips = ({
  selectedFilters,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) => {
  const { data: categoryResponse } = useAllCategories(1, 100);

  if (selectedFilters.size === 0) return null;

  const getLabel = (id: string) => {
    // Search both parent and child categories
    for (const cat of categoryResponse?.data ?? []) {
      if (cat.id === id) return cat.name;
      for (const child of cat.children ?? []) {
        if (child.id === id) return child.name;
      }
    }
    return id;
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {Array.from(selectedFilters).map((filterId) => (
        <button
          key={filterId}
          onClick={() => onRemoveFilter(filterId)}
          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-700/40 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors"
        >
          {getLabel(filterId)}
          <IonIcon icon={close} className="w-3.5 h-3.5" />
        </button>
      ))}
      {selectedFilters.size > 1 && (
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
