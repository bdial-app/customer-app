"use client";
import { IonIcon } from "@ionic/react";
import { alertCircle, checkmarkCircle, refreshOutline } from "ionicons/icons";
import type { UploadItem } from "@/hooks/useOnboardingUploads";

/** A small progress ring (0–1), or a spinner when progress isn't known. */
function Ring({ value, size = 34 }: { value: number | null; size?: number }) {
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  if (value == null || value <= 0) {
    return <span className="block rounded-full border-[3px] border-white/40 border-t-white animate-spin" style={{ width: size, height: size }} />;
  }
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth={3} fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - value)} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Laid over a photo while it uploads: preparing → uploading (with a ring) →
 * a tick when it's safe, or a clear "tap to retry" with the reason.
 */
export function UploadOverlay({
  item,
  onRetry,
  compact = false,
}: {
  item: UploadItem | undefined;
  onRetry: () => void;
  compact?: boolean;
}) {
  if (!item) return null;
  if (item.status === "done") {
    return compact ? (
      <span className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-white">
        <IonIcon icon={checkmarkCircle} className="text-white text-[11px]" />
      </span>
    ) : (
      <span className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
        <IonIcon icon={checkmarkCircle} className="text-xs" /> Uploaded
      </span>
    );
  }
  if (item.status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="absolute inset-0 bg-rose-600/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white px-2 text-center"
        aria-label="Retry upload"
      >
        <IonIcon icon={compact ? refreshOutline : alertCircle} className={compact ? "text-lg" : "text-2xl"} />
        {!compact && <span className="text-[11px] font-semibold leading-tight">{item.error ?? "Couldn't upload — tap to try again"}</span>}
      </button>
    );
  }
  const label = item.status === "uploading" ? `Uploading${item.progress > 0 ? ` ${Math.round(item.progress * 100)}%` : "…"}` : "Preparing…";
  return (
    <div className="absolute inset-0 bg-slate-900/45 flex flex-col items-center justify-center gap-1.5">
      <Ring value={item.status === "uploading" ? item.progress : null} size={compact ? 22 : 34} />
      {!compact && <span className="text-[11px] font-semibold text-white">{label}</span>}
    </div>
  );
}

/** A one-line summary for a step: "2 photos uploading · 1 needs a retry". */
export function UploadSummary({ busy, failed, onRetryAll }: { busy: number; failed: number; onRetryAll: () => void }) {
  if (!busy && !failed) return null;
  return (
    <div className={`mx-4 mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2 text-[12px] font-medium ${failed ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900" : "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900"}`}>
      {failed ? <IonIcon icon={alertCircle} className="text-base shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin shrink-0" />}
      <span className="flex-1">
        {busy > 0 && `${busy} ${busy === 1 ? "photo is" : "photos are"} uploading — you can keep going`}
        {busy > 0 && failed > 0 && " · "}
        {failed > 0 && `${failed} couldn't upload`}
      </span>
      {failed > 0 && (
        <button type="button" onClick={onRetryAll} className="font-bold underline underline-offset-2 shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}
