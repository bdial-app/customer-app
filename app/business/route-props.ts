/**
 * Props of a /business/… page. Spelled out: the export build has no generated
 * PageProps for these routes. No searchParams: reading them would stop the
 * page being cached (the proxy carries the query across redirects instead).
 */
export type RouteProps<P> = {
  params: Promise<P>;
};
