"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTopLevelCategories, useCategorySearch, useSubCategories, useCategoryProviders } from "@/hooks/useCategories";
import { Category, CategorySearchResult, SubCategory } from "@/services/category.service";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { ChevronLeft, Search, ChevronRight, X, Flame, TrendingUp, Star, MapPin, BadgeCheck, Users } from "lucide-react";
import { useCategoryInteraction } from "@/hooks/useCategoryInteraction";
import CategoryIcon from "@/app/components/ui/category-icon";
import { GRADIENT_PALETTE } from "@/app/components/ui/category-icon";
import OptimizedImage from "@/app/components/ui/optimized-image";

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
  const { data: categoryProviders = [], isLoading: providersLoading } = useCategoryProviders(selectedParent?.slug ?? null);

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
    <div className="h-screen flex flex-col bg-[#f8f9fa] dark:bg-slate-900 overflow-hidden">
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
      <div className="flex-1 overflow-y-auto">
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CategoryIcon icon={result.icon} iconColor={result.iconColor} name={result.name} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {result.parentName && (
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate mb-0.5">
                          {result.parentName}
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
                      <CategoryIcon icon={cat.icon} iconColor={cat.iconColor} imageUrl={cat.imageUrl} name={cat.name} size="xs" />
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
                          <CategoryIcon icon={cat.icon} iconColor={cat.iconColor} imageUrl={cat.imageUrl} name={cat.name} size="md" />
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
          /* ========== SUBCATEGORY VIEW — Rich Category Landing ========== */
          <motion.div
            key="sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* ── Hero Header ── */}
            {(() => {
              const palette = GRADIENT_PALETTE[selectedParent.iconColor ?? ""] ?? GRADIENT_PALETTE.amber;
              const totalProviders = subCategories.reduce((sum: number, s: SubCategory) => sum + (s.providerCount ?? 0), 0) || (selectedParent as any).providerCount || 0;
              const totalBookings = subCategories.reduce((sum: number, s: SubCategory) => sum + (s.recentBookings ?? 0), 0);
              return (
                <div className={`relative overflow-hidden bg-gradient-to-br ${palette.gradient} px-4 pt-5 pb-6`}>
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/[0.06]" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/[0.04]" />
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <CategoryIcon icon={selectedParent.icon} iconColor={selectedParent.iconColor} imageUrl={(selectedParent as any).imageUrl} name={selectedParent.name} size="md" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h2 className="text-lg font-bold text-white leading-snug">
                        {selectedParent.name}
                      </h2>
                      {selectedParent.description && (
                        <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                          {selectedParent.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {totalProviders > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/90 bg-white/20 rounded-full px-2.5 py-1">
                            <Users size={11} /> {totalProviders} providers
                          </span>
                        )}
                        {totalBookings > 0 && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/90 bg-white/20 rounded-full px-2.5 py-1">
                            <Flame size={11} /> {totalBookings} this week
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Subcategory Chips (horizontal scroll) ── */}
            {!subsLoading && subCategories.length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {subCategories.map((sub: SubCategory) => (
                    <button
                      key={sub.id}
                      onClick={() => handleNavigateToSearch(sub.name, sub.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm active:scale-[0.96] transition-transform flex-shrink-0"
                    >
                      <CategoryIcon icon={sub.icon} iconColor={sub.iconColor} name={sub.name} size="xs" />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {sub.name}
                      </span>
                      {(sub.providerCount ?? 0) > 0 && (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                          {sub.providerCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Top Providers Preview ── */}
            <div className="mt-2">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Top Providers
                </h3>
                <button
                  onClick={() => handleNavigateToSearch(selectedParent.name, selectedParent.id)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400"
                >
                  See All →
                </button>
              </div>

              {providersLoading ? (
                <div className="flex gap-3 overflow-hidden px-4 pb-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="shrink-0 w-[150px] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-pulse">
                      <div className="h-[100px] bg-slate-200 dark:bg-slate-700" />
                      <div className="p-2.5 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : categoryProviders.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-3" style={{ WebkitOverflowScrolling: "touch" }}>
                  {categoryProviders.slice(0, 6).map((provider, idx) => (
                    <div
                      key={provider.id}
                      onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`)}
                      className="shrink-0 w-[150px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-50 dark:border-slate-800 active:scale-[0.97] transition-transform"
                    >
                      <div className="relative h-[100px] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
                        {provider.image ? (
                          <OptimizedImage
                            src={provider.image}
                            alt={provider.name}
                            className="w-full h-full"
                            width={150}
                            height={100}
                            priority={idx < 3}
                            preset="card"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-200 dark:text-slate-600">
                              {provider.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        {provider.verified && (
                          <div className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <BadgeCheck size={8} /> Verified
                          </div>
                        )}
                        {provider.distance != null && (
                          <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                            <MapPin size={8} className="text-amber-500" />
                            {provider.distance < 1
                              ? `${Math.round(provider.distance * 1000)}m`
                              : `${provider.distance.toFixed(1)} km`}
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 leading-tight">
                          {provider.name}
                        </h4>
                        {provider.services && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {provider.services}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {provider.rating > 0 ? (
                            <div className="flex items-center gap-0.5 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-md">
                              <Star size={9} className="text-green-600 fill-green-600" />
                              <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                                {provider.rating.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">New</span>
                            </div>
                          )}
                          {provider.reviewCount > 0 && (
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">
                              {provider.reviewCount} reviews
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 pb-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No providers listed yet — be one of the first!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Subcategory Cards ── */}
            {!subsLoading && subCategories.length > 0 && (
              <div className="px-4 pt-2 pb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2.5">
                  Browse by Subcategory
                </h3>
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
                        <CategoryIcon icon={sub.icon} iconColor={sub.iconColor} name={sub.name} size="sm" />
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
              </div>
            )}

            {/* ── Browse All CTA ── */}
            <div className="px-4 pb-8">
              <button
                onClick={() => handleNavigateToSearch(selectedParent.name, selectedParent.id)}
                className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold active:scale-[0.98] transition-transform shadow-md"
              >
                Browse all {selectedParent.name} providers →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
