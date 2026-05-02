"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Preloader,
} from "konsta/react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import {
  close,
  searchOutline,
  checkmarkCircle,
  chevronDown,
  chevronForward,
  starOutline,
  locateOutline,
  shieldCheckmarkOutline,
  ribbonOutline,
  layersOutline,
} from "ionicons/icons";
import { useAllCategories } from "@/hooks/useCategories";
import { Category } from "@/services/category.service";

export interface AllServicesFilters {
  categoryIds: Set<string>;
  minRating: number | null;
  maxDistance: number | null;
  verifiedOnly: boolean;
  womenLedOnly: boolean;
}

interface FilterSheetProps {
  opened: boolean;
  filters: AllServicesFilters;
  onClose: () => void;
  onApply: (filters: AllServicesFilters) => void;
}

type FilterTab = "rating" | "distance" | "type" | "categories";

const TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "rating", label: "Rating", icon: starOutline },
  { key: "distance", label: "Distance", icon: locateOutline },
  { key: "type", label: "Type", icon: shieldCheckmarkOutline },
  { key: "categories", label: "Categories", icon: layersOutline },
];

const RATING_OPTIONS: { value: number | null; label: string; desc: string }[] = [
  { value: null, label: "Any Rating", desc: "Show all providers" },
  { value: 3, label: "3.0+ Stars", desc: "Good and above" },
  { value: 3.5, label: "3.5+ Stars", desc: "Very good and above" },
  { value: 4, label: "4.0+ Stars", desc: "Excellent and above" },
  { value: 4.5, label: "4.5+ Stars", desc: "Top rated only" },
];

const DISTANCE_OPTIONS: { value: number | null; label: string; desc: string }[] = [
  { value: null, label: "Any Distance", desc: "Show all results" },
  { value: 2, label: "Within 2 km", desc: "Walking distance" },
  { value: 5, label: "Within 5 km", desc: "Short drive away" },
  { value: 10, label: "Within 10 km", desc: "In your area" },
  { value: 25, label: "Within 25 km", desc: "Across the city" },
];

type ParentState = "none" | "some" | "all";

const getChildIds = (category: Category): string[] => {
  return category.children?.map((c) => c.id) ?? [];
};

