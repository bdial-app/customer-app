/**
 * What to print where a card shows "2.4 km".
 *
 * A business we only know the city for is pinned at that city's centre, so the
 * server sends distance: null with approximateLocation: true rather than a
 * distance that would be wrong by kilometres. Those businesses are still worth
 * showing — they are in the town the customer is searching — so the card says
 * "In Pune" instead of leaving an empty space where the distance belongs.
 */
export interface HasDistance {
  distance?: number | null;
  approximateLocation?: boolean;
  city?: string | null;
  location?: string | null;
}

const formatDistance = (d: number, compact: boolean) =>
  d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}${compact ? '' : ' '}km`;

/** The town, from whichever field the endpoint provided. */
export const cityOf = (p: HasDistance): string | null => {
  const city = p.city?.trim();
  if (city) return city;
  // `location` is "Area, City" — the town is the last part.
  const parts = (p.location ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : null;
};

/**
 * The label for the distance pill, or null when there is nothing honest to say.
 */
export const distanceLabel = (p: HasDistance, compact = false): string | null => {
  if (p.distance != null) return formatDistance(p.distance, compact);
  if (!p.approximateLocation) return null;
  const city = cityOf(p);
  return city ? `In ${city}` : null;
};

/** True when the pill is a town name rather than a real distance. */
export const isApproximate = (p: HasDistance): boolean =>
  p.distance == null && Boolean(p.approximateLocation) && Boolean(cityOf(p));
