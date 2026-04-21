"use client";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  searchOutline,
  locationOutline,
  starOutline,
  star,
  heartOutline,
  heart,
  filterOutline,
  flashOutline,
  trendingUpOutline,
  timeOutline,
  ribbonOutline,
  sparklesOutline,
} from "ionicons/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

/* ── Mock Data ── */

interface Deal {
  id: number;
  title: string;
  provider: string;
  discount: string;
  gradient: string;
  tag: string;
  expiresIn: string;
}

const FLASH_DEALS: Deal[] = [
  {
    id: 1,
    title: "Suit Stitching",
    provider: "Ahmed's Tailoring",
    discount: "30% OFF",
    gradient: "from-violet-500 to-purple-700",
    tag: "FLASH",
    expiresIn: "2h left",
  },
  {
    id: 2,
    title: "Full AC Service",
    provider: "QuickFix AC",
    discount: "₹199 only",
    gradient: "from-sky-500 to-blue-700",
    tag: "HOT",
    expiresIn: "5h left",
  },
  {
    id: 3,
    title: "Bridal Makeup",
    provider: "Glow Studio",
    discount: "40% OFF",
    gradient: "from-pink-500 to-rose-700",
    tag: "TRENDING",
    expiresIn: "1d left",
  },
];

interface NearbyProvider {
  id: number;
  name: string;
  service: string;
  distance: string;
  rating: number;
  reviews: number;
  image: string;
  verified: boolean;
  price: string;
  saved: boolean;
  tags: string[];
}

const NEARBY: NearbyProvider[] = [
  {
    id: 1,
    name: "Ahmed's Tailoring",
    service: "Tailoring & Stitching",
    distance: "0.8 km",
    rating: 4.8,
    reviews: 127,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
    verified: true,
    price: "₹500+",
    saved: false,
    tags: ["Fast Delivery", "Top Rated"],
  },
  {
    id: 2,
    name: "Glow Studio",
    service: "Salon & Makeup",
    distance: "1.2 km",
    rating: 4.9,
    reviews: 245,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400",
    verified: true,
    price: "₹300+",
    saved: true,
    tags: ["Women-Led", "Premium"],
  },
  {
    id: 3,
    name: "QuickFix AC",
    service: "AC Repair & Service",
    distance: "1.5 km",
    rating: 4.6,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400",
    verified: true,
    price: "₹199+",
    saved: false,
    tags: ["Same Day", "Affordable"],
  },
  {
    id: 4,
    name: "Mehandi Arts",
    service: "Mehandi Artist",
    distance: "2.0 km",
    rating: 4.8,
    reviews: 67,
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400",
    verified: true,
    price: "₹200+",
    saved: false,
    tags: ["Bridal Special"],
  },
  {
    id: 5,
    name: "Royal Catering",
    service: "Event Catering",
    distance: "3.2 km",
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400",
    verified: false,
    price: "₹1000+",
    saved: true,
    tags: ["Bulk Orders"],
  },
];

const COLLECTIONS = [
  {
    id: 1,
    title: "Wedding Season Picks",
    count: 24,
    gradient: "from-amber-400 to-orange-600",
    icon: ribbonOutline,
  },
  {
    id: 2,
    title: "Under ₹500",
    count: 45,
    gradient: "from-emerald-400 to-teal-600",
    icon: flashOutline,
  },
  {
    id: 3,
    title: "New Arrivals",
    count: 12,
    gradient: "from-blue-400 to-indigo-600",
    icon: sparklesOutline,
  },
  {
    id: 4,
    title: "Most Booked",
    count: 30,
    gradient: "from-pink-400 to-rose-600",
    icon: trendingUpOutline,
  },
];

type SortKey = "nearest" | "top_rated" | "newest";

/* ── Component ── */

