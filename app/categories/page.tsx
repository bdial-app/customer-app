"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { getSubCategories, Category } from "@/services/category.service";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Search, ChevronRight } from "lucide-react";
import { useCategoryInteraction } from "@/hooks/useCategoryInteraction";

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useTopLevelCategories();
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { trackCategory } = useCategoryInteraction();

  const { data: subCategories = [], isLoading: subsLoading } = useQuery({
    queryKey: ["sub-categories", selectedParent?.id],
    queryFn: () => getSubCategories(selectedParent!.id),
    enabled: !!selectedParent,
    staleTime: 10 * 60 * 1000,
  });

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (c: Category) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [categories, searchQuery]);

  const handleCategoryTap = (cat: Category) => {
    trackCategory(cat.id, 'view');
    setSelectedParent(cat);
  };

  const handleSubCategoryTap = (cat: Category) => {
    trackCategory(cat.id, 'view');
    router.push(
      `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(cat.name)}&categoryIds=${cat.id}`,
    );
  };

  const handleParentSearch = (cat: Category) => {
    trackCategory(cat.id, 'view');
    router.push(
      `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(cat.name)}&categoryIds=${cat.id}`,
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 pb-3" style={{ paddingTop: "var(--sat,0px)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (selectedParent ? setSelectedParent(null) : router.back())}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={20} className="text-slate-700 dark:text-slate-200" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {selectedParent ? selectedParent.name : "All Categories"}
          </h1>
        </div>

        {/* Search */}
        {!selectedParent && (
          <div className="mt-3 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!selectedParent ? (
          // Top-level categories grid
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 grid grid-cols-3 gap-3"
          >
            {isLoading
              ? [...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-white dark:bg-slate-800 animate-pulse"
                  />
                ))
              : filteredCategories.length === 0
                ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                    <p className="text-sm">
                      {searchQuery ? "No categories match your search" : "No categories available"}
                    </p>
                  </div>
                )
                : filteredCategories.map((cat: Category) => (
                  <motion.div
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryTap(cat)}
                    className="aspect-square rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-2 p-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="text-2xl">
                      {cat.icon || cat.name?.[0]}
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </motion.div>
                ))}
          </motion.div>
        ) : (
          // Subcategories list
          <motion.div
            key="sub"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {/* Browse all in parent */}
            <button
              onClick={() => handleParentSearch(selectedParent)}
              className="w-full mb-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Browse all in {selectedParent.name}
              </span>
              <ChevronRight size={16} className="text-amber-600" />
            </button>

            {/* Subcategories */}
            {subsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-white dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : subCategories.length > 0 ? (
              <div className="space-y-2">
                {subCategories.map((sub: Category) => (
                  <motion.button
                    key={sub.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSubCategoryTap(sub)}
                    className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-3 text-left shadow-sm"
                  >
                    <span className="text-lg">{sub.icon || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {sub.name}
                      </p>
                      {sub.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {sub.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 dark:text-slate-500 shrink-0"
                    />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No subcategories yet
                </p>
                <button
                  onClick={() => handleParentSearch(selectedParent)}
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
