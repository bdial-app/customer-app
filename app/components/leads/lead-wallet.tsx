"use client";
import { useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  walletOutline,
  addOutline,
  timeOutline,
  giftOutline,
  checkmarkCircle,
  callOutline,
  logoWhatsapp,
  downloadOutline,
  flame,
  closeOutline,
} from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import type { LeadItem } from "@/services/analytics.service";
import type { LeadWallet, LeadPack } from "@/services/lead-wallet.service";
import { useBuyLeadPack, useLeadQuote } from "@/hooks/useLeadWallet";
import { getNativePlatform } from "@/utils/platform";

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

/* ── Wallet card at the top of Leads ── */
export function LeadWalletCard({
  wallet,
  onTopUp,
  onHistory,
}: {
  wallet: LeadWallet;
  onTopUp: () => void;
  onHistory: () => void;
}) {
  const best = Math.max(0, ...wallet.packs.map((p) => p.bonusPct));
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
      <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-amber-400/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/60">
            <IonIcon icon={walletOutline} className="text-[13px]" />
            Lead Wallet
          </p>
          <p className="mt-1 text-[28px] font-extrabold leading-none tracking-tight">{inr(wallet.balance)}</p>
          <p className="mt-1.5 text-[12px] text-white/70">
            {wallet.balance > 0
              ? `≈ ${wallet.hotLeadsCovered} hot contact${wallet.hotLeadsCovered === 1 ? "" : "s"} · never expires`
              : `Top up and get up to ${best}% extra credit`}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onTopUp}
            className="h-9 px-3.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[12.5px] font-bold text-slate-900 flex items-center gap-1 active:scale-95 transition-transform"
          >
            <IonIcon icon={addOutline} className="text-[15px]" />
            Top up
          </button>
          {wallet.transactions.length > 0 && (
            <button type="button" onClick={onHistory} className="h-8 px-3 rounded-full bg-white/10 text-[11.5px] font-semibold flex items-center justify-center gap-1">
              <IonIcon icon={timeOutline} className="text-[13px]" />
              History
            </button>
          )}
        </div>
      </div>
      {wallet.firstTopup && (
        <p className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-full">
          <IonIcon icon={giftOutline} className="text-[12px]" />
          {`First top-up gift: +${inr(wallet.packs[0]?.firstBonus ?? 100)} extra`}
        </p>
      )}
    </div>
  );
}

