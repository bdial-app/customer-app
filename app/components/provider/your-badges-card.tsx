"use client";

import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IonIcon } from "@ionic/react";
import { ribbonOutline } from "ionicons/icons";
import { getMyBadges } from "@/services/badge.service";
import { BADGES } from "@/utils/badges";

/**
 * "Your badges" on the owner's dashboard: the badges the business holds,
 * and for the rest, where it stands — so owners know what earns them.
 * Badges show on the shop page and on cards in search and on home.
 */
const YourBadgesCard = memo(({ enabled = true }: { enabled?: boolean }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["my-badges"],
    queryFn: getMyBadges,
    enabled,
    staleTime: 10 * 60 * 1000,
  });

  if (!enabled) return null;
  const list = data?.badges ?? [];
  const styleOf = (key: string) => BADGES.find((b) => b.key === key);
  const held = list.filter((b) => b.held);
  // Tijarah Pick isn't something to work towards, so it's only shown when held.
  const next = list.filter((b) => !b.held && b.kind === "automatic" && b.possible !== false);

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Your badges</h3>
        <span className="text-[10px] text-slate-400 font-medium">Checked every night</span>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            {held.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {held.map((b) => {
                  const s = styleOf(b.key);
                  return (
                    <span key={b.key} className={`inline-flex items-center gap-1 rounded-full ring-1 ring-inset px-2 py-0.5 text-[11px] font-semibold ${s?.chip ?? ""}`}>
                      {s && <IonIcon icon={s.icon} className="w-3 h-3" />}
                      {b.label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-start gap-2 mb-3">
                <IonIcon icon={ribbonOutline} className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">
                  No badges yet. Badges show on your shop and in search, and help customers choose you. Here’s how to earn them:
                </p>
              </div>
            )}
            {next.length > 0 && (
              <ul className="space-y-2.5">
                {next.map((b) => {
                  const s = styleOf(b.key);
                  return (
                    <li key={b.key} className="flex items-start gap-2.5">
                      <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-white ${s?.disc ?? "bg-slate-400"} opacity-60`}>
                        {s && <IonIcon icon={s.icon} className="w-3.5 h-3.5" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{b.label}</p>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug">{b.progress}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
});
YourBadgesCard.displayName = "YourBadgesCard";

export default YourBadgesCard;
