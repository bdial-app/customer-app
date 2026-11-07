"use client";
import { IonIcon } from "@ionic/react";
import { copyOutline, imageOutline, location as locationPin, mapOutline, navigateOutline } from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import type { ChatMessage, SharedLocation } from "@/services/chat.service";
import { mapsLinkFor, openDirections, openMapAt } from "@/utils/sharing";

/** The words a message can be copied as (nothing for a photo without a caption). */
export function copyableText(m: ChatMessage): string | null {
  const loc = m.metadata?.location;
  if (loc) return [loc.label, loc.address && loc.address !== loc.label ? loc.address : null, mapsLinkFor(loc.lat, loc.lng)].filter(Boolean).join("\n");
  if (m.messageType === "file") return (m.metadata?.caption as string | undefined) || m.metadata?.fileName || null;
  return m.content?.trim() || null;
}

function Action({ icon, label, onClick, tone = "default" }: { icon: string; label: string; onClick: () => void; tone?: "default" | "primary" }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-5 py-3.5 text-left active:bg-slate-50 dark:active:bg-slate-800">
      <IonIcon icon={icon} className={`text-[20px] ${tone === "primary" ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400"}`} />
      <span className="text-[15px] font-medium text-slate-800 dark:text-slate-100">{label}</span>
    </button>
  );
}

/** What you can do with one message, after pressing and holding it. */
export function MessageActionsSheet({ message, onClose, onCopy, onOpenLocation }: {
  message: ChatMessage | null;
  onClose: () => void;
  onCopy: (text: string) => void;
  onOpenLocation: (loc: SharedLocation) => void;
}) {
  const text = message ? copyableText(message) : null;
  const loc = message?.metadata?.location ?? null;
  const preview = loc ? `📍 ${loc.label || "Location"}` : message?.messageType === "image" && !text ? "📷 Photo" : text;
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <Sheet open={!!message} onClose={onClose} label="Message options" className="bg-white dark:bg-slate-900" zIndex={9999}>
      {message && (
        <div className="pb-2">
          {preview && (
            <p className="mx-5 mb-2 mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[13px] text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap">{preview}</p>
          )}
          {text && <Action icon={copyOutline} tone="primary" label={loc ? "Copy address and link" : "Copy text"} onClick={run(() => onCopy(text))} />}
          {loc && (
            <>
              <Action icon={mapOutline} label="View on map" onClick={run(() => onOpenLocation(loc))} />
              <Action icon={navigateOutline} label="Get directions" onClick={run(() => openDirections(loc.lat, loc.lng, loc.label ?? undefined))} />
              <Action icon={locationPin} label="Open in your maps app" onClick={run(() => openMapAt(loc.lat, loc.lng, loc.label))} />
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

function AttachItem({ icon, tint, title, subtitle, onClick }: { icon: string; tint: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-5 py-3 text-left active:bg-slate-50 dark:active:bg-slate-800">
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tint}`}>
        <IonIcon icon={icon} className="text-[21px] text-white" />
      </span>
      <span>
        <span className="block text-[15px] font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className="block text-[12.5px] text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
    </button>
  );
}

/** The paperclip: a photo or PDF, or a location. */
export function AttachSheet({ open, onClose, onPickFile, onPickLocation }: { open: boolean; onClose: () => void; onPickFile: () => void; onPickLocation: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="Send" className="bg-white dark:bg-slate-900" zIndex={9999}>
      <div className="pb-2 pt-1">
        <AttachItem icon={imageOutline} tint="bg-indigo-500" title="Photo or document" subtitle="A picture from your phone, or a PDF" onClick={() => { onClose(); onPickFile(); }} />
        <AttachItem icon={locationPin} tint="bg-rose-500" title="Location" subtitle="Where you are, your shop, or a place on the map" onClick={() => { onClose(); onPickLocation(); }} />
      </div>
    </Sheet>
  );
}

