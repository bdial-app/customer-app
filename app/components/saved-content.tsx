"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import {
  bookmarkOutline,
  bookmark,
  star,
  locationOutline,
  callOutline,
  searchOutline,
  checkmarkCircleOutline,
  gridOutline,
  listOutline,
  storefrontOutline,
  cubeOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { useSavedItems, useToggleSaved } from "@/hooks/useSavedItems";
import type { SavedItemData } from "@/services/saved-item.service";

// ─── Types ──────────────────────────────────────────────────────
type FilterTab = "all" | "providers" | "products";

function formatSavedAt(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
}

// ─── Main Component ─────────────────────────────────────────────
const SavedContent = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data: savedItems = [], isLoading } = useSavedItems();
  const toggleSaved = useToggleSaved();

  const items = useMemo(() => {
    return savedItems.filter((item: SavedItemData) => {
      if (filter === "providers" && item.itemType !== "provider") return false;
      if (filter === "products" && item.itemType !== "product") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.name?.toLowerCase().includes(q) && !item.category?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [savedItems, filter, search]);

  const handleUnsave = (item: SavedItemData) => {
    toggleSaved.mutate({ itemId: item.itemId, itemType: item.itemType });
  };

  const handleNavigate = (item: SavedItemData) => {
    if (item.itemType === "provider") {
      router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${item.itemId}`);
    } else {
      router.push(`${ROUTE_PATH.PRODUCT_DETAILS}?id=${item.itemId}`);
    }
  };

  const counts = useMemo(() => ({
    all: savedItems.length,
    providers: savedItems.filter((i: SavedItemData) => i.itemType === "provider").length,
    products: savedItems.filter((i: SavedItemData) => i.itemType === "product").length,
  }), [savedItems]);

  return (
    <div className="pb-4">
      {/* ── Summary Strip ── */}
      <div className="mx-4 mt-3 mb-4">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute left-1/3 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <IonIcon icon={bookmark} className="text-white text-base" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Your Collection</div>
                <div className="text-white/50 text-[10px]">Providers & products you&apos;ve saved</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="text-white font-bold text-lg">{counts.all}</div>
                <div className="text-white/60 text-[10px]">Total Saved</div>
              </div>
              <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="text-white font-bold text-lg">{counts.providers}</div>
                <div className="text-white/60 text-[10px]">Providers</div>
              </div>
              <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="text-white font-bold text-lg">{counts.products}</div>
                <div className="text-white/60 text-[10px]">Products</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + View Toggle ── */}
      <div className="px-4 mb-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2">
          <IonIcon icon={searchOutline} className="text-sm text-slate-400" />
          <input
            type="text"
            placeholder="Search saved items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
          >
            <IonIcon icon={listOutline} className={`text-sm ${viewMode === "list" ? "text-slate-800 dark:text-white" : "text-slate-400"}`} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm" : ""}`}
          >
            <IonIcon icon={gridOutline} className={`text-sm ${viewMode === "grid" ? "text-slate-800 dark:text-white" : "text-slate-400"}`} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {([
            { key: "all" as FilterTab, label: "All", count: counts.all },
            { key: "providers" as FilterTab, label: "Providers", count: counts.providers, icon: storefrontOutline },
            { key: "products" as FilterTab, label: "Products", count: counts.products, icon: cubeOutline },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === tab.key
                  ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.icon && <IonIcon icon={tab.icon} className="text-xs" />}
              {tab.label}
              <span className={`text-[9px] ml-0.5 ${filter === tab.key ? "text-white/60" : "text-slate-400"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="flex flex-col gap-2.5 px-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 animate-pulse">
              <div className="flex gap-3">
                <div className="w-[88px] h-[88px] rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-50 rounded-full w-1/2" />
                  <div className="h-2.5 bg-slate-50 rounded-full w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
      /* ── Saved Items ── */
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <IonIcon icon={bookmarkOutline} className="text-3xl text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No saved items</h3>
            <p className="text-[12px] text-slate-500 text-center max-w-[240px]">
              {search ? "No items match your search." : "Bookmark providers and products while exploring to find them here."}
            </p>
          </motion.div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-2.5 px-4">
            {items.map((item: SavedItemData, i: number) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-700"
              >
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div
                    className="relative w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer bg-slate-100"
                    onClick={() => handleNavigate(item)}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IonIcon icon={item.itemType === "provider" ? storefrontOutline : cubeOutline} className="text-2xl text-slate-300" />
                      </div>
                    )}
                    {item.verified && (
                      <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <IonIcon icon={checkmarkCircleOutline} className="text-[7px]" />
                        Verified
                      </div>
                    )}
                    {item.isOpen === false && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full">Closed</span>
                      </div>
                    )}
                    <div className={`absolute bottom-1.5 left-1.5 text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.itemType === "provider" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {item.itemType === "provider" ? "Provider" : "Product"}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">{item.name}</h3>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleUnsave(item)}
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center"
                      >
                        <IonIcon icon={bookmark} className="text-sm text-amber-500" />
                      </motion.button>
                    </div>
                    <p className="text-[10px] text-slate-500">{item.category}</p>

                    {item.itemType === "provider" && (
                      <>
                        {(item.rating ?? 0) > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <IonIcon icon={star} className="text-[10px] text-amber-500" />
                              <span className="text-[10px] font-bold text-amber-700">{item.rating}</span>
                            </div>
                            {(item.reviews ?? 0) > 0 && (
                              <span className="text-[9px] text-slate-400">({item.reviews})</span>
                            )}
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-0.5 mt-1 text-[10px] text-slate-500">
                            <IonIcon icon={locationOutline} className="text-[10px]" />
                            {item.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-2">
                          {item.contactNumber && (
                            <button
                              onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${item.contactNumber}`; }}
                              className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                            >
                              <IonIcon icon={callOutline} className="text-[10px]" />
                              Call
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {item.itemType === "product" && (
                      <>
                        {item.price != null && (
                          <div className="text-[13px] font-bold text-amber-600 mt-1">
                            {item.currency === "INR" ? "₹" : item.currency}{Number(item.price).toLocaleString()}
                          </div>
                        )}
                        {item.providerName && (
                          <p className="text-[10px] text-slate-400 mt-0.5">by {item.providerName}</p>
                        )}
                      </>
                    )}

                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Saved {formatSavedAt(item.savedAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 gap-2.5 px-4">
            {items.map((item: SavedItemData, i: number) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleNavigate(item)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="relative h-[120px]">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <IonIcon icon={item.itemType === "provider" ? storefrontOutline : cubeOutline} className="text-2xl text-slate-300" />
                    </div>
                  )}
                  {item.isOpen === false && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full">Closed</span>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); handleUnsave(item); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                  >
                    <IonIcon icon={bookmark} className="text-xs text-amber-400" />
                  </motion.button>
                  {item.verified && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">✓</div>
                  )}
                  <div className={`absolute bottom-2 left-2 text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.itemType === "provider" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                  }`}>
                    {item.itemType === "provider" ? "Provider" : "Product"}
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="text-[12px] font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.category}</p>
                  {item.itemType === "provider" && (item.rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <IonIcon icon={star} className="text-amber-400 text-[10px]" />
                      <span className="text-[10px] font-bold text-slate-800">{item.rating}</span>
                      {(item.reviews ?? 0) > 0 && (
                        <span className="text-[8px] text-slate-400">({item.reviews})</span>
                      )}
                    </div>
                  )}
                  {item.itemType === "product" && item.price != null && (
                    <div className="text-[11px] font-bold text-amber-600 mt-1">
                      {item.currency === "INR" ? "₹" : item.currency}{Number(item.price).toLocaleString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
      )}
    </div>
  );
};

export default SavedContent;
