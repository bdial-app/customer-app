"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false }
);
import {
  searchOutline,
  trendingUpOutline,
  starOutline,
  gridOutline,
  arrowForward,
  locationOutline,
  sparklesOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import type {
  SearchFallback,
  ProviderSearchResult,
  CategorySearchResult,
} from "@/services/search.service";
import ProviderResultCard from "./cards/provider-result-card";
import CategoryResultCard from "./cards/category-result-card";

interface Props {
  query: string;
  fallback?: SearchFallback;
  didYouMean?: string;
  onDidYouMeanTap?: (text: string) => void;
  onTrendingTap?: (text: string) => void;
  onCategoryTap?: (name: string, id: string) => void;
}

const SearchFallbackView = ({
  query,
  fallback,
  didYouMean,
  onDidYouMeanTap,
  onTrendingTap,
  onCategoryTap,
}: Props) => {
  const router = useRouter();
  const hasAnyContent =
    didYouMean ||
    fallback?.relaxedProviders?.length ||
    fallback?.relatedCategories?.length ||
    fallback?.nearbyPopular?.length ||
    fallback?.trending?.length;

  if (!hasAnyContent) {
    return <AbsoluteEmptyState query={query} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="px-4 pt-2 pb-10 space-y-6"
    >
      {/* Header */}
      <div className="text-center pt-4 pb-1">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <IonIcon icon={searchOutline} className="w-7 h-7 text-amber-500" />
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-[260px] mx-auto">
          No exact matches for &ldquo;<span className="font-semibold text-gray-700">{query}</span>&rdquo;
          — but here&apos;s what we found
        </p>
      </div>

      {/* Did you mean? */}
      {didYouMean && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => onDidYouMeanTap?.(didYouMean)}
          className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-left active:bg-amber-100 transition-colors"
        >
          <p className="text-[13px] text-gray-600">
            Did you mean:{" "}
            <span className="font-bold text-amber-600">{didYouMean}</span>?
          </p>
        </motion.button>
      )}

      {/* Relaxed provider results */}
      {fallback?.relaxedProviders && fallback.relaxedProviders.length > 0 && (
        <section>
          <FallbackSectionHeader
            icon={locationOutline}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
            title="Similar results nearby"
            subtitle="We expanded your search area"
          />
          <div className="grid grid-cols-2 gap-3">
            {fallback.relaxedProviders.map((p, i) => (
              <ProviderResultCard key={p.id} provider={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Related categories */}
      {fallback?.relatedCategories && fallback.relatedCategories.length > 0 && (
        <section>
          <FallbackSectionHeader
            icon={gridOutline}
            iconColor="text-purple-500"
            iconBg="bg-purple-50"
            title="Related categories"
            subtitle="Browse these instead"
          />
          <div className="space-y-2">
            {fallback.relatedCategories.map((c, i) => (
              <CategoryResultCard key={c.id} category={c} index={i} onTap={onCategoryTap} />
            ))}
          </div>
        </section>
      )}

      {/* Nearby popular */}
      {fallback?.nearbyPopular && fallback.nearbyPopular.length > 0 && (
        <section>
          <FallbackSectionHeader
            icon={starOutline}
            iconColor="text-amber-500"
            iconBg="bg-amber-50"
            title="Popular near you"
            subtitle="Top-rated businesses in your area"
          />
          <div className="grid grid-cols-2 gap-3">
            {fallback.nearbyPopular.map((p, i) => (
              <ProviderResultCard key={p.id} provider={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Trending searches */}
      {fallback?.trending && fallback.trending.length > 0 && (
        <section>
          <FallbackSectionHeader
            icon={trendingUpOutline}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
            title="Trending searches"
            subtitle="See what others are looking for"
          />
          <div className="flex flex-wrap gap-2">
            {fallback.trending.map((t, i) => (
              <motion.button
                key={t.query}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onTrendingTap?.(t.query)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 active:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                <IonIcon icon={trendingUpOutline} className="w-3.5 h-3.5 text-gray-400" />
                <span className="capitalize">{t.query}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Browse all categories CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => router.push("/all-services")}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-2xl text-[14px] font-semibold active:bg-gray-800 transition-colors shadow-sm"
      >
        <IonIcon icon={gridOutline} className="w-4.5 h-4.5" />
        Browse all categories
        <IonIcon icon={arrowForward} className="w-4 h-4 ml-0.5" />
      </motion.button>
    </motion.div>
  );
};

// ── Section header ────────────────────────────────────────────

const FallbackSectionHeader = ({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
}) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
      <IonIcon icon={icon} className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div>
      <h3 className="text-[13px] font-bold text-gray-800">{title}</h3>
      <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>
    </div>
  </div>
);

// ── Absolute last resort (no fallback data at all) ────────────

const AbsoluteEmptyState = ({ query }: { query: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center pt-16 text-center px-6"
  >
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-5 shadow-sm">
      <IonIcon icon={searchOutline} className="w-9 h-9 text-amber-400" />
    </div>
    <h3 className="text-[16px] font-bold text-gray-800 mb-1.5">
      No results found
    </h3>
    <p className="text-[13px] text-gray-400 max-w-[280px] leading-relaxed">
      We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try a different
      search term or adjust your filters.
    </p>
  </motion.div>
);

export default SearchFallbackView;
