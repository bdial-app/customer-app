/**
 * Asking for an App Store / Play Store review — at the right moment, from the
 * right people, rarely.
 *
 * Shows the platform's own review sheet (stars without leaving the app), never
 * a custom "Do you like the app?" question first. That is not a style choice:
 * Google Play's in-app review guidelines forbid asking the user any question
 * before or after the rating card, opinion ("Do you like the app?") or
 * predictive ("Would you rate us 5 stars?"), and Apple asks apps not to
 * interrupt. So the timing does all the work the question would have done —
 * we ask people whose behaviour already says the app worked for them.
 *
 * Neither store tells us what happened next. The sheet may not appear at all
 * (Apple shows it at most three times a year per person; Google enforces an
 * undisclosed quota), and there is no callback for "dismissed" or "rated".
 * Everything here is therefore counted in asks *spent*, never in outcomes, and
 * each later ask waits longer than the last.
 *
 *   who      native apps only; a signed-in account that has used the app on a
 *            few separate days and got value from it more than once
 *   when     coming back within 15 minutes of calling or WhatsApping a
 *            business, right after saving one, or — for an owner — just after
 *            a new enquiry lands
 *   never    in the first minute of a session, over an open sheet or tour,
 *            within 10 minutes of an error, while signed out, or after they
 *            have told us to stop
 *   how often  once per app version, with a cooldown that grows after each
 *            ask, and only if they have got value again since the last one
 */
import { getNativePlatform } from "@/utils/platform";
import { hasOpenOverlay } from "@/hooks/useBackDismiss";
import { detectDevicePlatform, storeUrlFor } from "@/utils/store-links";

const STORE_KEY = "tijarah.appReview.v2";

const DAY = 864e5;

/** Defaults; the server can retune these without an app release. */
const DEFAULTS = {
  enabled: true,
  minDaysSinceFirstUse: 2,
  minSessions: 3,
  minValueMoments: 2,
  cooldownDays: 45,
  maxPrompts: 3,
};

const FIXED = {
  /** A new session after this long away. */
  sessionGapMs: 30 * 60_000,
  /** Settle into a session before anything pops up. */
  minSessionAgeMs: 60_000,
  /** Coming back this soon after a call/WhatsApp counts as "it worked". */
  contactReturnWindowMs: 15 * 60_000,
  /** Something went wrong recently: not the moment. */
  frictionQuietMs: 10 * 60_000,
  /**
   * Each ask after the first waits this much longer than the one before, so a
   * person who ignored us twice is left alone for most of a year.
   */
  cooldownGrowth: 2.5,
  /** Value has to arrive again before we spend another ask. */
  valueMomentsBetweenAsks: 2,
};

type Config = typeof DEFAULTS;
let config: Config = { ...DEFAULTS };

/**
 * Apply the server's tuning. Anything missing or unparseable keeps its
 * default, so a bad value cannot switch the prompt off by accident.
 */
export function setReviewConfig(flags: Record<string, unknown> | undefined | null): void {
  if (!flags) return;
  const num = (key: string, fallback: number) => {
    const raw = flags[`app_review_${key}`];
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const enabled = flags.app_review_enabled;
  config = {
    enabled: enabled === undefined ? DEFAULTS.enabled : enabled === true || enabled === "true",
    minDaysSinceFirstUse: num("min_days", DEFAULTS.minDaysSinceFirstUse),
    minSessions: num("min_sessions", DEFAULTS.minSessions),
    minValueMoments: num("min_value_moments", DEFAULTS.minValueMoments),
    cooldownDays: num("cooldown_days", DEFAULTS.cooldownDays),
    maxPrompts: num("max_asks", DEFAULTS.maxPrompts),
  };
}

type State = {
  firstUseAt: number;
  sessions: number;
  lastActiveAt: number;
  valueMoments: number;
  /** When they last left to call or WhatsApp a business. */
  contactAt?: number;
  lastFrictionAt?: number;
  prompts: number;
  lastPromptAt?: number;
  lastPromptVersion?: string;
  /** valueMoments as it stood when we last asked. */
  valueMomentsAtLastPrompt?: number;
  /** They told us to stop. */
  optedOut?: boolean;
};

function load(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // fall through
  }
  const now = Date.now();
  return { firstUseAt: now, sessions: 0, lastActiveAt: 0, valueMoments: 0, prompts: 0 };
}

function save(s: State) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    // storage full or unavailable — the prompt simply won't happen
  }
}

let signedIn = false;
let sessionStartedAt = Date.now();
let appVersion = "";
/** Set by the prompter so a spent ask reaches the server's shared ledger. */
let reportAsk: ((channel: "in_app") => void) | null = null;

const native = () => typeof window !== "undefined" && getNativePlatform() !== "web";

/** Kept in sync by AppReviewPrompter from the auth state. */
export function setReviewSignedIn(value: boolean) {
  signedIn = value;
}

export function setReviewAppVersion(version: string) {
  appVersion = version;
}

/**
 * How to tell the server an ask was spent. The server shares that ledger with
 * WhatsApp and push campaigns, so they skip anyone the app just asked.
 */
export function setReviewReporter(fn: ((channel: "in_app") => void) | null) {
  reportAsk = fn;
}

/** The app came to the foreground (or started). Counts sessions. */
export function noteForeground(): void {
  if (!native()) return;
  const s = load();
  const now = Date.now();
  if (!s.lastActiveAt || now - s.lastActiveAt > FIXED.sessionGapMs) {
    s.sessions += 1;
    sessionStartedAt = now;
  }
  s.lastActiveAt = now;
  save(s);
}

