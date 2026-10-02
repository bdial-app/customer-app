import type { ProviderData, ProviderDetailsResponse } from "@/services/provider.service";
import type { ProductDetail, ProductDetailsResponse } from "@/services/product.service";
import { formatMoney, type ShareBusiness, type ShareDeal, type ShareProduct } from "./share-copy";

/**
 * Turns the provider-details and product-details responses into what a share
 * shows. Pure, so the share hooks and anything else can use it.
 */

/** Fields the API sends on a provider but ProviderData does not declare. */
type ProviderExtras = ProviderData & { isWomenLed?: boolean; womenLedStatus?: string; communityVerified?: boolean };

const hour12 = (t: string | null | undefined) => {
  if (!t) return null;
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

/** The deal most worth leading with: the biggest saving that is live now. */
function bestDeal(offers: ProviderDetailsResponse["activeOffers"] | undefined): ShareDeal | null {
  const now = Date.now();
  const live = (offers ?? []).filter(
    (o) => o.isActive && new Date(o.startsAt).getTime() <= now && new Date(o.endsAt).getTime() > now,
  );
  if (!live.length) return null;
  const pct = live.filter((o) => o.discountType === "percentage").sort((a, b) => Number(b.discountValue) - Number(a.discountValue))[0];
  const flat = live.filter((o) => o.discountType !== "percentage").sort((a, b) => Number(b.discountValue) - Number(a.discountValue))[0];
  const pick = pct ?? flat!;
  const label = pick.discountType === "percentage" ? `${Number(pick.discountValue)}% off` : `${formatMoney(Number(pick.discountValue))} off`;
  return { label, title: pick.title, endsAt: pick.endsAt };
}

export function toShareBusiness(details: ProviderDetailsResponse): ShareBusiness {
  const p = details.provider as ProviderExtras;
  const products = [...(details.products ?? [])]
    .filter((x) => x.isActive !== false)
    // Hero items first, then the owner's own order.
    .sort((a, b) => Number(b.isHero) - Number(a.isHero) || a.displayOrder - b.displayOrder)
    .slice(0, 3)
    .map((x) => ({
      name: x.name,
      price: x.price != null ? Number(x.price) : null,
      currency: x.currency,
      imageUrl: x.photoUrls?.find(Boolean) ?? x.photoUrl ?? null,
    }));
  const open = hour12(p.openTime);
  const close = hour12(p.closeTime);
  return {
    id: p.id,
    name: p.brandName,
    category: (details.categories ?? []).slice(0, 2).map((c) => c.name).join(" · ") || null,
    area: p.area,
    city: p.city,
    description: p.description,
    logoUrl: p.profilePhotoUrl || p.websiteLogoUrl || null,
    // No banner? A gallery photo still beats an empty gradient.
    bannerUrl: p.bannerImageUrl || details.photos?.[0]?.imageUrl || null,
    verified: p.status === "active",
    womenLed: Boolean(p.isWomenLed || p.womenLedStatus === "approved"),
    communityVerified: Boolean(p.communityVerified),
    hours: open && close ? `${open} – ${close}` : null,
    deal: bestDeal(details.activeOffers),
    products,
  };
}

export function toShareProduct(details: ProductDetailsResponse, providerDetails: ProviderDetailsResponse | null): ShareProduct {
  const product = details.product as ProductDetail & { productType?: "product" | "service" };
  const summary = details.provider;
  // The full provider record, when we have it, adds the trust badges and the
  // shop's live deal; the product response alone carries neither.
  const business: ShareBusiness = providerDetails
    ? toShareBusiness(providerDetails)
    : {
        id: summary?.id ?? product.providerId,
        name: summary?.brandName ?? "this business",
        category: summary?.categories?.slice(0, 2).map((c) => c.name).join(" · ") || null,
        area: summary?.area ?? null,
        city: summary?.city ?? null,
        description: summary?.description ?? null,
        logoUrl: summary?.profilePhotoUrl ?? null,
        bannerUrl: summary?.photos?.[0]?.imageUrl ?? null,
        womenLed: Boolean(summary?.isWomenLed),
        communityVerified: Boolean(summary?.communityVerified),
      };
  return {
    id: product.id,
    name: product.name,
    price: product.price != null ? Number(product.price) : null,
    currency: product.currency,
    description: product.description,
    imageUrl: product.photoUrls?.find(Boolean) ?? product.photoUrl ?? null,
    kind: product.productType === "service" ? "service" : "product",
    business,
  };
}
