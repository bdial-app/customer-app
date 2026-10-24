"use client";

import { createContext, useContext } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { resolveBusinessSlug, resolveProductSlug } from "@/services/slug.service";

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
