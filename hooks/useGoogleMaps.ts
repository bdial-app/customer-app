import { useLoadScript } from "@react-google-maps/api";
import type { Libraries } from "@react-google-maps/api";

// Must be defined at module level for reference equality — @react-google-maps/api
// compares by reference and will reload the script if the array identity changes.
const LIBRARIES: Libraries = ["places"];

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

/**
 * Centralised Google Maps script loader.
 * Only ONE instance of the script is loaded regardless of how many components call this hook.
 * Always includes the "places" library so autocomplete works everywhere.
 */
export function useGoogleMapsLoader() {
  return useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });
}
