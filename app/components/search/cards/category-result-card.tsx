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
import { useCategoryInteraction } from "@/hooks/useCategoryInteraction";
import CategoryIcon from "@/app/components/ui/category-icon";

import { ROUTE_PATH } from "@/utils/contants";

interface Props {
  category: CategorySearchResult;
  index: number;
  onTap?: (name: string, id: string) => void;
}

const CategoryResultCard = ({ category, index, onTap }: Props) => {
  const router = useRouter();
  const { trackCategory } = useCategoryInteraction();

  const handleClick = () => {
    trackCategory(category.id, 'view');
    if (onTap) {
      onTap(category.name, category.id);
    } else {
      router.push(`${ROUTE_PATH.ALL_SERVICES}?categoryIds=${category.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={handleClick}
      className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:shadow-none active:bg-gray-50 dark:active:bg-slate-700 active:scale-[0.99] transition-all cursor-pointer"
    >
      {/* Icon */}
      <CategoryIcon
        icon={category.icon}
        iconColor={category.iconColor}
        imageUrl={category.imageUrl}
        name={category.name}
        size="sm"
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[14px] font-bold text-gray-800 dark:text-white truncate">
          {category.name}
        </h4>
        <div className="flex items-center gap-1 mt-0.5">
          <IonIcon icon={storefrontOutline} className="w-3 h-3 text-gray-400 dark:text-slate-500" />
          <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">
            {category.providerCount} business
            {category.providerCount !== 1 ? "es" : ""} nearby
          </p>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
        <IonIcon
          icon={chevronForward}
          className="w-4 h-4 text-gray-400 dark:text-slate-500"
        />
      </div>
    </motion.div>
  );
};

export default CategoryResultCard;
