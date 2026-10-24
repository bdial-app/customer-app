import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import ProviderDetailsPage from "@/app/provider-details/page";
import { ListingIdProvider } from "@/hooks/useListingId";
import { businessPath } from "@/utils/share-links";
import { businessMetadata, loadBusiness, resolveBusiness } from "../seo";
import type { RouteProps } from "../route-props";

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
  return businessMetadata(await loadBusiness(found.id), found.slug);
}

/**
 * tijarahapp.in/business/<slug>: a business's page on the website. The same
 * screen as the app's, drawn on the server with its data already in it, plus
 * what search engines read. An old slug or an id redirects to the current
 * slug, so every link ever shared still lands here.
 */
export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;
  const found = await resolveBusiness(slug);
  if (!found) notFound();
  if (found.slug !== decodeURIComponent(slug)) {
    permanentRedirect(`${businessPath(found.slug)}`);
  }

  const details = await loadBusiness(found.id);
  const cache = new QueryClient();
  cache.setQueryData(["provider-details", found.id], details);

  return (
    <HydrationBoundary state={dehydrate(cache)}>
      <ListingIdProvider id={found.id}>
        <ProviderDetailsPage />
      </ListingIdProvider>
    </HydrationBoundary>
  );
}
