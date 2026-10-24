import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import ProductDetailsPage from "@/app/product-details/page";
import { ListingIdProvider } from "@/hooks/useListingId";
import { productPath } from "@/utils/share-links";
import { loadProduct, productMetadata, resolveProduct } from "../../seo";
import { keepQuery, type RouteProps } from "../../route-props";

type Props = RouteProps<{ slug: string; item: string }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, item } = await params;
  const found = await resolveProduct(slug, item);
  if (!found) return { title: "Not found | Tijarah Connect", robots: { index: false } };
  return productMetadata(await loadProduct(found.productId), found.providerSlug, found.productSlug);
}

/**
 * tijarahapp.in/business/<slug>/<item slug>: one product or service. Old
 * slugs and ids redirect to the current address.
 */
export default async function ItemPage({ params, searchParams }: Props) {
  const { slug, item } = await params;
  const found = await resolveProduct(slug, item);
  if (!found) notFound();
  if (found.providerSlug !== decodeURIComponent(slug) || found.productSlug !== decodeURIComponent(item)) {
    permanentRedirect(`${productPath(found.providerSlug, found.productSlug)}${keepQuery(await searchParams)}`);
  }

  const details = await loadProduct(found.productId);
  const cache = new QueryClient();
  cache.setQueryData(["product", found.productId], details);

  return (
    <HydrationBoundary state={dehydrate(cache)}>
      <ListingIdProvider id={found.productId}>
        <ProductDetailsPage />
      </ListingIdProvider>
    </HydrationBoundary>
  );
}
