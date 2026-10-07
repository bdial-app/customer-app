"use client";
import { useSyncExternalStore } from "react";
import { isStorageReady, subscribeStorageReady } from "@/utils/storage";

/**
 * True once saved settings are readable (immediately on web; after the
 * Preferences → localStorage copy on native). Gate one-time prompts on it.
 */
export function useStorageReady(): boolean {
  return useSyncExternalStore(subscribeStorageReady, isStorageReady, () => false);
}
