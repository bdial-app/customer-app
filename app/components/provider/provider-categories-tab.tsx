"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  checkmarkCircle,
  closeCircle,
  searchOutline,
  alertCircleOutline,
  checkmarkOutline,
} from "ionicons/icons";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { updateProviderCategories } from "@/services/provider.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@/services/category.service";

interface Props {
  providerId: string | null;
  currentCategories: { id: string; name: string; slug: string }[];
}

const MAX_CATEGORIES = 2;

const getPlaceholderColor = (name: string) => {
  const colors = [
    "from-rose-400 to-pink-500",
    "from-violet-400 to-purple-500",
    "from-blue-400 to-indigo-500",
    "from-cyan-400 to-teal-500",
    "from-emerald-400 to-green-500",
    "from-amber-400 to-orange-500",
    "from-red-400 to-rose-500",
    "from-fuchsia-400 to-pink-500",
    "from-sky-400 to-blue-500",
    "from-lime-400 to-emerald-500",
    "from-yellow-400 to-amber-500",
    "from-teal-400 to-cyan-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

const ProviderCategoriesTab = ({ providerId, currentCategories }: Props) => {
  const { data: allCategories = [], isLoading } = useTopLevelCategories();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [brokenIcons, setBrokenIcons] = useState<Set<string>>(new Set());

  // Initialize from current categories
  useEffect(() => {
    setSelectedIds(currentCategories.map((c) => c.id));
  }, [currentCategories]);

  const hasChanges = useMemo(() => {
    const currentIds = currentCategories.map((c) => c.id).sort();
    const newIds = [...selectedIds].sort();
    return JSON.stringify(currentIds) !== JSON.stringify(newIds);
  }, [currentCategories, selectedIds]);

  const mutation = useMutation({
    mutationFn: () => updateProviderCategories(providerId!, selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-details"] });
      queryClient.invalidateQueries({ queryKey: ["my-provider"] });
    },
  });

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_CATEGORIES
        ? prev
        : [...prev, id],
    );
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return allCategories;
    const q = search.toLowerCase();
    return allCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCategories, search]);

  // Group alphabetically
  const grouped = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    filtered.forEach((cat) => {
      const letter = cat.name[0]?.toUpperCase() || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(cat);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const selectedCats = allCategories.filter((c) => selectedIds.includes(c.id));

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header with save action */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">
            Business Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Choose up to {MAX_CATEGORIES} categories that best describe your business
          </p>
        </div>
        <AnimatePresence>
          {hasChanges && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.15, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/30 disabled:opacity-60 animate-pulse"
            >
              {mutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <IonIcon icon={checkmarkOutline} className="text-base" />
                  <span className="text-xs font-bold">Save</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
        {mutation.isSuccess && !hasChanges && (
          <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <IonIcon icon={checkmarkCircle} className="text-lg text-emerald-500" />
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selectedCats.length > 0 && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
              Selected ({selectedCats.length}/{MAX_CATEGORIES})
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-teal-600 dark:text-teal-400 font-medium"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCats.map((cat) => (
              <motion.div
                key={cat.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-full pl-1.5 pr-2 py-1 shadow-sm border border-teal-200 dark:border-teal-600"
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getPlaceholderColor(cat.name)} flex items-center justify-center`}>
                  <span className="text-[9px] font-bold text-white">{cat.name[0]}</span>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {cat.name}
                </span>
                <button onClick={() => toggle(cat.id)}>
                  <IonIcon icon={closeCircle} className="text-sm text-slate-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Max warning */}
      {selectedIds.length >= MAX_CATEGORIES && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg px-3 py-2">
          <IonIcon icon={alertCircleOutline} className="text-amber-500 text-sm shrink-0" />
          <span className="text-[11px] text-amber-700 dark:text-amber-300">
            Maximum {MAX_CATEGORIES} categories reached. Remove one to select another.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <IonIcon
          icon={searchOutline}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
        />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        />
      </div>

      {/* Category list — fills remaining space */}
      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {grouped.map(([letter, cats]) => (
          <div key={letter}>
            <div className="sticky top-0 bg-slate-50 dark:bg-slate-700/50 px-3 py-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {letter}
              </span>
            </div>
            {cats.map((cat) => {
              const isSelected = selectedIds.includes(cat.id);
              const isDisabled = !isSelected && selectedIds.length >= MAX_CATEGORIES;
              return (
                <button
                  key={cat.id}
                  onClick={() => !isDisabled && toggle(cat.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-teal-50/50 dark:bg-teal-900/20"
                      : isDisabled
                      ? "opacity-40"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  }`}
                >
                  {/* Icon */}
                  {cat.icon && !brokenIcons.has(cat.id) && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={() => setBrokenIcons((s) => new Set(s).add(cat.id))}
                    />
                  ) : cat.icon && !brokenIcons.has(cat.id) ? (
                    <span className="text-xl leading-none">{cat.icon}</span>
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${getPlaceholderColor(cat.name)} flex items-center justify-center`}
                    >
                      <span className="text-xs font-bold text-white">{cat.name[0]}</span>
                    </div>
                  )}

                  {/* Name */}
                  <span className="flex-1 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
                    {cat.name}
                  </span>

                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-teal-500 text-white"
                        : "border-2 border-slate-300 dark:border-slate-500"
                    }`}
                  >
                    {isSelected && (
                      <IonIcon icon={checkmarkOutline} className="text-sm" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No categories found
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
};

export default ProviderCategoriesTab;
