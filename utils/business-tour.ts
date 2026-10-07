import { createTourStore } from "./tour-store";

/**
 * Progress through the business tour, per account and device. Keyed by user
 * id: it explains your own dashboard, so a second account on the same phone
 * should see it too.
 */
const store = createTourStore("business");

export const readBusinessTour = store.read;
export const saveBusinessTour = store.save;
export const recordBusinessTour = store.record;
export const subscribeBusinessTour = store.subscribe;

/** Open the tour from anywhere (a help button, Profile). Optionally a single chapter. */
export const openBusinessTour = store.open;
export const onOpenBusinessTour = store.onOpen;
