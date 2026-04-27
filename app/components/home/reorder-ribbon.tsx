"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { LastBooking } from "@/services/home.service";

interface ReorderRibbonProps {
  lastBooking: LastBooking | null;
}

const ReorderRibbon = ({ lastBooking }: ReorderRibbonProps) => {
  const router = useRouter();

  if (!lastBooking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-3"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/40 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
              Your last booking
            </p>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
              {lastBooking.providerName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lastBooking.categories || lastBooking.providerName}
              {lastBooking.location ? ` • ${lastBooking.location}` : ""}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
            onClick={() => router.push(`/provider-details/${lastBooking.providerId}`)}
          >
            Rebook
          </motion.button>
        </div>
        {/* Decorative circle */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-200/30" />
        <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full bg-orange-200/20" />
      </div>
    </motion.div>
  );
};

export default ReorderRibbon;
