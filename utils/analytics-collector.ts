import { getTokenSync } from "@/utils/storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const EVENTS_URL = `${API_BASE}/analytics/events`;
const FLUSH_INTERVAL = 10_000; // 10 seconds
const MAX_BUFFER = 20;

type EventType =
  | "profile_view"
  | "product_view"
  | "search_appearance"
  | "search_click"
  | "chat_initiated"
  | "call_clicked"
  | "direction_clicked"
  | "share_clicked"
  | "saved"
  | "unsaved"
  | "offer_viewed"
  | "photo_viewed"
  | "review_read"
  | "tab_switched";

type SourceType =
  | "home_feed"
  | "explore"
  | "search"
  | "direct"
  | "saved"
  | "chat"
  | "product_link";

interface QueuedEvent {
  providerId: string;
  eventType: EventType;
  entityId?: string;
  metadata?: Record<string, any>;
  duration?: number;
  source?: SourceType;
  timestamp: string;
}

// ─── Session ID ─────────────────────────────────────────────────────

let _sessionId: string | null = null;

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  if (_sessionId) return _sessionId;
  _sessionId = sessionStorage.getItem("_bid_sid");
  if (!_sessionId) {
    _sessionId = crypto.randomUUID();
    sessionStorage.setItem("_bid_sid", _sessionId);
  }
  return _sessionId;
}

// ─── Event Buffer ───────────────────────────────────────────────────

let buffer: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastEventKeys = new Map<string, number>(); // dedup key → timestamp

function dedupeKey(providerId: string, eventType: string, entityId?: string): string {
  return `${providerId}:${eventType}:${entityId || ""}`;
}

function shouldDedupe(key: string): boolean {
  const now = Date.now();
  const last = lastEventKeys.get(key);
  if (last && now - last < 2000) return true; // Skip if same event within 2s
  lastEventKeys.set(key, now);
  // Clean old keys periodically
  if (lastEventKeys.size > 100) {
    const cutoff = now - 5000;
    for (const [k, t] of lastEventKeys) {
      if (t < cutoff) lastEventKeys.delete(k);
    }
  }
  return false;
}

// ─── Flush Logic ────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? getTokenSync() : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function flush() {
  if (buffer.length === 0) return;

  const events = [...buffer];
  buffer = [];
  const sessionId = getSessionId();
  const payload = JSON.stringify({ sessionId, events });

  // Always use fetch when possible — sendBeacon can't include auth headers
  // and some CORS configs block it. Fetch with keepalive survives page nav.
  fetch(EVENTS_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Last resort: sendBeacon (no auth, but at least the event arrives)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(EVENTS_URL, blob);
    }
  });
}

// ─── Setup ──────────────────────────────────────────────────────────

function ensureSetup() {
  if (typeof window === "undefined") return;
  if (flushTimer) return;

  flushTimer = setInterval(flush, FLUSH_INTERVAL);

  // Flush on page hide (tab switch, navigate away, close)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

// ─── Public API ─────────────────────────────────────────────────────

export function trackEvent(
  providerId: string,
  eventType: EventType,
  options?: {
    entityId?: string;
    metadata?: Record<string, any>;
    duration?: number;
    source?: SourceType;
  },
) {
  if (typeof window === "undefined") return;
  ensureSetup();

  const key = dedupeKey(providerId, eventType, options?.entityId);
  if (shouldDedupe(key)) return;

  buffer.push({
    providerId,
    eventType,
    entityId: options?.entityId,
    metadata: options?.metadata,
    duration: options?.duration,
    source: options?.source,
    timestamp: new Date().toISOString(),
  });

  if (buffer.length >= MAX_BUFFER) flush();
}

export function trackDuration(
  providerId: string,
  eventType: EventType = "profile_view",
  options?: { entityId?: string; source?: SourceType },
): () => void {
  const start = Date.now();
  return () => {
    const seconds = Math.round((Date.now() - start) / 1000);
    if (seconds < 2) return; // Ignore very short views
    trackEvent(providerId, eventType, {
      ...options,
      duration: seconds,
    });
  };
}

export function flushAnalytics() {
  flush();
}
