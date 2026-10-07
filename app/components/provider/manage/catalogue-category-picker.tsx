"use client";
/**
 * Category picker for a catalogue item: search across parent and
 * sub-categories, or browse the parent → child tree. Same data and selection
 * contract as before; only the look changed.
 */
import { useMemo, useRef, useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  checkmarkCircle,
  chevronDownOutline,
  chevronForwardOutline,
  closeCircle,
  layersOutline,
  searchOutline,
} from "ionicons/icons";
import { useTopLevelCategories, useCategorySearch, useSubCategories } from "@/hooks/useCategories";
import type { Category, CategorySearchResult } from "@/services/category.service";
import { inputCls } from "./kit";

export function UnifiedCategoryPicker({
  categoryId,
  subcategoryId,
  selectedCategoryName,
  selectedSubcategoryName,
  selectedParentName,
  onSelect,
}: {
  categoryId: string;
  subcategoryId: string;
  selectedCategoryName?: string;
  selectedSubcategoryName?: string;
  selectedParentName?: string;
  onSelect: (catId: string, subId: string, catName?: string, subName?: string, parentName?: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedParent, setExpandedParent] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: topCategories } = useTopLevelCategories();
  const { data: searchResults, isFetching: isSearching } = useCategorySearch(search);
  const { data: subCategories } = useSubCategories(expandedParent);

  const parents = useMemo(() => topCategories || [], [topCategories]);
  const subs = useMemo(() => (subCategories || []) as Category[], [subCategories]);
  const results = useMemo(() => searchResults || [], [searchResults]);

  const hasSearch = search.trim().length >= 2;
  const hasSelection = !!categoryId;

  // An existing item only carries ids: look the names up (cached lists) so the
  // owner sees "Bridal wear", not "Sub-category selected".
  const needSubName = !!subcategoryId && !selectedSubcategoryName;
  const { data: savedSubs } = useSubCategories(needSubName ? categoryId : null);
  const savedParentName = parents.find((c: Category) => c.id === categoryId)?.name;
  const savedSubName = ((savedSubs || []) as Category[]).find((c) => c.id === subcategoryId)?.name;

  const displayName = subcategoryId
    ? selectedSubcategoryName || savedSubName || "Sub-category selected"
    : selectedCategoryName || savedParentName || "Category selected";
  const displayParent = subcategoryId ? selectedParentName || selectedCategoryName || savedParentName || "" : "";

  const handleSelect = (catId: string, subId: string, catName?: string, subName?: string, parentName?: string) => {
    onSelect(catId, subId, catName, subName, parentName);
    setIsOpen(false);
    setSearch("");
    setExpandedParent(null);
  };

  const handleClear = () => {
    onSelect("", "", "", "", "");
    setSearch("");
  };

  if (!isOpen) {
    return hasSelection ? (
      <div className="flex items-center gap-3 min-h-12 pl-3.5 pr-1.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 ring-1 ring-indigo-200 dark:ring-indigo-800/70">
        <IonIcon icon={layersOutline} className="text-indigo-500 dark:text-indigo-300 text-[18px] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-indigo-800 dark:text-indigo-200 truncate">{displayName}</p>
          {displayParent && <p className="text-[11.5px] text-indigo-500/80 dark:text-indigo-300/70 truncate">in {displayParent}</p>}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 h-9 px-3 rounded-lg text-[12.5px] font-bold text-indigo-700 dark:text-indigo-200 bg-white/80 dark:bg-indigo-900/60"
        >
          Change
        </button>
        <button type="button" onClick={handleClear} aria-label="Remove category" className="shrink-0 w-9 h-9 flex items-center justify-center">
          <IonIcon icon={closeCircle} className="text-indigo-300 dark:text-indigo-500 text-[20px]" />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 150);
        }}
        className={`${inputCls} flex items-center gap-2.5 text-left`}
      >
        <IonIcon icon={searchOutline} className="text-slate-400 dark:text-slate-500 text-[17px]" />
        <span className="text-slate-400 dark:text-slate-500">Search or pick a category</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <IonIcon icon={searchOutline} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[17px] pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Try "rida", "stitching", "salon"…'
          className={`${inputCls} !pl-10 !pr-10 !ring-indigo-300 dark:!ring-indigo-700`}
          autoFocus
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center">
            <IonIcon icon={closeCircle} className="text-slate-300 dark:text-slate-600 text-[18px]" />
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto overscroll-contain rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-800/60 divide-y divide-slate-100 dark:divide-slate-700/70">
        {hasSearch ? (
          isSearching ? (
            <div className="flex items-center justify-center py-7">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-7 text-center text-[13px] text-slate-400">No categories match &ldquo;{search}&rdquo;</p>
          ) : (
            results.map((r: CategorySearchResult) => {
              const isActive = r.id === (subcategoryId || categoryId);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    handleSelect(
                      r.parentId || r.id,
                      r.parentId ? r.id : "",
                      r.parentId ? r.parentName || "" : r.name,
                      r.parentId ? r.name : "",
                      r.parentName || "",
                    )
                  }
                  className={`w-full flex items-center gap-3 px-3.5 min-h-12 py-2 text-left ${isActive ? "bg-indigo-50 dark:bg-indigo-950/50" : "active:bg-slate-50 dark:active:bg-slate-700/50"}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13.5px] truncate ${isActive ? "font-bold text-indigo-700 dark:text-indigo-300" : "font-medium text-slate-700 dark:text-slate-200"}`}>{r.name}</p>
                    {r.parentName && <p className="text-[11.5px] text-slate-400 dark:text-slate-500 truncate">in {r.parentName}</p>}
                  </div>
                  {isActive && <IonIcon icon={checkmarkCircle} className="text-indigo-500 text-[18px] shrink-0" />}
                </button>
              );
            })
          )
        ) : parents.length === 0 ? (
          <p className="py-7 text-center text-[13px] text-slate-400 animate-pulse">Loading categories…</p>
        ) : (
          parents.map((cat: Category) => {
            const isExpanded = expandedParent === cat.id;
            const isParentActive = categoryId === cat.id && !subcategoryId;
            return (
              <div key={cat.id}>
                <div className={`flex items-center ${isParentActive ? "bg-indigo-50 dark:bg-indigo-950/50" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setExpandedParent(isExpanded ? null : cat.id)}
                    aria-expanded={isExpanded}
                    className="flex-1 min-w-0 flex items-center gap-2.5 pl-3.5 pr-2 min-h-12 text-left"
                  >
                    <IonIcon icon={isExpanded ? chevronDownOutline : chevronForwardOutline} className="text-slate-400 text-[14px] shrink-0" />
                    <span className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">{cat.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelect(cat.id, "", cat.name, "", "")}
                    className="shrink-0 mr-2 h-9 px-3 rounded-lg text-[12px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 active:bg-indigo-100"
                  >
                    {isParentActive ? "Selected" : "Select"}
                  </button>
                </div>
                {isExpanded && (
                  <div className="bg-slate-50 dark:bg-slate-900/40">
                    {subs.length === 0 ? (
                      <div className="flex items-center gap-2 pl-10 py-3">
                        <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[12px] text-slate-400">Loading…</span>
                      </div>
                    ) : (
                      subs.map((sub: Category) => {
                        const isSubActive = sub.id === subcategoryId;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSelect(cat.id, sub.id, cat.name, sub.name, cat.name)}
                            className={`w-full flex items-center gap-2.5 pl-10 pr-3.5 min-h-11 text-left ${isSubActive ? "bg-indigo-50 dark:bg-indigo-950/50" : "active:bg-white dark:active:bg-slate-700/50"}`}
                          >
                            <span className={`text-[13px] flex-1 truncate ${isSubActive ? "font-bold text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-300"}`}>{sub.name}</span>
                            {isSubActive && <IonIcon icon={checkmarkCircle} className="text-indigo-500 text-[16px] shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setSearch("");
          setExpandedParent(null);
        }}
        className="self-start h-9 px-1 text-[12.5px] font-bold text-slate-500 dark:text-slate-400"
      >
        {hasSelection ? "Keep current category" : "Skip for now"}
      </button>
    </div>
  );
}
