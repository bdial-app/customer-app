"use client";
import { motion } from "framer-motion";

const ReorderRibbon = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-3"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
              Your last booking
            </p>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5">
              Ahmed's Tailoring Shop
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tailoring • 2.5 km away</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
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
