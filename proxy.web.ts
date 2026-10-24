import { NextResponse, type NextRequest } from "next/server";
import { businessPath, cataloguePath, productPath } from "@/utils/share-links";

/**
 * Real HTTP answers for the website's listing addresses, which pages can't
 * give themselves: they stream (the root loading screen starts the response
 * before the page runs), so a redirect or "not found" from a page reaches the
 * browser as a 200 with a script. Website build only (*.web.ts).
 *
 * - /business/…: an old slug or an id answers 308 to the current address;
 *   an unknown or hidden listing answers 404.
 * - The app's own screens opened by their old address (/provider-details?id=,
 *   /product-details?id=, /shop?id=) answer 308 to the /business/… page.
 *
 * Only for a browser loading the page: navigations inside the site (RSC
 * requests) go through untouched — the pages handle those themselves, and
 * the onboarding tour relies on the app's screens keeping their addresses.
 */
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const enc = encodeURIComponent;

const isInSiteNavigation = (request: NextRequest) =>
  request.headers.get("rsc") === "1" ||
  request.headers.has("next-router-prefetch") ||
  request.nextUrl.searchParams.has("_rsc");

async function getJson<T>(path: string): Promise<{ status: number; data: T | null }> {
  try {
    const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(4000) });
    return { status: res.status, data: res.ok ? ((await res.json()) as T) : null };
  } catch {
    return { status: 0, data: null };
  }
}

function redirect(request: NextRequest, path: string, drop: string[] = []) {
  const to = new URL(path, request.url);
  const query = new URLSearchParams(request.nextUrl.search);
  for (const k of drop) query.delete(k);
  to.search = query.toString();
  return NextResponse.redirect(to, 308);
}

/** /provider-details?id=…, /product-details?id=… or ?b=&p=, /shop?id=… → their /business/… page. */
async function fromAppScreen(request: NextRequest, screen: string) {
  const q = request.nextUrl.searchParams;
  if (q.get("tour") === "1") return NextResponse.next();
  const id = q.get("id");
  const drop = ["id", "b", "p"];

  if (screen === "product-details") {
    const b = q.get("b");
    const p = q.get("p");
    if (b && p) {
      const { data } = await getJson<{ providerSlug: string; productSlug: string }>(`/slugs/business/${enc(b)}/${enc(p)}`);
      return data ? redirect(request, productPath(data.providerSlug, data.productSlug), drop) : NextResponse.next();
    }
    if (!id) return NextResponse.next();
    const { data } = await getJson<{ product?: { slug?: string }; provider?: { slug?: string } }>(`/products/${enc(id)}`);
    const shop = data?.provider?.slug;
    const item = data?.product?.slug;
    return shop && item ? redirect(request, productPath(shop, item), drop) : NextResponse.next();
  }

  if (!id) return NextResponse.next();
  const { data } = await getJson<{ slug: string }>(`/slugs/business/${enc(id)}`);
  if (!data) return NextResponse.next(); // Let the screen say what's wrong.
  return redirect(request, screen === "shop" ? cataloguePath(data.slug) : businessPath(data.slug), drop);
}

export default async function proxy(request: NextRequest) {
  if (isInSiteNavigation(request)) return NextResponse.next();
  const path = request.nextUrl.pathname;

  const screen = path.match(/^\/(provider-details|product-details|shop)\/?$/);
  if (screen) return fromAppScreen(request, screen[1]!);

  const match = path.match(/^\/business\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!match) return NextResponse.next();
  const slug = decodeURIComponent(match[1]!);
  const sub = match[2] ? decodeURIComponent(match[2]) : null;
  const item = sub && sub !== "catalogue" ? sub : null;

  const { status, data } = await getJson<{ slug?: string; providerSlug?: string; productSlug?: string }>(
    `/slugs/business/${enc(slug)}${item ? `/${enc(item)}` : ""}`,
  );
  if (status === 404 || status === 400) {
    // No route answers here, so Next draws its not-found page with a 404.
    return NextResponse.rewrite(new URL("/_listing-not-found", request.url));
  }
  if (!data) return NextResponse.next(); // The page tries again and handles it.

  const canonical = item
    ? productPath(data.providerSlug!, data.productSlug!)
    : sub === "catalogue"
      ? cataloguePath(data.slug!)
      : businessPath(data.slug!);
  const here = path.endsWith("/") ? path : `${path}/`;
  return decodeURIComponent(here) !== decodeURIComponent(canonical) ? redirect(request, canonical) : NextResponse.next();
}

export const config = {
  matcher: ["/business/:path*", "/provider-details/:path*", "/product-details/:path*", "/shop/:path*"],
};
