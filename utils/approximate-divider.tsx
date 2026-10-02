import { cityOf, isApproximate, type HasDistance } from "./distance-label";

/**
 * Lists are sorted with real pins first and city-centre pins after them, so
 * the point where distances stop is also the point where the list switches to
 * businesses we can only place in the town. Say so once, instead of letting
 * "2.4 km" silently turn into "In Pune".
 */
export const startsApproximateRun = (items: HasDistance[], index: number): boolean =>
  isApproximate(items[index]) && (index === 0 || !isApproximate(items[index - 1]));

/** Only worth a heading when the list also has real distances above it. */
export const shouldShowApproximateDivider = (items: HasDistance[], index: number): boolean =>
  index > 0 && startsApproximateRun(items, index);

export function ApproximateDivider({ item }: { item: HasDistance }) {
  const city = cityOf(item);
  return (
    <div className="col-span-2 flex items-center gap-2 pt-2">
      <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
      <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 whitespace-nowrap">
        {city ? `More in ${city}` : "More nearby"} · exact location not set
      </span>
      <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
    </div>
  );
}
