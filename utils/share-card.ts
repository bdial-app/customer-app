import type { ShareBusiness, ShareProduct } from "./share-copy";
import { formatMoney, placeLine } from "./share-copy";

/**
 * Branded share cards, drawn on a canvas in the browser.
 *
 * 1080×1350 (4:5) because that is the shape WhatsApp chats and Instagram feeds
 * both show uncropped. Images are fetched into blobs before drawing, so the
 * canvas stays exportable; Supabase storage answers CORS for every origin. Any
 * image that cannot be loaded in time is simply left out, and a card that
 * cannot be made at all returns null so the caller shares text instead.
 */

const W = 1080;
const H = 1350;
const PAD = 60;
const FOOTER_H = 170;

const BRAND = "#1a1799";
const BRAND_2 = "#4f46e5";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";

const IMAGE_TIMEOUT_MS = 4000;

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

// ── Loading ──────────────────────────────────────────────

/** Blob URLs to revoke once the card is drawn. */
class ImageLoader {
  private urls: string[] = [];

  async load(src: string | null | undefined): Promise<HTMLImageElement | null> {
    if (!src) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    try {
      const res = await fetch(src, { signal: controller.signal, mode: "cors", credentials: "omit" });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/") && blob.size === 0) return null;
      const url = URL.createObjectURL(blob);
      this.urls.push(url);
      const img = new Image();
      img.src = url;
      await img.decode();
      return img.naturalWidth > 0 ? img : null;
    } catch {
      return null; // unreachable, too slow, or not an image — draw without it
    } finally {
      clearTimeout(timer);
    }
  }

  release() {
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls = [];
  }
}

// ── Drawing primitives ───────────────────────────────────

let fontFamily = "sans-serif";

/** The app's own font (Open Sans via next/font), so the card looks like Tijarah. */
async function prepareFont() {
  if (typeof document === "undefined") return;
  fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";
  try {
    await document.fonts?.ready;
  } catch {
    /* system font it is */
  }
}

const font = (ctx: Ctx, weight: number, size: number) => {
  ctx.font = `${weight} ${size}px ${fontFamily}`;
};

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** object-fit: cover, clipped to the box. */
function drawCover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** object-fit: contain, centred in the box — for logos, which are often wide wordmarks. */
function drawContain(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function brandGradient(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, BRAND);
  g.addColorStop(1, BRAND_2);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // Soft circles so an empty banner still looks designed, not missing.
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath();
  ctx.arc(x + w * 0.85, y + h * 0.15, h * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.1, y + h * 1.05, h * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

/**
 * Word-wrap to at most `maxLines`, ending the last line with an ellipsis when
 * text is left over. A single word longer than the line is broken by letter.
 */
function wrap(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const out: string[] = [];
  let line = "";
  const fits = (s: string) => ctx.measureText(s).width <= maxWidth;

  for (let i = 0; i < words.length; i++) {
    let word = words[i]!;
    while (!fits(word)) {
      // Break an over-long word across lines.
      let cut = word.length - 1;
      while (cut > 1 && !fits(word.slice(0, cut))) cut--;
      if (line) {
        out.push(line);
        line = "";
      }
      out.push(word.slice(0, cut));
      word = word.slice(cut);
      if (out.length >= maxLines) break;
    }
    if (out.length >= maxLines) break;
    const candidate = line ? `${line} ${word}` : word;
    if (fits(candidate)) {
      line = candidate;
    } else {
      out.push(line);
      line = word;
      if (out.length >= maxLines) break;
    }
  }
  if (line && out.length < maxLines) out.push(line);

  const consumed = out.join(" ").replace(/\s+/g, " ").length;
  const total = words.join(" ").length;
  if (consumed < total && out.length) {
    let last = out[out.length - 1]!;
    while (last && !fits(`${last}…`)) last = last.slice(0, -1);
    out[out.length - 1] = `${last.replace(/[\s,.;:]+$/, "")}…`;
  }
  return out.slice(0, maxLines);
}

/** Draws wrapped text; returns the y just below the last line. */
function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  opts: {
    size: number;
    weight?: number;
    color?: string;
    maxWidth: number;
    maxLines?: number;
    lineHeight?: number;
    /** Centre each line on `x` instead of starting it there. */
    centre?: boolean;
  },
): number {
  font(ctx, opts.weight ?? 400, opts.size);
  ctx.fillStyle = opts.color ?? INK;
  ctx.textBaseline = "alphabetic";
  if (opts.centre) ctx.textAlign = "center";
  const lh = opts.lineHeight ?? Math.round(opts.size * 1.22);
  const rows = wrap(ctx, value, opts.maxWidth, opts.maxLines ?? 1);
  rows.forEach((row, i) => ctx.fillText(row, x, y + opts.size + i * lh));
  ctx.textAlign = "left";
  return y + (rows.length ? opts.size + (rows.length - 1) * lh + Math.round(opts.size * 0.3) : 0);
}

/** What `text` would occupy, without drawing it — for laying a card out first. */
function textHeight(
  ctx: Ctx,
  value: string,
  opts: { size: number; weight?: number; maxWidth: number; maxLines?: number; lineHeight?: number },
): number {
  font(ctx, opts.weight ?? 400, opts.size);
  const lh = opts.lineHeight ?? Math.round(opts.size * 1.22);
  const rows = wrap(ctx, value, opts.maxWidth, opts.maxLines ?? 1);
  return rows.length ? opts.size + (rows.length - 1) * lh + Math.round(opts.size * 0.3) : 0;
}

/** A rounded label; returns its width so the caller can lay out a row. */
function pill(
  ctx: Ctx,
  label: string,
  x: number,
  y: number,
  opts: { bg: string; fg: string; size?: number; check?: boolean },
): number {
  const size = opts.size ?? 28;
  const padX = Math.round(size * 0.7);
  const h = Math.round(size * 1.75);
  font(ctx, 700, size);
  const iconW = opts.check ? size * 0.9 : 0;
  const w = padX * 2 + iconW + ctx.measureText(label).width;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = opts.bg;
  ctx.fill();
  if (opts.check) {
    // Drawn, not typed: a check glyph is not in every font.
    const cx = x + padX;
    const cy = y + h / 2;
    ctx.strokeStyle = opts.fg;
    ctx.lineWidth = size * 0.14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + size * 0.22, cy + size * 0.22);
    ctx.lineTo(cx + size * 0.6, cy - size * 0.24);
    ctx.stroke();
  }
  ctx.fillStyle = opts.fg;
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + padX + iconW, y + h / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return w;
}

