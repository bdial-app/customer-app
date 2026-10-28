"use client";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { documentTextOutline, openOutline, closeOutline, timeOutline, chevronForward } from "ionicons/icons";
import type { ChatMessageMetadata } from "@/services/chat.service";
import { sizedImageUrl, fallbackToOriginal } from "@/utils/image-optimization";

const inr = (v: number | string) => `₹${Number(v).toLocaleString("en-IN")}`;
const sizeLabel = (bytes?: number) =>
  !bytes ? "" : bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** A PDF (or any non-photo file): name, size, open. */
export function FileCard({ m, sent }: { m: ChatMessageMetadata; sent: boolean }) {
  return (
    <a
      href={m.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 rounded-xl p-2.5 -mx-0.5 mb-1 min-w-[200px] ${sent ? "bg-white/10" : "bg-slate-50 dark:bg-slate-700/60"}`}
    >
      <span className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center shrink-0">
        <IonIcon icon={documentTextOutline} className="text-white text-[20px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-[13px] font-semibold truncate ${sent ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
          {m.fileName || "Document"}
        </span>
        <span className={`block text-[11px] ${sent ? "text-white/60" : "text-slate-500 dark:text-slate-400"}`}>
          {["PDF", sizeLabel(m.size)].filter(Boolean).join(" · ")}
        </span>
      </span>
      <IonIcon icon={openOutline} className={`text-[16px] shrink-0 ${sent ? "text-white/70" : "text-slate-400"}`} />
    </a>
  );
}

/** A product or service from the business's catalogue; tap opens it. */
export function ProductCard({ m, sent, onOpen }: { m: ChatMessageMetadata; sent: boolean; onOpen?: () => void }) {
  const service = m.productType === "service";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-[230px] max-w-full text-left rounded-xl overflow-hidden -mx-0.5 mb-1 block ${sent ? "bg-white/10" : "bg-slate-50 dark:bg-slate-700/60"}`}
    >
      {m.productImage ? (
        <img
          src={sizedImageUrl(m.productImage, 480)}
          alt={m.productName || ""}
          className="w-full h-32 object-cover"
          loading="lazy"
          onError={fallbackToOriginal(m.productImage)}
        />
      ) : (
        <div className="w-full h-20 flex items-center justify-center text-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-700 dark:to-slate-800">
          {service ? "🛠️" : "📦"}
        </div>
      )}
      <span className="block px-2.5 py-2">
        <span className={`block text-[9.5px] font-bold uppercase tracking-wider ${sent ? "text-white/60" : "text-amber-600 dark:text-amber-400"}`}>
          {service ? "Service" : "Product"}
        </span>
        <span className={`block text-[13.5px] font-bold leading-snug line-clamp-2 ${sent ? "text-white" : "text-slate-900 dark:text-white"}`}>
          {m.productName}
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className={`text-[14px] font-extrabold ${sent ? "text-white" : "text-slate-900 dark:text-white"}`}>
            {m.productPrice != null ? `${service ? "From " : ""}${inr(m.productPrice)}` : service ? "Get a quote" : "Ask for price"}
          </span>
          <span className={`inline-flex items-center text-[11.5px] font-bold ${sent ? "text-white/80" : "text-indigo-600 dark:text-indigo-300"}`}>
            View <IonIcon icon={chevronForward} className="text-[12px]" />
          </span>
        </span>
      </span>
    </button>
  );
}

/** A live deal as a coupon ticket. */
export function DealCard({ m, onOpen }: { m: ChatMessageMetadata; onOpen?: () => void }) {
  const ended = m.endsAt ? new Date(m.endsAt) < new Date() : false;
  const value = m.discountType === "percentage" ? `${Number(m.discountValue)}%` : inr(m.discountValue ?? 0);
  return (
    <button type="button" onClick={onOpen} className={`w-[240px] max-w-full flex items-stretch text-left rounded-xl overflow-hidden -mx-0.5 mb-1 bg-white dark:bg-slate-800 ring-1 ring-rose-100 dark:ring-rose-900/40 ${ended ? "opacity-60" : ""}`}>
      <span className="w-[72px] shrink-0 bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 text-white flex flex-col items-center justify-center py-3">
        <span className="text-[18px] font-extrabold leading-none">{value}</span>
        <span className="mt-1 text-[9px] font-bold tracking-[0.18em]">OFF</span>
      </span>
      <span className="flex-1 min-w-0 px-3 py-2.5 border-l-2 border-dashed border-rose-200 dark:border-rose-900/60">
        <span className="block text-[13px] font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{m.title}</span>
        {m.minOrderAmount != null && m.minOrderAmount > 0 && (
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{`On orders above ${inr(m.minOrderAmount)}`}</span>
        )}
        <span className={`mt-1 inline-flex items-center gap-1 text-[10.5px] font-bold ${ended ? "text-slate-400" : "text-rose-600 dark:text-rose-300"}`}>
          <IonIcon icon={timeOutline} className="text-[11px]" />
          {ended
            ? "Deal ended"
            : `Valid till ${new Date(m.endsAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
        </span>
      </span>
    </button>
  );
}

/** The product a customer asked about — photo, name, price; tap opens it. */
export function EnquiryCard({ m, sent, onOpen }: { m: ChatMessageMetadata; sent: boolean; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className={`w-full flex items-center gap-2.5 text-left rounded-xl p-2 mb-1.5 -mx-0.5 ${sent ? "bg-white/10" : "bg-amber-50 dark:bg-amber-900/30"}`}
    >
      {m.productImage ? (
        <img
          src={sizedImageUrl(m.productImage, 160)}
          alt=""
          className="w-12 h-12 rounded-lg object-cover shrink-0"
          loading="lazy"
          onError={fallbackToOriginal(m.productImage)}
        />
      ) : (
        <span className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xl shrink-0">📋</span>
      )}
      <span className="flex-1 min-w-0">
        <span className={`block text-[9px] font-bold uppercase tracking-wider ${sent ? "text-white/60" : "text-amber-600 dark:text-amber-400"}`}>
          Asking about
        </span>
        {m.productName && (
          <span className={`block text-[12.5px] font-semibold leading-snug line-clamp-2 ${sent ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
            {m.productName}
          </span>
        )}
        {m.productPrice != null && m.productPrice !== "" && (
          <span className={`block text-[11px] ${sent ? "text-white/60" : "text-slate-500 dark:text-slate-400"}`}>{inr(m.productPrice)}</span>
        )}
      </span>
      {onOpen && <IonIcon icon={chevronForward} className={`text-[14px] shrink-0 ${sent ? "text-white/60" : "text-slate-400"}`} />}
    </button>
  );
}

/** Full-screen photo; pinch to zoom is the browser's own. */
export function ImageViewer({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={onClose}
          style={{ touchAction: "pinch-zoom" }}
        >
          <img src={url} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            className="absolute right-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
            style={{ top: "calc(var(--sat, 0px) + 12px)" }}
          >
            <IonIcon icon={closeOutline} className="text-white text-[24px]" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
