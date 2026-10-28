"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IonIcon } from "@ionic/react";
import { closeCircle, addOutline, flashOutline, pricetagOutline, bagHandleOutline, createOutline, checkmark } from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import { getQuickReplies, saveQuickReplies } from "@/services/chat.service";
import { useMyProducts } from "@/hooks/useProduct";
import { useMyOffers } from "@/hooks/useMyProvider";
import { isOfferActive } from "@/app/components/provider/manage/offers-ticket";
import { sizedImageUrl, fallbackToOriginal } from "@/utils/image-optimization";

const QR_KEY = ["chat-quick-replies"];
const useQuickReplies = (enabled = true) =>
  useQuery({ queryKey: QR_KEY, queryFn: getQuickReplies, enabled, staleTime: 5 * 60_000 });

/** One-tap saved replies above the keyboard (business side). */
export function QuickReplyChips({ onPick }: { onPick: (text: string) => void }) {
  const { data } = useQuickReplies();
  const replies = data?.replies ?? [];
  if (replies.length === 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-3 pb-2">
      {replies.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onPick(r)}
          className="shrink-0 max-w-[220px] truncate text-[12px] font-semibold px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200 ring-1 ring-violet-100 dark:ring-violet-800/50 active:scale-95 transition-transform"
        >
          {r}
        </button>
      ))}
    </div>
  );
}

type Tab = "replies" | "products" | "deals";

/** Send from your business: a saved reply, a product card or a live deal. */
export function OwnerToolsSheet({
  open,
  onClose,
  onInsert,
  onSendProduct,
  onSendDeal,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
  onSendProduct: (productId: string) => void;
  onSendDeal: (offerId: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("replies");
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "replies", label: "Replies", icon: flashOutline },
    { id: "products", label: "Products", icon: bagHandleOutline },
    { id: "deals", label: "Deals", icon: pricetagOutline },
  ];
  return (
    <Sheet open={open} onClose={onClose} label="Send from your business" zIndex={9999} maxHeight="80dvh" className="bg-white dark:bg-slate-800">
      <div className="px-4 pb-5 pt-1 sm:pt-5">
        <div className="flex bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1 mb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 h-9 rounded-lg text-[12.5px] font-bold flex items-center justify-center gap-1 transition-colors ${
                tab === t.id ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <IonIcon icon={t.icon} className="text-[14px]" />
              {t.label}
            </button>
          ))}
        </div>
        {tab === "replies" && <RepliesTab onPick={(t) => { onInsert(t); onClose(); }} />}
        {tab === "products" && open && <ProductsTab onPick={(id) => { onSendProduct(id); onClose(); }} />}
        {tab === "deals" && open && <DealsTab onPick={(id) => { onSendDeal(id); onClose(); }} />}
      </div>
    </Sheet>
  );
}

function RepliesTab({ onPick }: { onPick: (text: string) => void }) {
  const qc = useQueryClient();
  const { data } = useQuickReplies();
  const [editing, setEditing] = useState<string[] | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const replies = data?.replies ?? [];

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {editing.map((r, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
            <p className="flex-1 min-w-0 text-[13px] text-slate-700 dark:text-slate-200">{r}</p>
            <button type="button" aria-label="Remove reply" onClick={() => setEditing(editing.filter((_, j) => j !== i))}>
              <IonIcon icon={closeCircle} className="text-[20px] text-slate-400" />
            </button>
          </div>
        ))}
        {editing.length < 12 && (
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={300}
              placeholder="Add a reply, e.g. “Delivery in 2 days”"
              className="flex-1 min-w-0 h-11 rounded-xl px-3 text-[13px] bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 outline-none focus:ring-violet-400 text-slate-800 dark:text-white"
            />
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={() => {
                setEditing([...editing, draft.trim()]);
                setDraft("");
              }}
              className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center disabled:opacity-40"
              aria-label="Add reply"
            >
              <IonIcon icon={addOutline} className="text-[20px]" />
            </button>
          </div>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const res = await saveQuickReplies(editing);
              qc.setQueryData(QR_KEY, res);
              setEditing(null);
            } catch (err) {
              alert(err instanceof Error ? err.message : "Couldn't save your replies");
            } finally {
              setSaving(false);
            }
          }}
          className="mt-1 h-11 rounded-xl bg-violet-600 text-white text-[13.5px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <IonIcon icon={checkmark} className="text-[16px]" />
          {saving ? "Saving…" : "Save replies"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {replies.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onPick(r)}
          className="text-left rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3.5 py-3 text-[13px] text-slate-800 dark:text-slate-100 active:bg-violet-50 dark:active:bg-violet-900/30"
        >
          {r}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setEditing(replies)}
        className="h-10 rounded-xl text-[12.5px] font-bold text-violet-600 dark:text-violet-300 flex items-center justify-center gap-1"
      >
        <IonIcon icon={createOutline} className="text-[15px]" />
        Edit replies
      </button>
    </div>
  );
}

