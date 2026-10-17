"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { IonIcon } from "@ionic/react";
import { checkmark, chevronForward, documentTextOutline, shieldCheckmark } from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useAppContext } from "@/app/context/AppContext";
import { useNotification } from "@/app/context/NotificationContext";
import { useAcceptLegal, useMyLegalStatus } from "@/hooks/useLegal";
import { clearUser } from "@/store/slices/authSlice";
import { resetChat } from "@/store/slices/chatSlice";
import { setFcmToken } from "@/store/slices/notificationSlice";
import { unregisterDevice } from "@/services/notification.service";
import { removeItem, removeItemSync } from "@/utils/storage";

/** Pages where the gate steps aside: reading the documents, and signing in. */
const OPEN_PATHS = ["/legal", "/terms", "/privacy-policy", "/eula", "/auth"];

/** "Terms of Use, Privacy Policy and Business Listing Terms" */
const joinTitles = (titles: string[]) =>
  titles.length <= 1 ? (titles[0] ?? "") : `${titles.slice(0, -1).join(", ")} and ${titles[titles.length - 1]}`;

/**
 * Asks anyone signed in to accept the terms they haven't accepted yet: new
 * accounts, people from before the terms had a tick, business owners our
 * team added (bulk uploads), and everyone after an update that needs a
 * fresh yes. It can't be dismissed; they can read each document first, or
 * log out.
 */
export default function LegalGate() {
  const user = useAppSelector((s) => s.auth.user);
  const fcmToken = useAppSelector((s) => s.notification.fcmToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { resetProviderState } = useAppContext();
  const { notify } = useNotification();
  const { data } = useMyLegalStatus(!!user?.id);
  const accept = useAcceptLegal();
  const [agreed, setAgreed] = useState(false);

  const pending = data?.pending ?? [];
  const reading = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`));
  const open = !!user?.id && pending.length > 0 && !reading;

  const updated = pending.length > 0 && pending.every((p) => p.updated);
  const businessOnly = pending.every((p) => p.requiredFor === "business");
  const titles = pending.map((p) => p.title);

  const title = updated ? "We've updated our terms" : businessOnly ? "Terms for your business" : "Before you continue";
  const intro = updated
    ? "Please take a moment to review what's changed and accept to keep using Tijarah."
    : data?.isOwner && pending.some((p) => p.requiredFor === "business")
      ? "Your business is on Tijarah. To manage it and keep receiving enquiries, please review and accept:"
      : "To keep Tijarah safe and trusted for our community, please review and accept:";

  const onAgree = () => {
    accept.mutate(
      { documents: pending.map((p) => ({ slug: p.slug, version: p.version })), method: "signin_prompt" },
      {
        onSuccess: () => setAgreed(false),
        onError: () =>
          notify({ title: "Couldn't save", subtitle: "Check your connection and try again.", variant: "error" }),
      },
    );
  };

  const logOut = () => {
    if (fcmToken) {
      unregisterDevice(fcmToken).catch(() => {});
      dispatch(setFcmToken(null));
    }
    removeItemSync("user");
    removeItemSync("token");
    dispatch(clearUser());
    dispatch(resetChat());
    resetProviderState();
    queryClient.clear();
    removeItem("tijarah-query-cache");
    router.push("/");
  };

  return (
    <Sheet
      open={open}
      onClose={() => undefined}
      dismissible={false}
      handle={false}
      label={title}
      zIndex={10050}
      wideWidth="max-w-md"
      className="bg-white dark:bg-slate-800"
    >
      <div className="px-5 pt-3 pb-6 sm:pt-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <IonIcon icon={shieldCheckmark} className="text-white text-3xl" />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{intro}</p>

        <div className="mt-5 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
          {pending.map((doc) => (
            <button
              key={doc.slug}
              onClick={() => router.push(`/legal?doc=${doc.slug}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-700/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <IonIcon icon={documentTextOutline} className="text-indigo-500 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-100">{doc.title}</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug mt-0.5">
                  {doc.updated && doc.changeNote ? `What's new: ${doc.changeNote}` : doc.summary}
                </p>
              </div>
              <span className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center shrink-0">
                Read
                <IonIcon icon={chevronForward} className="text-sm" />
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400 ${
              agreed ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-500"
            }`}
          >
            {agreed && <IonIcon icon={checkmark} className="text-white text-sm" />}
          </span>
          <span className="text-[13px] text-slate-600 dark:text-slate-300 leading-snug">
            I have read and agree to the {joinTitles(titles)}.
          </span>
        </label>

        <button
          onClick={onAgree}
          disabled={!agreed || accept.isPending}
          className="mt-5 w-full h-12 rounded-2xl bg-indigo-600 text-white font-bold text-[15px] shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none"
        >
          {accept.isPending ? "Saving…" : "Agree and continue"}
        </button>
        <button
          onClick={logOut}
          disabled={accept.isPending}
          className="mt-2 w-full py-2.5 text-[13px] font-medium text-slate-400 dark:text-slate-500 active:opacity-60"
        >
          Not now, log me out
        </button>
      </div>
    </Sheet>
  );
}
