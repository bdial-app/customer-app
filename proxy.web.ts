import { NextResponse, type NextRequest } from "next/server";
import { businessPath, cataloguePath, productPath } from "@/utils/share-links";

/**
 * The /business/… pages stream (the root loading screen starts the response
 * before the page runs), so a redirect or a "not found" decided inside the
 * page reaches the browser as a 200 with a script. Search engines need the
 * real status: an old slug or an id answers 308 to the current address, and
 * an unknown or hidden listing answers 404. Website build only (*.web.ts).
 */
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/business\/([^/]+)(?:\/([^/]+))?\/?$/);
  if (!match) return NextResponse.next();
  const slug = decodeURIComponent(match[1]!);
  const sub = match[2] ? decodeURIComponent(match[2]) : null;
  const item = sub && sub !== "catalogue" ? sub : null;
  const enc = encodeURIComponent;

  let res: Response;
  try {
    res = await fetch(`${API}/slugs/business/${enc(slug)}${item ? `/${enc(item)}` : ""}`, {
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    return NextResponse.next(); // The page tries again and handles it.
  }
  if (res.status === 404 || res.status === 400) {
    // No route answers here, so Next draws its not-found page with a 404.
    return NextResponse.rewrite(new URL("/_listing-not-found", request.url));
  }
  if (!res.ok) return NextResponse.next();

  const found = (await res.json()) as { slug?: string; providerSlug?: string; productSlug?: string };
  const canonical = item
    ? productPath(found.providerSlug!, found.productSlug!)
    : sub === "catalogue"
      ? cataloguePath(found.slug!)
      : businessPath(found.slug!);
  const here = request.nextUrl.pathname.endsWith("/") ? request.nextUrl.pathname : `${request.nextUrl.pathname}/`;
  if (decodeURIComponent(here) !== decodeURIComponent(canonical)) {
    const to = new URL(canonical, request.url);
    to.search = request.nextUrl.search;
    return NextResponse.redirect(to, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/business/:path*"],
};