/* ── Top-up packs ── */
export function LeadPackSheet({
  open,
  onClose,
  wallet,
  suggested,
  need,
  onBought,
}: {
  open: boolean;
  onClose: () => void;
  wallet: LeadWallet;
  /** Pack that covers what the owner is trying to buy. */
  suggested?: string | null;
  need?: number;
  onBought?: () => void;
}) {
  const ios = getNativePlatform() === "ios";
  const initial = suggested ?? wallet.packs.find((p) => p.popular)?.id ?? wallet.packs[0]?.id;
  const [pick, setPick] = useState<string | undefined>(initial);
  const [shownFor, setShownFor] = useState(initial);
  if (initial !== shownFor) {
    setShownFor(initial);
    setPick(initial);
  }
  const buy = useBuyLeadPack();
  const pack = wallet.packs.find((p) => p.id === pick);
  const blocked = ios && pack && !pack.onApple;

  return (
    <Sheet open={open} onClose={onClose} label="Top up Lead Wallet" zIndex={9999} maxHeight="88dvh" className="bg-white dark:bg-slate-800">
      <div className="px-5 pb-6 pt-1 sm:pt-6">
        <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Top up your Lead Wallet</h3>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-0.5">
          {need && need > 0
            ? `You need ${inr(need)} more for the contacts you picked.`
            : "Pay once, get bonus credit, and get contacts in one tap."}
        </p>

        <div className="mt-4 flex flex-col gap-2.5" role="radiogroup">
          {wallet.packs.map((p) => (
            <PackOption key={p.id} p={p} selected={p.id === pick} onPick={() => setPick(p.id)} covers={need ? p.credit >= need : undefined} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1.5 text-[12px] text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-[14px]" />
            Balance never expires
          </span>
          <span className="flex items-center gap-1.5">
            <IonIcon icon={checkmarkCircle} className="text-emerald-500 text-[14px]" />
            Free monthly unlocks are always used first
          </span>
        </div>

        {buy.isError && (
          <p className="mt-3 text-center text-[12px] text-rose-500">{(buy.error as Error)?.message || "Payment didn't go through. No charge was made."}</p>
        )}
        <button
          type="button"
          disabled={!pack || buy.isPending || !!blocked}
          onClick={() =>
            pack &&
            buy.mutate(pack.id, {
              onSuccess: () => {
                onClose();
                onBought?.();
              },
            })
          }
          className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[14.5px] font-bold shadow-md shadow-orange-500/25 disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {blocked
            ? "Coming soon on iPhone"
            : buy.isPending
              ? "Opening payment…"
              : pack
                ? `Pay ${inr(pack.price)} · get ${inr(pack.credit)}`
                : "Pick a pack"}
        </button>
      </div>
    </Sheet>
  );
}

function PackOption({ p, selected, onPick, covers }: { p: LeadPack; selected: boolean; onPick: () => void; covers?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className={`relative w-full text-left rounded-2xl p-3.5 ring-1 transition-colors ${
        selected ? "ring-2 ring-amber-400 bg-amber-50/70 dark:bg-amber-900/20" : "ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-900"
      }`}
    >
      {p.popular && (
        <span className="absolute -top-2 right-3 text-[9.5px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 rounded">
          Most popular
        </span>
      )}
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-slate-500 dark:text-slate-400">
          Pay <b className="text-slate-900 dark:text-white text-[15px]">{inr(p.price)}</b>
        </span>
        <span className="text-[13px] text-slate-500 dark:text-slate-400">
          Get <b className="text-emerald-600 dark:text-emerald-400 text-[18px] font-extrabold">{inr(p.credit)}</b>
        </span>
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {`+${p.bonusPct}% bonus`}
        </span>
        {p.firstBonus > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {`+${inr(p.firstBonus)} first top-up`}
          </span>
        )}
        <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-0.5">
          <IonIcon icon={flame} className="text-[11px] text-red-500" />
          {`≈ ${p.hotLeads} hot contacts`}
        </span>
        {covers && <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">· covers your pick</span>}
      </span>
    </button>
  );
}

/* ── Wallet history ── */
export function LeadWalletHistory({ open, onClose, wallet }: { open: boolean; onClose: () => void; wallet: LeadWallet }) {
  const label: Record<string, string> = { topup: "Top-up", bonus: "Bonus", unlock: "Contact" };
  return (
    <Sheet open={open} onClose={onClose} label="Wallet history" zIndex={9999} maxHeight="80dvh" className="bg-white dark:bg-slate-800">
      <div className="px-5 pb-6 pt-1 sm:pt-6">
        <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white mb-3">Wallet history</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {wallet.transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {t.kind === "unlock"
                    ? `${label[t.kind]} · ${t.customerName ?? "Customer"}${t.tier ? ` · ${t.tier}` : ""}`
                    : t.note || label[t.kind]}
                </p>
                <p className="text-[11px] text-slate-400">
                  {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-[13.5px] font-bold ${t.amount < 0 ? "text-slate-700 dark:text-slate-200" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {`${t.amount < 0 ? "−" : "+"}${inr(Math.abs(t.amount))}`}
                </p>
                <p className="text-[10.5px] text-slate-400">{`Bal ${inr(t.balanceAfter)}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ── Sticky bar while picking several leads ── */
export function BulkUnlockBar({
  ids,
  busy,
  onCancel,
  onUnlock,
  onTopUp,
}: {
  ids: string[];
  busy: boolean;
  onCancel: () => void;
  onUnlock: () => void;
  onTopUp: (suggested: string | null, need: number) => void;
}) {
  const { data: q, isFetching } = useLeadQuote(ids);
  const short = q && q.shortfall > 0;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pt-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700"
      style={{ paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 12px)" }}
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onCancel} aria-label="Stop selecting" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <IonIcon icon={closeOutline} className="text-[20px] text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-slate-900 dark:text-white">{`${ids.length} selected`}</p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
            {!q || isFetching
              ? "Working out the total…"
              : [q.freeCount > 0 ? `${q.freeCount} free` : null, q.paidCount > 0 ? `${q.paidCount} from wallet · ${inr(q.total)}` : null]
                  .filter(Boolean)
                  .join(" + ") || "All free"}
          </p>
        </div>
        <button
          type="button"
          disabled={!q || isFetching || busy}
          onClick={() => (short ? onTopUp(q!.suggestedPack, q!.shortfall) : onUnlock())}
          className="h-11 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[13px] font-bold shadow-md shadow-orange-500/25 disabled:opacity-60 shrink-0"
        >
          {busy ? "Getting contacts…" : short ? `Top up · need ${inr(q!.shortfall)}` : `Get ${ids.length} contact${ids.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
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
