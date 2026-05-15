"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTopLevelCategories, useCategorySearch, useSubCategories } from "@/hooks/useCategories";
import { Category, CategorySearchResult, SubCategory } from "@/services/category.service";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { ChevronLeft, Search, ChevronRight, X, Flame, TrendingUp } from "lucide-react";
import { useCategoryInteraction } from "@/hooks/useCategoryInteraction";

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useTopLevelCategories();
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const { trackCategory } = useCategoryInteraction();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query — 300ms
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  const isSearching = debouncedQuery.length >= 2;
  const { data: searchResults = [], isLoading: searchLoading } = useCategorySearch(debouncedQuery);
  const { data: subCategories = [], isLoading: subsLoading } = useSubCategories(selectedParent?.id ?? null);

  // Popular categories — top 5 by providerCount (derived client-side, no API)
  const popularCategories = useMemo(() => {
    return [...categories]
      .filter((c: any) => (c.providerCount ?? 0) > 0)
      .sort((a: any, b: any) => (b.providerCount ?? 0) - (a.providerCount ?? 0))
      .slice(0, 5);
  }, [categories]);

  const handleCategoryTap = useCallback((cat: Category) => {
    trackCategory(cat.id, "view");
    setSelectedParent(cat);
    setSearchQuery("");
    setDebouncedQuery("");
  }, [trackCategory]);

  const handleNavigateToSearch = useCallback((name: string, id: string) => {
    trackCategory(id, "view");
    router.push(`${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(name)}&categoryIds=${id}`);
  }, [trackCategory, router]);

  const handleBack = useCallback(() => {
    if (selectedParent) {
      setSelectedParent(null);
    } else {
      router.back();
    }
  }, [selectedParent, router]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setDebouncedQuery("");
    searchRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 pb-3" style={{ paddingTop: "var(--sat,0px)" }}>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-700 dark:text-slate-200" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1 truncate">
            {selectedParent ? selectedParent.name : "All Categories"}
          </h1>
        </div>

        {/* Search bar — visible in default + search views, hidden in subcategory view */}
        {!selectedParent && (
          <div className="mt-3 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all categories..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-shadow"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {/* ========== SEARCH RESULTS VIEW ========== */}
        {isSearching && !selectedParent ? (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {searchLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result: CategorySearchResult) => (
                  <motion.button
                    key={result.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigateToSearch(result.name, result.id)}
                    className="w-full p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-3 text-left shadow-sm active:shadow-none transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{result.icon || result.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {result.parentName && (
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mb-0.5">
                          {result.parentIcon || "📁"} {result.parentName}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {result.name}
                      </p>
                    </div>
                    {result.providerCount > 0 && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        {result.providerCount}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Search size={20} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No categories found for &ldquo;{debouncedQuery}&rdquo;
                </p>
                <button
                  onClick={clearSearch}
                  className="text-xs font-medium text-amber-600 dark:text-amber-400"
                >
                  Clear search
                </button>
              </div>
            )}
          </motion.div>
        ) : !selectedParent ? (
          /* ========== DEFAULT VIEW (grid + popular) ========== */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Popular categories strip */}
            {!isLoading && popularCategories.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <TrendingUp size={13} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Popular
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {popularCategories.map((cat: any) => (
                    <button
                      key={cat.id}
                      onClick={() => handleNavigateToSearch(cat.name, cat.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 shadow-sm hover:shadow-md active:scale-[0.97] transition-all flex-shrink-0"
                    >
                      <span className="text-sm">{cat.icon || cat.name[0]}</span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {cat.name}
                      </span>
                      <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                        {cat.providerCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full grid */}
            <div className="p-4 pt-2 grid grid-cols-3 gap-2.5">
              {isLoading
                ? [...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-white dark:bg-slate-800 animate-pulse" />
                  ))
                : categories.length === 0
                  ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                      <p className="text-sm">No categories available</p>
                    </div>
                  )
                  : categories.map((cat: any) => {
                      const hasProviders = (cat.providerCount ?? 0) > 0;
                      return (
                        <motion.button
                          key={cat.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCategoryTap(cat)}
                          className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1.5 p-2 cursor-pointer transition-all relative ${
                            hasProviders
                              ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md"
                              : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-60"
                          }`}
                        >
                          <span className="text-2xl leading-none">{cat.icon || cat.name?.[0]}</span>
                          <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-2">
                            {cat.name}
                          </span>
                          {hasProviders ? (
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                              {cat.providerCount} {cat.providerCount === 1 ? "provider" : "providers"}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-slate-300 dark:text-slate-600 italic">
                              Coming soon
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
            </div>
          </motion.div>
        ) : (
          /* ========== SUBCATEGORY VIEW ========== */
          <motion.div
            key="sub"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {/* Browse all in parent */}
            <button
              onClick={() => handleNavigateToSearch(selectedParent.name, selectedParent.id)}
              className="w-full mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-center justify-between active:scale-[0.99] transition-transform"
            >
              <div>
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Browse all in {selectedParent.name}
                </span>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                  See all providers & services
                </p>
              </div>
              <ChevronRight size={18} className="text-amber-600 dark:text-amber-400" />
            </button>

            {/* Subcategories list */}
            {subsLoading ? (
              <div className="space-y-2.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-[68px] rounded-xl bg-white dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : subCategories.length > 0 ? (
              <div className="space-y-2">
                {subCategories.map((sub: SubCategory) => {
                  const hasProviders = (sub.providerCount ?? 0) > 0;
                  const isPopular = (sub.recentBookings ?? 0) > 3;
                  return (
                    <motion.button
                      key={sub.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavigateToSearch(sub.name, sub.id)}
                      className={`w-full p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all active:shadow-none ${
                        hasProviders
                          ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100/70 dark:border-slate-700/40 opacity-70"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{sub.icon || "📋"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {sub.name}
                          </p>
                          {isPopular && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              <Flame size={9} /> Popular
                            </span>
                          )}
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {sub.description}
                          </p>
                        )}
                      </div>
                      {hasProviders ? (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full flex-shrink-0">
                          {sub.providerCount}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300 dark:text-slate-600 italic flex-shrink-0">
                          Soon
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Search size={18} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No subcategories yet
                </p>
                <button
                  onClick={() => handleNavigateToSearch(selectedParent.name, selectedParent.id)}
                  className="mt-3 text-sm font-medium text-amber-600 dark:text-amber-400"
                >
                  Search all {selectedParent.name} providers →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
