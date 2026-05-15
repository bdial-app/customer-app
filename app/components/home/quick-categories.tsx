"use client";
import { motion } from "framer-motion";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";
import { PersonalizedCategory } from "@/services/home.service";
import { useCategoryInteraction } from "@/hooks/useCategoryInteraction";
import CategoryIcon from "@/app/components/ui/category-icon";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.015 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "tween" as const, duration: 0.15, ease: "easeOut" as const },
  },
};

const QuickCategories = ({ personalizedCategories }: { personalizedCategories?: PersonalizedCategory[] | null }) => {
  const { data: rawCategories = [], isLoading, isError } = useTopLevelCategories();
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const router = useRouter();
  const { trackCategory } = useCategoryInteraction();

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

  if (isError || categories.length === 0) {
    return null;
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
          return (
            <motion.div
              key={cat.id}
              variants={cardItem}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                trackCategory(cat.id, 'view');
                router.push(
                  `${ROUTE_PATH.SEARCH}?q=${encodeURIComponent(cat.name)}`,
                );
              }}
              className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <CategoryIcon
                icon={cat.icon}
                iconColor={cat.iconColor}
                imageUrl={cat.imageUrl}
                name={cat.name}
                size="lg"
              />
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
