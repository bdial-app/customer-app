"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { closeOutline, searchOutline, heartOutline, callOutline } from "ionicons/icons";
import { LEAD_TIERS, TIER_ORDER } from "./lead-insights";

const SEEN_KEY = "tijarah.leads.explainer.dismissed";

const STEPS = [
  { icon: searchOutline, title: "They find you", text: "Searched for what you do, or came across your page" },
  { icon: heartOutline, title: "They show interest", text: "Looked at products, saved you, tapped call" },
  { icon: callOutline, title: "You reach out first", text: "The business that replies first often wins the order" },
];

/**
 * What a lead is and why it's worth contacting, for an owner seeing the list
 * for the first time. Stays until they close it; "What do these mean?" brings it back.
 */
export function LeadsExplainer({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) {
  const [firstVisit, setFirstVisit] = useState(false);
  const open = firstVisit || !!forceOpen;

  // Read the "seen it" choice after mount (localStorage isn't there on the server).
  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      // storage blocked: treat as a first visit
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage once mounted
    setFirstVisit(!seen);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      // private mode: it simply shows again next time
    }
    setFirstVisit(false);
    onClose?.();
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white relative">
            <button onClick={dismiss} aria-label="Close" className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <IonIcon icon={closeOutline} className="text-sm" />
            </button>
            <h3 className="text-sm font-bold pr-8">These are customers interested in you</h3>
            <p className="text-[11px] text-white/60 mt-0.5">Every visit is scored so you know who to call first.</p>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="bg-white/[0.06] rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <IonIcon icon={s.icon} className="text-amber-400 text-xs" />
                  </div>
                  <p className="text-[11px] font-semibold leading-tight">{s.title}</p>
                  <p className="text-[9px] text-white/50 mt-0.5 leading-snug">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1.5">
              {TIER_ORDER.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <IonIcon icon={LEAD_TIERS[t].icon} className={`text-sm w-4 shrink-0 ${LEAD_TIERS[t].iconColor}`} />
                  <span className="text-[11px] font-semibold w-[120px] shrink-0">{LEAD_TIERS[t].name}</span>
                  <span className="text-[10px] text-white/50 leading-snug">{LEAD_TIERS[t].meaning}</span>
                </div>
              ))}
            </div>

            <button onClick={dismiss} className="mt-3 w-full py-2 bg-white text-slate-900 rounded-xl text-xs font-bold active:scale-[0.98]">
              Got it — show me my customers
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
