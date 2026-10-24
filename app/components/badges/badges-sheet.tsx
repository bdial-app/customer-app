"use client";

import dynamic from "next/dynamic";
import { Sheet } from "@/app/components/ui/sheet";
import { BADGES, knownBadges, type BadgeRef } from "@/utils/badges";

const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });

/**
 * What a business's badges mean: each one it holds, how it's earned, and the
 * team's reason for a Tijarah Pick — then the other badges on Tijarah, so
 * customers know what to look for elsewhere.
 */
export function BadgesSheet({
  open,
  onClose,
  badges,
  businessName,
}: {
  open: boolean;
  onClose: () => void;
  badges: BadgeRef[] | null | undefined;
  businessName: string;
}) {
  const held = knownBadges(badges);
  const others = BADGES.filter((b) => !held.some((h) => h.key === b.key));

  return (
    <Sheet open={open} onClose={onClose} label={`${businessName} badges`}>
      <div className="px-5 pt-2 pb-[calc(var(--sab,0px)+20px)]">
        <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">
          {held.length ? `${businessName}${/s$/i.test(businessName) ? "’" : "’s"} badges` : "Badges on Tijarah"}
        </h3>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-slate-400">
          Badges are earned from real activity on Tijarah and checked every night, or chosen by the Tijarah team.
        </p>

        {held.length > 0 && (
          <ul className="mt-4 space-y-3">
            {held.map((b) => (
              <li key={b.key} className="flex gap-3 rounded-2xl bg-gray-50 dark:bg-slate-800/70 p-3">
                <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white ${b.disc}`}>
                  <IonIcon icon={b.icon} className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white">{b.label}</p>
                  <p className="text-[13px] text-gray-600 dark:text-slate-300 leading-snug">{b.meaning}</p>
                  {b.key === "tijarah_pick" && b.ref.reason ? (
                    <p className="mt-1.5 text-[12.5px] italic text-indigo-700 dark:text-indigo-300">“{b.ref.reason}”</p>
                  ) : (
                    <p className="mt-1 text-[11.5px] text-gray-400 dark:text-slate-500">{b.earned}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {others.length > 0 && (
          <>
            <p className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
              {held.length ? "Other badges on Tijarah" : "What to look for"}
            </p>
            <ul className="space-y-2.5">
              {others.map((b) => (
                <li key={b.key} className="flex items-start gap-2.5">
                  <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-white ${b.disc} opacity-80`}>
                    <IonIcon icon={b.icon} className="w-3.5 h-3.5" />
                  </span>
                  <p className="text-[12.5px] text-gray-600 dark:text-slate-300 leading-snug">
                    <span className="font-semibold text-gray-800 dark:text-slate-100">{b.label}</span> · {b.earned}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}
