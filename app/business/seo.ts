import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ProviderDetailsResponse } from "@/services/provider.service";
import type { ProductDetailsResponse } from "@/services/product.service";
import type { SellerCatalogue } from "@/services/catalog.service";
import type { ResolvedBusiness, ResolvedProduct } from "@/services/slug.service";
import { businessPath, cataloguePath, productPath } from "@/utils/share-links";

/**
 * Server-side helpers for the website's /business/… pages: loading a listing
 * by its address, and describing it to search engines and link previews.
 * Used only by the *.web.tsx pages, which only the server build has.
 */

/** The address search engines should treat as the real one. */
export const SITE_ORIGIN = "https://www.tijarahapp.in";

/** Only the production site is indexed; uat, develop and previews would be duplicates. */
const INDEXED_HOSTS = new Set(["www.tijarahapp.in", "tijarahapp.in"]);

export async function isIndexedHost(): Promise<boolean> {
  const host = ((await headers()).get("x-forwarded-host") ?? (await headers()).get("host") ?? "").toLowerCase();
  return INDEXED_HOSTS.has(host.replace(/:\d+$/, ""));
}

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
/** Listings change rarely; a few minutes' delay on an edit is fine. */
const REVALIDATE_S = 300;

class NotFound extends Error {}

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { next: { revalidate: REVALIDATE_S } });
  if (res.status === 404 || res.status === 400) throw new NotFound(path);
  if (!res.ok) throw new Error(`${res.status} from ${path}`);
  return res.json() as Promise<T>;
}

/** null when the address leads nowhere, so the page can answer 404. */
async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof NotFound) return null;
    throw err;
  }
}

const enc = encodeURIComponent;

export const resolveBusiness = (slug: string) => orNull(api<ResolvedBusiness>(`/slugs/business/${enc(slug)}`));
export const resolveProduct = (slug: string, item: string) =>
  orNull(api<ResolvedProduct>(`/slugs/business/${enc(slug)}/${enc(item)}`));
export const loadBusiness = (id: string) => api<ProviderDetailsResponse>(`/providers/${enc(id)}/details`);
export const loadProduct = (id: string) => api<ProductDetailsResponse>(`/products/${enc(id)}`);
export const loadCatalogue = (id: string) => api<SellerCatalogue>(`/products/catalog/seller/${enc(id)}`);
export const loadSitemap = () =>
  api<{
    businesses: { slug: string; updatedAt: string }[];
    items: { businessSlug: string; slug: string; createdAt: string }[];
  }>(`/slugs/sitemap`);

// ── Describing a listing ─────────────────────────────────

