"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  checkmarkCircle,
  closeOutline,
  searchOutline,
  alertCircleOutline,
  checkmarkOutline,
  addOutline,
  gridOutline,
  arrowUndoOutline,
  informationCircleOutline,
  swapHorizontalOutline,
} from "ionicons/icons";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { updateProviderCategories } from "@/services/provider.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@/services/category.service";
import CategoryIcon from "@/app/components/ui/category-icon";
import {
  Card,
  EmptyState,
  GroupLabel,
  ManagePage,
  ManageSheet,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StickyActionBar,
  inputCls,
} from "./manage/kit";

interface Props {
  providerId: string | null;
  currentCategories: { id: string; name: string; slug: string }[];
}

const MAX_CATEGORIES = 2;

const ProviderCategoriesTab = ({ providerId, currentCategories }: Props) => {
  const { data: allCategories = [], isLoading } = useTopLevelCategories();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => currentCategories.map((c) => c.id));
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Re-sync when the saved categories change. Compared by ids, not array
  // identity: a parent passing a fresh array each render would otherwise wipe
  // the user's in-progress selection (and, done during render, loop forever).
  const currentKey = currentCategories.map((c) => c.id).join(",");
  const [syncedKey, setSyncedKey] = useState(currentKey);
  if (currentKey !== syncedKey) {
    setSyncedKey(currentKey);
    setSelectedIds(currentCategories.map((c) => c.id));
  }

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

  // In the order the owner picked them; falls back to the saved name when a
  // category isn't in the top-level list.
  const selectedCats = selectedIds
    .map((id) => allCategories.find((c) => c.id === id) ?? currentCategories.find((c) => c.id === id))
    .filter(Boolean) as (Pick<Category, "id" | "name"> & Partial<Category>)[];

  const isFull = selectedIds.length >= MAX_CATEGORIES;
  const slotsLeft = MAX_CATEGORIES - selectedIds.length;
  const openPicker = () => setPickerOpen(true);
  const save = (after?: () => void) => mutation.mutate(undefined, { onSuccess: () => after?.() });
  const undo = () => setSelectedIds(currentCategories.map((c) => c.id));

  const renderRow = (cat: Category) => {
    const isSelected = selectedIds.includes(cat.id);
    const isDisabled = !isSelected && isFull;
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => !isDisabled && toggle(cat.id)}
        disabled={isDisabled}
        aria-pressed={isSelected}
        className={`w-full min-h-[56px] flex items-center gap-3 px-3 py-2 rounded-2xl text-left transition-colors ${
          isSelected
            ? "bg-indigo-50 dark:bg-indigo-950/50 ring-2 ring-indigo-500"
            : isDisabled
            ? "opacity-40 ring-1 ring-slate-100 dark:ring-slate-800"
            : "ring-1 ring-slate-200/80 dark:ring-slate-800 active:bg-slate-50 dark:active:bg-slate-800/60"
        }`}
      >
        <CategoryIcon icon={cat.icon} iconColor={cat.iconColor} imageUrl={cat.imageUrl} name={cat.name} size="xs" />
        <span className={`flex-1 text-[14px] leading-snug ${isSelected ? "font-bold text-indigo-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-200"}`}>
          {cat.name}
        </span>
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isSelected ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "border-2 border-slate-300 dark:border-slate-600"
          }`}
        >
          {isSelected && <IonIcon icon={checkmarkOutline} className="text-[14px]" />}
        </span>
      </button>
    );
  };

  if (isLoading) {
    return (
      <ManagePage>
        <div className="h-5 w-32 rounded-lg bg-slate-200/80 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-64 rounded-lg bg-slate-200/60 dark:bg-slate-800/70 animate-pulse -mt-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 animate-pulse" />
        ))}
      </ManagePage>
    );
  }

  return (
    <ManagePage>
      <SectionHeader
        title="Categories"
        subtitle="Categories decide where customers find you when they browse or search the app."
      />

      {/* Save feedback */}
      <AnimatePresence initial={false}>
        {mutation.isSuccess && !hasChanges && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/50 px-4 py-3">
              <IonIcon icon={checkmarkCircle} className="text-[18px] text-emerald-500 shrink-0" />
              <p className="text-[13px] font-medium text-emerald-800 dark:text-emerald-200">Saved. Customers will find you in these categories.</p>
            </div>
          </motion.div>
        )}
        {mutation.isError && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div role="alert" className="flex items-center gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 px-4 py-3">
              <IonIcon icon={alertCircleOutline} className="text-[18px] text-rose-500 shrink-0" />
              <p className="text-[13px] font-medium text-rose-700 dark:text-rose-200">Couldn&apos;t save your categories. Please try again.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCats.length === 0 ? (
        <EmptyState
          icon={gridOutline}
          title="Choose your categories"
          body={`Without a category, customers browsing the app can't find you. Pick up to ${MAX_CATEGORIES} that match your business.`}
          action={
            <PrimaryButton icon={addOutline} onClick={openPicker}>
              Choose categories
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <GroupLabel
            action={
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="-my-3 py-3 px-1 text-[12px] font-bold text-indigo-600 dark:text-indigo-300"
              >
                Clear all
              </button>
            }
          >
            Your categories · {selectedIds.length}/{MAX_CATEGORIES}
          </GroupLabel>

          <Card padded={false}>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence initial={false}>
                {selectedCats.map((cat) => (
                  <motion.li
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="flex items-center gap-3 pl-4 pr-2 py-3"
                  >
                    <CategoryIcon icon={cat.icon} iconColor={cat.iconColor} imageUrl={cat.imageUrl} name={cat.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-bold text-slate-900 dark:text-white leading-snug">{cat.name}</p>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Customers can find you here</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(cat.id)}
                      aria-label={`Remove ${cat.name}`}
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 active:bg-slate-100 dark:active:bg-slate-800"
                    >
                      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <IonIcon icon={closeOutline} className="text-[18px] text-slate-500 dark:text-slate-400" />
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {!isFull && (
              <button
                type="button"
                onClick={openPicker}
                className="w-full flex items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-left active:bg-slate-50 dark:active:bg-slate-800/50 rounded-b-2xl"
              >
                <span className="w-10 h-10 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                  <IonIcon icon={addOutline} className="text-[20px] text-indigo-600 dark:text-indigo-300" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-bold text-indigo-600 dark:text-indigo-300">Add another category</span>
                  <span className="block text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    You can add {slotsLeft} more
                  </span>
                </span>
              </button>
            )}
          </Card>

          {isFull && (
            <div className="flex flex-col gap-3">
              <p className="flex items-start gap-2 px-1 text-[12.5px] leading-snug text-slate-500 dark:text-slate-400">
                <IonIcon icon={informationCircleOutline} className="text-[16px] shrink-0 mt-px" />
                You&apos;re using all {MAX_CATEGORIES} spots. To switch, untick one and pick another.
              </p>
              {!hasChanges && (
                <SecondaryButton full icon={swapHorizontalOutline} onClick={openPicker}>
                  Change categories
                </SecondaryButton>
              )}
            </div>
          )}
        </>
      )}

      {hasChanges && providerId && (
        <StickyActionBar>
          <div className="flex gap-2">
            <SecondaryButton icon={arrowUndoOutline} onClick={undo} disabled={mutation.isPending}>
              Undo
            </SecondaryButton>
            <PrimaryButton full icon={checkmarkOutline} onClick={() => save()} loading={mutation.isPending} className="flex-1">
              Save changes
            </PrimaryButton>
          </div>
        </StickyActionBar>
      )}

      {/* Picker */}
      <ManageSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose categories"
        subtitle={`Pick up to ${MAX_CATEGORIES} · ${selectedIds.length} selected`}
        footer={
          hasChanges && providerId ? (
            <PrimaryButton full icon={checkmarkOutline} loading={mutation.isPending} onClick={() => save(() => setPickerOpen(false))}>
              Save changes
            </PrimaryButton>
          ) : (
            <SecondaryButton full onClick={() => setPickerOpen(false)}>
              Done
            </SecondaryButton>
          )
        }
      >
        {/* Search stays at the top while the list scrolls */}
        <div className="sticky -top-4 z-10 -mx-5 -mt-4 px-5 pt-4 pb-3 bg-white dark:bg-slate-900">
          <div className="relative">
            <IonIcon icon={searchOutline} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[17px] text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search, e.g. salon, plumber…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          {isFull && (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/50 px-3 py-2.5">
              <IonIcon icon={alertCircleOutline} className="text-[16px] text-amber-500 shrink-0 mt-px" />
              <span className="text-[12.5px] leading-snug text-amber-800 dark:text-amber-200">
                Maximum {MAX_CATEGORIES} categories reached. Remove one to select another.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {!search.trim() && selectedIds.length > 0 && (
            <div>
              <p className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-300">Selected</p>
              <div className="flex flex-col gap-1.5">{allCategories.filter((c) => selectedIds.includes(c.id)).map(renderRow)}</div>
            </div>
          )}
          {grouped.map(([letter, cats]) => (
            <div key={letter}>
              <p className="px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{letter}</p>
              <div className="flex flex-col gap-1.5">
                {cats.map(renderRow)}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="py-10 text-center">
              <IonIcon icon={searchOutline} className="text-[28px] text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-[14px] font-bold text-slate-700 dark:text-slate-200">No categories found</p>
              <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">Try a shorter or different word.</p>
            </div>
          )}
        </div>
      </ManageSheet>
    </ManagePage>
  );
};

export default ProviderCategoriesTab;
