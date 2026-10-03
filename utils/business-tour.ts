import { getItemSync, setItemSync } from "./storage";

/**
 * Which chapters of the business tour this account has been through, per
 * device. Keyed by user id: unlike the welcome tour, this one explains your
 * own dashboard, so a second account on the same phone should see it too.
 */
const keyFor = (userId: string) => `tijarah.businessTour.v1.${userId}`;

interface TourRecord {
  /** Chapter ids completed (home, business, analytics, chats). */
  chapters: string[];
  /** The owner chose "Not now" or closed it — don't auto-open again. */
  dismissed?: boolean;
}

export function readBusinessTour(userId: string): TourRecord {
  try {
    const raw = getItemSync(keyFor(userId));
    if (!raw) return { chapters: [] };
    const parsed = JSON.parse(raw) as TourRecord;
    return { chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [], dismissed: !!parsed.dismissed };
  } catch {
    // Unreadable storage counts as "seen" so a broken read never traps anyone in the tour.
    return { chapters: [], dismissed: true };
  }
}

export function saveBusinessTour(userId: string, record: TourRecord): void {
  try {
    setItemSync(keyFor(userId), JSON.stringify(record));
  } catch {
    /* worst case it offers itself once more */
  }
  listeners.forEach((l) => l());
}

/** Merge newly completed chapters in, and optionally mark it dismissed. */
export function recordBusinessTour(userId: string, completed: string[], dismissed?: boolean): void {
  const prev = readBusinessTour(userId);
  saveBusinessTour(userId, {
    chapters: [...new Set([...prev.chapters, ...completed])],
    dismissed: prev.dismissed || !!dismissed,
  });
}

// ── Lets the replay button anywhere in the app open the tour ──
type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribeBusinessTour = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const OPEN_EVENT = "tijarah:open-business-tour";

/** Open the tour from anywhere (a help button, Profile). Optionally a single chapter. */
export function openBusinessTour(chapterId?: string): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { chapterId } }));
}

export function onOpenBusinessTour(handler: (chapterId?: string) => void): () => void {
  const fn = (e: Event) => handler((e as CustomEvent<{ chapterId?: string }>).detail?.chapterId);
  window.addEventListener(OPEN_EVENT, fn);
  return () => window.removeEventListener(OPEN_EVENT, fn);
}
