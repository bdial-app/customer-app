"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  storefrontOutline,
  cubeOutline,
  imagesOutline,
  starOutline,
  pricetagsOutline,
  rocketOutline,
} from "ionicons/icons";
import ProviderDetailsTab from "./provider-details-tab";
import ProviderProductsTab from "./provider-products-tab";
import ProviderPhotosTab from "./provider-photos-tab";
import ProviderReviewsTab from "./provider-reviews-tab";
import ProviderDealsTab from "./provider-deals-tab";
import ProviderSponsorTab from "./provider-sponsor-tab";
import { useMyProvider } from "@/hooks/useMyProvider";
import { useProviderDetails } from "@/hooks/useProvider";

type ManagerTab = "details" | "products" | "photos" | "reviews" | "deals" | "boost";

const tabs: { id: ManagerTab; label: string; icon: string }[] = [
  { id: "details", label: "Details", icon: storefrontOutline },
  { id: "products", label: "Products", icon: cubeOutline },
  { id: "photos", label: "Photos", icon: imagesOutline },
  { id: "reviews", label: "Reviews", icon: starOutline },
  { id: "deals", label: "Deals", icon: pricetagsOutline },
  { id: "boost", label: "Boost", icon: rocketOutline },
];

interface ProviderListingsManagerProps {
  initialSubTab?: string | null;
  onSubTabConsumed?: () => void;
}

const ProviderListingsManager = ({ initialSubTab, onSubTabConsumed }: ProviderListingsManagerProps) => {
  const [activeTab, setActiveTab] = useState<ManagerTab>("details");
  const { data: providerData, isLoading: providerLoading } = useMyProvider();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync external sub-tab navigation requests
  useEffect(() => {
    if (initialSubTab && tabs.some((t) => t.id === initialSubTab)) {
      setActiveTab(initialSubTab as ManagerTab);
      onSubTabConsumed?.();
    }
  }, [initialSubTab, onSubTabConsumed]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

  const provider = providerData?.provider ?? null;
  const providerId = provider?.id ?? null;

  const { data: details, isLoading: detailsLoading } = useProviderDetails(providerId ?? "");

  const photos = details?.photos ?? [];
  const products = details?.products ?? [];
  const reviews = details?.reviews ?? [];

  const isLoading = providerLoading || detailsLoading;

  if (isLoading) {
    return (
      <div className="pb-24">
        <div
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/60"
          style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="h-6 w-32 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
        <div className="px-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header + Tabs fused into sticky bar */}
      <div
        className="sticky top-0 z-40 bg-teal-600"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
      >
        <div className="px-4 py-3">
          <h1 className="text-base font-bold text-white">Manage Business</h1>
          <p className="text-[11px] text-white/50">{provider?.brandName ?? ""}</p>
        </div>

        {/* Scrollable tab bar */}
        <div
          ref={scrollRef}
          className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 shrink-0 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-white text-teal-700 pl-3 pr-3.5 py-1.5 shadow-sm"
                    : "bg-teal-500/40 text-white/80 px-2.5 py-1.5 active:bg-teal-500/60"
                }`}
              >
                <IonIcon icon={tab.icon} className="text-[15px]" />
                {isActive && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && provider && (
        <ProviderDetailsTab provider={provider} />
      )}

      {activeTab === "products" && (
        <ProviderProductsTab products={products} providerId={providerId} />
      )}

      {activeTab === "photos" && (
        <ProviderPhotosTab photos={photos} providerId={providerId} />
      )}

      {activeTab === "reviews" && (
        <ProviderReviewsTab reviews={reviews} />
      )}

      {activeTab === "deals" && (
        <ProviderDealsTab />
      )}

      {activeTab === "boost" && (
        <ProviderSponsorTab />
      )}
    </div>
  );
};

export default ProviderListingsManager;
