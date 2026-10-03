import { getItemSync, setItemSync } from "./storage";

/** Which chapters of a tour someone has been through, and whether they waved it off. */
export interface TourRecord {
  chapters: string[];
  /** Chose "Maybe later" or closed it — don't auto-open again. */
  dismissed?: boolean;
}

/**
 * Per-device progress for one guided tour, keyed by account (or "guest").
 * Each tour gets its own storage key and its own "open me" event, so the
 * business and customer tours never step on each other.
 */
export function createTourStore(name: string) {
  const keyFor = (owner: string) => `tijarah.${name}Tour.v1.${owner}`;
  const listeners = new Set<() => void>();
  const openEvent = `tijarah:open-${name}-tour`;

  const read = (owner: string): TourRecord => {
    try {
      const raw = getItemSync(keyFor(owner));
      if (!raw) return { chapters: [] };
      const parsed = JSON.parse(raw) as TourRecord;
      return { chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [], dismissed: !!parsed.dismissed };
    } catch {
      // Unreadable storage counts as "seen" so a broken read never traps anyone in a tour.
      return { chapters: [], dismissed: true };
    }
  };

  const save = (owner: string, record: TourRecord) => {
    try {
      setItemSync(keyFor(owner), JSON.stringify(record));
    } catch {
      /* worst case it offers itself once more */
    }
    listeners.forEach((l) => l());
  };

  return {
    read,
    save,
    /** Merge newly completed chapters in, and optionally mark it dismissed. */
    record(owner: string, completed: string[], dismissed?: boolean) {
      const prev = read(owner);
      save(owner, {
        chapters: [...new Set([...prev.chapters, ...completed])],
        dismissed: prev.dismissed || !!dismissed,
      });
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    /** Open the tour from anywhere (a help button, Profile). "all" = whole tour; a chapter id = just that chapter. */
    open(chapterId?: string) {
      window.dispatchEvent(new CustomEvent(openEvent, { detail: { chapterId } }));
    },
    onOpen(handler: (chapterId?: string) => void) {
      const fn = (e: Event) => handler((e as CustomEvent<{ chapterId?: string }>).detail?.chapterId);
      window.addEventListener(openEvent, fn);
      return () => window.removeEventListener(openEvent, fn);
    },
  };
}
