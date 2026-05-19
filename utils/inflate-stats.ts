/**
 * Frontend stat inflation utility.
 *
 * When the platform is early-stage and real counts are low (<threshold),
 * we display believable inflated numbers so both customers and providers
 * see confidence-building metrics.
 *
 * Uses a date-seeded deterministic pseudo-random so numbers stay consistent
 * within a day but change naturally day-to-day.
 */

/** Simple hash for seeding — converts a string to a 32-bit integer */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/** Seeded pseudo-random number generator (mulberry32) */
function seededRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Inflate a stat value if it's below the minimum threshold.
 *
 * @param actual - The real count from the API
 * @param key - A unique key for this metric (ensures different metrics get different inflated values)
 * @param min - Minimum acceptable display value (default 25)
 * @param max - Maximum inflated value (default 45)
 * @returns The actual value if >= min, otherwise a deterministic daily inflated value
 */
export function inflateIfLow(
  actual: number,
  key: string,
  min = 25,
  max = 45,
): number {
  if (actual >= min) return actual;

  // Seed from today's date + metric key for deterministic daily values
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const seed = hashString(`${today}_${key}`);
  const rand = seededRandom(seed);

  return Math.floor(min + rand * (max - min));
}
