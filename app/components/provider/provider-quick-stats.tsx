"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { eyeOutline, starOutline, chatbubblesOutline, trendingUpOutline } from "ionicons/icons";
import { ListingData } from "@/services/listing.service";

interface ProviderQuickStatsProps {
  listings: ListingData[];
}

const ProviderQuickStats = ({ listings }: ProviderQuickStatsProps) => {
  const totalReviews = listings.reduce((sum, l) => sum + (l.reviews?.length || 0), 0);
  const allRatings = listings.flatMap((l) => l.reviews?.map((r) => r.starRating) || []);
  const avgRating = allRatings.length > 0
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : "—";
  const liveListings = listings.filter((l) => l.status === "live").length;
  const totalProducts = listings.reduce((sum, l) => sum + (l.products?.length || 0), 0);

  const stats = [
    { icon: eyeOutline, label: "Listings", value: liveListings.toString(), color: "text-blue-500", bg: "bg-blue-50" },
    { icon: starOutline, label: "Rating", value: avgRating, color: "text-amber-500", bg: "bg-amber-50" },
    { icon: chatbubblesOutline, label: "Reviews", value: totalReviews.toString(), color: "text-purple-500", bg: "bg-purple-50" },
    { icon: trendingUpOutline, label: "Products", value: totalProducts.toString(), color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-3 border border-slate-100 text-center shadow-sm"
          >
            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-1.5`}>
              <IonIcon icon={stat.icon} className={`text-base ${stat.color}`} />
            </div>
            <p className="text-base font-bold text-slate-800">{stat.value}</p>
            <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProviderQuickStats;