const ExploreContent = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [savedIds, setSavedIds] = useState<Set<number>>(
    new Set(NEARBY.filter((p) => p.saved).map((p) => p.id))
  );

  const toggleSave = (id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
    { key: "nearest", label: "Nearest", icon: locationOutline },
    { key: "top_rated", label: "Top Rated", icon: starOutline },
    { key: "newest", label: "Newest", icon: timeOutline },
  ];

  const filteredProviders = NEARBY.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.service.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col pb-4">
      {/* Search */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2.5 bg-slate-100 rounded-xl px-3.5 py-2.5">
          <IonIcon icon={searchOutline} className="text-base text-slate-400" />
          <input
            type="text"
            placeholder="Search providers, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="w-7 h-7 rounded-lg bg-slate-200/80 flex items-center justify-center"
          >
            <IonIcon icon={filterOutline} className="text-sm text-slate-600" />
          </motion.button>
        </div>
      </div>

      {/* ── Flash Deals ── */}
      <div className="mt-3">
        <div className="flex items-center gap-2 px-4 mb-2.5">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <IonIcon icon={flashOutline} className="text-base text-amber-500" />
          </motion.div>
          <h2 className="text-[15px] font-bold text-slate-800">Flash Deals</h2>
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
            Limited Time
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
          {FLASH_DEALS.map((deal, i) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.96 }}
              className={`shrink-0 w-[200px] rounded-2xl bg-gradient-to-br ${deal.gradient} p-3.5 cursor-pointer relative overflow-hidden`}
            >
              {/* Decorative */}
              <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/[0.08]" />
              <div className="absolute right-4 -bottom-4 w-14 h-14 rounded-full bg-white/[0.05]" />

              <div className="relative z-10">
                <span className="text-[9px] font-bold tracking-wider text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
                  {deal.tag}
                </span>
                <h3 className="text-base font-extrabold text-white mt-2 leading-tight">
                  {deal.discount}
                </h3>
                <p className="text-[12px] text-white/80 mt-0.5">{deal.title}</p>
                <p className="text-[10px] text-white/50">{deal.provider}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-white/50 flex items-center gap-1">
                    <IonIcon icon={timeOutline} className="text-[10px]" />
                    {deal.expiresIn}
                  </span>
                  <motion.span
                    whileTap={{ scale: 0.9 }}
                    className="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg"
                  >
                    Grab →
                  </motion.span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Curated Collections ── */}
      <div className="mt-5">
        <h2 className="text-[15px] font-bold text-slate-800 px-4 mb-2.5">
          Curated Collections
        </h2>
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {COLLECTIONS.map((col, i) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              className={`rounded-2xl bg-gradient-to-br ${col.gradient} p-3.5 cursor-pointer relative overflow-hidden`}
            >
              <div className="absolute right-2 top-2 opacity-20">
                <IonIcon icon={col.icon} className="text-4xl text-white" />
              </div>
              <div className="relative z-10">
                <h3 className="text-[13px] font-bold text-white leading-tight">
                  {col.title}
                </h3>
                <p className="text-[10px] text-white/60 mt-0.5">
                  {col.count} providers
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="h-2 bg-slate-50 mx-0 mt-5" />

      {/* ── Sort chips ── */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-slate-800 mr-auto">
          Discover Nearby
        </h2>
        {SORT_OPTIONS.map((opt) => (
          <motion.button
            key={opt.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSort(opt.key)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${
              sort === opt.key
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            <IonIcon icon={opt.icon} className="text-xs" />
            {opt.label}
          </motion.button>
        ))}
      </div>

      {/* ── Provider List ── */}
      <div className="flex flex-col px-4 gap-3 pb-2">
        <AnimatePresence>
          {filteredProviders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <IonIcon
                  icon={searchOutline}
                  className="text-2xl text-slate-300"
                />
              </div>
              <p className="text-sm font-medium text-slate-400">
                No providers found
              </p>
            </motion.div>
          ) : (
            filteredProviders.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${p.id}`)
                }
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer"
              >
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div className="relative w-[90px] h-[90px] rounded-xl overflow-hidden shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {p.verified && (
                      <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">
                        ✓
                      </div>
                    )}
                    {/* Save button */}
                    <motion.button
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSave(p.id);
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
                    >
                      <IonIcon
                        icon={savedIds.has(p.id) ? heart : heartOutline}
                        className={`text-xs ${
                          savedIds.has(p.id) ? "text-red-400" : "text-white"
                        }`}
                      />
                    </motion.button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-bold text-slate-800 leading-tight line-clamp-1">
                        {p.name}
                      </h3>
                      <span className="shrink-0 text-[11px] font-bold text-slate-800">
                        {p.price}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.service}
                    </p>

                    {/* Rating + distance */}
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        <IonIcon
                          icon={star}
                          className="text-[10px] text-amber-500"
                        />
                        <span className="text-[10px] font-bold text-amber-700">
                          {p.rating}
                        </span>
                        <span className="text-[9px] text-amber-600/60">
                          ({p.reviews})
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                        <IonIcon
                          icon={locationOutline}
                          className="text-[10px]"
                        />
                        {p.distance}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {p.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExploreContent;
