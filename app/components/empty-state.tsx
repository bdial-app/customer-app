"use client";
import { motion } from "framer-motion";

interface EmptyStateProps {
  searchQuery: string;
  activeFilterCount: number;
  onClearSearch: () => void;
  onClearFilters: () => void;
}

const EmptyState = ({
  searchQuery,
  activeFilterCount,
  onClearSearch,
  onClearFilters,
}: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 px-8"
  >
    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-5">
      <span className="text-3xl">🔍</span>
    </div>
    <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
      No services found
    </h3>
    <p className="text-[13px] text-gray-400 dark:text-slate-500 text-center max-w-[260px] mb-5">
      {searchQuery
        ? `We couldn\u2019t find anything for \u201C${searchQuery}\u201D. Try a different search term.`
        : "Try adjusting your filters to see more results."}
    </p>
    <div className="flex gap-2">
      {searchQuery && (
        <button
          onClick={onClearSearch}
          className="px-4 py-2.5 text-[13px] font-semibold text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 rounded-xl active:bg-gray-200 dark:active:bg-slate-700 transition-colors"
        >
          Clear Search
        </button>
      )}
      {activeFilterCount > 0 && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  </motion.div>
);

export default EmptyState;
