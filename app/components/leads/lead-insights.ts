import {
  callOutline,
  chatbubbleOutline,
  navigateOutline,
  bookmarkOutline,
  shareSocialOutline,
  searchOutline,
  cubeOutline,
  timeOutline,
  pricetagOutline,
  starOutline,
  imagesOutline,
  eyeOutline,
  flame,
  heart,
  eye,
  sparkles,
} from "ionicons/icons";
import type { LeadItem } from "@/services/analytics.service";

export type LeadTier = LeadItem["tier"];

/**
 * How each interest level is named to a business owner.
 *
 * Every tier reads as a buyer at a different stage. "Cold" told owners the
 * lead was worthless before they had seen why it was there.
 */
export const LEAD_TIERS: Record<
  LeadTier,
  {
    name: string;
    badge: string;
    /** Filled icon; takes the colour of the text around it. */
    icon: string;
    /** The icon's colour on its own, e.g. on a dark card. */
    iconColor: string;
    meaning: string;
    badgeClass: string;
    dot: string;
    bar: string;
    gradient: string;
  }
> = {
  hot: {
    name: "Ready to Buy",
    badge: "Ready to buy",
    icon: flame,
    iconColor: "text-red-500",
    meaning: "Strong buying signals — contact them first",
    badgeClass: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
    gradient: "from-red-500 to-orange-500",
  },
  warm: {
    name: "Highly Interested",
    badge: "High interest",
    icon: heart,
    iconColor: "text-orange-400",
    meaning: "Spent real time on your business",
    badgeClass: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    dot: "bg-orange-400",
    bar: "bg-orange-400",
    gradient: "from-amber-400 to-orange-400",
  },
  soft: {
    name: "Comparing Options",
    badge: "Comparing",
    icon: eye,
    iconColor: "text-yellow-400",
    meaning: "Weighing you up — reach them before others do",
    badgeClass: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-400",
    bar: "bg-yellow-400",
    gradient: "from-emerald-400 to-indigo-400",
  },
  cold: {
    name: "Just Discovered You",
    badge: "New interest",
    icon: sparkles,
    iconColor: "text-sky-400",
    meaning: "Found you recently — a friendly hello goes far",
    badgeClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-400",
    bar: "bg-blue-400",
    gradient: "from-blue-400 to-indigo-400",
  },
};

export const TIER_ORDER: LeadTier[] = ["hot", "warm", "soft", "cold"];

export const tierInfo = (tier: string | null | undefined) =>
  LEAD_TIERS[(tier as LeadTier) in LEAD_TIERS ? (tier as LeadTier) : "cold"];

/** "45s", "6 min", "1h 5m" — never "0m" for a visit under a minute. */
export function formatTimeSpent(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return mins % 60 ? `${h}h ${mins % 60}m` : `${h}h`;
}

/** How recently they were around, coloured so "today" stands out. */
export function leadRecency(lastSeenAt: string): { label: string; tone: "today" | "week" | "older"; dot: string; text: string } {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000));
  const days = Math.floor(mins / 1440);
  const label =
    mins < 5 ? "Active just now"
    : mins < 60 ? `Active ${mins}m ago`
    : mins < 1440 ? `Active ${Math.floor(mins / 60)}h ago`
    : days === 1 ? "Active yesterday"
    : `Active ${days}d ago`;
  if (mins < 1440) return { label, tone: "today", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (days < 7) return { label, tone: "week", dot: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" };
  return { label, tone: "older", dot: "bg-slate-300 dark:bg-slate-600", text: "text-slate-400" };
}

export interface LeadSignal {
  key: string;
  label: string;
  icon: string;
  /** Phrase used in the one-line summary ("tapped Call"). */
  phrase: string;
}

// Strongest first: an action says more than a view.
const ACTION_SIGNALS: { event: string; label: string; phrase: string; icon: string }[] = [
  { event: "chat_initiated", label: "Started a chat", phrase: "started a chat", icon: chatbubbleOutline },
  { event: "call_clicked", label: "Tapped Call", phrase: "tapped Call", icon: callOutline },
  { event: "direction_clicked", label: "Got directions", phrase: "got directions to you", icon: navigateOutline },
  { event: "saved", label: "Saved you", phrase: "saved your business", icon: bookmarkOutline },
  { event: "share_clicked", label: "Shared you", phrase: "shared your business", icon: shareSocialOutline },
  { event: "offer_viewed", label: "Checked offers", phrase: "checked your offers", icon: pricetagOutline },
  { event: "review_read", label: "Read reviews", phrase: "read your reviews", icon: starOutline },
  { event: "photo_viewed", label: "Browsed photos", phrase: "browsed your photos", icon: imagesOutline },
];

/**
 * Why this lead is worth contacting, from what they did — no personal details,
 * so it can be shown before the contact is bought.
 */
export function leadSignals(lead: Pick<LeadItem, "actionsPerformed" | "productsViewed" | "searchQuery" | "totalDuration">): LeadSignal[] {
  const actions = new Set(lead.actionsPerformed ?? []);
  const out: LeadSignal[] = [];
  const strong = ACTION_SIGNALS.slice(0, 4);
  const weak = ACTION_SIGNALS.slice(4);

  for (const a of strong) if (actions.has(a.event)) out.push({ key: a.event, label: a.label, phrase: a.phrase, icon: a.icon });
  if (lead.searchQuery) {
    out.push({ key: "search", label: `“${lead.searchQuery}”`, phrase: `searched “${lead.searchQuery}”`, icon: searchOutline });
  }
  const products = lead.productsViewed?.length ?? 0;
  if (products > 0) {
    out.push({
      key: "products",
      label: `${products} product${products === 1 ? "" : "s"}`,
      phrase: `viewed ${products === 1 ? "one" : products} of your products`,
      icon: cubeOutline,
    });
  }
  if (lead.totalDuration >= 30) {
    const t = formatTimeSpent(lead.totalDuration);
    out.push({ key: "time", label: t, phrase: `spent ${t} on your page`, icon: timeOutline });
  }
  for (const a of weak) if (actions.has(a.event)) out.push({ key: a.event, label: a.label, phrase: a.phrase, icon: a.icon });
  if (!out.length && actions.has("profile_view")) {
    out.push({ key: "profile_view", label: "Opened your page", phrase: "opened your business page", icon: eyeOutline });
  }
  return out;
}

/** One sentence: "Searched “birthday cake”, viewed 4 of your products and tapped Call." */
export function leadWhyLine(signals: LeadSignal[]): string {
  // Lead with the search (what they want), then the strongest actions.
  const ordered = [...signals].sort((a, b) => (a.key === "search" ? -1 : b.key === "search" ? 1 : 0));
  const parts = ordered.slice(0, 3).map((s) => s.phrase);
  if (!parts.length) return "Came across your business recently.";
  if (parts.length === 1 && ordered[0].key === "search") parts[0] += " and found you";
  const text = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}
