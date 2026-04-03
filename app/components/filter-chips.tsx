"use client"
import { IonIcon } from "@ionic/react";
import { close } from "ionicons/icons";
import { getFilterLabel } from "../data/categories";

interface FilterChipsProps {
  selectedFilters: Set<string>;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

const FilterChips = ({ selectedFilters, onRemoveFilter, onClearAll }: FilterChipsProps) => {
  if (selectedFilters.size === 0) return null;

  return (
    <div className="px-4 pb-2 flex flex-wrap gap-2">
      {Array.from(selectedFilters).map((filterId) => (
        <button
          key={filterId}
          onClick={() => onRemoveFilter(filterId)}
          className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full text-xs font-medium transition-all duration-200"
          style={{
            background: "rgba(0, 122, 255, 0.12)",
            color: "#007AFF",
          }}
        >
          {getFilterLabel(filterId)}
          <IonIcon icon={close} style={{ fontSize: "14px" }} />
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-gray-500 underline ml-1 py-1"
      >
        Clear all
      </button>
    </div>
  );
};

export default FilterChips;
