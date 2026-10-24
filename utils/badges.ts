import { flash, heart, layers, ribbon, rocket, star } from "ionicons/icons";

/**
 * The badges a business can hold, as customers see them. The rules that
 * award them live in the API (bdial-service/src/badges/badge-catalog.ts);
 * the wording here explains them to customers. Highest first: where only one
 * fits (cards), the first one a business holds is shown.
 */
export type BadgeKey =
  | "tijarah_pick"
  | "top_rated"
  | "community_favourite"
  | "quick_responder"
  | "rising_star"
  | "full_catalogue";

/** A badge as the API sends it on lists, cards and the business page. */
export interface BadgeRef {
  type: string;
  source?: string;
  /** Why the team chose it (Tijarah Pick only, business page only). */
  reason?: string | null;
}

export interface BadgeStyle {
  key: BadgeKey;
  label: string;
  icon: string;
  /** Chip on a light surface. */
  chip: string;
  /** Icon disc in the explainer. */
  disc: string;
  /** What it tells a customer, in a sentence. */
  meaning: string;
  /** How a business gets it, briefly. */
  earned: string;
}

export const BADGES: BadgeStyle[] = [
  {
    key: "tijarah_pick",
    label: "Tijarah Pick",
    icon: ribbon,
    chip: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/30",
    disc: "bg-indigo-600",
    meaning: "Chosen by the Tijarah team as a standout business in our community.",
    earned: "Picked by the Tijarah team.",
  },
  {
    key: "top_rated",
    label: "Top Rated",
    icon: star,
    chip: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    disc: "bg-amber-500",
    meaning: "Consistently rated highly by its customers.",
    earned: "Rated 4.5★ or more from at least 10 reviews on Tijarah and Google.",
  },
  {
    key: "community_favourite",
    label: "Community Favourite",
    icon: heart,
    chip: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30",
    disc: "bg-rose-500",
    meaning: "One of the businesses people in its city contact and save most.",
    earned: "Among the most contacted and saved businesses in its city this month.",
  },
  {
    key: "quick_responder",
    label: "Quick Responder",
    icon: flash,
    chip: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/30",
    disc: "bg-sky-500",
    meaning: "Usually replies to enquiries within two hours.",
    earned: "Replied within 2 hours to most enquiries in the last 30 days.",
  },
  {
    key: "rising_star",
    label: "Rising Star",
    icon: rocket,
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    disc: "bg-emerald-500",
    meaning: "New on Tijarah and already loved by its first customers.",
    earned: "Joined in the last 90 days and rated 4★ or more from 3+ reviews.",
  },
  {
    key: "full_catalogue",
    label: "Full Catalogue",
    icon: layers,
    chip: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-400/30",
    disc: "bg-teal-500",
    meaning: "Shows its products and services with prices and photos, so you can browse before you ask.",
    earned: "At least 10 items, each with a price and a photo.",
  },
];

const BY_KEY = new Map(BADGES.map((b) => [b.key as string, b]));

/** The badges this app knows, in order, from whatever the API sent. */
export function knownBadges(list: BadgeRef[] | null | undefined): Array<BadgeStyle & { ref: BadgeRef }> {
  const out: Array<BadgeStyle & { ref: BadgeRef }> = [];
  for (const ref of list ?? []) {
    const style = BY_KEY.get(ref.type);
    if (style && !out.some((b) => b.key === style.key)) out.push({ ...style, ref });
  }
  return out.sort((a, b) => BADGES.indexOf(BY_KEY.get(a.key)!) - BADGES.indexOf(BY_KEY.get(b.key)!));
}
