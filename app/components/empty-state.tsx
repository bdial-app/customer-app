"use client"
import { Block, Button } from "konsta/react";

interface EmptyStateProps {
  searchQuery: string;
  activeFilterCount: number;
  onClearSearch: () => void;
  onClearFilters: () => void;
}

const EmptyState = ({ searchQuery, activeFilterCount, onClearSearch, onClearFilters }: EmptyStateProps) => (
  <Block className="text-center py-8">
    <div className="text-4xl mb-3">🔍</div>
    <p className="text-gray-500 text-base font-medium">No services found</p>
    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
    <div className="flex gap-2 justify-center mt-4">
      {searchQuery && (
        <Button
          className="!bg-transparent"
          tonal
          rounded
          small
          onClick={onClearSearch}
        >
          Clear Search
        </Button>
      )}
      {activeFilterCount > 0 && (
        <Button tonal rounded small onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  </Block>
);

export default EmptyState;
