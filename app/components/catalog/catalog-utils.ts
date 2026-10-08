import { ROUTE_PATH } from "@/utils/contants";
import { distanceLabel } from "@/utils/distance-label";
import type {
  CatalogArea,
  CatalogBrowseParams,
  CatalogItem,
  CatalogSeeAll,
  CatalogSort,
  CatalogType,
} from "@/services/catalog.service";

export const formatPrice = (price: number | null, currency = "INR"): string | null => {
  if (price == null) return null;
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${Number(price).toLocaleString("en-IN")}`;
};

/** "2.1 km" / "In Pune" / null — the honest location label for a card. */
export const itemDistance = (item: CatalogItem, compact = true) =>
  distanceLabel(
    { distance: item.distance, approximateLocation: item.approximateLocation, city: item.providerCity },
    compact,
  );

export const itemLocation = (item: CatalogItem) =>
  [item.providerArea, item.providerCity].filter(Boolean).join(", ");

/** Where tapping a card goes; `src` attributes the product view in analytics. */
export const productHref = (id: string, src: "explore" | "home_feed" | "direct" = "explore") =>
  `${ROUTE_PATH.PRODUCT_DETAILS}?id=${id}&src=${src}`;

export const typeNoun = (type: CatalogType, plural = true) =>
  type === "service" ? (plural ? "services" : "service") : plural ? "products" : "product";

export const SORT_OPTIONS: { value: CatalogSort; label: string; needsLocation?: boolean }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "popular", label: "Popular" },
  { value: "nearest", label: "Nearest", needsLocation: true },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "New sellers" },
];

export const AREA_OPTIONS: { value: CatalogArea; label: string }[] = [
  { value: "nearby", label: "Within 10 km" },
  { value: "city", label: "My city" },
  { value: "all", label: "Anywhere" },
];

/** Price bands per type; services usually cost more than everyday products. */
export const PRICE_BANDS: Record<CatalogType, { label: string; min?: number; max?: number }[]> = {
  product: [
    { label: "Under ₹250", max: 250 },
    { label: "₹250 – ₹500", min: 250, max: 500 },
    { label: "₹500 – ₹1,000", min: 500, max: 1000 },
    { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
    { label: "Over ₹5,000", min: 5000 },
  ],
  service: [
    { label: "Under ₹500", max: 500 },
    { label: "₹500 – ₹1,000", min: 500, max: 1000 },
    { label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
    { label: "Over ₹5,000", min: 5000 },
  ],
};

/** The filters a listing can be opened with or changed to. */
export type CatalogFilters = Pick<
  CatalogBrowseParams,
  "categoryId" | "categoryIds" | "sort" | "area" | "minPrice" | "maxPrice" | "minRating" | "verified" | "womenLed" | "priced" | "featured"
>;

export const DEFAULT_FILTERS: CatalogFilters = { sort: "recommended", area: "all" };

/** Filters that narrow results (sort doesn't), for the badge on the filter button. */
export const activeFilterCount = (f: CatalogFilters) =>
  [
    f.area && f.area !== "all",
    f.minPrice != null || f.maxPrice != null,
    f.minRating,
    f.verified,
    f.womenLed,
    f.priced,
    f.featured,
  ].filter(Boolean).length;

const num = (v: string | null) => (v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);
const bool = (v: string | null) => (v === "true" ? true : undefined);

export const filtersFromSearchParams = (sp: URLSearchParams): CatalogFilters => {
  const sort = sp.get("sort") as CatalogSort | null;
  const area = sp.get("area") as CatalogArea | null;
  return {
    categoryId: sp.get("categoryId") || undefined,
    sort: sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : "recommended",
    area: area && AREA_OPTIONS.some((o) => o.value === area) ? area : "all",
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    minRating: num(sp.get("minRating")),
    verified: bool(sp.get("verified")),
    womenLed: bool(sp.get("womenLed")),
    priced: bool(sp.get("priced")),
    featured: bool(sp.get("featured")),
  };
};

/** Full-listing URL for a type, optional title, and filters (or a shelf's seeAll). */
export const catalogHref = (
  type: CatalogType,
  opts: { title?: string; filters?: CatalogFilters | CatalogSeeAll | null } = {},
) => {
  const sp = new URLSearchParams({ type });
  if (opts.title) sp.set("title", opts.title);
  Object.entries(opts.filters ?? {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === false) return;
    if (k === "sort" && v === "recommended") return;
    if (k === "area" && v === "all") return;
    sp.set(k, String(v));
  });
  return `${ROUTE_PATH.CATALOG}?${sp.toString()}`;
};
