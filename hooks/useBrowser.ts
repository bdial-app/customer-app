import { useNativePlatform } from "./useNativePlatform";

export function useBrowser(): boolean {
  const { runtime } = useNativePlatform();
  return runtime === "browser";
}
