"use client";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IonIcon } from "@ionic/react";
import { callOutline, logoWhatsapp, downloadOutline, closeOutline } from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import type { LeadItem } from "@/services/analytics.service";
import { checkoutBulkLeads, quoteBulkLeads } from "@/services/lead-bulk.service";
import { payWithRazorpay } from "@/services/razorpay.service";
import { ANALYTICS_LEADS_KEY } from "@/hooks/useProviderAnalytics";
import { getNativePlatform } from "@/utils/platform";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

/** Bulk buying is one Razorpay payment for any number of leads — not possible on iPhone. */
export const bulkLeadsSupported = () => getNativePlatform() !== "ios";

export const useBulkLeadQuote = (ids: string[]) =>
  useQuery({
    queryKey: ["lead-bulk-quote", [...ids].sort().join(",")],
    queryFn: () => quoteBulkLeads(ids),
    enabled: ids.length > 0,
    staleTime: 10_000,
  });

/** Free ones unlock at once; the rest are one payment. Resolves with every lead now unlocked. */
export const useBulkLeadCheckout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const c = await checkoutBulkLeads(ids);
      if (c.requiresPayment && c.orderId && c.keyId) {
        await payWithRazorpay({
          orderId: c.orderId,
          amount: c.amount!,
          currency: c.currency!,
          paymentId: c.paymentId!,
          keyId: c.keyId,
          description: c.description!,
          prefill: c.prefill || {},
        });
        return [...c.unlocked, ...(c.paidLeadIds ?? [])];
      }
      return c.unlocked;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ANALYTICS_LEADS_KEY });
      qc.invalidateQueries({ queryKey: ["lead-unlock-info"] });
      qc.invalidateQueries({ queryKey: ["analytics-lead-detail"] });
    },
  });
};

/**
 * Bottom bar while picking leads. Rendered on <body> so it pins to the
 * screen's bottom (inside the scrolling page it landed mid-screen), over the
 * tab bar while selecting.
 */
export function BulkLeadsBar({
  ids,
  busy,
  error,
  onCancel,
  onBuy,
}: {
  ids: string[];
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onBuy: () => void;
}) {
  const { data: q, isFetching } = useBulkLeadQuote(ids);
  if (typeof document === "undefined") return null;
  const summary = !q || isFetching
    ? "Working out the price…"
    : [
        q.freeCount > 0 ? `${q.freeCount} free` : null,
        q.paidCount > 0 ? (q.discountPct > 0 ? `${q.paidCount} for ${inr(q.total)} (${q.discountPct}% off)` : `${q.paidCount} for ${inr(q.total)}`) : null,
      ]
        .filter(Boolean)
        .join(" + ");
  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
      style={{ paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 12px)" }}
    >
      {q?.nextDiscount && q.paidCount > 0 && !isFetching && (
        <p className="mb-2 text-center text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg py-1">
          {`Add ${q.nextDiscount.more} more for ${q.nextDiscount.pct}% off`}
        </p>
      )}
      {error && <p className="mb-2 text-center text-[11.5px] text-rose-500">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Stop selecting"
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"
        >
          <IonIcon icon={closeOutline} className="text-[20px] text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-slate-900 dark:text-white">{`${ids.length} selected`}</p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{summary || "All free"}</p>
        </div>
        <button
          type="button"
          disabled={!q || isFetching || busy}
          onClick={onBuy}
          className="h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[13px] font-bold shadow-md shadow-orange-500/25 disabled:opacity-60 shrink-0"
        >
          {busy
            ? "Getting contacts…"
            : q && q.total > 0
              ? `Get ${ids.length} · ${inr(q.total)}`
              : `Get ${ids.length} contact${ids.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ── Contacts just bought: call, WhatsApp, export ── */
export function UnlockedContactsSheet({ open, onClose, leads }: { open: boolean; onClose: () => void; leads: LeadItem[] }) {
  const exportCsv = async () => {
    const rows = [["Name", "Phone", "Email", "City", "Interest"]].concat(
      leads.map((l) => [l.visitor.name, l.visitor.phone ?? "", l.visitor.email ?? "", l.visitor.city ?? "", l.tier]),
    );
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const file = new File([csv], `tijarah-leads-${new Date().toISOString().slice(0, 10)}.csv`, { type: "text/csv" });
    // Share sheet on phones (save to Files, email, WhatsApp); a download elsewhere.
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Tijarah leads" }).catch(() => {});
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const wa = (phone: string) => {
    const d = phone.replace(/\D/g, "");
    return `https://wa.me/${d.length === 10 ? `91${d}` : d}`;
  };
  return (
    <Sheet open={open} onClose={onClose} label="Your new contacts" zIndex={9999} maxHeight="88dvh" className="bg-white dark:bg-slate-800">
      <div className="px-5 pb-6 pt-1 sm:pt-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">{`${leads.length} new contact${leads.length === 1 ? "" : "s"}`}</h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">Reach out while they&apos;re still interested.</p>
          </div>
          {leads.length > 0 && (
            <button type="button" onClick={exportCsv} className="h-9 px-3 rounded-full bg-slate-100 dark:bg-slate-700 text-[12px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <IonIcon icon={downloadOutline} className="text-[14px]" />
              CSV
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {leads.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">{l.visitor.name}</p>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
                  {[l.visitor.phone, l.visitor.city].filter(Boolean).join(" · ") || "No phone shared"}
                </p>
              </div>
              {l.visitor.phone && (
                <>
                  <a href={`tel:${l.visitor.phone}`} aria-label={`Call ${l.visitor.name}`} className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                    <IonIcon icon={callOutline} className="text-white text-[17px]" />
                  </a>
                  <a href={wa(l.visitor.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${l.visitor.name}`} className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <IonIcon icon={logoWhatsapp} className="text-white text-[18px]" />
                  </a>
                </>
              )}
            </div>
          ))}
          {leads.length === 0 && <p className="text-center text-[12.5px] text-slate-400 py-6">Loading your contacts…</p>}
        </div>
      </div>
    </Sheet>
  );
}

/** The API's message from a failed request, if any. */
export function apiMessage(err: unknown): string | undefined {
  const e = err as { response?: { data?: { message?: string | { message?: string } } } } | null;
  const m = e?.response?.data?.message;
  return typeof m === "string" ? m : m?.message;
}
