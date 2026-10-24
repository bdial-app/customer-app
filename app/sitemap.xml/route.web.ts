import { businessPath, cataloguePath, productPath } from "@/utils/share-links";
import { loadSitemap, SITE_ORIGIN } from "../business/seo";

/** Rebuilt at most hourly: new listings reach search engines within the hour. */
export const revalidate = 3600;

type Entry = { path: string; lastModified?: string; changefreq: string; priority: number };

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Every public business, its catalogue, and each item it sells. A route
 * rather than sitemap.ts: metadata files don't take the .web.ts extension
 * that keeps this out of the app's build.
 */
export async function GET() {
  const entries: Entry[] = [
    { path: "/", changefreq: "daily", priority: 1 },
    { path: "/about-us/", changefreq: "monthly", priority: 0.3 },
  ];
  const data = await loadSitemap().catch(() => null);
  if (data) {
    const withItems = new Set(data.items.map((i) => i.businessSlug));
    for (const b of data.businesses) {
      entries.push({ path: businessPath(b.slug), lastModified: b.updatedAt, changefreq: "weekly", priority: 0.8 });
      if (withItems.has(b.slug)) entries.push({ path: cataloguePath(b.slug), changefreq: "weekly", priority: 0.6 });
    }
    for (const i of data.items) {
      entries.push({ path: productPath(i.businessSlug, i.slug), lastModified: i.createdAt, changefreq: "monthly", priority: 0.5 });
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) =>
      [
        "<url>",
        `<loc>${xml(`${SITE_ORIGIN}${e.path}`)}</loc>`,
        e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : "",
        `<changefreq>${e.changefreq}</changefreq>`,
        `<priority>${e.priority}</priority>`,
        "</url>",
      ].join(""),
    ),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