function avatar(ctx: Ctx, img: HTMLImageElement | null, name: string, cx: number, cy: number, r: number, ring = 0) {
  if (ring) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, r + ring, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    // A square logo fills the circle; a wide wordmark is fitted inside it rather
    // than cropped to its middle letters.
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 0.85 && ratio < 1.18) drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
    else {
      const inset = r * 0.3;
      drawContain(ctx, img, cx - r + inset, cy - r + inset, (r - inset) * 2, (r - inset) * 2);
    }
  } else {
    brandGradient(ctx, cx - r, cy - r, r * 2, r * 2);
    font(ctx, 800, Math.round(r * 0.8));
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(name), cx, cy + 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}

type Badge = { label: string; bg: string; fg: string; check?: boolean };

const BADGE_SIZE = 28;
const BADGE_ROW_H = Math.round(BADGE_SIZE * 1.75) + 28;

const badgeList = (b: ShareBusiness): Badge[] => {
  const items: Badge[] = [];
  if (b.deal) items.push({ label: b.deal.label.toUpperCase(), bg: "#f59e0b", fg: "#ffffff" });
  if (b.verified) items.push({ label: "Verified", bg: "#dcfce7", fg: "#15803d", check: true });
  if (b.womenLed) items.push({ label: "Women-led", bg: "#fce7f3", fg: "#be185d" });
  if (b.communityVerified) items.push({ label: "Community verified", bg: "#fef3c7", fg: "#b45309", check: true });
  return items;
};

/** The row's height for the layout pass; 0 when there is nothing to show. */
const badgeHeight = (b: ShareBusiness) => (badgeList(b).length ? 24 + BADGE_ROW_H : 0);

/** The offer and trust labels, as one centred row under the name. */
function badges(ctx: Ctx, b: ShareBusiness, y: number, maxWidth: number): number {
  const items = badgeList(b);
  if (!items.length) return y;

  const GAP = 16;
  const widthOf = (it: Badge) => {
    font(ctx, 700, BADGE_SIZE);
    return Math.round(BADGE_SIZE * 0.7) * 2 + (it.check ? BADGE_SIZE * 0.9 : 0) + ctx.measureText(it.label).width;
  };

  // Measure the whole row first so it can be centred; anything that would not
  // fit on the line is dropped rather than wrapped.
  const shown: { it: Badge; w: number }[] = [];
  let total = 0;
  for (const it of items) {
    const w = widthOf(it);
    const next = total + w + (shown.length ? GAP : 0);
    if (next > maxWidth) break;
    shown.push({ it, w });
    total = next;
  }
  if (!shown.length) return y;

  let x = (W - total) / 2;
  for (const { it, w } of shown) {
    pill(ctx, it.label, x, y, { ...it, size: BADGE_SIZE });
    x += w + GAP;
  }
  return y + BADGE_ROW_H;
}

