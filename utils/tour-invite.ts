import { getItemSync, setItemSync } from "./storage";

/**
 * The small "Take a 1-minute tour" card. Tours never open by themselves: this
 * card sits on the screen instead, for the first few app opens, until it's
 * waved off or the tour is taken — then never again.
 *
 * "customer" is per device (you can browse without an account, and signing
 * in or out mustn't bring it back). The business card is per account, since
 * it explains that owner's own dashboard.
 */
export type InviteScope = "customer" | `business.${string}`;

interface InviteRecord {
  /** App opens the card has been shown on. */
  opens: number;
  /** Waved off, or the tour was taken. */
  done: boolean;
  /** When the last open was counted. */
  lastAt: number;
}

/** Shown on at most this many app opens. */
export const INVITE_MAX_OPENS = 3;
/** Opens closer together than this are one visit (reloads, quick app switches). */
const VISIT_GAP_MS = 30 * 60 * 1000;

const keyFor = (scope: InviteScope) => `tijarah.tourInvite.v1.${scope}`;
const listeners = new Set<() => void>();
const countedThisLaunch = new Set<InviteScope>();

export function readInvite(scope: InviteScope): InviteRecord {
  try {
    const raw = getItemSync(keyFor(scope));
    if (!raw) return { opens: 0, done: false, lastAt: 0 };
    const r = JSON.parse(raw) as Partial<InviteRecord>;
    return { opens: Number(r.opens) || 0, done: !!r.done, lastAt: Number(r.lastAt) || 0 };
  } catch {
    // Unreadable storage counts as done: never nag because of a broken read.
    return { opens: 0, done: true, lastAt: 0 };
  }
}

function save(scope: InviteScope, record: InviteRecord) {
  try {
    setItemSync(keyFor(scope), JSON.stringify(record));
  } catch {
    /* worst case it shows once more */
  }
  listeners.forEach((l) => l());
}

/** Count this visit: once per launch, and only if the last one was a while ago. */
export function countInviteOpen(scope: InviteScope) {
  if (countedThisLaunch.has(scope)) return;
  countedThisLaunch.add(scope);
  const r = readInvite(scope);
  const now = Date.now();
  if (r.done || now - r.lastAt < VISIT_GAP_MS) return;
  save(scope, { ...r, opens: r.opens + 1, lastAt: now });
}

/** Waved off or tour taken: never show it again. */
export function closeInvite(scope: InviteScope) {
  save(scope, { ...readInvite(scope), done: true });
}

export function subscribeInvite(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
