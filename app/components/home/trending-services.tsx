"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

interface TrendingItem {
  label: string;
  bookings: string;
  gradient: string;
  abstractPath: string;
}

const TRENDING: TrendingItem[] = [
  {
    label: "AC Repair",
    bookings: "2.4k this week",
    gradient: "from-sky-400 to-blue-600",
    abstractPath: "M4 24 C12 10 20 38 28 24 S44 10 44 24",
  },
  {
    label: "Tailoring",
    bookings: "1.8k this week",
    gradient: "from-amber-400 to-orange-600",
    abstractPath: "M8 8 L40 8 L24 40 Z",
  },
  {
    label: "Salon",
    bookings: "1.5k this week",
    gradient: "from-pink-400 to-rose-600",
    abstractPath: "M24 8 A16 16 0 1 0 24 40 A16 16 0 1 0 24 8 M24 16 A8 8 0 1 1 24 32",
  },
  {
    label: "Cleaning",
    bookings: "980 this week",
    gradient: "from-emerald-400 to-green-600",
    abstractPath: "M4 40 L12 16 L20 32 L28 8 L36 28 L44 12",
  },
  {
    label: "Plumbing",
    bookings: "870 this week",
    gradient: "from-violet-400 to-purple-600",
    abstractPath: "M24 4 L42 15 V33 L24 44 L6 33 V15 Z",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, x: 30 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

const TrendingServices = () => {
  const router = useRouter();

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800 leading-tight">
            Trending Now
          </h2>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-xs"
          >
            🔥
          </motion.span>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4 pb-3"
      >
        {TRENDING.map((t) => (
          <motion.div
            key={t.label}
            variants={item}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              router.push(
                `${ROUTE_PATH.ALL_SERVICES}?search=${encodeURIComponent(t.label)}`
              )
            }
            className={`shrink-0 w-[130px] rounded-2xl bg-gradient-to-br ${t.gradient} p-3 cursor-pointer relative overflow-hidden`}
          >
            {/* Abstract background shape */}
            <svg
              viewBox="0 0 48 48"
              className="absolute inset-0 w-full h-full text-white/[0.08]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={t.abstractPath} />
            </svg>

            <div className="relative z-10">
              <h4 className="text-sm font-bold text-white">{t.label}</h4>
              <p className="text-[10px] text-white/60 mt-0.5">{t.bookings}</p>
              <div className="flex items-center gap-1 mt-2.5">
                <div className="flex -space-x-1.5">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="w-4 h-4 rounded-full bg-white/20 border border-white/30"
                    />
                  ))}
                </div>
                <span className="text-[9px] text-white/50">+more</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TrendingServices;
