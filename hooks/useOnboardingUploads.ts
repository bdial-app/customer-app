"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isAxiosError } from "axios";
import { uploadOnboardingMedia, type OnboardingMediaKind } from "@/services/onboarding.service";
import { prepareForUpload, withDeadline } from "@/utils/onboarding-media";
import { UploadFileError } from "@/utils/compress-image";

export type UploadStatus = "queued" | "preparing" | "uploading" | "done" | "error";

export interface UploadItem {
  id: string;
  kind: OnboardingMediaKind;
  name: string;
  mime: string;
  /** Local preview while uploading, then the uploaded URL. */
  previewUrl: string | null;
  url?: string;
  status: UploadStatus;
  /** 0–1 while uploading. */
  progress: number;
  error?: string;
  file?: File;
}

/** What a draft keeps of a finished upload. */
export interface MediaRef {
  id: string;
  kind: OnboardingMediaKind;
  url: string;
  name: string;
  mime: string;
}

const MAX_ATTEMPTS = 3;
const CONCURRENCY = 2;
const newId = () => `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function friendlyError(err: unknown): { message: string; retryable: boolean } {
  if (err instanceof UploadFileError) return { message: err.message, retryable: false };
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const serverMsg = (err.response?.data as { message?: string | string[] } | undefined)?.message;
    const msg = Array.isArray(serverMsg) ? serverMsg.join(", ") : serverMsg;
    if (!err.response) return { message: "No connection — tap to try again", retryable: true };
    if (status === 413) return { message: "This file is too large (max 25 MB) — pick a smaller one", retryable: false };
    if (status === 401) return { message: "Please sign in again, then retry", retryable: false };
    if (status && status >= 500) return { message: "Server busy — tap to try again", retryable: true };
    return { message: msg || "Couldn't upload — tap to try again", retryable: status === 429 };
  }
  const m = err instanceof Error ? err.message : "";
  if (/too large/i.test(m)) return { message: m, retryable: false };
  if (/timeout|timed out|deadline/i.test(m)) return { message: "Slow connection — tap to try again", retryable: true };
  return { message: "Couldn't upload — tap to try again", retryable: true };
}

/**
 * Photos and documents for "List your business", uploaded one by one in the
 * background as soon as they're picked. Nothing here can wait forever: every
 * step has a deadline, retries are automatic, and a failure is shown on the
 * photo itself with a tap to retry.
 */
export class OnboardingUploadQueue {
  private items = new Map<string, UploadItem>();
  private aborts = new Map<string, AbortController>();
  private listeners = new Set<() => void>();
  private idleWaiters = new Set<() => void>();
  private running = 0;
  private version = 0;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getVersion = () => this.version;

  private emit() {
    this.version++;
    this.listeners.forEach((l) => l());
    if (this.busyCount() === 0) {
      this.idleWaiters.forEach((w) => w());
      this.idleWaiters.clear();
    }
  }

  private patch(id: string, p: Partial<UploadItem>) {
    const cur = this.items.get(id);
    if (!cur) return;
    this.items.set(id, { ...cur, ...p });
    this.emit();
  }

  get(id: string | null | undefined): UploadItem | undefined {
    return id ? this.items.get(id) : undefined;
  }

  add(kind: OnboardingMediaKind, file: File): string {
    const id = newId();
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    this.items.set(id, { id, kind, name: file.name, mime: file.type, previewUrl, status: "queued", progress: 0, file });
    this.emit();
    this.pump();
    return id;
  }

  /** A finished upload brought back from a draft. */
  restore(ref: MediaRef) {
    if (this.items.has(ref.id)) return;
    this.items.set(ref.id, {
      id: ref.id,
      kind: ref.kind,
      name: ref.name,
      mime: ref.mime,
      previewUrl: ref.mime.startsWith("image/") ? ref.url : null,
      url: ref.url,
      status: "done",
      progress: 1,
    });
    this.emit();
  }

  remove(id: string | null | undefined) {
    if (!id) return;
    const it = this.items.get(id);
    this.aborts.get(id)?.abort();
    if (it?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(it.previewUrl);
    this.items.delete(id);
    this.emit();
  }

  retry(id: string) {
    const it = this.items.get(id);
    if (!it || it.status !== "error" || !it.file) return;
    this.patch(id, { status: "queued", error: undefined, progress: 0 });
    this.pump();
  }

  retryAllFailed() {
    for (const it of this.items.values()) if (it.status === "error") this.retry(it.id);
  }

  ref(id: string | null | undefined): MediaRef | null {
    const it = this.get(id);
    return it?.status === "done" && it.url
      ? { id: it.id, kind: it.kind, url: it.url, name: it.name, mime: it.mime }
      : null;
  }

  busyCount(ids?: string[]) {
    let n = 0;
    for (const it of this.items.values()) {
      if (ids && !ids.includes(it.id)) continue;
      if (it.status === "queued" || it.status === "preparing" || it.status === "uploading") n++;
    }
    return n;
  }

  failedCount(ids?: string[]) {
    let n = 0;
    for (const it of this.items.values()) {
      if (ids && !ids.includes(it.id)) continue;
      if (it.status === "error") n++;
    }
    return n;
  }

  /** Resolves when nothing is preparing or uploading (or after `ms`). */
  waitForIdle(ms: number): Promise<void> {
    if (this.busyCount() === 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(t);
        resolve();
      };
      const t = setTimeout(() => {
        this.idleWaiters.delete(done);
        resolve();
      }, ms);
      this.idleWaiters.add(done);
    });
  }

  dispose() {
    for (const c of this.aborts.values()) c.abort();
    for (const it of this.items.values()) if (it.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(it.previewUrl);
    this.items.clear();
  }

  private pump() {
    while (this.running < CONCURRENCY) {
      const next = [...this.items.values()].find((it) => it.status === "queued");
      if (!next) return;
      this.running++;
      void this.process(next.id).finally(() => {
        this.running--;
        this.pump();
      });
    }
  }

  private async process(id: string) {
    const item = this.items.get(id);
    if (!item?.file) return;
    this.patch(id, { status: "preparing", progress: 0 });
    let file: File;
    try {
      // Photos are shrunk one at a time, so this may include waiting for others.
      file = await withDeadline(prepareForUpload(item.file, item.kind), 120_000, "prepare-timeout");
    } catch (err) {
      if (!this.items.has(id)) return;
      const { message } = friendlyError(err);
      this.patch(id, { status: "error", error: message });
      return;
    }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (!this.items.has(id)) return; // removed meanwhile
      const ctrl = new AbortController();
      this.aborts.set(id, ctrl);
      this.patch(id, { status: "uploading", progress: 0 });
      try {
        // Our own deadline too: on some phones the native HTTP layer ignores axios' timeout.
        const res = await withDeadline(
          uploadOnboardingMedia(item.kind, file, {
            signal: ctrl.signal,
            onProgress: (f) => this.items.has(id) && this.patch(id, { progress: f }),
          }),
          100_000,
          "upload-timeout",
        );
        this.aborts.delete(id);
        if (!this.items.has(id)) return;
        this.patch(id, { status: "done", url: res.url, progress: 1, error: undefined });
        return;
      } catch (err) {
        ctrl.abort();
        this.aborts.delete(id);
        if (!this.items.has(id)) return;
        const { message, retryable } = friendlyError(err);
        if (!retryable || attempt === MAX_ATTEMPTS) {
          this.patch(id, { status: "error", error: message });
          return;
        }
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
}

/** One queue per onboarding screen, re-rendering whatever reads it. */
export function useOnboardingUploads(): OnboardingUploadQueue {
  const [queue] = useState(() => new OnboardingUploadQueue());
  useSyncExternalStore(queue.subscribe, queue.getVersion, queue.getVersion);
  useEffect(() => () => queue.dispose(), [queue]);
  return queue;
}