const clip = (text: string | null | undefined, max: number) => {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6))}…`;
};

const place = (area?: string | null, city?: string | null) => [area, city].filter(Boolean).join(", ");

const money = (amount: number | string | null | undefined, currency?: string | null) => {
  if (amount == null || Number(amount) <= 0) return null;
  const symbol = !currency || currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

async function baseMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image: string | null;
}): Promise<Metadata> {
  const url = `${SITE_ORIGIN}${opts.path}`;
  const indexed = await isIndexedHost();
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: indexed ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "Tijarah Connect",
      url,
      title: opts.title,
      description: opts.description,
      images: opts.image ? [{ url: opts.image }] : undefined,
    },
    twitter: {
      card: opts.image ? "summary_large_image" : "summary",
      title: opts.title,
      description: opts.description,
      images: opts.image ? [opts.image] : undefined,
    },
    // Safari's Smart App Banner: "Open" when the app is installed, "Get" when it isn't.
    other: { "apple-itunes-app": "app-id=6772507338" },
  };
}

const businessImage = (d: ProviderDetailsResponse) =>
  d.provider.bannerImageUrl || d.provider.profilePhotoUrl || d.photos?.[0]?.imageUrl || null;

export function businessMetadata(d: ProviderDetailsResponse, slug: string) {
  const p = d.provider;
  const categories = (d.categories ?? []).map((c) => c.name).filter(Boolean).slice(0, 2).join(" & ");
  const where = place(p.area, p.city);
  const lead = [categories, where && `in ${where}`].filter(Boolean).join(" ");
  return baseMetadata({
    title: `${p.brandName}${lead ? ` – ${lead}` : ""} | Tijarah Connect`,
    description:
      clip(p.description, 155) ||
      `${p.brandName}${lead ? `, ${lead}` : ""}. See photos, prices and reviews, and call or WhatsApp directly on Tijarah Connect.`,
    path: businessPath(slug),
    image: businessImage(d),
  });
}

export function catalogueMetadata(c: SellerCatalogue, slug: string) {
  const counts = [
    c.counts.products > 0 && `${c.counts.products} ${c.counts.products === 1 ? "product" : "products"}`,
    c.counts.services > 0 && `${c.counts.services} ${c.counts.services === 1 ? "service" : "services"}`,
  ]
    .filter(Boolean)
    .join(" and ");
  const where = place(c.provider.area, c.provider.city);
  return baseMetadata({
    title: `${c.provider.name} catalogue${where ? ` – ${where}` : ""} | Tijarah Connect`,
    description: `${counts || "Everything"} from ${c.provider.name}${where ? ` in ${where}` : ""}, with prices. ${c.items
      .slice(0, 4)
      .map((i) => i.name)
      .join(", ")}.`.slice(0, 160),
    path: cataloguePath(slug),
    image: c.items.find((i) => i.photoUrl)?.photoUrl ?? c.provider.bannerUrl ?? c.provider.logoUrl,
  });
}

export function productMetadata(d: ProductDetailsResponse, businessSlug: string, itemSlug: string) {
  const item = d.product;
  // The item endpoint always sends its business; the type allows for older responses.
  const shop = d.provider!;
  const price = money(item.price, item.currency);
  const where = place(shop.area, shop.city);
  return baseMetadata({
    title: `${item.name}${price ? ` – ${price}` : ""} | ${shop.brandName}`,
    description:
      clip(item.description, 155) ||
      `${item.name}${price ? ` for ${price}` : ""} from ${shop.brandName}${where ? `, ${where}` : ""}. Order by call or WhatsApp on Tijarah Connect.`,
    path: productPath(businessSlug, itemSlug),
    image: item.photoUrls?.find(Boolean) ?? item.photoUrl ?? shop.profilePhotoUrl,
  });
}

// ── Structured data (schema.org) ─────────────────────────

/**
 * What the business is, for search results: name, place, hours, rating and
 * the first few things it sells. The phone number is left out on purpose —
 * the page offers it to people, not to scrapers.
 */
export function businessJsonLd(d: ProviderDetailsResponse, slug: string) {
  const p = d.provider;
  const url = `${SITE_ORIGIN}${businessPath(slug)}`;
  const lat = p.latitude != null ? Number(p.latitude) : null;
  const lng = p.longitude != null ? Number(p.longitude) : null;
  const time = (t: string | null | undefined) => (t ? t.slice(0, 5) : null);
  const opens = time(p.openTime);
  const closes = time(p.closeTime);
  const images = [p.bannerImageUrl, p.profilePhotoUrl, ...(d.photos ?? []).map((x) => x.imageUrl)].filter(Boolean);
  return [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${url}#business`,
      name: p.brandName,
      url,
      description: clip(p.description, 500) || undefined,
      image: images.slice(0, 5),
      logo: p.profilePhotoUrl || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: p.address || undefined,
        addressLocality: p.area || p.city || undefined,
        addressRegion: p.area ? p.city : undefined,
        postalCode: p.pincode || undefined,
        addressCountry: "IN",
      },
      geo: lat != null && lng != null && !(lat === 0 && lng === 0) ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng } : undefined,
      openingHoursSpecification:
        opens && closes
          ? {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              opens,
              closes,
            }
          : undefined,
      aggregateRating:
        d.stats?.reviewCount > 0
          ? { "@type": "AggregateRating", ratingValue: d.stats.rating, reviewCount: d.stats.reviewCount, bestRating: 5, worstRating: 1 }
          : undefined,
      priceRange: d.stats?.priceRange
        ? [money(d.stats.priceRange.min, d.stats.priceRange.currency), money(d.stats.priceRange.max, d.stats.priceRange.currency)]
            .filter(Boolean)
            .join(" – ") || undefined
        : undefined,
      sameAs: [
        p.websiteUrl,
        p.instagramHandle && `https://www.instagram.com/${p.instagramHandle.replace(/^@/, "")}`,
      ].filter(Boolean),
      makesOffer: (d.products ?? []).slice(0, 10).map((item) => ({
        "@type": "Offer",
        url: item.slug ? `${SITE_ORIGIN}${productPath(slug, item.slug)}` : undefined,
        price: item.price != null && Number(item.price) > 0 ? Number(item.price) : undefined,
        priceCurrency: item.price != null && Number(item.price) > 0 ? item.currency || "INR" : undefined,
        itemOffered: { "@type": item.productType === "service" ? "Service" : "Product", name: item.name },
      })),
    },
    breadcrumbs([
      ["Tijarah Connect", `${SITE_ORIGIN}/`],
      [p.brandName, url],
    ]),
  ];
}

