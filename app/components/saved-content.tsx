"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  bookmarkOutline,
  bookmark,
  star,
  starOutline,
  locationOutline,
  callOutline,
  chatbubbleOutline,
  chevronForwardOutline,
  searchOutline,
  trashOutline,
  shareSocialOutline,
  timeOutline,
  checkmarkCircleOutline,
  heartOutline,
  heart,
  gridOutline,
  listOutline,
  storefrontOutline,
  ribbonOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

// ─── Types ──────────────────────────────────────────────────────
type FilterTab = "all" | "providers" | "listings";

interface SavedItem {
  id: string;
  type: "provider" | "listing";
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  distance: string;
  location: string;
  savedAt: string;
  verified: boolean;
  price?: string;
  isOpen: boolean;
}

// ─── Mock Data ──────────────────────────────────────────────────
const SAVED_ITEMS: SavedItem[] = [
  {
    id: "1", type: "provider", name: "Ahmed's Tailoring",
    category: "Tailoring & Stitching", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    rating: 4.8, reviews: 127, distance: "0.8 km", location: "Bhendi Bazaar",
    savedAt: "2 days ago", verified: true, price: "₹500+", isOpen: true,
  },
  {
    id: "2", type: "listing", name: "Bridal Mehendi Package",
    category: "Mehendi & Henna Art", image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400",
    rating: 4.9, reviews: 89, distance: "1.2 km", location: "Mohammed Ali Road",
    savedAt: "5 days ago", verified: true, price: "₹2,500", isOpen: true,
  },
  {
    id: "3", type: "provider", name: "Glow Beauty Studio",
    category: "Salon & Makeup", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    rating: 4.7, reviews: 245, distance: "1.5 km", location: "Nagpada",
    savedAt: "1 week ago", verified: true, price: "₹300+", isOpen: false,
  },
  {
    id: "4", type: "listing", name: "Full AC Service",
    category: "AC Repair & Service", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400",
    rating: 4.6, reviews: 56, distance: "2.0 km", location: "Dongri",
    savedAt: "1 week ago", verified: false, price: "₹199", isOpen: true,
  },
  {
    id: "5", type: "provider", name: "Royal Catering Services",
    category: "Event Catering", image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400",
    rating: 4.7, reviews: 156, distance: "3.2 km", location: "Mazgaon",
    savedAt: "2 weeks ago", verified: true, price: "₹1,000+", isOpen: true,
  },
  {
    id: "6", type: "listing", name: "Wedding Photography",
    category: "Photography", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400",
    rating: 4.5, reviews: 34, distance: "4.0 km", location: "Byculla",
    savedAt: "3 weeks ago", verified: true, price: "₹15,000", isOpen: true,
  },
];

// ─── Star Row ───────────────────────────────────────────────────
const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-px">
    {[1, 2, 3, 4, 5].map((s) => (
      <IonIcon
        key={s}
        icon={s <= Math.round(rating) ? star : starOutline}
        className={`text-[10px] ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-200"}`}
      />
    ))}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────
