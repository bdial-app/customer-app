/**
 * Back lands where you left.
 *
 * Almost nothing in the app scrolls the window: the home tabs, collections,
 * catalogues, search and the rest each scroll a box of their own. The browser
 * and Next.js only restore the window's scroll, so opening a card and coming
 * back rebuilt the list at the top every time.
 *
 * This remembers the scroll of every scrolling box, per page, and puts it back
 * when the page is reached by going *back* (in-app arrow, Android back, the
 * browser's back, an iOS swipe: all of them pop history). A page opened fresh
 * still starts at the top.
 *
 * Boxes are told apart by a `data-scroll-key` when they carry one (the home
 * tabs do, since which of them is mounted varies), otherwise by their class
 * list and which match of it they are. Both survive a banner or toast showing
 * up elsewhere on the page, so no page has to opt in.
 */

const STORAGE_KEY = "__scroll_memory";
const MAX_PAGES = 40;
/** How long after a back to keep re-applying the position while the page fills in. */
const RESTORE_WINDOW_MS = 2500;
/**
 * A box that was already on screen when back was pressed belongs to the page
 * being left, unless it's still there after this long (a box shared by both).
 */
const OUTGOING_GRACE_MS = 400;

type PagePositions = Record<string, number>;

let memory: Map<string, PagePositions> | null = null;
let restoring: { url: string; until: number } | null = null;
let installed = false;

const currentUrl = () => location.pathname + location.search;

function load(): Map<string, PagePositions> {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    memory = new Map(raw ? (JSON.parse(raw) as [string, PagePositions][]) : []);
  } catch {
    memory = new Map();
  }
  return memory;
}

let persistQueued = false;
function persist() {
  if (persistQueued) return;
  persistQueued = true;
  setTimeout(() => {
    persistQueued = false;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...load()]));
    } catch {
      // Private mode or storage full: positions still live for this session.
    }
  }, 300);
}

/** Elements whose class attribute is exactly `cls`, in document order. */
function sameClass(cls: string): Element[] {
  return Array.from(document.getElementsByClassName(cls)).filter((e) => e.getAttribute("class") === cls);
}

/** "k:home", "c:flex-1 overflow-y-auto#0" or "window". */
function keyOf(el: Element): string | null {
  if (el === document.scrollingElement) return "window";
  const named = el.getAttribute("data-scroll-key");
  if (named) return `k:${named}`;
  const cls = el.getAttribute("class")?.trim();
  if (!cls) return null;
  return `c:${cls}#${sameClass(cls).indexOf(el)}`;
}

function elementFor(key: string): Element | null {
  if (key === "window") return document.scrollingElement;
  if (key.startsWith("k:")) return document.querySelector(`[data-scroll-key="${CSS.escape(key.slice(2))}"]`);
  const at = key.lastIndexOf("#");
  return sameClass(key.slice(2, at))[Number(key.slice(at + 1))] ?? null;
}

function remember(el: Element) {
  const url = currentUrl();
  // While a back is being restored, the page is still filling in: a scroll
  // event now is the browser clamping a short list, not the person scrolling.
  if (restoring?.url === url) return;
  const key = keyOf(el);
  if (!key) return;
  const pages = load();
  const positions = pages.get(url) ?? {};
  if (el.scrollTop > 0) positions[key] = Math.round(el.scrollTop);
  else delete positions[key];
  // Most recent last, so the oldest page is the one dropped.
  pages.delete(url);
  if (Object.keys(positions).length) pages.set(url, positions);
  while (pages.size > MAX_PAGES) pages.delete(pages.keys().next().value as string);
  persist();
}

function stopRestoring() {
  restoring = null;
}

/** Re-apply the saved positions each frame until they stick or time runs out. */
function restore(url: string) {
  const positions = load().get(url);
  if (!positions) return;
  const started = Date.now();
  restoring = { url, until: started + RESTORE_WINDOW_MS };
  // History has already moved but the page being left is still on screen for a
  // moment, and its boxes can match the same keys. Leave those alone, or the
  // outgoing page jumps on its way out.
  const outgoing = new Set(
    Object.keys(positions)
      .filter((k) => k !== "window")
      .map(elementFor),
  );

  const tick = () => {
    if (!restoring || restoring.url !== url) return;
    // Navigated on before it finished, or ran out of time.
    if (currentUrl() !== url || Date.now() > restoring.until) return stopRestoring();
    for (const [key, top] of Object.entries(positions)) {
      const el = elementFor(key);
      if (!el || (outgoing.has(el) && Date.now() - started < OUTGOING_GRACE_MS)) continue;
      // Short of content means the list hasn't loaded yet; try next frame.
      if (Math.abs(el.scrollTop - top) > 2 && el.scrollHeight - el.clientHeight >= top) {
        el.scrollTop = top;
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Wire it up once, as early as possible. Safe to call more than once. */
export function installScrollMemory() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // We restore ourselves; the browser jumping the window as well would fight it.
  try {
    history.scrollRestoration = "manual";
  } catch {}

  let queued = new Set<Element>();
  document.addEventListener(
    "scroll",
    (e) => {
      const target = e.target === document ? document.scrollingElement : e.target;
      if (!(target instanceof Element)) return;
      if (queued.size === 0) {
        requestAnimationFrame(() => {
          const els = queued;
          queued = new Set();
          els.forEach(remember);
        });
      }
      queued.add(target);
    },
    { capture: true, passive: true },
  );

  // The moment someone touches the screen, it's their scroll again.
  for (const type of ["touchstart", "wheel", "pointerdown", "keydown"]) {
    window.addEventListener(type, stopRestoring, { capture: true, passive: true });
  }

  window.addEventListener("popstate", () => restore(currentUrl()));

  // A reload, or coming back to the app from another site, also gets its place back.
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload" || nav?.type === "back_forward") restore(currentUrl());
  } catch {}
}
