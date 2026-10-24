/**
 * Which address is the real one. Plain module (no server-only imports) so the
 * proxy can use it too.
 */

/** The address search engines should treat as the real one. */
export const SITE_ORIGIN = "https://www.tijarahapp.in";

/** Only the production site is indexed; uat, develop and previews would be duplicates. */
const INDEXED_HOSTS = new Set(["www.tijarahapp.in", "tijarahapp.in"]);

export const isIndexedHostName = (host: string | null | undefined) =>
  INDEXED_HOSTS.has((host ?? "").toLowerCase().replace(/:\d+$/, ""));
