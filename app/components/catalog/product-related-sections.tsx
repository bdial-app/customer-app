"use client";
import { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { arrowForwardOutline, storefront, sparkles } from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import type { ProductDetail, ProductProviderSummary } from "@/services/product.service";
import type { CatalogItem, CatalogType } from "@/services/catalog.service";
import { useSimilarItems } from "@/hooks/useCatalog";
import ProductCard, { ProductCardSkeleton } from "./product-card";
import { ServiceListCard, ServiceListSkeleton } from "./service-card";
import { useCatalogCardActions } from "./catalog-results";
import { catalogHref, typeNoun } from "./catalog-utils";

/** The detail endpoint's same-seller items, in the shape catalog cards take. */
const fromSellerItem = (
  p: ProductDetail,
  seller: ProductProviderSummary,
  rating: number,
  reviewCount: number,
): CatalogItem => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price != null ? Number(p.price) : null,
  currency: p.currency,
  photoUrl: p.photoUrl || p.photoUrls?.[0] || null,
  photoUrls: p.photoUrls ?? [],
  productType: p.productType === "service" ? "service" : "product",
  isHero: p.isHero,
  categoryId: p.categoryId ?? null,
  categoryName: null,
  providerId: seller.id,
  providerUserId: seller.userId,
  providerName: seller.brandName,
  providerImage: seller.profilePhotoUrl,
  providerCity: seller.city,
  providerArea: seller.area,
  verified: seller.communityVerified,
  isWomenLed: seller.isWomenLed,
  rating,
  reviewCount,
  views: 0,
  // Same shop as the page: a distance pill on every card would repeat itself.
  distance: null,
  approximateLocation: false,
});

const SectionHeader = ({
  icon,
  iconClass,
  title,
  subtitle,
  href,
}: {
  icon: string;
  iconClass: string;
  title: string;
  subtitle?: string;
  href?: string;
}) => (
  <div className="flex items-end justify-between gap-3 mb-3">
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <IonIcon icon={icon} className={`text-[15px] ${iconClass}`} />
        <h3 className="text-[16px] font-extrabold text-gray-900 dark:text-white tracking-tight truncate">{title}</h3>
      </div>
      {subtitle && <p className="text-[11.5px] text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {href && (
      <Link href={href} className="shrink-0 flex items-center gap-0.5 text-[12px] font-bold text-amber-600 dark:text-amber-400">
        See all <IonIcon icon={arrowForwardOutline} className="text-[11px]" />
      </Link>
    )}
  </div>
);

/** "More from {seller}" — the seller's other items, as a swipeable rail. */
export function MoreFromSeller({
  related,
  provider,
  rating,
  reviewCount,
}: {
  related: ProductDetail[];
  provider: ProductProviderSummary;
  rating: number;
  reviewCount: number;
}) {
  const actions = useCatalogCardActions();
  const items = useMemo(
    () => related.map((r) => fromSellerItem(r, provider, rating, reviewCount)),
    [related, provider, rating, reviewCount],
  );
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader
        icon={storefront}
        iconClass="text-amber-500"
        title={`More from ${provider.brandName}`}
        href={`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`}
      />
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} variant="rail" isSaved={actions.isSaved(item.id)} onToggleSave={actions.toggle} />
        ))}
      </div>
    </section>
  );
}

/** Similar items from other businesses: a 2-column grid for products, a list for services. */
export function SimilarItems({
  productId,
  type,
  categoryId,
  categoryName,
}: {
  productId: string;
  type: CatalogType;
  categoryId?: string | null;
  categoryName?: string | null;
}) {
  const { data, isLoading, isError } = useSimilarItems(productId);
  const actions = useCatalogCardActions();

  if (isError) return null;
  if (isLoading) {
    return (
      <section>
        <div className="h-5 w-40 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse mb-3" />
        {type === "service" ? (
          <div className="space-y-2.5">
            <ServiceListSkeleton />
            <ServiceListSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}
      </section>
    );
  }

  const items = data?.data ?? [];
  if (items.length === 0) return null;

  // Only call it "similar" when the list is all close matches.
  const exact = data?.mode === "similar";
  const title = exact ? `Similar ${typeNoun(type)}` : "You may also like";
  const subtitle = exact ? "From other businesses" : `Popular ${typeNoun(type)} from other businesses`;
  const href = catalogHref(type, {
    title: categoryId && categoryName ? categoryName : `All ${typeNoun(type)}`,
    filters: categoryId ? { categoryId } : undefined,
  });
  const shown = type === "service" ? items.slice(0, 6) : items.slice(0, 10);

  return (
    <section>
      <SectionHeader icon={sparkles} iconClass="text-violet-500" title={title} subtitle={subtitle} href={href} />
      {type === "service" ? (
        <div className="space-y-2.5">
          {shown.map((item) => (
            <ServiceListCard
              key={item.id}
              item={item}
              isSaved={actions.isSaved(item.id)}
              onToggleSave={actions.toggle}
              onEnquire={actions.enquire}
              enquiring={actions.isEnquiring(item)}
              isOwn={actions.isOwn(item)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {shown.map((item) => (
            <ProductCard key={item.id} item={item} isSaved={actions.isSaved(item.id)} onToggleSave={actions.toggle} />
          ))}
        </div>
      )}
    </section>
  );
}
