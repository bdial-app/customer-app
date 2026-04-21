"use client";
import { motion } from "framer-motion";

const ReferEarnCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-1"
    >
      <div className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-amber-400/10" />
        <div className="absolute right-10 -bottom-4 w-16 h-16 rounded-full bg-blue-400/10" />
        <div className="absolute left-1/2 top-0 w-32 h-32 rounded-full bg-purple-400/5 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-amber-400/20 flex items-center justify-center">
                <svg viewBox="0 0 20 20" className="w-3 h-3 text-amber-400" fill="currentColor">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.617 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0114 15a3.989 3.989 0 01-3.667-1.018 1 1 0 01-.285-1.05l1.715-5.349L10 6.874l-1.763.71 1.715 5.348a1 1 0 01-.285 1.05A3.989 3.989 0 016 15a3.989 3.989 0 01-3.667-1.018 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                Invite & Earn
              </span>
            </div>
            <h3 className="text-[15px] font-extrabold text-white leading-snug">
              Get ₹100 for every friend who books
            </h3>
            <p className="text-[11px] text-white/40 mt-1">
              Your friend gets ₹50 off their first booking too
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="shrink-0 bg-amber-400 text-[#1a1a2e] text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/20"
          >
            Share
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReferEarnCard;
