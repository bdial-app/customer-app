import { ROUTE_PATH } from "./contants";

/**
 * The public address shared links live on. iOS and Android hand any link on
 * this domain straight to the installed app (it serves
 * /.well-known/apple-app-site-association and assetlinks.json); without the
 * app, the /b and /p landing pages open the store instead.
 *
 * Set in next.config — the production website.
 */
export const SHARE_ORIGIN = (process.env.NEXT_PUBLIC_SHARE_ORIGIN || "https://www.tijarahapp.in").replace(/\/+$/, "");

/**
 * The website's readable addresses. A business: /business/<slug>/; its
 * catalogue: /business/<slug>/catalogue/; one of its items:
 * /business/<slug>/<item slug>/. An id works in place of a slug too: the page
 * answers it with a redirect to the slug. Trailing slash, as every page here.
 */
export const businessPath = (slugOrId: string) => `/business/${encodeURIComponent(slugOrId)}/`;
export const cataloguePath = (slugOrId: string) => `/business/${encodeURIComponent(slugOrId)}/catalogue/`;
export const productPath = (businessSlugOrId: string, itemSlugOrId: string) =>
  `/business/${encodeURIComponent(businessSlugOrId)}/${encodeURIComponent(itemSlugOrId)}/`;

/**
 * A business: https://…/business/<slug>/ once the API sends slugs, else the
 * short https://…/b/<id>.
 */
export const businessShareUrl = (id: string, slug?: string | null) =>
  slug ? `${SHARE_ORIGIN}${businessPath(slug)}` : `${SHARE_ORIGIN}/b/${encodeURIComponent(id)}`;

/** A product or service: https://…/business/<business>/<item>/, else https://…/p/<id>. */
export const productShareUrl = (id: string, businessSlug?: string | null, slug?: string | null) =>
  businessSlug && slug
    ? `${SHARE_ORIGIN}${productPath(businessSlug, slug)}`
    : `${SHARE_ORIGIN}/p/${encodeURIComponent(id)}`;

/** A business's whole catalogue: https://…/business/<slug>/catalogue/, else https://…/c/<id>. */
export const catalogueShareUrl = (providerId: string, slug?: string | null) =>
  slug ? `${SHARE_ORIGIN}${cataloguePath(slug)}` : `${SHARE_ORIGIN}/c/${encodeURIComponent(providerId)}`;

export type ShareLinkKind = "business" | "product" | "catalogue";

const KIND_BY_LETTER: Record<string, ShareLinkKind> = { b: "business", p: "product", c: "catalogue" };

/**
 * The listing a share link points at, from the address it was opened on.
 * Accepts /b/<id> and /b/?id=<id> (and the same for /p and /c).
 */
export function readShareLink(pathname: string, search: string): { kind: ShareLinkKind; id: string } | null {
  const path = pathname.match(/^\/(b|p|c)\/([^/?#]+)\/?$/);
  if (path) return { kind: KIND_BY_LETTER[path[1]!]!, id: decodeURIComponent(path[2]!) };
  const bare = pathname.match(/^\/(b|p|c)\/?$/);
  const id = new URLSearchParams(search).get("id");
  if (bare && id) return { kind: KIND_BY_LETTER[bare[1]!]!, id };
  return null;
}

/** The in-app / web page a share link opens. */
export const detailsRouteFor = (link: { kind: ShareLinkKind; id: string }) => {
  const page =
    link.kind === "business" ? ROUTE_PATH.PROVIDER_DETAILS : link.kind === "catalogue" ? ROUTE_PATH.SHOP : ROUTE_PATH.PRODUCT_DETAILS;
  return `${page}?id=${encodeURIComponent(link.id)}&src=product_link`;
};
