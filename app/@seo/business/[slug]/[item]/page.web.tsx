import { jsonLdHtml, loadProduct, productJsonLd, resolveProduct } from "@/app/business/seo";

/** Cached with its page; see app/business/[slug]/page.web.tsx. */
export const revalidate = 300;
export function generateStaticParams() {
  return [];
}

/** An item's structured data (Product or Service with its offer, breadcrumbs), drawn into the HTML itself. */
export default async function ItemStructuredData({ params }: { params: Promise<{ slug: string; item: string }> }) {
  const { slug, item } = await params;
  const found = await resolveProduct(slug, item);
  if (!found) return null;
  const details = await loadProduct(found.productId);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdHtml(productJsonLd(details, found.providerSlug, found.productSlug))}
    />
  );
}
