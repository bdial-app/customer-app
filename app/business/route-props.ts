/** Props of a /business/… page. Spelled out: the export build has no generated PageProps for these routes. */
export type RouteProps<P> = {
  params: Promise<P>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** The query string to carry across a redirect (?src=…, ?review=1 …), or "". */
export function keepQuery(search: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    for (const value of Array.isArray(v) ? v : v != null ? [v] : []) q.append(k, value);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
