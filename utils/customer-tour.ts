import { createTourStore } from "./tour-store";

/**
 * Progress through the customer tour, per device and account. Guests are
 * stored under "guest": the shopping side works without signing in, so the
 * tour does too.
 */
const store = createTourStore("customer");

export const readCustomerTour = store.read;
export const recordCustomerTour = store.record;
export const subscribeCustomerTour = store.subscribe;

/** Open the tour from anywhere. "all" = whole tour; a chapter id = just that chapter; nothing = the chapter picker. */
export const openCustomerTour = store.open;
export const onOpenCustomerTour = store.onOpen;
