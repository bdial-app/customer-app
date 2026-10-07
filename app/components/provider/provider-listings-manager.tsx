"use client";
import { useState, useEffect } from "react";
import { IonIcon } from "@ionic/react";
import {
  storefrontOutline,
  cubeOutline,
  imagesOutline,
  starOutline,
  pricetagsOutline,
  rocketOutline,
  diamondOutline,
  gridOutline,
  eyeOutline,
} from "ionicons/icons";
import { motion } from "framer-motion";
import { Segmented } from "./manage/kit";
import Link from "next/link";
import { ROUTE_PATH } from "@/utils/contants";
import ProviderDetailsTab from "./provider-details-tab";
import ProviderProductsTab from "./provider-products-tab";
import ProviderPhotosTab from "./provider-photos-tab";
import ProviderReviewsTab from "./provider-reviews-tab";
import ProviderDealsTab from "./provider-deals-tab";
import ProviderSponsorTab from "./provider-sponsor-tab";
import ProviderSubscriptionTab from "./provider-subscription-tab";
import ProviderCategoriesTab from "./provider-categories-tab";
import { useMyProvider, useMySponsorships } from "@/hooks/useMyProvider";
import { BoostButton, BoostHero, BoostProvider, type BoostState } from "./manage/boost";
import { hasBudgetLeft } from "@/services/provider.service";
import { useProviderDetails } from "@/hooks/useProvider";
import { useMyProducts } from "@/hooks/useProduct";
import { useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

type ManagerTab = "details" | "products" | "photos" | "reviews" | "deals" | "categories" | "plans" | "boost";

// Every tab shows its name: an icon alone told new owners nothing.
// The first five sit in one row that fits any phone; the rest live under More.
// Managing the listing: one tab each, all in one row that fits any phone.
// Growing it (Plans, Boost) has its own place: the Grow button in the header.
// Boost first: it is what most owners need, and it pays for the app.
const GROW: ManagerTab[] = ["boost", "plans"];
const allTabs: { id: ManagerTab; label: string; icon: string }[] = [
  { id: "details", label: "Details", icon: storefrontOutline },
  { id: "products", label: "Catalogue", icon: cubeOutline },
  { id: "photos", label: "Photos", icon: imagesOutline },
  { id: "reviews", label: "Reviews", icon: starOutline },
  { id: "deals", label: "Offers", icon: pricetagsOutline },
  { id: "categories", label: "Categories", icon: gridOutline },
  { id: "plans", label: "Plans", icon: diamondOutline },
  { id: "boost", label: "Boost", icon: rocketOutline },
];

interface ProviderListingsManagerProps {
  initialSubTab?: string | null;
  onSubTabConsumed?: () => void;
}

/** One tab: icon above a short label, a count badge, and the sliding underline. */
function TabSlot({
  id,
  tourId,
  label,
  icon,
  active,
  count,
  attention,
  onClick,
}: {
  id: string;
  tourId: string;
  label: string;
  icon: string;
  active: boolean;
  count?: number;
  attention?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-tab={id}
      data-tour={tourId}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1 min-w-0 pt-1.5 pb-3 min-h-[58px] transition-colors active:bg-white/10 rounded-t-xl ${
        active ? "text-white" : "text-white/60"
      }`}
    >
      <span className="relative">
        <IonIcon icon={icon} className={`text-[21px] transition-transform ${active ? "scale-110" : ""}`} />
        {count != null && count > 0 && (
          <span className="absolute -top-1.5 -right-3 min-w-[17px] h-[17px] px-1 rounded-full bg-white text-indigo-700 text-[10px] font-extrabold tabular-nums flex items-center justify-center shadow-sm">
            {count > 99 ? "99+" : count}
          </span>
        )}
        {attention && <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-indigo-700" aria-label="Needs attention" />}
      </span>
      <span className={`max-w-full truncate px-0.5 text-[11px] leading-none ${active ? "font-bold" : "font-semibold"}`}>{label}</span>
      {active && (
        <motion.span
          layoutId="biz-tab-underline"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
          className="absolute bottom-0 h-[3px] w-9 rounded-full bg-white"
        />
      )}
    </button>
  );
}

const ProviderListingsManager = ({ initialSubTab, onSubTabConsumed }: ProviderListingsManagerProps) => {
  const [activeTab, setActiveTab] = useState<ManagerTab>("details");
  const { data: providerData, isLoading: providerLoading } = useMyProvider();
  const { data: monetizationConfig } = useMonetizationConfig();
  const { data: featureFlags } = useFeatureFlags();

  // Each tab gated by its own flag independently
  const subscriptionsVisible = monetizationConfig?.flags.subscriptionsVisible ?? false;
  const sponsorshipsEnabled = featureFlags?.sponsorships_enabled ?? false;
  const tabs = allTabs.filter((t) => {
    if (t.id === "boost" && !sponsorshipsEnabled) return false;
    if (t.id === "plans" && !subscriptionsVisible) return false;
    return true;
  });

  // Sync external sub-tab navigation requests. Applied during render once the
  // requested tab exists — tabs depend on flags that load async, and an effect
  // keyed only on the request dropped it if it arrived first. The parent is
  // told it was consumed from an effect, since that updates the parent.
  // A request may carry an action: "products:add:service" opens Catalogue
  // with the add form already set to a service (the dashboard's add card).
  const [requestedTab, requestedAction, requestedType] = (initialSubTab ?? "").split(":");
  const [appliedSubTab, setAppliedSubTab] = useState<string | null>(null);
  const [autoAdd, setAutoAdd] = useState<{ type: "product" | "service"; nonce: number } | null>(null);
  const [addSeq, setAddSeq] = useState(0);
  const subTabReady = !!initialSubTab && tabs.some((t) => t.id === requestedTab);
  if (subTabReady && initialSubTab !== appliedSubTab) {
    setAppliedSubTab(initialSubTab!);
    setActiveTab(requestedTab as ManagerTab);
    if (requestedTab === "products" && requestedAction === "add") {
      setAddSeq(addSeq + 1);
      setAutoAdd({ type: requestedType === "service" ? "service" : "product", nonce: addSeq + 1 });
    }
  } else if (!initialSubTab && appliedSubTab !== null) {
    setAppliedSubTab(null);
  }
  useEffect(() => {
    if (subTabReady) onSubTabConsumed?.();
  }, [subTabReady, onSubTabConsumed]);


  const provider = providerData?.provider ?? null;
  const providerId = provider?.id ?? null;

  const { data: details, isLoading: detailsLoading } = useProviderDetails(providerId ?? "");
  const isLoading = providerLoading || detailsLoading;
  const manageTabs = tabs.filter((t) => !GROW.includes(t.id));
  const growTabs = GROW.map((id) => tabs.find((t) => t.id === id)).filter((t): t is (typeof tabs)[number] => !!t);
  const activeGrow = growTabs.find((t) => t.id === activeTab)?.id ?? null;


  const photos = details?.photos ?? [];
  // The owner's own list includes hidden items; the public page leaves them out.
  const { data: myProducts } = useMyProducts(!!providerId);
  const products = myProducts ?? details?.products ?? [];
  const reviews = details?.reviews ?? [];


  // How much is in each section, and which empty ones need the owner's attention.
  const counts: Partial<Record<ManagerTab, number>> = {
    products: products.length,
    photos: photos.length,
    reviews: reviews.length,
    deals: details?.activeOffers?.length ?? 0,
    categories: details?.categories?.length ?? 0,
  };
  // Is a boost running? (Drives "Boosted · N days left" and hides the prompts.)
  const { data: sponsorships } = useMySponsorships();
  const activeUntil =
    (sponsorships ?? [])
      .filter((sp) => sp.isActive && new Date(sp.endsAt) > new Date() && hasBudgetLeft(sp))
      .map((sp) => new Date(sp.endsAt))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const boost: BoostState = {
    enabled: sponsorshipsEnabled,
    activeUntil,
    openTab: (id) => setActiveTab(id as ManagerTab),
  };

  const needsAttention = (id: ManagerTab) =>
    (id === "products" || id === "photos" || id === "categories") && counts[id] === 0;

  if (isLoading) {
    return (
      <div className="pb-24">
        <div
          className="sticky top-0 z-40 bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-700"
          style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
        >
          <div className="px-4 pt-3 pb-3 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 w-40 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-3 w-24 bg-white/15 rounded-lg animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-white/15 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-2 px-4 pb-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 shrink-0 bg-white/15 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-3" />
        <div className="px-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <BoostProvider value={boost}>
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header + one fixed row of tabs: everything visible, nothing to swipe */}
      <div
        className="sticky top-0 z-40 bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-700 shadow-[0_8px_24px_-12px_rgba(49,46,129,0.6)]"
        style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
      >
        <div className="px-4 pt-2.5 pb-2 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-extrabold tracking-tight text-white leading-tight truncate">Manage Business</h1>
            <p className="text-[12px] text-white/65 truncate">{provider?.brandName || "Your business"}</p>
          </div>
          {providerId && (
            <Link
              href={`${ROUTE_PATH.PROVIDER_DETAILS}?id=${providerId}`}
              aria-label="Preview my page as customers see it"
              className="w-9 h-9 rounded-full bg-white/15 active:bg-white/25 text-white flex items-center justify-center shrink-0"
            >
              <IonIcon icon={eyeOutline} className="text-[17px]" />
            </Link>
          )}
          {sponsorshipsEnabled ? (
            <BoostButton
              open={!!activeGrow}
              // The tour points at "biz-tab-boost"/"biz-tab-plans" once that view is open.
              tourId={`biz-tab-${activeGrow ?? "boost"}`}
              onClick={() => setActiveTab(activeGrow ?? "boost")}
            />
          ) : growTabs.length > 0 ? (
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              data-tour="biz-tab-plans"
              onClick={() => setActiveTab("plans")}
              aria-pressed={!!activeGrow}
              className={`h-9 pl-2.5 pr-3 rounded-full text-[12px] font-extrabold flex items-center gap-1.5 shrink-0 ${
                activeGrow ? "bg-white text-violet-700" : "bg-gradient-to-r from-amber-300 to-orange-400 text-slate-900 shadow-md shadow-amber-500/30"
              }`}
            >
              <IonIcon icon={diamondOutline} className="text-[14px]" />
              Plans
            </motion.button>
          ) : null}
        </div>

        <div
          data-tour="biz-tabbar"
          role="tablist"
          aria-label="Business sections"
          className="grid px-1"
          style={{ gridTemplateColumns: `repeat(${manageTabs.length}, minmax(0, 1fr))` }}
        >
          {manageTabs.map((tab) => (
            <TabSlot
              key={tab.id}
              id={tab.id}
              tourId={`biz-tab-${tab.id}`}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              count={counts[tab.id]}
              attention={needsAttention(tab.id)}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Growth area: what Boost gets you, then Boost | Plans */}
      {activeGrow && (
        <div className="px-4 pt-4 flex flex-col gap-3 bg-white dark:bg-slate-900">
          {sponsorshipsEnabled && <BoostHero />}
          {growTabs.length > 1 && (
          <Segmented
            value={activeGrow}
            onChange={(v) => setActiveTab(v)}
            options={growTabs.map((t) => ({
              value: t.id,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <IonIcon icon={t.icon} className="text-[14px]" />
                  {t.label}
                </span>
              ),
            }))}
          />
          )}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "details" && provider && (
        <ProviderDetailsTab provider={provider} />
      )}

      {activeTab === "products" && (
        <ProviderProductsTab
          products={products}
          providerId={providerId}
          autoAdd={autoAdd}
          onAutoAddConsumed={() => setAutoAdd(null)}
        />
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

      {activeTab === "categories" && (
        <ProviderCategoriesTab
          providerId={providerId}
          currentCategories={details?.categories ?? []}
        />
      )}

      {activeTab === "plans" && (
        <div className="pb-28 bg-white dark:bg-slate-900 min-h-full">
          <ProviderSubscriptionTab />
        </div>
      )}

      {activeTab === "boost" && (
        <div className="pb-28 bg-white dark:bg-slate-900 min-h-full">
          <ProviderSponsorTab />
        </div>
      )}
    </div>
    </BoostProvider>
  );
};

export default ProviderListingsManager;
