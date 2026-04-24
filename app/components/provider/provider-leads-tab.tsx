"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  flameOutline,
  personOutline,
  lockClosedOutline,
  lockOpenOutline,
  chatbubbleOutline,
  timeOutline,
  searchOutline,
  cubeOutline,
  chevronForward,
  arrowBack,
} from "ionicons/icons";
import { useLeads, useLeadDetail, useUnlockLead } from "@/hooks/useProviderAnalytics";
import type { LeadItem } from "@/services/analytics.service";

const TIERS = [
  { key: undefined as string | undefined, label: "All" },
  { key: "hot", label: "Hot" },
  { key: "warm", label: "Warm" },
  { key: "soft", label: "Soft" },
  { key: "cold", label: "Cold" },
];

const TIER_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  hot: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  warm: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400" },
  soft: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  cold: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Lead Card ──────────────────────────────────────────────────────

function LeadCard({
  lead,
  onSelect,
  onUnlock,
  isUnlocking,
}: {
  lead: LeadItem;
  onSelect: () => void;
  onUnlock: () => void;
  isUnlocking: boolean;
}) {
  const badge = TIER_BADGE[lead.tier] || TIER_BADGE.cold;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/60"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0 relative">
          {lead.isUnlocked && lead.visitor.avatar ? (
            <img src={lead.visitor.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <IonIcon icon={personOutline} className="text-xl text-gray-400" />
          )}
          {!lead.isUnlocked && (
            <div className="absolute inset-0 rounded-full bg-gray-200/60 backdrop-blur-[2px] flex items-center justify-center">
              <IonIcon icon={lockClosedOutline} className="text-sm text-gray-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-bold ${lead.isUnlocked ? "text-gray-900" : "text-gray-500"}`}>
              {lead.visitor.name}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {lead.tier}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
            {lead.searchQuery && (
              <span className="flex items-center gap-1">
                <IonIcon icon={searchOutline} className="text-[10px]" />
                &ldquo;{lead.searchQuery}&rdquo;
              </span>
            )}
            <span className="flex items-center gap-1">
              <IonIcon icon={cubeOutline} className="text-[10px]" />
              {lead.productsViewed.length} products
            </span>
            <span className="flex items-center gap-1">
              <IonIcon icon={timeOutline} className="text-[10px]" />
              {Math.round(lead.totalDuration / 60)}m spent
            </span>
          </div>

          <p className="text-[10px] text-gray-300 mt-1">Last seen {timeAgo(lead.lastSeenAt)}</p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-gray-800">{lead.score}</span>
          <p className="text-[9px] text-gray-400 uppercase">Score</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {lead.isUnlocked ? (
          <>
            <button onClick={onSelect} className="flex-1 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform">
              View Details
            </button>
            {lead.visitor.userId && (
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform">
                <IonIcon icon={chatbubbleOutline} className="text-sm" />
                Message
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onUnlock}
            disabled={isUnlocking}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <IonIcon icon={lockOpenOutline} className="text-sm" />
            {isUnlocking ? "Unlocking..." : "Unlock Lead"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Lead Detail ────────────────────────────────────────────────────

function LeadDetailView({ leadId, onBack }: { leadId: string; onBack: () => void }) {
  const { data: detail, isLoading } = useLeadDetail(leadId);

  if (isLoading || !detail) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const badge = TIER_BADGE[detail.tier] || TIER_BADGE.cold;

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <IonIcon icon={arrowBack} className="text-lg text-gray-600" />
        </button>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900">{detail.visitor.name}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {detail.tier} · Score {detail.score}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{detail.productsViewed.length}</p>
          <p className="text-[10px] text-gray-400">Products</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{Math.round(detail.totalDuration / 60)}</p>
          <p className="text-[10px] text-gray-400">Minutes</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{detail.actionsPerformed.length}</p>
          <p className="text-[10px] text-gray-400">Actions</p>
        </div>
      </div>

      {/* Products Viewed */}
      {detail.products.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/60">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Products Viewed</h4>
          <div className="space-y-2">
            {detail.products.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <IonIcon icon={cubeOutline} className="text-gray-400" />
                <span className="text-sm text-gray-700">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/60">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Activity Timeline</h4>
        <div className="space-y-3">
          {detail.timeline.slice(0, 20).map((ev, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-teal-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">{ev.eventType.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-gray-400">
                  {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {ev.duration ? ` · ${ev.duration}s` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ProviderLeadsTab() {
  const [tier, setTier] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { data, isLoading } = useLeads(tier, page);
  const unlockMutation = useUnlockLead();

  if (selectedLeadId) {
    return <LeadDetailView leadId={selectedLeadId} onBack={() => setSelectedLeadId(null)} />;
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Tier Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TIERS.map((t) => (
          <button
            key={t.label}
            onClick={() => { setTier(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tier === t.key
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 active:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hot Leads CTA */}
      {data && data.data.filter((l) => l.tier === "hot").length > 0 && !tier && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <IonIcon icon={flameOutline} className="text-lg" />
            <span className="text-sm font-bold">Hot Leads Available!</span>
          </div>
          <p className="text-[11px] opacity-90">
            You have {data.data.filter((l) => l.tier === "hot").length} highly interested visitors. Unlock to connect!
          </p>
          <button
            onClick={() => setTier("hot")}
            className="mt-3 px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-xs font-bold active:scale-[0.97]"
          >
            View Hot Leads
          </button>
        </div>
      )}

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-12">
          <IonIcon icon={personOutline} className="text-4xl text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-400">No leads yet</p>
          <p className="text-xs text-gray-300 mt-1">Leads appear when customers interact with your profile</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onSelect={() => setSelectedLeadId(lead.id)}
              onUnlock={() => unlockMutation.mutate(lead.id)}
              isUnlocking={unlockMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            {page} / {data.meta.totalPages}
          </span>
          <button
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
