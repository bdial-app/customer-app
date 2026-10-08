import { airplane, bulb, construct, gift, heart, iceCream, leaf, shirt } from "ionicons/icons";
import type { CollectionTheme } from "@/services/home.service";

/** Colours for a home collection, light and dark. Full class names so Tailwind keeps them. */
export interface ThemeStyle {
  card: string;
  title: string;
  accent: string;
  tile: string;
  tileIcon: string;
  hero: string;
  chipOn: string;
  icon: string;
}

export const COLLECTION_THEMES: Record<CollectionTheme, ThemeStyle> = {
  sky: {
    card: "bg-gradient-to-br from-sky-50 to-cyan-50 ring-sky-100 dark:from-sky-950/60 dark:to-slate-900 dark:ring-sky-900/60",
    title: "text-sky-950 dark:text-sky-50",
    accent: "text-sky-700 dark:text-sky-300",
    tile: "bg-sky-100 dark:bg-sky-900/40",
    tileIcon: "text-sky-400 dark:text-sky-500",
    hero: "from-sky-500 via-cyan-500 to-teal-500",
    chipOn: "bg-sky-600 text-white border-sky-600",
    icon: construct,
  },
  amber: {
    card: "bg-gradient-to-br from-amber-50 to-yellow-50 ring-amber-100 dark:from-amber-950/50 dark:to-slate-900 dark:ring-amber-900/60",
    title: "text-amber-950 dark:text-amber-50",
    accent: "text-amber-700 dark:text-amber-300",
    tile: "bg-amber-100 dark:bg-amber-900/40",
    tileIcon: "text-amber-400 dark:text-amber-500",
    hero: "from-amber-400 via-amber-500 to-orange-500",
    chipOn: "bg-amber-500 text-white border-amber-500",
    icon: bulb,
  },
  rose: {
    card: "bg-gradient-to-br from-rose-50 to-pink-50 ring-rose-100 dark:from-rose-950/50 dark:to-slate-900 dark:ring-rose-900/60",
    title: "text-rose-950 dark:text-rose-50",
    accent: "text-rose-700 dark:text-rose-300",
    tile: "bg-rose-100 dark:bg-rose-900/40",
    tileIcon: "text-rose-400 dark:text-rose-500",
    hero: "from-rose-500 via-pink-500 to-fuchsia-500",
    chipOn: "bg-rose-600 text-white border-rose-600",
    icon: shirt,
  },
  violet: {
    card: "bg-gradient-to-br from-violet-50 to-purple-50 ring-violet-100 dark:from-violet-950/50 dark:to-slate-900 dark:ring-violet-900/60",
    title: "text-violet-950 dark:text-violet-50",
    accent: "text-violet-700 dark:text-violet-300",
    tile: "bg-violet-100 dark:bg-violet-900/40",
    tileIcon: "text-violet-400 dark:text-violet-500",
    hero: "from-violet-500 via-purple-500 to-fuchsia-500",
    chipOn: "bg-violet-600 text-white border-violet-600",
    icon: heart,
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-50 to-teal-50 ring-emerald-100 dark:from-emerald-950/50 dark:to-slate-900 dark:ring-emerald-900/60",
    title: "text-emerald-950 dark:text-emerald-50",
    accent: "text-emerald-700 dark:text-emerald-300",
    tile: "bg-emerald-100 dark:bg-emerald-900/40",
    tileIcon: "text-emerald-400 dark:text-emerald-500",
    hero: "from-emerald-500 via-teal-500 to-cyan-600",
    chipOn: "bg-emerald-600 text-white border-emerald-600",
    icon: airplane,
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-amber-50 ring-orange-100 dark:from-orange-950/50 dark:to-slate-900 dark:ring-orange-900/60",
    title: "text-orange-950 dark:text-orange-50",
    accent: "text-orange-700 dark:text-orange-300",
    tile: "bg-orange-100 dark:bg-orange-900/40",
    tileIcon: "text-orange-400 dark:text-orange-500",
    hero: "from-orange-400 via-orange-500 to-rose-500",
    chipOn: "bg-orange-500 text-white border-orange-500",
    icon: iceCream,
  },
  indigo: {
    card: "bg-gradient-to-br from-indigo-50 to-blue-50 ring-indigo-100 dark:from-indigo-950/50 dark:to-slate-900 dark:ring-indigo-900/60",
    title: "text-indigo-950 dark:text-indigo-50",
    accent: "text-indigo-700 dark:text-indigo-300",
    tile: "bg-indigo-100 dark:bg-indigo-900/40",
    tileIcon: "text-indigo-400 dark:text-indigo-500",
    hero: "from-indigo-500 via-blue-500 to-sky-500",
    chipOn: "bg-indigo-600 text-white border-indigo-600",
    icon: gift,
  },
  teal: {
    card: "bg-gradient-to-br from-teal-50 to-emerald-50 ring-teal-100 dark:from-teal-950/50 dark:to-slate-900 dark:ring-teal-900/60",
    title: "text-teal-950 dark:text-teal-50",
    accent: "text-teal-700 dark:text-teal-300",
    tile: "bg-teal-100 dark:bg-teal-900/40",
    tileIcon: "text-teal-400 dark:text-teal-500",
    hero: "from-teal-500 via-emerald-500 to-green-500",
    chipOn: "bg-teal-600 text-white border-teal-600",
    icon: leaf,
  },
};

export const themeOf = (t: string | null | undefined): ThemeStyle =>
  COLLECTION_THEMES[(t as CollectionTheme) in COLLECTION_THEMES ? (t as CollectionTheme) : "amber"];

/** "22 items", "1 service", "9 products". */
export const countLabel = (c: { itemCount: number; listingType: string }) => {
  const noun = c.listingType === "product" ? "product" : c.listingType === "service" ? "service" : "item";
  return `${c.itemCount} ${noun}${c.itemCount === 1 ? "" : "s"}`;
};