/**
 * The first candidate that fits on one line, stepping the size down before
 * giving up on a candidate — a long business name should shrink the line, not
 * lose its end to an ellipsis.
 */
function fitLine(ctx: Ctx, candidates: string[], weight: number, sizes: number[], maxWidth: number) {
  for (const value of candidates) {
    for (const size of sizes) {
      font(ctx, weight, size);
      if (ctx.measureText(value).width <= maxWidth) return { value, size };
    }
  }
  return { value: candidates[candidates.length - 1]!, size: sizes[sizes.length - 1]! };
}

/** The band every card ends on: the app, and how to find this listing in it. */
function footer(ctx: Ctx, icon: HTMLImageElement | null, headlines: string[], subs: string[]) {
  const y = H - FOOTER_H;
  ctx.fillStyle = BRAND;
  ctx.fillRect(0, y, W, FOOTER_H);
  const size = 108;
  const iy = y + (FOOTER_H - size) / 2;
  ctx.save();
  roundRect(ctx, PAD, iy, size, size, 26);
  ctx.clip();
  if (icon) drawCover(ctx, icon, PAD, iy, size, size);
  else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(PAD, iy, size, size);
  }
  ctx.restore();
  const tx = PAD + size + 32;
  const tw = W - tx - PAD;
  const head = fitLine(ctx, headlines, 800, [38, 34, 31], tw);
  text(ctx, head.value, tx, y + 34, { size: head.size, weight: 800, color: "#ffffff", maxWidth: tw });
  const sub = fitLine(ctx, subs, 500, [27, 25], tw);
  text(ctx, sub.value, tx, y + 92, { size: sub.size, weight: 500, color: "rgba(255,255,255,0.78)", maxWidth: tw });
}

const storesLine = "Free on Android & iPhone";

function newCanvas(): { canvas: HTMLCanvasElement; ctx: Ctx } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d") as Ctx | null;
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  return { canvas, ctx };
}

const toJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
    } catch {
      resolve(null); // a tainted canvas — never expected, but never fatal
    }
  });

const APP_ICON = "/icons/512.png";

// ── Business card ────────────────────────────────────────

/**
 * The business logo is the only picture on this card. It used to carry a banner
 * behind the logo and a row of product thumbnails under the text, which read as
 * four images of a business rather than one brand — on a phone the logo is what
 * someone recognises, so everything else here is type.
 */
export async function renderBusinessCard(b: ShareBusiness): Promise<Blob | null> {
  const made = newCanvas();
  if (!made) return null;
  const { canvas, ctx } = made;
  const loader = new ImageLoader();
  try {
    await prepareFont();
    const [logo, icon] = await Promise.all([loader.load(b.logoUrl), loader.load(APP_ICON)]);

    const cx = W / 2;
    const maxW = W - PAD * 2;
    const R = 190;

    const NAME = { size: 64, weight: 800, maxWidth: maxW, maxLines: 2, lineHeight: 76 } as const;
    const IDENTITY = { size: 32, weight: 500, maxWidth: maxW } as const;
    const DESC = { size: 32, weight: 400, maxWidth: maxW, lineHeight: 44 } as const;
    const GAP = { logo: 76, identity: 6, badges: 24, desc: 12 };

    // Measured before anything is drawn, so a listing with one line of text
    // sits centred in the card instead of leaving a hole above the footer.
    const identity = [b.category, placeLine(b)].filter(Boolean).join("  ·  ");
    const area = H - FOOTER_H;
    const fixed =
      R * 2 +
      GAP.logo +
      textHeight(ctx, b.name, NAME) +
      (identity ? GAP.identity + textHeight(ctx, identity, IDENTITY) : 0) +
      badgeHeight(b);
    const descLines = b.description ? Math.max(0, Math.min(4, Math.floor((area - fixed - 180) / DESC.lineHeight))) : 0;
    const descH = descLines ? GAP.desc + textHeight(ctx, b.description!, { ...DESC, maxLines: descLines }) : 0;
    const top = Math.max(70, Math.round((area - fixed - descH) / 2));

    // Logo. The hairline keeps a logo on a white background from bleeding into
    // the card.
    const logoCy = top + R;
    avatar(ctx, logo, b.name, cx, logoCy, R);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, logoCy, R + 1, 0, Math.PI * 2);
    ctx.stroke();

    let y = text(ctx, b.name, cx, logoCy + R + GAP.logo, { ...NAME, centre: true });
    if (identity) y = text(ctx, identity, cx, y + GAP.identity, { ...IDENTITY, color: MUTED, centre: true });
    y = badges(ctx, b, y + GAP.badges, maxW);
    if (descLines) {
      text(ctx, b.description!, cx, y + GAP.desc, { ...DESC, color: "#334155", maxLines: descLines, centre: true });
    }

    footer(
      ctx,
      icon,
      [`Find ${b.name} on Tijarah Connect`, "Find it on Tijarah Connect"],
      [`Search “${b.name}” · free on Android & iPhone`, `Search “${b.name}” in the free app`, storesLine],
    );
    return await toJpeg(canvas);
  } catch {
    return null;
  } finally {
    loader.release();
  }
}