/** The app went to the background. */
export function noteBackground(): void {
  if (!native()) return;
  const s = load();
  s.lastActiveAt = Date.now();
  save(s);
}

/** Something went wrong (an error message was shown). */
export function noteFriction(): void {
  if (!native()) return;
  const s = load();
  s.lastFrictionAt = Date.now();
  save(s);
}

/**
 * The moments worth counting. A customer gets value when they reach a business
 * (`contact`, `chat`) or keep one for later (`save`); an owner gets value when
 * the app brings them someone (`lead`) or their listing goes live (`listing`).
 *
 * `save`, `lead` and `listing` are themselves good moments to ask, so they try
 * straight away; `contact` and `chat` send the person out of the app, so those
 * wait for them to come back (see `returnedFromContact`).
 */
export type ValueMoment = "contact" | "chat" | "save" | "lead" | "listing";

const ASK_IMMEDIATELY: ValueMoment[] = ["save", "lead", "listing"];

export function noteValueMoment(kind: ValueMoment): void {
  if (!native()) return;
  const s = load();
  s.valueMoments += 1;
  if (kind === "contact") s.contactAt = Date.now();
  save(s);
  if (ASK_IMMEDIATELY.includes(kind)) {
    setTimeout(() => void maybeAskForReview(kind), 1500);
  }
}

/** They asked not to be shown this again — honoured everywhere, forever. */
export function optOutOfReviewPrompts(): void {
  const s = load();
  s.optedOut = true;
  save(s);
}

/** How long to wait after the nth ask: 45d, then 112d, then 281d. */
function cooldownFor(prompts: number): number {
  return config.cooldownDays * DAY * Math.pow(FIXED.cooldownGrowth, Math.max(0, prompts - 1));
}

/** Whether now is a good moment, and why not when it isn't (for debugging). */
export function reviewEligibility(now = Date.now()): { ok: boolean; reason: string } {
  if (!native()) return { ok: false, reason: "not a native app" };
  if (!config.enabled) return { ok: false, reason: "turned off" };
  if (!signedIn) return { ok: false, reason: "signed out" };
  const s = load();
  if (s.optedOut) return { ok: false, reason: "opted out" };
  if (now - s.firstUseAt < config.minDaysSinceFirstUse * DAY) return { ok: false, reason: "too new" };
  if (s.sessions < config.minSessions) return { ok: false, reason: "too few sessions" };
  if (s.valueMoments < config.minValueMoments) return { ok: false, reason: "too few value moments" };
  if (s.prompts >= config.maxPrompts) return { ok: false, reason: "asked enough" };
  if (s.lastPromptAt && now - s.lastPromptAt < cooldownFor(s.prompts)) {
    return { ok: false, reason: "cooling down" };
  }
  // Asked before and nothing good has happened since: they have moved on.
  if (
    s.prompts > 0 &&
    s.valueMoments - (s.valueMomentsAtLastPrompt ?? 0) < FIXED.valueMomentsBetweenAsks
  ) {
    return { ok: false, reason: "no new value since last ask" };
  }
  if (appVersion && s.lastPromptVersion === appVersion) return { ok: false, reason: "already asked this version" };
  if (s.lastFrictionAt && now - s.lastFrictionAt < FIXED.frictionQuietMs) return { ok: false, reason: "recent error" };
  if (now - sessionStartedAt < FIXED.minSessionAgeMs) return { ok: false, reason: "session just started" };
  if (hasOpenOverlay()) return { ok: false, reason: "something is open" };
  if (document.querySelector('[aria-modal="true"][aria-label$=" tour"]')) return { ok: false, reason: "tour showing" };
  return { ok: true, reason: "ok" };
}

/** Back in the app soon after leaving to contact a business? */
export function returnedFromContact(now = Date.now()): boolean {
  const s = load();
  return !!s.contactAt && now - s.contactAt < FIXED.contactReturnWindowMs;
}

/** Show the store's review sheet if everything lines up. */
export async function maybeAskForReview(
  trigger: "contact-return" | ValueMoment,
): Promise<boolean> {
  if (!reviewEligibility().ok) return false;
  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    // Re-check: the person may have opened something while the plugin loaded.
    if (!reviewEligibility().ok) return false;
    await InAppReview.requestReview();
  } catch {
    return false; // plugin missing in an older build, or the store declined
  }
  // The sheet may never have appeared — the stores don't say. Either way the
  // ask is spent, and counting it is what keeps us from asking again soon.
  const s = load();
  s.prompts += 1;
  s.lastPromptAt = Date.now();
  s.lastPromptVersion = appVersion || s.lastPromptVersion;
  s.valueMomentsAtLastPrompt = s.valueMoments;
  if (trigger === "contact-return") s.contactAt = undefined;
  save(s);
  try {
    reportAsk?.("in_app");
  } catch {
    // the ledger is an optimisation, never a reason to fail here
  }
  return true;
}

/**
 * The store page, for the "Rate Tijarah" row — always the person's choice.
 *
 * Uses the checked links in store-links rather than the NEXT_PUBLIC_*_STORE_URL
 * env values, which point at a Play package that does not exist and an App
 * Store placeholder id.
 */
export function storeReviewUrl(): string | null {
  const platform = getNativePlatform();
  if (platform === "web") return null;
  const url = storeUrlFor(detectDevicePlatform(platform));
  // Apple opens the review composer directly; Play has no such deep link, so
  // Android gets the listing, where the stars are the first thing on screen.
  return platform === "ios" ? `${url}?action=write-review` : url;
}
