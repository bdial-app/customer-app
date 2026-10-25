"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { flameOutline, chevronForwardOutline, peopleOutline, giftOutline, lockClosedOutline } from "ionicons/icons";
import { useAnalyticsSummary, useLeads } from "@/hooks/useProviderAnalytics";
import { useLeadUnlockInfo, useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { leadRecency, leadSignals, leadWhyLine, tierInfo } from "./lead-insights";

/**
 * The business home's pitch for leads: how many people are interested right
 * now, a peek at the most promising one (what they did, never who they are),
 * and one tap to the list. With nothing yet, it explains what will appear.
 */
export function LeadsSpotlightCard({ onOpen, className = "" }: { onOpen: () => void; className?: string }) {
  const { data: summary, isError } = useAnalyticsSummary("30d");
  const { data: top } = useLeads({ page: 1, limit: 5, status: "locked", sortBy: "score", sortOrder: "DESC" });
  const { data: unlockInfo } = useLeadUnlockInfo();
  const { data: config } = useMonetizationConfig();

  if (isError || !summary) return null;

  const { hot, warm, soft, cold } = summary.leads;
  const total = hot + warm + soft + cold;
  // Show someone whose contact can actually be bought, if there is one.
  const lead = top?.data.find((l) => !l.isAnonymous) ?? top?.data[0];

  const freeLabel = !config?.flags.leadsMonetizationEnabled
    ? "Contacts are free during launch"
    : unlockInfo?.isProSubscriber
      ? "Unlimited contacts on your plan"
      : unlockInfo && unlockInfo.freeRemaining + unlockInfo.subscriptionCreditsRemaining > 0
        ? `${unlockInfo.freeRemaining + unlockInfo.subscriptionCreditsRemaining} free contacts left this month`
        : null;

  if (total === 0) {
    return (
      <div className={className}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onOpen}
          className="w-full text-left bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-4 text-white"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <IonIcon icon={peopleOutline} className="text-amber-400 text-base" />
            </div>
            <span className="text-sm font-bold">See who wants to buy from you</span>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            When people search for, view or save your business, we show you who they are, what they looked at and how
            interested they are, so you can call them first. Products with photos and prices get more people looking.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
            How it works <IonIcon icon={chevronForwardOutline} className="text-[10px]" />
          </span>
        </motion.button>
      </div>
    );
  }

  const tier = lead ? tierInfo(lead.tier) : null;
  const recency = lead ? leadRecency(lead.lastSeenAt) : null;

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-4 text-white relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-orange-500/15 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <IonIcon icon={flameOutline} className="text-orange-400 text-base" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">
                  {total} customer{total === 1 ? "" : "s"} interested in you
                </p>
                <p className="text-[10px] text-white/50">Last 30 days</p>
              </div>
            </div>
            {freeLabel && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold max-w-[130px] text-right leading-tight">
                <IonIcon icon={giftOutline} className="text-[10px] shrink-0" />
                {freeLabel}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { n: hot, label: "Ready to buy", tone: "text-orange-300" },
              { n: warm, label: "High interest", tone: "text-amber-300" },
              { n: soft + cold, label: "Exploring", tone: "text-sky-300" },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.06] rounded-xl px-2.5 py-2">
                <p className={`text-base font-black leading-none ${s.tone}`}>{s.n}</p>
                <p className="text-[9px] text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* A peek at the most promising one — what they did, not who they are */}
          {lead && tier && recency && (
            <button onClick={onOpen} className="w-full text-left mt-3 bg-white/[0.07] rounded-xl p-3 active:bg-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <IonIcon icon={lockClosedOutline} className="text-[11px] text-amber-400 shrink-0" />
                  {lead.isAnonymous ? "Guest visitor" : lead.visitor.name}
                </span>
                <span className="flex items-center gap-1 text-[9px] font-semibold text-white/60 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${recency.dot}`} />
                  {recency.label}
                </span>
              </div>
              <p className="text-[10px] font-bold text-orange-300 mt-1">
                {tier.emoji} {tier.badge} · Buying intent {lead.score}%
              </p>
              <p className="text-[11px] text-white/80 mt-1 leading-snug line-clamp-2">{leadWhyLine(leadSignals(lead))}</p>
            </button>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onOpen}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-xs font-bold shadow-lg"
          >
            {hot > 0 ? `See who's ready to buy` : "See who's interested"}
            <IonIcon icon={chevronForwardOutline} className="text-[11px]" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
