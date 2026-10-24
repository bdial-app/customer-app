import { businessJsonLd, jsonLdHtml, loadBusiness, resolveBusiness } from "@/app/business/seo";

/** A business's structured data (LocalBusiness, breadcrumbs), drawn into the HTML itself. */
export default async function BusinessStructuredData({ params }: { params: Promise<{ slug: string }> }) {
  const found = await resolveBusiness((await params).slug);
  if (!found) return null;
  const details = await loadBusiness(found.id);
  return <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(businessJsonLd(details, found.slug))} />;
}
