"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";

const BecomeProviderCTA = () => {
  const router = useRouter();
  const { providerStatus } = useAppContext();

  // Don't show if already a provider or applied
  if (providerStatus !== "not_applied") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mx-4 my-1"
    >
      <div
        className="relative overflow-hidden rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/40"
        style={{
          background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)",
        }}
      >
        {/* Geometric decoration */}
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full border-[3px] border-emerald-300/30" />
        <div className="absolute right-8 bottom-0 w-12 h-12 rounded-full border-[2px] border-emerald-200/40" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <svg viewBox="0 0 20 20" className="w-3 h-3 text-emerald-600" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Earn on your own terms
                </span>
              </div>
              <h3 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-900 leading-snug">
                Become a service provider
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Join 500+ providers earning from home. List your skills, get bookings.
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/provider-onboarding")}
              className="shrink-0 mt-1 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
            >
              Apply
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BecomeProviderCTA;
