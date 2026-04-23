"use client";
import { motion } from "framer-motion";
import { useTopLevelCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

/* ── Abstract SVG patterns — one per category slot ── */
const ABSTRACT_ICONS: React.FC<{ className?: string }>[] = [
  // 0: Concentric rings
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <circle
        cx="24"
        cy="24"
        r="12"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.5"
      />
      <circle cx="24" cy="24" r="6" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  // 1: Stacked bars
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor">
      <rect x="8" y="10" width="32" height="5" rx="2.5" opacity="0.3" />
      <rect x="12" y="19" width="24" height="5" rx="2.5" opacity="0.5" />
      <rect x="8" y="28" width="32" height="5" rx="2.5" opacity="0.7" />
      <rect x="14" y="37" width="20" height="5" rx="2.5" opacity="0.9" />
    </svg>
  ),
  // 2: Diamond grid
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor">
      <rect
        x="20"
        y="4"
        width="10"
        height="10"
        rx="2"
        transform="rotate(45 25 9)"
        opacity="0.4"
      />
      <rect
        x="8"
        y="16"
        width="10"
        height="10"
        rx="2"
        transform="rotate(45 13 21)"
        opacity="0.6"
      />
      <rect
        x="30"
        y="16"
        width="10"
        height="10"
        rx="2"
        transform="rotate(45 35 21)"
        opacity="0.6"
      />
      <rect
        x="20"
        y="28"
        width="10"
        height="10"
        rx="2"
        transform="rotate(45 25 33)"
        opacity="0.8"
      />
    </svg>
  ),
  // 3: Waves
  ({ className }) => (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M4 16 C12 10, 20 22, 28 16 S44 10, 44 16"
        strokeWidth="2.5"
        opacity="0.3"
      />
      <path
        d="M4 24 C12 18, 20 30, 28 24 S44 18, 44 24"
        strokeWidth="2.5"
        opacity="0.6"
      />
      <path
        d="M4 32 C12 26, 20 38, 28 32 S44 26, 44 32"
        strokeWidth="2.5"
        opacity="0.9"
      />
    </svg>
  ),
  // 4: Hexagon
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor">
      <path d="M24 4 L42 15 L42 33 L24 44 L6 33 L6 15 Z" opacity="0.2" />
      <path
        d="M24 12 L35 18.5 L35 31.5 L24 38 L13 31.5 L13 18.5 Z"
        opacity="0.5"
      />
      <circle cx="24" cy="25" r="5" opacity="0.8" />
    </svg>
  ),
  // 5: Radiating lines
  ({ className }) => (
    <svg
      viewBox="0 0 48 48"
      className={className}
      stroke="currentColor"
      fill="none"
    >
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="24"
          y1="24"
          x2={24 + 16 * Math.cos((angle * Math.PI) / 180)}
          y2={24 + 16 * Math.sin((angle * Math.PI) / 180)}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.3 + (angle / 315) * 0.6}
        />
      ))}
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  // 6: Stacked circles
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor">
      <circle cx="16" cy="28" r="10" opacity="0.25" />
      <circle cx="32" cy="28" r="10" opacity="0.25" />
      <circle cx="24" cy="16" r="10" opacity="0.4" />
      <circle cx="24" cy="24" r="4" opacity="0.9" />
    </svg>
  ),
  // 7: Triangle mesh
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor">
      <polygon points="24,6 40,38 8,38" opacity="0.2" />
      <polygon points="24,14 34,34 14,34" opacity="0.4" />
      <polygon points="24,22 28,30 20,30" opacity="0.8" />
    </svg>
  ),
  // 8: Dots grid
  ({ className }) => (
    <svg viewBox="0 0 48 48" className={className} fill="currentColor">
      {[12, 24, 36].map((x) =>
        [12, 24, 36].map((y) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={x === 24 && y === 24 ? 5 : 3}
            opacity={x === 24 && y === 24 ? 0.9 : 0.35}
          />
        )),
      )}
    </svg>
  ),
  // 9: Spiral arcs
  ({ className }) => (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
    >
      <path d="M24 24 C24 16, 34 16, 34 24" strokeWidth="2" opacity="0.3" />
      <path d="M34 24 C34 34, 14 34, 14 24" strokeWidth="2" opacity="0.5" />
      <path d="M14 24 C14 10, 40 10, 40 24" strokeWidth="2.5" opacity="0.7" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.9" />
    </svg>
  ),
];

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
  show: { transition: { staggerChildren: 0.05 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

const QuickCategories = () => {
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

  const displayCategories = categories.slice(0, 10);
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
                  `${ROUTE_PATH.SERVICE_PROVIDERS}?categoryId=${cat.id}`,
                )
              }
              className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div
                className={`w-[62px] h-[62px] rounded-2xl flex items-center justify-center relative overflow-hidden`}
                style={{
                  background: `url(${cat.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* <Icon className="w-9 h-9 text-white" /> */}
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
            onClick={() => router.push(ROUTE_PATH.ALL_SERVICES)}
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
