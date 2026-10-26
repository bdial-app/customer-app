"use client";
import { useEffect } from "react";
import { installScrollMemory } from "@/utils/scroll-memory";

/** Mounted once in the root layout: going back returns to the same scroll. */
export function ScrollMemory() {
  useEffect(() => {
    installScrollMemory();
  }, []);
  return null;
}
