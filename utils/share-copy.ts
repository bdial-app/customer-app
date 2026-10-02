import { storeLinksText } from "./store-links";

/**
 * Everything a share needs to know about a business, already shaped for
 * display. Built from the provider-details or product-details response by the
 * share hooks, so this module never touches the API types.
 */
export interface ShareBusiness {
  id: string;
  name: string;
  /** "IT & Computer Services · Digital Marketing" */
  category?: string | null;
  area?: string | null;
  city?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  verified?: boolean;
  womenLed?: boolean;
  communityVerified?: boolean;
  /** "10:00 AM – 8:00 PM" */
  hours?: string | null;
  deal?: ShareDeal | null;
  /** The few worth showing, best first. */
  products?: ShareProductLite[];
}

export interface ShareDeal {
  /** "20% off" / "₹100 off" */
  label: string;
  title: string;
  endsAt?: string | null;
}

export interface ShareProductLite {
  name: string;
  price?: number | null;
  currency?: string | null;
  imageUrl?: string | null;
}

export interface ShareProduct {
  id: string;
  name: string;
  price?: number | null;
  currency?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  kind: "product" | "service";
  business: ShareBusiness;
}

// ── Formatting ───────────────────────────────────────────

export const formatMoney = (amount: number, currency?: string | null) => {
  const symbol = !currency || currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

/** Cut at a word boundary so a teaser never ends mid-word. */
export const teaser = (text: string | null | undefined, max: number) => {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\-–—\s]+$/, "")}…`;
};

export const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

export const placeLine = (b: Pick<ShareBusiness, "area" | "city">) =>
  [b.area, b.city].map((s) => s?.trim()).filter(Boolean).join(", ");

const trustLine = (b: ShareBusiness) =>
  [b.verified && "Verified", b.womenLed && "Women-led", b.communityVerified && "Community verified"]
    .filter(Boolean)
    .join(" · ");

const productsLine = (products: ShareProductLite[] = []) =>
  products
    .slice(0, 3)
    .map((p) => (p.price != null && p.price > 0 ? `${p.name} (${formatMoney(p.price, p.currency)})` : p.name))
    .join(" · ");

const dealLine = (deal: ShareDeal) =>
  `${deal.label} — “${teaser(deal.title, 60)}”${deal.endsAt ? `, ends ${shortDate(deal.endsAt)}` : ""}`;

const lines = (...parts: (string | false | null | undefined)[]) =>
  parts
    .filter((p): p is string => p !== false && p !== null && p !== undefined)
    .join("\n")
    // Collapse the blank lines left behind by sections that had nothing to say.
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * There is no web page to link to, so the message says exactly what to search
 * for once the app is installed — the next best thing to a deep link.
 */
const getTheApp = (searchFor: string, why: string) =>
  `Get the free Tijarah Connect app and search “${searchFor}” to ${why}:\n${storeLinksText()}`;

// ── Captions ─────────────────────────────────────────────

/**
 * What goes with a business share. A customer recommends it in the third
 * person; an owner sharing their own listing speaks as the business, which is
 * the version that turns every owner into a promoter of the app too.
 */
export function businessCaption(b: ShareBusiness, asOwner = false): string {
  const where = placeLine(b);
  const identity = [b.category, where].filter(Boolean).join(" · ");
  const trust = trustLine(b);
  const offer = productsLine(b.products);

  if (asOwner) {
    return lines(
      "We’re on Tijarah Connect! 🎉",
      "",
      `*${b.name}*`,
      identity,
      "",
      teaser(b.description, 220),
      "",
      offer && `🛍️ What we offer: ${offer}`,
      b.deal && `🎁 Offer for you: ${dealLine(b.deal)}`,
      b.hours && `🕒 Open ${b.hours}`,
      "",
      getTheApp(b.name, "see our products, grab our offers and message us directly"),
    );
  }

  return lines(
    "Found a great local business on Tijarah Connect 👇",
    "",
    `*${b.name}*`,
    identity,
    trust && `✅ ${trust}`,
    "",
    teaser(b.description, 180),
    "",
    offer && `🛍️ Popular here: ${offer}`,
    b.deal && `🎁 Running now: ${dealLine(b.deal)}`,
    b.hours && `🕒 Open ${b.hours}`,
    "",
    getTheApp(b.name, "see everything they offer and message them directly"),
  );
}

/** What goes with a product or service share. */
export function productCaption(p: ShareProduct, asOwner = false): string {
  const b = p.business;
  const price = p.price != null && p.price > 0 ? formatMoney(p.price, p.currency) : "Price on request";
  const kindLabel = p.kind === "service" ? "Service" : "Product";
  const where = placeLine(b);

  if (asOwner) {
    return lines(
      p.kind === "service" ? `Now booking at *${b.name}* ✨` : `Now available at *${b.name}* 🛍️`,
      "",
      `*${p.name}*`,
      `${price} · ${kindLabel}`,
      "",
      teaser(p.description, 200),
      "",
      where && `📍 ${where}`,
      b.deal && `🎁 Offer for you: ${dealLine(b.deal)}`,
      "",
      getTheApp(b.name, p.kind === "service" ? "book it with us or ask us anything" : "order it from us or ask us anything"),
    );
  }

  const trust = trustLine(b);
  return lines(
    "Look what I found on Tijarah Connect 👇",
    "",
    `*${p.name}*`,
    `${price} · ${kindLabel}`,
    "",
    teaser(p.description, 180),
    "",
    `From *${b.name}*${where ? ` · ${where}` : ""}${trust ? ` · ✅ ${trust}` : ""}`,
    b.deal && `🎁 This shop is running ${dealLine(b.deal)}`,
    "",
    getTheApp(b.name, p.kind === "service" ? "book it or ask them about it" : "order it or ask them about it"),
  );
}
