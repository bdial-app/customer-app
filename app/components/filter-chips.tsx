"use client";
import { useAllCategories } from "@/hooks/useCategories";
import { IonIcon } from "@ionic/react";
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
    const category = categoryResponse?.data.find((c) => c.id === id);
    return category?.name || id;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
      <div className="flex gap-2 shrink-0">
        {selectedFilters.size > 0 && <div className="h-4"></div>}
        {Array.from(selectedFilters).map((filterId) => (
          <button
            key={filterId}
            onClick={() => onRemoveFilter(filterId)}
            className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: "rgba(0, 122, 255, 0.12)",
              color: "#007AFF",
            }}
          >
            {getLabel(filterId)}
            <IonIcon icon={close} style={{ fontSize: "14px" }} />
          </button>
        ))}
      </div>
      {/* <button
        onClick={onClearAll}
        className="text-xs text-gray-500 underline py-1 shrink-0 whitespace-nowrap"
      >
        Clear all
      </button> */}
    </div>
  );
};

export default FilterChips;
