"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import { chevronForward, storefrontOutline } from "ionicons/icons";
import type { CategorySearchResult } from "@/services/search.service";

interface Props {
  category: CategorySearchResult;
  index: number;
  onTap?: (name: string, id: string) => void;
}

const CategoryResultCard = ({ category, index, onTap }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    if (onTap) {
      onTap(category.name, category.id);
    } else {
      router.push(`/search?q=${encodeURIComponent(category.name)}&categoryIds=${category.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={handleClick}
      className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] active:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/60 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : category.icon ? (
          <img
            src={category.icon}
            alt=""
            className="w-6 h-6 object-contain"
          />
        ) : (
          <span className="text-lg">📂</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-bold text-gray-800 truncate">
          {category.name}
        </h4>
        <div className="flex items-center gap-1 mt-0.5">
          <IonIcon icon={storefrontOutline} className="w-3 h-3 text-gray-400" />
          <p className="text-[11px] text-gray-400 font-medium">
            {category.providerCount} business
            {category.providerCount !== 1 ? "es" : ""} nearby
          </p>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
        <IonIcon
          icon={chevronForward}
          className="w-4 h-4 text-gray-400"
        />
      </div>
    </motion.div>
  );
};

export default CategoryResultCard;
