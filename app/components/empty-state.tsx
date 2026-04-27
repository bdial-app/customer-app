"use client";
import { motion } from "framer-motion";
import { useAllCategories } from "@/hooks/useCategories";

interface EmptyStateProps {
  searchQuery: string;
  activeFilterCount: number;
  onClearSearch: () => void;
  onClearFilters: () => void;
}

const POPULAR_SEARCHES = [
  "Tailoring",
  "Mehandi",
  "Tuition",
  "Beauty",
  "Jewellery",
  "Embroidery",
];

const EmptyState = ({
  searchQuery,
  activeFilterCount,
  onClearSearch,
  onClearFilters,
}: EmptyStateProps) => {
  const { data: categoryResponse } = useAllCategories(1, 100);
  const topCategories = (categoryResponse?.data ?? [])
    .filter((c) => c.parentId === null)
    .slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center py-12 px-6"
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
      <div className="flex gap-2 mb-8">
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

      {/* Popular searches */}
      <div className="w-full max-w-sm">
        <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
          Popular Searches
        </h4>
        <div className="flex flex-wrap gap-2 mb-6">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => {
                onClearSearch();
                // Trigger search via URL - parent will pick it up
                const url = new URL(window.location.href);
                url.searchParams.set("search", term);
                window.history.replaceState({}, "", url.toString());
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 active:bg-gray-50 dark:active:bg-slate-700 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Browse categories */}
      {topCategories.length > 0 && (
        <div className="w-full max-w-sm">
          <h4 className="text-[12px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 px-1">
            Browse Categories
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onClearFilters();
                  const url = new URL(window.location.href);
                  url.searchParams.delete("search");
                  window.history.replaceState({}, "", url.toString());
                }}
                className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-700 transition-colors text-left"
              >
                <span className="text-[14px] font-medium text-gray-800 dark:text-slate-200 truncate">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
