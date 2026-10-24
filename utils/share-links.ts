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
 * Whether this build has the /business/… pages. The website (server build)
 * does; the app's static build doesn't, so its links use its own screens.
 */
export const HAS_LISTING_PAGES = process.env.NEXT_PUBLIC_LISTING_PAGES === "1";

type Query = Record<string, string | number | null | undefined>;
const withQuery = (path: string, query?: Query) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v != null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
};

/**
 * Where a link to a business goes inside the site or app: /business/<slug>/
 * on the website (its id when the slug isn't known — the page redirects),
 * the business screen in the app.
 */
// Some older card types still type an id as `string | number`.
type Ref = { id: string | number; slug?: string | null };

export const businessHref = (b: Ref, query?: Query) =>
  HAS_LISTING_PAGES
    ? withQuery(businessPath(b.slug || String(b.id)), query)
    : withQuery(ROUTE_PATH.PROVIDER_DETAILS, { id: b.id, ...query });

/** A business's whole catalogue: /business/<slug>/catalogue/ on the website. */
export const catalogueHref = (b: Ref, query?: Query) =>
  HAS_LISTING_PAGES
    ? withQuery(cataloguePath(b.slug || String(b.id)), query)
    : withQuery(ROUTE_PATH.SHOP, { id: b.id, ...query });

/**
 * A product or service: /business/<business>/<item>/ on the website when its
 * business is known (slugs, or ids that redirect to them); otherwise, and in
 * the app, the item screen — which on the website then shows the readable
 * address once it has loaded.
 */
export const productHref = (
  p: { id: string; slug?: string | null; providerId?: string | null; providerSlug?: string | null },
  query?: Query,
) => {
  const business = p.providerSlug || p.providerId;
  return HAS_LISTING_PAGES && business
    ? withQuery(productPath(business, p.slug || p.id), query)
    : withQuery(ROUTE_PATH.PRODUCT_DETAILS, { id: p.id, ...query });
};

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
  const query = { src: "product_link" };
  if (link.kind === "business") return businessHref({ id: link.id }, query);
  if (link.kind === "catalogue") return catalogueHref({ id: link.id }, query);
  return productHref({ id: link.id }, query);
};
