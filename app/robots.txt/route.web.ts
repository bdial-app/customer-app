import { isIndexedHost, SITE_ORIGIN } from "../business/seo";

/**
 * Only the production website is crawled. The ?id= screens are the app's own
 * copies of the /business/… pages, so search engines are kept to the latter.
 * A route rather than robots.ts: metadata files don't take the .web.ts
 * extension that keeps this out of the app's build.
 */
const PRIVATE = [
  "/auth/",
  "/provider/",
  "/provider-onboarding/",
  "/add-location/",
  "/provider-details/",
  "/product-details/",
  "/shop/",
  "/b/",
  "/p/",
  "/c/",
  "/go/",
  "/r/",
  "/invite/",
];

export async function GET() {
  const body = (await isIndexedHost())
    ? ["User-agent: *", "Allow: /", ...PRIVATE.map((p) => `Disallow: ${p}`), "", `Sitemap: ${SITE_ORIGIN}/sitemap.xml`, ""]
    : ["User-agent: *", "Disallow: /", ""];
  return new Response(body.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
