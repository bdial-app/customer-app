"use client";

import * as Sentry from "@sentry/react";

let initialized = false;

/**
 * Initialize Sentry error tracking.
 * Works on both web and native Capacitor.
 * Requires NEXT_PUBLIC_SENTRY_DSN env var.
 */
export function initSentry() {
  if (initialized) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Sentry] DSN not configured — error tracking disabled");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "production",
    // Capture 100% of errors, sample 10% of transactions (performance)
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    // Don't send in development
    enabled: process.env.NODE_ENV === "production",
    // Filter noisy/expected errors
    ignoreErrors: [
      "Token expired",
      "Network Error",
      "Request aborted",
      "canceled",
      "AbortError",
      "ChunkLoadError",
    ],
    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (b.data?.url) {
            // Remove tokens from URLs
            b.data.url = b.data.url.replace(/token=[^&]+/g, "token=[REDACTED]");
          }
          return b;
        });
      }
      return event;
    },
  });

  initialized = true;
}

/**
 * Identify the current user for Sentry error context.
 */
export function identifySentryUser(user: { id: string; email?: string }) {
  Sentry.setUser({ id: user.id, email: user.email });
}

/**
 * Clear user identity on logout.
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Manually capture an error with optional context.
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}