const SavedContent = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const items = SAVED_ITEMS.filter((item) => {
    if (removedIds.has(item.id)) return false;
    if (filter === "providers" && item.type !== "provider") return false;
    if (filter === "listings" && item.type !== "listing") return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleRemove = useCallback((id: string) => {
    setRemovedIds((prev) => new Set(prev).add(id));
  }, []);

  const counts = {
    all: SAVED_ITEMS.length - removedIds.size,
    providers: SAVED_ITEMS.filter((i) => i.type === "provider" && !removedIds.has(i.id)).length,
    listings: SAVED_ITEMS.filter((i) => i.type === "listing" && !removedIds.has(i.id)).length,
  };

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
                <div className="text-white/50 text-[10px]">Services & providers you've saved</div>
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
                <div className="text-white font-bold text-lg">{counts.listings}</div>
                <div className="text-white/60 text-[10px]">Listings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + View Toggle ── */}
      <div className="px-4 mb-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
          <IonIcon icon={searchOutline} className="text-sm text-slate-400" />
          <input
            type="text"
            placeholder="Search saved items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
          >
            <IonIcon icon={listOutline} className={`text-sm ${viewMode === "list" ? "text-slate-800" : "text-slate-400"}`} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
          >
            <IonIcon icon={gridOutline} className={`text-sm ${viewMode === "grid" ? "text-slate-800" : "text-slate-400"}`} />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          {([
            { key: "all" as FilterTab, label: "All", count: counts.all },
            { key: "providers" as FilterTab, label: "Providers", count: counts.providers, icon: storefrontOutline },
            { key: "listings" as FilterTab, label: "Listings", count: counts.listings, icon: ribbonOutline },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === tab.key
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-500"
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

      {/* ── Saved Items ── */}
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
            <h3 className="text-base font-bold text-slate-800 mb-1">No saved items</h3>
            <p className="text-[12px] text-slate-500 text-center max-w-[240px]">
              {search ? "No items match your search." : "Bookmark providers and listings while exploring to find them here."}
            </p>
          </motion.div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-2.5 px-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 active:bg-slate-50"
              >
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div
                    className="relative w-[88px] h-[88px] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${item.id}`)}
                  >
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    {item.verified && (
                      <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <IonIcon icon={checkmarkCircleOutline} className="text-[7px]" />
                        Verified
                      </div>
                    )}
                    {!item.isOpen && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full">Closed</span>
                      </div>
                    )}
                    {/* Type badge */}
                    <div className={`absolute bottom-1.5 left-1.5 text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.type === "provider" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {item.type === "provider" ? "Provider" : "Listing"}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-1">{item.name}</h3>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleRemove(item.id)}
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center"
                      >
                        <IonIcon icon={bookmark} className="text-sm text-amber-500" />
                      </motion.button>
                    </div>
                    <p className="text-[10px] text-slate-500">{item.category}</p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Stars rating={item.rating} />
                      <span className="text-[10px] font-semibold text-slate-700">{item.rating}</span>
                      <span className="text-[9px] text-slate-400">({item.reviews})</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                        <IonIcon icon={locationOutline} className="text-[10px]" />
                        {item.distance}
                      </span>
                      {item.price && (
                        <span className="text-[10px] font-bold text-slate-800">{item.price}</span>
                      )}
                      <span className="text-[9px] text-slate-400 ml-auto">
                        <IonIcon icon={timeOutline} className="text-[9px] mr-0.5" />
                        {item.savedAt}
                      </span>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                      >
                        <IonIcon icon={callOutline} className="text-[10px]" />
                        Call
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                      >
                        <IonIcon icon={chatbubbleOutline} className="text-[10px]" />
                        Chat
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                      >
                        <IonIcon icon={shareSocialOutline} className="text-[10px]" />
                        Share
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 gap-2.5 px-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${item.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="relative h-[120px]">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  {!item.isOpen && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded-full">Closed</span>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                  >
                    <IonIcon icon={bookmark} className="text-xs text-amber-400" />
                  </motion.button>
                  {item.verified && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">✓</div>
                  )}
                  <div className={`absolute bottom-2 left-2 text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.type === "provider" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                  }`}>
                    {item.type === "provider" ? "Provider" : "Listing"}
                  </div>
                </div>
                <div className="p-2.5">
                  <h3 className="text-[12px] font-bold text-slate-800 line-clamp-1">{item.name}</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5">{item.category}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1">
                      <IonIcon icon={star} className="text-amber-400 text-[10px]" />
                      <span className="text-[10px] font-bold text-slate-800">{item.rating}</span>
                      <span className="text-[8px] text-slate-400">({item.reviews})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{item.distance}</span>
                  </div>
                  {item.price && (
                    <div className="text-[11px] font-bold text-amber-600 mt-1">{item.price}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedContent;
