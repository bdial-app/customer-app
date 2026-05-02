"use client";
import { motion } from "framer-motion";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ROUTE_PATH } from "@/utils/contants";
import { PersonalizedCategory } from "@/services/home.service";

const CATEGORY_COLORS = [
  { gradient: "from-orange-400 to-amber-500", text: "text-white" },
  { gradient: "from-emerald-400 to-teal-500", text: "text-white" },
  { gradient: "from-pink-400 to-rose-500", text: "text-white" },
  { gradient: "from-blue-400 to-indigo-500", text: "text-white" },
  { gradient: "from-yellow-400 to-orange-500", text: "text-white" },
  { gradient: "from-purple-400 to-violet-500", text: "text-white" },
  { gradient: "from-cyan-400 to-blue-500", text: "text-white" },
  { gradient: "from-red-400 to-pink-500", text: "text-white" },
  { gradient: "from-lime-400 to-green-500", text: "text-white" },
  { gradient: "from-fuchsia-400 to-purple-500", text: "text-white" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "tween" as const, duration: 0.25, ease: "easeOut" as const },
  },
};

const QuickCategories = ({ personalizedCategories }: { personalizedCategories?: PersonalizedCategory[] | null }) => {
  const { data: categories = [], isLoading } = useTopLevelCategories();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="px-4 pb-3">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[72px] flex flex-col items-center gap-2"
            >
              <div className="w-[64px] h-[64px] rounded-2xl bg-white/[0.06] animate-pulse" />
              <div className="w-12 h-2 rounded bg-white/[0.06] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Use personalized order if available, otherwise fall back to default order
  let displayCategories: any[];
  if (personalizedCategories?.length) {
    // Map personalized weights to actual category objects
    const catMap = new Map(categories.map((c: any) => [c.id, c]));
    const personalized = personalizedCategories
      .map((pc) => catMap.get(pc.id))
      .filter(Boolean);
    // Fill remaining with categories not in personalized list
    const personalizedIds = new Set(personalizedCategories.map((pc) => pc.id));
    const rest = categories.filter((c: any) => !personalizedIds.has(c.id));
    displayCategories = [...personalized, ...rest].slice(0, 10);
  } else {
    displayCategories = categories.slice(0, 10);
  }
  const hasMore = categories.length > 10;

  return (
    <div className="pb-5">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex gap-3 overflow-x-auto no-scrollbar px-4"
      >
        {displayCategories.map((cat: any, i) => {
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          // const Icon = ABSTRACT_ICONS[i % ABSTRACT_ICONS.length];
          return (
            <motion.div
              key={cat.id}
              variants={cardItem}
              whileTap={{ scale: 0.92 }}
              onClick={() =>
                router.push(
                  `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(cat.name)}`,
                )
              }
              className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div className="w-[62px] h-[62px] rounded-2xl relative overflow-hidden flex items-center justify-center">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="62px"
                    priority={i < 5}
                    className="object-cover"
                  />
                ) : cat.icon ? (
                  <Image
                    src={cat.icon}
                    alt={cat.name}
                    fill
                    sizes="62px"
                    priority={i < 5}
                    className="object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${color.gradient} flex items-center justify-center`}>
                    <span className="text-xl font-bold text-white/80">{cat.name?.[0] || "?"}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-white/70 text-center leading-tight w-[68px] line-clamp-2">
                {cat.name}
              </span>
            </motion.div>
          );
        })}
        {hasMore && (
          <motion.div
            variants={cardItem}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push(ROUTE_PATH.CATEGORIES)}
            className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <div className="w-[62px] h-[62px] rounded-2xl bg-white/[0.08] border border-white/[0.1] flex items-center justify-center">
              <span className="text-lg text-white/50">→</span>
            </div>
            <span className="text-[10px] font-semibold text-white/40 text-center leading-tight">
              See All
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QuickCategories;
