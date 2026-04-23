"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  storefrontOutline,
  cubeOutline,
  imagesOutline,
  starOutline,
} from "ionicons/icons";
import ProviderDetailsTab from "./provider-details-tab";
import ProviderProductsTab from "./provider-products-tab";
import ProviderPhotosTab from "./provider-photos-tab";
import ProviderReviewsTab from "./provider-reviews-tab";
import { useMyProvider } from "@/hooks/useMyProvider";
import { useProviderDetails } from "@/hooks/useProvider";

type ManagerTab = "details" | "products" | "photos" | "reviews";

const tabs: { id: ManagerTab; label: string; icon: string }[] = [
  { id: "details", label: "Details", icon: storefrontOutline },
  { id: "products", label: "Products", icon: cubeOutline },
  { id: "photos", label: "Photos", icon: imagesOutline },
  { id: "reviews", label: "Reviews", icon: starOutline },
];

const ProviderListingsManager = () => {
  const [activeTab, setActiveTab] = useState<ManagerTab>("details");
  const { data: providerData, isLoading: providerLoading } = useMyProvider();

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
        {/* Header skeleton */}
        <div
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/60"
          style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
        {/* Tab skeleton */}
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
      {/* Listings header */}
      <div
        className="sticky top-0 z-40 bg-teal-600 border-b border-teal-500"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Manage Business</h1>
            <p className="text-[11px] text-white/60">
              {provider?.brandName ?? ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-3">
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id ? "text-teal-700" : "text-slate-500"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="listingManagerTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <IonIcon icon={tab.icon} className="relative z-10 text-sm" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
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
    </div>
  );
};

export default ProviderListingsManager;
