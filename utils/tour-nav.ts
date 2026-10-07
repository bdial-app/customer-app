/**
 * How a guided tour moves the app around. The tours live in the app shell so
 * they survive page changes; screens listen for these and switch themselves.
 */

export type ExploreSegment = "businesses" | "products" | "services";

export const EXPLORE_SEGMENT_KEY = "__explore_segment";
export const EXPLORE_SEGMENT_EVENT = "tijarah:explore-segment";
export const MAIN_TAB_KEY = "__active_tab";
export const MAIN_TAB_EVENT = "tijarah:goto-tab";
export const PROVIDER_TAB_EVENT = "tijarah:provider-tab";

const store = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
};

/** Open a section of Explore. Stored too, so Explore opens on it if it isn't mounted yet. */
export function openExploreSegment(segment: ExploreSegment) {
  store(EXPLORE_SEGMENT_KEY, segment);
  window.dispatchEvent(new CustomEvent(EXPLORE_SEGMENT_EVENT, { detail: segment }));
}

/** Switch the main screen's tab. Stored too, for when the main screen mounts after this. */
export function openMainTab(tab: string) {
  store(MAIN_TAB_KEY, tab);
  window.dispatchEvent(new CustomEvent(MAIN_TAB_EVENT, { detail: tab }));
}

/** Switch the open business page's tab (Overview, Reviews, Catalogue, Photos). */
export function openProviderTab(tab: string) {
  window.dispatchEvent(new CustomEvent(PROVIDER_TAB_EVENT, { detail: tab }));
}
