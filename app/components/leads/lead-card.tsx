"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  personOutline,
  lockClosedOutline,
  lockOpenOutline,
  callOutline,
  mailOutline,
  locationOutline,
  checkmarkCircle,
  eyeOffOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import type { LeadItem } from "@/services/analytics.service";
import { leadRecency, leadSignals, leadWhyLine, tierInfo } from "./lead-insights";

interface LeadCardProps {
  lead: LeadItem;
  /** "Get contact · ₹99", "Get contact free" — worked out by the screen. */
  unlockLabel: string;
  unlockDisabled?: boolean;
  onOpen: () => void;
  onUnlock: () => void;
}

/**
 * One interested customer. Locked or not, it says why they're worth a call —
 * the signals carry no personal details, so the owner sees the value before
 * paying for the contact.
 */
export function LeadCard({ lead, unlockLabel, unlockDisabled, onOpen, onUnlock }: LeadCardProps) {
  const tier = tierInfo(lead.tier);
  const signals = leadSignals(lead);
  const why = leadWhyLine(signals);
  const recency = leadRecency(lead.lastSeenAt);
  const chips = signals.slice(0, 3);
  const more = signals.length - chips.length;
  const intent = Math.max(0, Math.min(100, lead.score));
  // A guest never signed in: there is no contact to sell, only their activity.
  const guest = lead.isAnonymous;
  const name = lead.isUnlocked ? lead.visitor.name : guest ? "Guest visitor" : lead.visitor.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700"
    >
      <button onClick={onOpen} className="w-full text-left active:opacity-80">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 relative">
            {lead.isUnlocked && lead.visitor.avatar ? (
              <img src={lead.visitor.avatar} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <IonIcon icon={personOutline} className="text-xl text-slate-400" />
            )}
            {!lead.isUnlocked && !guest && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-800 flex items-center justify-center">
                <IonIcon icon={lockClosedOutline} className="text-[9px] text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{name}</span>
              <span className={`flex items-center gap-1 text-[10px] font-semibold shrink-0 ${recency.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${recency.dot} ${recency.tone === "today" ? "animate-pulse" : ""}`} />
                {recency.label}
              </span>
            </div>
            <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tier.badgeClass}`}>
              {tier.emoji} {tier.badge}
            </span>
          </div>
        </div>

        {/* Why they're worth it */}
        <p className="text-xs text-slate-700 dark:text-slate-200 mt-3 leading-relaxed">{why}</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/60 text-[10px] font-medium text-slate-600 dark:text-slate-300 max-w-full">
                <IonIcon icon={s.icon} className="text-[11px] shrink-0" />
                <span className="truncate">{s.label}</span>
              </span>
            ))}
            {more > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/60 text-[10px] font-semibold text-slate-400">+{more} more</span>
            )}
          </div>
        )}

        {/* Buying intent */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Buying intent</span>
            <span className="text-[11px] font-bold text-slate-800 dark:text-white">{intent}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${tier.gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(intent, 3)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </button>

      {/* Who they are, as far as the owner may see */}
      {lead.isUnlocked ? (
        (lead.visitor.phone || lead.visitor.email || lead.visitor.city) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
            {lead.visitor.phone && (
              <a href={`tel:${lead.visitor.phone}`} className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <IonIcon icon={callOutline} className="text-[11px]" />
                {lead.visitor.phone}
              </a>
            )}
            {lead.visitor.email && (
              <a href={`mailto:${lead.visitor.email}`} className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                <IonIcon icon={mailOutline} className="text-[11px]" />
                {lead.visitor.email}
              </a>
            )}
            {lead.visitor.city && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <IonIcon icon={locationOutline} className="text-[11px]" />
                {lead.visitor.city}
              </span>
            )}
          </div>
        )
      ) : guest ? (
        <p className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
          <IonIcon icon={eyeOffOutline} className="text-[11px]" />
          Didn&apos;t sign in — no contact details to share, but you can see what they looked at
        </p>
      ) : (
        <p className="flex items-center gap-1.5 mt-3 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <IonIcon icon={checkmarkCircle} className="text-[12px]" />
          Signed-in customer — contact details available
        </p>
      )}

      <div className="flex gap-2 mt-3">
        {lead.isUnlocked || guest ? (
          <>
            <button
              onClick={onOpen}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform"
            >
              {guest && !lead.isUnlocked ? "See their activity" : "View details"}
              <IonIcon icon={chevronForwardOutline} className="text-[11px]" />
            </button>
            {lead.isUnlocked && lead.visitor.phone && (
              <a
                href={`tel:${lead.visitor.phone}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform"
              >
                <IonIcon icon={callOutline} className="text-sm" />
                Call now
              </a>
            )}
          </>
        ) : (
          <>
            <button
              onClick={onOpen}
              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform"
            >
              See why
            </button>
            <button
              onClick={onUnlock}
              disabled={unlockDisabled}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${tier.gradient} text-white rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50`}
            >
              <IonIcon icon={lockOpenOutline} className="text-sm" />
              {unlockLabel}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