// ── Product card ─────────────────────────────────────────

/**
 * A product share is still a share of a business, so the logo and name head the
 * card and the product photo sits under them. That also makes a product share
 * and a business share read as the same family at a glance in a chat.
 */
export async function renderProductCard(p: ShareProduct): Promise<Blob | null> {
  const made = newCanvas();
  if (!made) return null;
  const { canvas, ctx } = made;
  const loader = new ImageLoader();
  const b = p.business;
  try {
    await prepareFont();
    const [photo, logo, icon] = await Promise.all([
      loader.load(p.imageUrl),
      loader.load(b.logoUrl),
      loader.load(APP_ICON),
    ]);

    const maxW = W - PAD * 2;

    // Header: whose shop this is.
    const AR = 62;
    const headCy = 44 + AR;
    avatar(ctx, logo, b.name, PAD + AR, headCy, AR);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(PAD + AR, headCy, AR + 1, 0, Math.PI * 2);
    ctx.stroke();

    const hx = PAD + AR * 2 + 26;
    const hw = W - hx - PAD;
    const meta = [placeLine(b), b.verified && "Verified", b.womenLed && "Women-led"].filter(Boolean).join("  ·  ");
    const nameBottom = text(ctx, b.name, hx, headCy - (meta ? 40 : 22), { size: 38, weight: 800, maxWidth: hw });
    if (meta) text(ctx, meta, hx, nameBottom - 2, { size: 26, weight: 500, color: MUTED, maxWidth: hw });

    const headerBottom = headCy + AR + 44;
    ctx.fillStyle = LINE;
    ctx.fillRect(0, headerBottom - 2, W, 2);

    // Product photo
    const PHOTO_H = 600;
    const photoTop = headerBottom;
    if (photo) drawCover(ctx, photo, 0, photoTop, W, PHOTO_H);
    else {
      brandGradient(ctx, 0, photoTop, W, PHOTO_H);
      font(ctx, 800, 200);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(p.name), W / 2, photoTop + PHOTO_H / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
    const shade = ctx.createLinearGradient(0, photoTop, 0, photoTop + 200);
    shade.addColorStop(0, "rgba(0,0,0,0.3)");
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, photoTop, W, 200);

    let px = PAD;
    px += pill(ctx, p.kind === "service" ? "SERVICE" : "PRODUCT", px, photoTop + 28, { bg: "#ffffff", fg: BRAND, size: 26 }) + 14;
    if (b.deal) pill(ctx, b.deal.label.toUpperCase(), px, photoTop + 28, { bg: "#f59e0b", fg: "#ffffff", size: 26 });

    // Name, price, and whatever room is left for the description
    let y = photoTop + PHOTO_H + 36;
    y = text(ctx, p.name, PAD, y, { size: 54, weight: 800, maxWidth: maxW, maxLines: 2, lineHeight: 64 });
    if (p.price != null && p.price > 0) {
      y = text(ctx, formatMoney(p.price, p.currency), PAD, y + 2, { size: 56, weight: 800, color: BRAND, maxWidth: maxW });
    } else {
      y = text(ctx, "Price on request", PAD, y + 4, { size: 36, weight: 700, color: MUTED, maxWidth: maxW });
    }

    const bottom = H - FOOTER_H - 32;
    const descLines = Math.min(3, Math.floor((bottom - y) / 40));
    if (p.description && descLines > 0) {
      text(ctx, p.description, PAD, y + 8, { size: 30, weight: 400, color: "#334155", maxWidth: maxW, maxLines: descLines, lineHeight: 40 });
    }

    footer(
      ctx,
      icon,
      ["Get it on Tijarah Connect"],
      [`Search “${b.name}” · free on Android & iPhone`, `Search “${b.name}” in the free app`, storesLine],
    );
    return await toJpeg(canvas);
  } catch {
    return null;
  } finally {
    loader.release();
  }
}
