"use client";

import { createContext, useContext, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { resolveBusinessSlug, resolveProductSlug } from "@/services/slug.service";
import { HAS_LISTING_PAGES } from "@/utils/share-links";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The id of the listing a details page shows, when a route already knows it:
 * the website's /business/<slug> pages look it up on the server and pass it
 * down here, so the page doesn't read the address itself.
 */
const ListingIdContext = createContext<string | null>(null);

export function ListingIdProvider({ id, children }: { id: string; children: React.ReactNode }) {
  return <ListingIdContext.Provider value={id}>{children}</ListingIdContext.Provider>;
}

export interface ListingId {
  /** "" until known. */
  id: string;
  /** Still looking a slug up. */
  resolving: boolean;
  /** The slug leads nowhere (unknown, or the listing is hidden). */
  notFound: boolean;
}

/**
 * Which business, or which product or service, a details page is for. In
 * order: the id a /business/… route passed down; ?id= holding an id; ?id=
 * holding a business slug (from a /business/<slug> link opened in the app);
 * ?b=<business slug>&p=<product slug> for an item.
 */
export function useListingId(kind: "business" | "product"): ListingId {
  const fromRoute = useContext(ListingIdContext);
  const params = useSearchParams();
  const raw = (params.get("id") ?? "").trim();
  const b = (params.get("b") ?? "").trim();
  const p = (params.get("p") ?? "").trim();

  const slugLookup: { key: string[]; fn: () => Promise<string> } | null = fromRoute
    ? null
    : kind === "product" && b && p
      ? { key: ["slug", "product", b, p], fn: () => resolveProductSlug(b, p).then((r) => r.productId) }
      : kind === "business" && raw && !UUID.test(raw)
        ? { key: ["slug", "business", raw], fn: () => resolveBusinessSlug(raw).then((r) => r.id) }
        : null;

  const lookup = useQuery({
    queryKey: slugLookup?.key ?? ["slug", "none"],
    queryFn: slugLookup?.fn ?? (async () => ""),
    enabled: !!slugLookup,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (fromRoute) return { id: fromRoute, resolving: false, notFound: false };
  if (slugLookup) {
    return { id: lookup.data ?? "", resolving: lookup.isPending, notFound: lookup.isError };
  }
  return { id: raw, resolving: false, notFound: false };
}

const APP_SCREEN = /^\/(provider-details|product-details|shop)\/?$/;

/**
 * On the website, once a details screen opened by its old address
 * (/provider-details?id=…) knows the listing's readable one, the address bar
 * shows that instead — without reloading — so what people copy or share is
 * the /business/… link. Not during the onboarding tour, which follows the
 * screen's own address, and never in the app.
 */
export function useReadableAddress(path: string | null) {
  useEffect(() => {
    if (!HAS_LISTING_PAGES || !path || !APP_SCREEN.test(window.location.pathname)) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") return;
    for (const k of ["id", "b", "p"]) params.delete(k);
    const query = params.toString();
    window.history.replaceState(window.history.state, "", query ? `${path}?${query}` : path);
  }, [path]);
}
