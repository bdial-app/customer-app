import { catalogueJsonLd, jsonLdHtml, loadCatalogue, resolveBusiness } from "@/app/business/seo";

/** Cached with its page; see app/business/[slug]/page.web.tsx. */
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

/** A catalogue's structured data (the item list, breadcrumbs), drawn into the HTML itself. */
export default async function CatalogueStructuredData({ params }: { params: Promise<{ slug: string }> }) {
  const found = await resolveBusiness((await params).slug);
  if (!found) return null;
  const catalogue = await loadCatalogue(found.id);
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(catalogueJsonLd(catalogue, found.slug))} />;
}
