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
const SOFT = "#f1f5f9";

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

const tracking = (ctx: Ctx, px: number) => {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
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
  opts: { size: number; weight?: number; color?: string; maxWidth: number; maxLines?: number; lineHeight?: number },
): number {
  font(ctx, opts.weight ?? 400, opts.size);
  ctx.fillStyle = opts.color ?? INK;
  ctx.textBaseline = "alphabetic";
  const lh = opts.lineHeight ?? Math.round(opts.size * 1.22);
  const rows = wrap(ctx, value, opts.maxWidth, opts.maxLines ?? 1);
  rows.forEach((row, i) => ctx.fillText(row, x, y + opts.size + i * lh));
  return y + (rows.length ? opts.size + (rows.length - 1) * lh + Math.round(opts.size * 0.3) : 0);
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

function trustPills(ctx: Ctx, b: ShareBusiness, x: number, y: number, maxX: number): number {
  const items: { label: string; bg: string; fg: string; check?: boolean }[] = [];
  if (b.verified) items.push({ label: "Verified", bg: "#dcfce7", fg: "#15803d", check: true });
  if (b.womenLed) items.push({ label: "Women-led", bg: "#fce7f3", fg: "#be185d" });
  if (b.communityVerified) items.push({ label: "Community verified", bg: "#fef3c7", fg: "#b45309", check: true });
  if (!items.length) return y;
  let cx = x;
  for (const it of items) {
    font(ctx, 700, 26);
    const est = ctx.measureText(it.label).width + 26 * 2.3;
    if (cx + est > maxX) break;
    cx += pill(ctx, it.label, cx, y, { ...it, size: 26 }) + 14;
  }
  return y + Math.round(26 * 1.75) + 26;
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

const storesLine = "Free on Google Play & the App Store";

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

export async function renderBusinessCard(b: ShareBusiness): Promise<Blob | null> {
  const made = newCanvas();
  if (!made) return null;
  const { canvas, ctx } = made;
  const loader = new ImageLoader();
  try {
    await prepareFont();
    const products = (b.products ?? []).slice(0, 3);
    const [banner, logo, icon, ...thumbs] = await Promise.all([
      loader.load(b.bannerUrl),
      loader.load(b.logoUrl),
      loader.load(APP_ICON),
      ...products.map((p) => loader.load(p.imageUrl)),
    ]);

    // Banner — shorter when products need the room below.
    const BANNER_H = products.length ? 470 : 520;
    if (banner) drawCover(ctx, banner, 0, 0, W, BANNER_H);
    else brandGradient(ctx, 0, 0, W, BANNER_H);
    const shade = ctx.createLinearGradient(0, BANNER_H * 0.45, 0, BANNER_H);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, BANNER_H);

    if (b.deal) {
      pill(ctx, b.deal.label.toUpperCase(), PAD, PAD, { bg: "#f59e0b", fg: "#ffffff", size: 34 });
    }

    // Logo, overlapping the banner edge
    const R = 108;
    avatar(ctx, logo, b.name, PAD + R + 12, BANNER_H, R, 12);

    // Identity
    let y = BANNER_H + R + 34;
    const maxW = W - PAD * 2;
    y = text(ctx, b.name, PAD, y, { size: 62, weight: 800, maxWidth: maxW, maxLines: 2, lineHeight: 74 });
    const identity = [b.category, placeLine(b)].filter(Boolean).join("  ·  ");
    if (identity) y = text(ctx, identity, PAD, y + 4, { size: 32, weight: 500, color: MUTED, maxWidth: maxW });
    y = trustPills(ctx, b, PAD, y + 18, W - PAD);

    // Products, sized to the room left above the footer. Prices go first when
    // it is tight, then the strip itself, so text never runs into the footer.
    const bottom = H - FOOTER_H - 36;
    const LABEL_H = 44;
    let showPrices = products.some((x) => x.price != null && x.price > 0);
    let textH = showPrices ? 84 : 46;
    let tileH = bottom - y - LABEL_H - textH;
    if (products.length && showPrices && tileH < 150) {
      showPrices = false;
      textH = 46;
      tileH = bottom - y - LABEL_H - textH;
    }
    const drawProducts = products.length > 0 && tileH >= 120;
    tileH = Math.min(tileH, 240);
    const stripH = drawProducts ? LABEL_H + tileH + textH : 0;

    // Description, in whatever room the products leave
    const room = bottom - y - stripH - (drawProducts ? 16 : 0);
    const descLines = Math.min(drawProducts ? 2 : 5, Math.floor(room / 42));
    if (b.description && descLines > 0) {
      text(ctx, b.description, PAD, y, { size: 32, weight: 400, color: "#334155", maxWidth: maxW, maxLines: descLines, lineHeight: 42 });
    }

    if (drawProducts) {
      const top = bottom - stripH;
      font(ctx, 800, 24);
      tracking(ctx, 3);
      ctx.fillStyle = MUTED;
      ctx.fillText(products.length === 1 ? "FEATURED" : "POPULAR HERE", PAD, top + 24);
      tracking(ctx, 0);
      const gap = 24;
      const tw = (maxW - gap * 2) / 3;
      products.forEach((p, i) => {
        const tx = PAD + i * (tw + gap);
        const ty = top + LABEL_H;
        ctx.save();
        roundRect(ctx, tx, ty, tw, tileH, 24);
        ctx.clip();
        const img = thumbs[i] ?? null;
        if (img) drawCover(ctx, img, tx, ty, tw, tileH);
        else {
          ctx.fillStyle = SOFT;
          ctx.fillRect(tx, ty, tw, tileH);
          font(ctx, 800, 72);
          ctx.fillStyle = "#cbd5e1";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(initials(p.name), tx + tw / 2, ty + tileH / 2);
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
        }
        ctx.restore();
        const ny = text(ctx, p.name, tx, ty + tileH + 8, { size: 27, weight: 600, maxWidth: tw });
        if (showPrices && p.price != null && p.price > 0) {
          text(ctx, formatMoney(p.price, p.currency), tx, ny - 6, { size: 28, weight: 800, color: BRAND, maxWidth: tw });
        }
      });
    }

    footer(
      ctx,
      icon,
      [`Find ${b.name} on Tijarah Connect`, "Find it on Tijarah Connect"],
      [`Search “${b.name}” · free on Google Play & App Store`, `Search “${b.name}” in the free app`, storesLine],
    );
    return await toJpeg(canvas);
  } catch {
    return null;
  } finally {
    loader.release();
  }
}

// ── Product card ─────────────────────────────────────────

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

    // Product photo
    const PHOTO_H = 720;
    if (photo) drawCover(ctx, photo, 0, 0, W, PHOTO_H);
    else {
      brandGradient(ctx, 0, 0, W, PHOTO_H);
      font(ctx, 800, 220);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials(p.name), W / 2, PHOTO_H / 2);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }
    const shade = ctx.createLinearGradient(0, 0, 0, 220);
    shade.addColorStop(0, "rgba(0,0,0,0.28)");
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, 220);

    let px = PAD;
    px += pill(ctx, p.kind === "service" ? "SERVICE" : "PRODUCT", px, PAD, { bg: "#ffffff", fg: BRAND, size: 26 }) + 14;
    if (b.deal) pill(ctx, b.deal.label.toUpperCase(), px, PAD, { bg: "#f59e0b", fg: "#ffffff", size: 26 });

    // Name and price
    const maxW = W - PAD * 2;
    let y = PHOTO_H + 36;
    y = text(ctx, p.name, PAD, y, { size: 56, weight: 800, maxWidth: maxW, maxLines: 2, lineHeight: 66 });
    if (p.price != null && p.price > 0) {
      y = text(ctx, formatMoney(p.price, p.currency), PAD, y + 2, { size: 58, weight: 800, color: BRAND, maxWidth: maxW });
    } else {
      y = text(ctx, "Price on request", PAD, y + 4, { size: 38, weight: 700, color: MUTED, maxWidth: maxW });
    }

    // Business strip, pinned above the footer
    const STRIP_H = 136;
    const stripTop = H - FOOTER_H - STRIP_H;
    const room = stripTop - y - 20;
    const descLines = Math.min(3, Math.floor(room / 40));
    if (p.description && descLines > 0) {
      text(ctx, p.description, PAD, y + 6, { size: 30, weight: 400, color: "#334155", maxWidth: maxW, maxLines: descLines, lineHeight: 40 });
    }

    ctx.fillStyle = LINE;
    ctx.fillRect(PAD, stripTop, maxW, 2);
    const ar = 44;
    avatar(ctx, logo, b.name, PAD + ar, stripTop + STRIP_H / 2, ar);
    const sx = PAD + ar * 2 + 24;
    const sw = W - sx - PAD;
    const nameBottom = text(ctx, b.name, sx, stripTop + 24, { size: 34, weight: 800, maxWidth: sw });
    const meta = [placeLine(b), b.verified ? "Verified" : null, b.womenLed ? "Women-led" : null].filter(Boolean).join("  ·  ");
    if (meta) text(ctx, meta, sx, nameBottom - 4, { size: 26, weight: 500, color: MUTED, maxWidth: sw });

    footer(
      ctx,
      icon,
      ["Get it on Tijarah Connect"],
      [`Search “${b.name}” · free on Google Play & App Store`, `Search “${b.name}” on Tijarah Connect`, storesLine],
    );
    return await toJpeg(canvas);
  } catch {
    return null;
  } finally {
    loader.release();
  }
}