export function productJsonLd(d: ProductDetailsResponse, businessSlug: string, itemSlug: string) {
  const item = d.product;
  // The item endpoint always sends its business; the type allows for older responses.
  const shop = d.provider!;
  const url = `${SITE_ORIGIN}${productPath(businessSlug, itemSlug)}`;
  const shopUrl = `${SITE_ORIGIN}${businessPath(businessSlug)}`;
  const price = item.price != null && Number(item.price) > 0 ? Number(item.price) : null;
  const isService = item.productType === "service";
  return [
    {
      "@context": "https://schema.org",
      "@type": isService ? "Service" : "Product",
      name: item.name,
      url,
      description: clip(item.description, 500) || undefined,
      image: [...(item.photoUrls ?? []), item.photoUrl].filter(Boolean).slice(0, 5),
      category: item.subcategory?.name || item.category?.name || undefined,
      ...(isService
        ? { provider: { "@type": "LocalBusiness", name: shop.brandName, url: shopUrl } }
        : { brand: { "@type": "Brand", name: shop.brandName } }),
      offers: price
        ? {
            "@type": "Offer",
            url,
            price,
            priceCurrency: item.currency || "INR",
            availability: "https://schema.org/InStock",
            seller: { "@type": "LocalBusiness", name: shop.brandName, url: shopUrl },
          }
        : undefined,
    },
    breadcrumbs([
      ["Tijarah Connect", `${SITE_ORIGIN}/`],
      [shop.brandName, shopUrl],
      [item.name, url],
    ]),
  ];
}

export function catalogueJsonLd(c: SellerCatalogue, slug: string) {
  const shopUrl = `${SITE_ORIGIN}${businessPath(slug)}`;
  const url = `${SITE_ORIGIN}${cataloguePath(slug)}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${c.provider.name} catalogue`,
      url,
      numberOfItems: c.items.length,
      itemListElement: c.items.slice(0, 50).map((i, n) => ({
        "@type": "ListItem",
        position: n + 1,
        name: i.name,
        url: i.slug ? `${SITE_ORIGIN}${productPath(slug, i.slug)}` : undefined,
      })),
    },
    breadcrumbs([
      ["Tijarah Connect", `${SITE_ORIGIN}/`],
      [c.provider.name, shopUrl],
      ["Catalogue", url],
    ]),
  ];
}

function breadcrumbs(trail: [string, string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })),
  };
}

/** JSON for a <script type="application/ld+json">, safe to drop into HTML. */
export const jsonLdHtml = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});
