import { store } from "@/store";

/**
 * True while the location the app is using (the signed-in user's, else the
 * guest's) is still this point — a late GPS refine must not overwrite a
 * place the customer has since picked.
 */
export function isActiveCoords(lat: number, lng: number): boolean {
  const { auth, location } = store.getState();
  const cur = auth.user
    ? { lat: auth.user.latitude, lng: auth.user.longitude }
    : location.guestCoords;
  return !!cur && Number(cur.lat) === lat && Number(cur.lng) === lng;
}