function ProductsTab({ onPick }: { onPick: (productId: string) => void }) {
  const { data: products = [], isLoading } = useMyProducts(true);
  const live = products.filter((p) => p.isActive);
  if (isLoading) return <p className="text-center text-[12.5px] text-slate-400 py-6">Loading your catalogue…</p>;
  if (live.length === 0) return <p className="text-center text-[12.5px] text-slate-500 py-6">Add products or services to your catalogue to share them here.</p>;
  return (
    <div className="flex flex-col gap-2">
      {live.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPick(p.id)}
          className="flex items-center gap-3 text-left rounded-xl bg-slate-50 dark:bg-slate-700/50 p-2 active:bg-violet-50 dark:active:bg-violet-900/30"
        >
          {p.photoUrl ? (
            <img src={sizedImageUrl(p.photoUrl, 160)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" onError={fallbackToOriginal(p.photoUrl)} />
          ) : (
            <span className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xl shrink-0">
              {p.productType === "service" ? "🛠️" : "📦"}
            </span>
          )}
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold text-slate-800 dark:text-white truncate">{p.name}</span>
            <span className="block text-[11.5px] text-slate-500 dark:text-slate-400">
              {p.price != null ? `₹${Number(p.price).toLocaleString("en-IN")}` : p.productType === "service" ? "Quote on request" : "Price on request"}
            </span>
          </span>
          <span className="text-[11.5px] font-bold text-violet-600 dark:text-violet-300 shrink-0 pr-1">Send</span>
        </button>
      ))}
    </div>
  );
}

function DealsTab({ onPick }: { onPick: (offerId: string) => void }) {
  const { data: offers = [], isLoading } = useMyOffers();
  const live = offers.filter(isOfferActive);
  if (isLoading) return <p className="text-center text-[12.5px] text-slate-400 py-6">Loading your deals…</p>;
  if (live.length === 0)
    return <p className="text-center text-[12.5px] text-slate-500 py-6">No live deal right now. Create one in Offers and send it to customers here.</p>;
  return (
    <div className="flex flex-col gap-2">
      {live.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          className="flex items-stretch text-left rounded-xl overflow-hidden ring-1 ring-rose-100 dark:ring-rose-900/40 active:scale-[0.99] transition-transform"
        >
          <span className="w-16 shrink-0 bg-gradient-to-br from-rose-500 to-orange-500 text-white flex flex-col items-center justify-center">
            <span className="text-[15px] font-extrabold leading-none">
              {o.discountType === "percentage" ? `${Number(o.discountValue)}%` : `₹${Number(o.discountValue)}`}
            </span>
            <span className="text-[8.5px] font-bold tracking-[0.16em] mt-0.5">OFF</span>
          </span>
          <span className="flex-1 min-w-0 px-3 py-2.5">
            <span className="block text-[13px] font-bold text-slate-900 dark:text-white truncate">{o.title}</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {`Ends ${new Date(o.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
            </span>
          </span>
          <span className="self-center text-[11.5px] font-bold text-violet-600 dark:text-violet-300 shrink-0 pr-3">Send</span>
        </button>
      ))}
    </div>
  );
}
