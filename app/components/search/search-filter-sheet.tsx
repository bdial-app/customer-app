"use client";

import { useState, useCallback } from "react";
import { Sheet, Button } from "konsta/react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  checkmarkCircle,
  chevronDown,
  chevronForward,
  star,
  close,
  shieldCheckmarkOutline,
  ribbonOutline,
} from "ionicons/icons";
import { useAllCategories } from "@/hooks/useCategories";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  setCategoryIds,
  setMinRating,
  setMaxDistance,
  setVerifiedOnly,
  setWomenLedOnly,
  resetFilters,
} from "@/store/slices/searchSlice";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const RATING_OPTIONS = [
  { value: null, label: "Any", icon: null },
  { value: 3, label: "3+", icon: "⭐" },
  { value: 3.5, label: "3.5+", icon: "⭐" },
  { value: 4, label: "4+", icon: "⭐" },
  { value: 4.5, label: "4.5+", icon: "⭐" },
];

const DISTANCE_OPTIONS = [
  { value: null, label: "Any" },
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
];

const SearchFilterSheet = ({ opened, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((s) => s.search);
  const { data: catResponse } = useAllCategories(1, 100);
  const allCategories = catResponse?.data?.filter((c: any) => c.parentId === null) ?? [];

  const [tempCats, setTempCats] = useState<Set<string>>(
    new Set(filters.categoryIds)
  );
  const [tempRating, setTempRating] = useState<number | null>(
    filters.minRating
  );
  const [tempDistance, setTempDistance] = useState<number | null>(
    filters.maxDistance
  );
  const [tempVerified, setTempVerified] = useState(filters.verifiedOnly);
  const [tempWomenLed, setTempWomenLed] = useState(filters.womenLedOnly);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const handleOpen = useCallback(() => {
    setTempCats(new Set(filters.categoryIds));
    setTempRating(filters.minRating);
    setTempDistance(filters.maxDistance);
    setTempVerified(filters.verifiedOnly);
    setTempWomenLed(filters.womenLedOnly);
  }, [filters]);

  const toggleCat = (id: string) => {
    setTempCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleApply = () => {
    dispatch(setCategoryIds(Array.from(tempCats)));
    dispatch(setMinRating(tempRating));
    dispatch(setMaxDistance(tempDistance));
    dispatch(setVerifiedOnly(tempVerified));
    dispatch(setWomenLedOnly(tempWomenLed));
    onClose();
  };

  const handleReset = () => {
    setTempCats(new Set());
    setTempRating(null);
    setTempDistance(null);
    setTempVerified(false);
    setTempWomenLed(false);
  };

  const tempFilterCount =
    tempCats.size +
    (tempRating ? 1 : 0) +
    (tempDistance ? 1 : 0) +
    (tempVerified ? 1 : 0) +
    (tempWomenLed ? 1 : 0);

  return (
    <Sheet
      className="pb-safe"
      opened={opened}
      onBackdropClick={onClose}
      style={{ maxHeight: "85vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
          >
            <IonIcon icon={close} className="w-4 h-4 text-gray-600" />
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">Filters</h2>
        </div>
        {tempFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="text-[13px] font-bold text-amber-500 active:opacity-60 px-2 py-1 rounded-lg active:bg-amber-50 transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      <div
        className="overflow-auto px-4 pt-4 pb-4"
        style={{ maxHeight: "calc(85vh - 140px)" }}
      >
        {/* ── Rating ─────────────────────────── */}
        <section className="mb-6">
          <h3 className="text-[13px] font-bold text-gray-800 mb-3">
            Minimum Rating
          </h3>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((opt) => {
              const isActive = tempRating === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => setTempRating(opt.value)}
                  className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all active:scale-95 ${
                    isActive
                      ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm shadow-amber-100"
                      : "bg-white border-gray-200 text-gray-600 active:bg-gray-50"
                  }`}
                >
                  {opt.value && (
                    <IonIcon icon={star} className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Distance ───────────────────────── */}
        <section className="mb-6">
          <h3 className="text-[13px] font-bold text-gray-800 mb-3">
            Maximum Distance
          </h3>
          <div className="flex flex-wrap gap-2">
            {DISTANCE_OPTIONS.map((opt) => {
              const isActive = tempDistance === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => setTempDistance(opt.value)}
                  className={`h-10 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all active:scale-95 ${
                    isActive
                      ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm shadow-blue-100"
                      : "bg-white border-gray-200 text-gray-600 active:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Toggles ────────────────────────── */}
        <section className="mb-6 space-y-2">
          <h3 className="text-[13px] font-bold text-gray-800 mb-2">
            Business Type
          </h3>
          <label className="flex items-center gap-3 py-3 px-3 rounded-xl bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={shieldCheckmarkOutline} className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[14px] font-semibold text-gray-700 flex-1">
              Verified Only
            </span>
            <div
              onClick={() => setTempVerified(!tempVerified)}
              className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${
                tempVerified ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  tempVerified ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </label>
          <label className="flex items-center gap-3 py-3 px-3 rounded-xl bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={ribbonOutline} className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-[14px] font-semibold text-gray-700 flex-1">
              Women-Led Only
            </span>
            <div
              onClick={() => setTempWomenLed(!tempWomenLed)}
              className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${
                tempWomenLed ? "bg-purple-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                  tempWomenLed ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </section>

        {/* ── Categories ─────────────────────── */}
        {allCategories.length > 0 && (
          <section className="mb-2">
            <h3 className="text-[13px] font-bold text-gray-800 mb-3">
              Categories
            </h3>
            <div className="space-y-0.5">
              {allCategories.map((cat: any) => {
                const isExpanded = expandedCats.has(cat.id);
                const children = cat.children ?? [];
                const selectedCount = children.filter((c: any) =>
                  tempCats.has(c.id)
                ).length;

                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => {
                        if (children.length) {
                          setExpandedCats((prev) => {
                            const next = new Set(prev);
                            next.has(cat.id)
                              ? next.delete(cat.id)
                              : next.add(cat.id);
                            return next;
                          });
                        } else {
                          toggleCat(cat.id);
                        }
                      }}
                      className="w-full flex items-center gap-3 py-3 px-3 rounded-xl active:bg-gray-50 transition-colors"
                    >
                      <span className="text-[14px] font-semibold text-gray-700 flex-1 text-left">
                        {cat.name}
                      </span>
                      {selectedCount > 0 && children.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                          {selectedCount}
                        </span>
                      )}
                      {children.length > 0 ? (
                        <IonIcon
                          icon={isExpanded ? chevronDown : chevronForward}
                          className="w-4 h-4 text-gray-400"
                        />
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            tempCats.has(cat.id)
                              ? "bg-amber-500 border-amber-500"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {tempCats.has(cat.id) && (
                            <IonIcon icon={checkmarkCircle} className="w-4 h-4 text-white" />
                          )}
                        </div>
                      )}
                    </button>

                    {children.length > 0 && isExpanded && (
                      <div className="ml-5 mb-2 space-y-0.5 border-l-2 border-gray-100 pl-3">
                        {children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => toggleCat(child.id)}
                            className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg active:bg-gray-50 transition-colors"
                          >
                            <span className="text-[13px] text-gray-600 flex-1 text-left font-medium">
                              {child.name}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                tempCats.has(child.id)
                                  ? "bg-amber-500 border-amber-500"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {tempCats.has(child.id) && (
                                <IonIcon icon={checkmarkCircle} className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Apply button */}
      <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white">
        <button
          onClick={handleApply}
          className="w-full h-12 rounded-2xl bg-amber-500 text-white text-[15px] font-bold active:bg-amber-600 transition-colors shadow-sm shadow-amber-200"
        >
          {tempFilterCount > 0
            ? `Apply Filters (${tempFilterCount})`
            : "Show All Results"}
        </button>
      </div>
    </Sheet>
  );
};

export default SearchFilterSheet;
