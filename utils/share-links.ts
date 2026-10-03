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

export type ShareLinkKind = "business" | "product";

/**
 * The listing a share link points at, from the address it was opened on.
 * Accepts /b/<id> and /b/?id=<id> (and the same for /p).
 */
export function readShareLink(pathname: string, search: string): { kind: ShareLinkKind; id: string } | null {
  const path = pathname.match(/^\/(b|p)\/([^/?#]+)\/?$/);
  if (path) return { kind: path[1] === "b" ? "business" : "product", id: decodeURIComponent(path[2]!) };
  const bare = pathname.match(/^\/(b|p)\/?$/);
  const id = new URLSearchParams(search).get("id");
  if (bare && id) return { kind: bare[1] === "b" ? "business" : "product", id };
  return null;
}

/** The in-app / web page a share link opens. */
export const detailsRouteFor = (link: { kind: ShareLinkKind; id: string }) =>
  `${link.kind === "business" ? ROUTE_PATH.PROVIDER_DETAILS : ROUTE_PATH.PRODUCT_DETAILS}?id=${encodeURIComponent(link.id)}&src=product_link`;