const FilterSheet = ({
  opened,
  filters,
  onClose,
  onApply,
}: FilterSheetProps) => {
  const { data: categoryResponse, isLoading } = useAllCategories(1, 100);
  const allCategories =
    categoryResponse?.data.filter((c) => c.parentId === null) ?? [];

  const [activeTab, setActiveTab] = useState<FilterTab>("rating");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorySearch, setCategorySearch] = useState("");
  const [tempCats, setTempCats] = useState<Set<string>>(new Set(filters.categoryIds));
  const [tempRating, setTempRating] = useState<number | null>(filters.minRating);
  const [tempDistance, setTempDistance] = useState<number | null>(filters.maxDistance);
  const [tempVerified, setTempVerified] = useState(filters.verifiedOnly);
  const [tempWomenLed, setTempWomenLed] = useState(filters.womenLedOnly);

  // Sync temp state when sheet opens
  useEffect(() => {
    if (opened) {
      setTempCats(new Set(filters.categoryIds));
      setTempRating(filters.minRating);
      setTempDistance(filters.maxDistance);
      setTempVerified(filters.verifiedOnly);
      setTempWomenLed(filters.womenLedOnly);
      setCategorySearch("");
    }
  }, [opened, filters]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return allCategories;
    const q = categorySearch.toLowerCase();
    return allCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.children?.some((child) => child.name.toLowerCase().includes(q)),
    );
  }, [allCategories, categorySearch]);

  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }, []);

  const toggleChildFilter = useCallback((childId: string) => {
    setTempCats((prev) => {
      const next = new Set(prev);
      next.has(childId) ? next.delete(childId) : next.add(childId);
      return next;
    });
  }, []);

  const toggleParentFilter = useCallback((category: Category) => {
    setTempCats((prev) => {
      const next = new Set(prev);
      const childIds = getChildIds(category);
      const allSelected = childIds.every((id) => next.has(id));
      if (allSelected) {
        childIds.forEach((id) => next.delete(id));
        next.delete(category.id);
      } else {
        childIds.forEach((id) => next.add(id));
        next.add(category.id);
      }
      return next;
    });
  }, []);

  const getParentState = useCallback(
    (category: Category): ParentState => {
      const childIds = getChildIds(category);
      if (childIds.length === 0)
        return tempCats.has(category.id) ? "all" : "none";
      const selectedCount = childIds.filter((id) => tempCats.has(id)).length;
      if (selectedCount === 0) return "none";
      if (selectedCount === childIds.length) return "all";
      return "some";
    },
    [tempCats],
  );

  const handleApply = () => {
    onApply({
      categoryIds: tempCats,
      minRating: tempRating,
      maxDistance: tempDistance,
      verifiedOnly: tempVerified,
      womenLedOnly: tempWomenLed,
    });
  };

  const handleReset = () => {
    setTempCats(new Set());
    setTempRating(null);
    setTempDistance(null);
    setTempVerified(false);
    setTempWomenLed(false);
    setCategorySearch("");
  };

  const activeCount =
    tempCats.size +
    (tempRating ? 1 : 0) +
    (tempDistance ? 1 : 0) +
    (tempVerified ? 1 : 0) +
    (tempWomenLed ? 1 : 0);

  // Per-tab badge counts
  const tabBadge = (tab: FilterTab): number => {
    switch (tab) {
      case "rating": return tempRating ? 1 : 0;
      case "distance": return tempDistance ? 1 : 0;
      case "type": return (tempVerified ? 1 : 0) + (tempWomenLed ? 1 : 0);
      case "categories": return tempCats.size;
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const content = (
    <AnimatePresence>
      {opened && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[9999] bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "92vh", paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
          >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">Filters</h3>
          {activeCount > 0 && (
            <span className="h-5 min-w-5 px-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={handleReset} className="text-[13px] font-semibold text-red-500 active:text-red-600">
              Clear All
            </button>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600">
            <IonIcon icon={close} className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── Body: Left tabs + Right content ── */}
      <div className="flex" style={{ height: "calc(92vh - 130px)" }}>
        {/* Left sidebar tabs */}
        <div className="w-[90px] bg-gray-50 dark:bg-slate-800/50 border-r border-gray-100 dark:border-slate-700 overflow-y-auto flex flex-col">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const badge = tabBadge(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center gap-1 px-2 py-3.5 text-center transition-all border-l-[3px] ${
                  isActive
                    ? "bg-white dark:bg-slate-900 border-l-amber-500 text-amber-600 dark:text-amber-400"
                    : "border-l-transparent text-gray-500 dark:text-slate-400 active:bg-gray-100 dark:active:bg-slate-700"
                }`}
              >
                <IonIcon icon={tab.icon} className="w-5 h-5" />
                <span className="text-[10px] font-semibold leading-tight">{tab.label}</span>
                {badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right content panel */}
        <div className="flex-1 overflow-y-auto">
          {/* ─── Rating Tab ─── */}
          {activeTab === "rating" && (
            <div className="p-4">
              <p className="text-[13px] font-bold text-gray-800 dark:text-white mb-1">Minimum Rating</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-3">Show providers rated above</p>
              <div className="space-y-2">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setTempRating(opt.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      tempRating === opt.value
                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600"
                        : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-700"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-[13px] font-semibold ${tempRating === opt.value ? "text-amber-700 dark:text-amber-400" : "text-gray-800 dark:text-slate-200"}`}>
                        {opt.value ? `⭐ ${opt.label}` : opt.label}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempRating === opt.value
                        ? "border-amber-500 bg-amber-500"
                        : "border-gray-300 dark:border-slate-600"
                    }`}>
                      {tempRating === opt.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Distance Tab ─── */}
          {activeTab === "distance" && (
            <div className="p-4">
              <p className="text-[13px] font-bold text-gray-800 dark:text-white mb-1">Maximum Distance</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-3">Show providers within range</p>
              <div className="space-y-2">
                {DISTANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setTempDistance(opt.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      tempDistance === opt.value
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600"
                        : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-700"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-[13px] font-semibold ${tempDistance === opt.value ? "text-blue-700 dark:text-blue-400" : "text-gray-800 dark:text-slate-200"}`}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      tempDistance === opt.value
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-slate-600"
                    }`}>
                      {tempDistance === opt.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Type Tab ─── */}
          {activeTab === "type" && (
            <div className="p-4">
              <p className="text-[13px] font-bold text-gray-800 dark:text-white mb-1">Provider Type</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-3">Filter by provider attributes</p>
              <div className="space-y-3">
                <button
                  onClick={() => setTempVerified((v) => !v)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    tempVerified
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                      : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tempVerified ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <IonIcon icon={shieldCheckmarkOutline} className={`w-5 h-5 ${tempVerified ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-[13px] font-semibold ${tempVerified ? "text-emerald-700 dark:text-emerald-400" : "text-gray-800 dark:text-slate-200"}`}>Verified Only</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Identity and quality verified providers</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${tempVerified ? "bg-emerald-500" : "bg-gray-200 dark:bg-slate-600"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${tempVerified ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </button>

                <button
                  onClick={() => setTempWomenLed((v) => !v)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    tempWomenLed
                      ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700"
                      : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tempWomenLed ? "bg-purple-100 dark:bg-purple-900/40" : "bg-gray-100 dark:bg-slate-700"}`}>
                    <IonIcon icon={ribbonOutline} className={`w-5 h-5 ${tempWomenLed ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-slate-500"}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-[13px] font-semibold ${tempWomenLed ? "text-purple-700 dark:text-purple-400" : "text-gray-800 dark:text-slate-200"}`}>Women-Led</p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Support women-owned businesses</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${tempWomenLed ? "bg-purple-500" : "bg-gray-200 dark:bg-slate-600"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${tempWomenLed ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ─── Categories Tab ─── */}
          {activeTab === "categories" && (
            <div>
              {/* Category search */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-3 pt-3 pb-2">
                <div className="relative">
                  <IonIcon icon={searchOutline} className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300 dark:focus:border-amber-500 transition-all"
                  />
                  {categorySearch && (
                    <button
                      onClick={() => setCategorySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      <IonIcon icon={close} className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {tempCats.size > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1.5">
                    {tempCats.size} selected
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Preloader />
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <span className="text-2xl mb-2">🔍</span>
                  <p className="text-[13px] text-gray-400 dark:text-slate-500">No categories match "{categorySearch}"</p>
                </div>
              ) : (
                <div className="pb-2">
                  {filteredCategories.map((category) => {
                    const isExpanded = expandedCategories.has(category.id);
                    const parentState = getParentState(category);
                    const childIds = getChildIds(category);
                    const hasChildren = childIds.length > 0;

                    // Filter children by search too
                    const visibleChildren = categorySearch.trim()
                      ? category.children?.filter((c) =>
                          c.name.toLowerCase().includes(categorySearch.toLowerCase()),
                        )
                      : category.children;

                    return (
                      <div key={category.id}>
                        {/* Parent row */}
                        <button
                          onClick={() => hasChildren ? toggleExpand(category.id) : toggleChildFilter(category.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 active:bg-gray-50 dark:active:bg-slate-800 transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            parentState === "all"
                              ? "bg-amber-500 border-amber-500"
                              : parentState === "some"
                              ? "bg-amber-500/30 border-amber-500"
                              : tempCats.has(category.id)
                              ? "bg-amber-500 border-amber-500"
                              : "border-gray-300 dark:border-slate-600"
                          }`}>
                            {(parentState === "all" || (!hasChildren && tempCats.has(category.id))) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            )}
                            {parentState === "some" && (
                              <div className="w-2.5 h-0.5 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="flex-1 text-left text-[13px] font-semibold text-gray-800 dark:text-slate-200">
                            {category.name}
                          </span>
                          {hasChildren && (
                            <div className="flex items-center gap-1.5">
                              {parentState !== "none" && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
                                  {childIds.filter((id) => tempCats.has(id)).length}/{childIds.length}
                                </span>
                              )}
                              <IonIcon
                                icon={isExpanded ? chevronDown : chevronForward}
                                className="w-4 h-4 text-gray-400 dark:text-slate-500"
                              />
                            </div>
                          )}
                        </button>

                        {/* Children (auto-expand when searching) */}
                        {hasChildren && (
                          <div
                            style={{
                              maxHeight: isExpanded || categorySearch.trim()
                                ? `${((visibleChildren?.length ?? 0) + 1) * 44 + 10}px`
                                : "0px",
                              overflow: "hidden",
                              transition: "max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                            {/* Select All / Deselect All */}
                            <button
                              onClick={() => toggleParentFilter(category)}
                              className="w-full flex items-center gap-2.5 pl-11 pr-4 py-2 text-left"
                            >
                              <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                                {parentState === "all" ? "Deselect All" : "Select All"}
                              </span>
                            </button>

                            {visibleChildren?.map((child) => {
                              const isSelected = tempCats.has(child.id);
                              return (
                                <button
                                  key={child.id}
                                  onClick={() => toggleChildFilter(child.id)}
                                  className="w-full flex items-center gap-2.5 pl-11 pr-4 py-2.5 active:bg-gray-50 dark:active:bg-slate-800 transition-colors"
                                >
                                  <div className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? "bg-amber-500 border-amber-500"
                                      : "border-gray-300 dark:border-slate-600"
                                  }`}>
                                    {isSelected && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                  </div>
                                  <span className={`text-[12px] ${isSelected ? "font-semibold text-gray-800 dark:text-slate-200" : "text-gray-600 dark:text-slate-400"}`}>
                                    {child.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Subtle divider */}
                        <div className="h-px bg-gray-50 dark:bg-slate-800 mx-4" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: Apply / Clear ── */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-3 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900">
        {activeCount > 0 && (
          <button
            onClick={handleReset}
            className="h-11 px-5 rounded-xl text-[13px] font-semibold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 active:bg-gray-50 dark:active:bg-slate-800 transition-colors"
          >
            Clear All
          </button>
        )}
        <button
          onClick={handleApply}
          className="flex-1 h-11 rounded-xl text-[14px] font-bold text-white bg-amber-500 active:bg-amber-600 shadow-sm shadow-amber-200/50 dark:shadow-amber-900/30 transition-colors"
        >
          {activeCount > 0 ? `Apply Filters (${activeCount})` : "Show All Results"}
        </button>
      </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default FilterSheet;
