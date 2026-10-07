import { ROUTE_PATH } from "./contants";

/**
 * The public address shared links live on. iOS and Android hand any link on
 * this domain straight to the installed app (it serves
 * /.well-known/apple-app-site-association and assetlinks.json); without the
 * app, the /b and /p landing pages open the store instead.
 *
 * Comes from NEXT_APP_BASE_URL via next.config — the UAT web app for now.
 */
export const SHARE_ORIGIN = (process.env.NEXT_PUBLIC_SHARE_ORIGIN || "https://uat.tijarahapp.in").replace(/\/+$/, "");

/** https://…/b/<id> — a business. */
export const businessShareUrl = (id: string) => `${SHARE_ORIGIN}/b/${encodeURIComponent(id)}`;

/** https://…/p/<id> — a product or service. */
export const productShareUrl = (id: string) => `${SHARE_ORIGIN}/p/${encodeURIComponent(id)}`;

/** https://…/c/<business id> — a business's whole catalogue. */
export const catalogueShareUrl = (providerId: string) => `${SHARE_ORIGIN}/c/${encodeURIComponent(providerId)}`;

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
