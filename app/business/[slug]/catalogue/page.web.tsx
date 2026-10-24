import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import SellerCatalogueContent from "@/app/components/shop/seller-catalogue-content";
import { ListingIdProvider } from "@/hooks/useListingId";
import { cataloguePath } from "@/utils/share-links";
import { catalogueMetadata, loadCatalogue, resolveBusiness } from "../../seo";
import type { RouteProps } from "../../route-props";

/**
 * Rendered on a listing's first visit, then served from the edge cache and
 * refreshed in the background at most every 5 minutes — so opening a
 * business is instant instead of a server round trip every time.
 */
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

type Props = RouteProps<{ slug: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await resolveBusiness(slug);
  if (!found) return { title: "Not found | Tijarah Connect", robots: { index: false } };
  return catalogueMetadata(await loadCatalogue(found.id), found.slug);
}

/** tijarahapp.in/business/<slug>/catalogue: everything a business sells, with prices. */
export default async function CataloguePage({ params }: Props) {
  const { slug } = await params;
  const found = await resolveBusiness(slug);
  if (!found) notFound();
  if (found.slug !== decodeURIComponent(slug)) {
    permanentRedirect(`${cataloguePath(found.slug)}`);
  }

  const catalogue = await loadCatalogue(found.id);
  const cache = new QueryClient();
  cache.setQueryData(["seller-catalogue", found.id], catalogue);

  return (
    <HydrationBoundary state={dehydrate(cache)}>
      <ListingIdProvider id={found.id}>
        <SellerCatalogueContent />
      </ListingIdProvider>
    </HydrationBoundary>
  );
}
