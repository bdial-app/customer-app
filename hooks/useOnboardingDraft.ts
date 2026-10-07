"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getItemSync, removeItemSync, setItemSync } from "@/utils/storage";
import { deleteOnboardingDraft, getOnboardingDraft, saveOnboardingDraft } from "@/services/onboarding.service";
import { withDeadline } from "@/utils/onboarding-media";

export type DraftSaveStatus = "idle" | "saving" | "saved" | "local";

interface Stored<T> {
  data: T;
  step: number;
  updatedAt: string;
}

const keyFor = (userId: string) => `tijarah.onboardingDraft.v1.${userId}`;
const SERVER_DEBOUNCE_MS = 2500;

function readLocal<T>(userId: string): Stored<T> | null {
  try {
    const raw = getItemSync(keyFor(userId));
    return raw ? (JSON.parse(raw) as Stored<T>) : null;
  } catch {
    return null;
  }
}

/**
 * "List your business" progress, kept as people type: on the phone at once,
 * and on their account a moment later (and right away when the app goes to
 * the background). On return, whichever copy is newer wins — so a killed
 * app, no signal, or a new phone never costs anyone their work.
 */
export function useOnboardingDraft<T>(userId: string | null | undefined) {
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<Stored<T> | null>(null);
  const [status, setStatus] = useState<DraftSaveStatus>("idle");
  const pending = useRef<{ data: T; step: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleared = useRef(false);

  // Load: newest of this phone's copy and the account's copy.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const local = readLocal<T>(userId);
    withDeadline(getOnboardingDraft<T>(), 8000, "draft-timeout")
      .then((server) => {
        if (cancelled) return;
        const newest =
          server && (!local || new Date(server.updatedAt) >= new Date(local.updatedAt)) ? server : local;
        setInitial(newest ?? null);
      })
      .catch(() => !cancelled && setInitial(local))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const pushToServer = useCallback(async () => {
    if (!userId || !pending.current || cleared.current) return;
    const { data, step } = pending.current;
    pending.current = null;
    setStatus("saving");
    try {
      await withDeadline(saveOnboardingDraft(data, step), 15_000, "draft-timeout");
      if (!cleared.current) setStatus("saved");
    } catch {
      // Still safe on this phone; the next change (or reconnect) tries again.
      if (!pending.current) pending.current = { data, step };
      setStatus("local");
    }
  }, [userId]);

  const save = useCallback(
    (data: T, step: number) => {
      if (!userId || cleared.current) return;
      try {
        setItemSync(keyFor(userId), JSON.stringify({ data, step, updatedAt: new Date().toISOString() }));
      } catch {
        /* storage full or blocked: the account copy still saves */
      }
      pending.current = { data, step };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void pushToServer(), SERVER_DEBOUNCE_MS);
    },
    [userId, pushToServer],
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    void pushToServer();
  }, [pushToServer]);

  /** Throw the draft away (start over, or listed successfully). */
  const clear = useCallback(async () => {
    cleared.current = true;
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    if (userId) {
      try {
        removeItemSync(keyFor(userId));
      } catch {
        /* ignore */
      }
    }
    await deleteOnboardingDraft().catch(() => undefined);
  }, [userId]);

  /** Start saving again after a "start over". */
  const reset = useCallback(() => {
    cleared.current = false;
    setInitial(null);
    setStatus("idle");
  }, []);

  // Save immediately when the app goes to the background or reconnects.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    const onOnline = () => flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", onOnline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  // Signed out: nothing to load.
  return { loading: userId ? loading : false, initial, status, save, flush, clear, reset };
}
