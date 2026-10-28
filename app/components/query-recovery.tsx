"use client";
import { useEffect } from "react";
import { onlineManager, useQueryClient, type Query } from "@tanstack/react-query";
import { isNativePlatform } from "@/utils/platform";

/** On screen, but failed or never loaded — what the user is staring at empty. */
const stranded = (q: Query) =>
  q.getObserversCount() > 0 &&
  q.state.fetchStatus !== "fetching" &&
  (q.state.status === "error" || q.state.data === undefined);

const BACKOFF_MS = [3000, 6000, 12000, 20000, 30000];
const GIVE_UP_AFTER_MS = 5 * 60 * 1000;

/**
 * Data that failed to load comes back by itself.
 *
 * A first launch on mobile data can lose its first requests while the phone
 * still reports "online". react-query then gives up after its retries, and
 * nothing asks again: focus refetching is off and "reconnect" never fires —
 * the screen stayed empty until something changed the query (e.g. signing in).
 * So: retry stranded queries with backoff, again whenever the app comes back
 * to the front, and treat any successful response as proof we're online.
 */
export function QueryRecovery() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let since = 0;

    const sweep = () =>
      queryClient.refetchQueries({ type: "active", predicate: stranded }).catch(() => {});

    const schedule = () => {
      if (timer) return;
      if (!since) since = Date.now();
      if (Date.now() - since > GIVE_UP_AFTER_MS) return;
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      timer = setTimeout(() => {
        timer = null;
        attempt++;
        sweep().then(() => {
          if (queryClient.getQueryCache().getAll().some(stranded)) schedule();
          else reset();
        });
      }, delay);
    };
    const reset = () => {
      attempt = 0;
      since = 0;
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const unsub = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated") return;
      const { query, action } = event;
      if (action.type === "error" && query.getObserversCount() > 0) schedule();
      // A response arrived, so the network works — un-pause anything waiting on "online".
      if (action.type === "success" && !onlineManager.isOnline()) onlineManager.setOnline(true);
    });

    // Back to the front (app resume / tab visible): fetch whatever is still missing.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      reset();
      sweep();
    };
    document.addEventListener("visibilitychange", onVisible);

    let removeResume: (() => void) | undefined;
    if (isNativePlatform()) {
      import("@capacitor/app")
        .then(({ App }) =>
          App.addListener("resume", () => {
            reset();
            sweep();
          }),
        )
        .then((h) => {
          removeResume = () => h.remove();
        })
        .catch(() => {});
    }

    return () => {
      unsub();
      reset();
      document.removeEventListener("visibilitychange", onVisible);
      removeResume?.();
    };
  }, [queryClient]);

  return null;
}
