"use client";

import { IonIcon } from "@ionic/react";
import { linkOutline, logoWhatsapp } from "ionicons/icons";
import { useAppContext } from "@/app/context/AppContext";
import { useNotification } from "@/app/context/NotificationContext";
import { reviewLinkUrl } from "@/utils/app-links";
import { shareContent } from "@/utils/sharing";
import { Card } from "./manage/kit";

/**
 * "Get reviews": the owner shares their review link with their own customers
 * (from their own WhatsApp). Reviews are written in the app, so every review
 * is also a customer joining Tijarah.
 */
export default function GetReviewsCard() {
  const { providerInfo } = useAppContext();
  const { notify } = useNotification();
  if (!providerInfo?.id) return null;

  const link = reviewLinkUrl(providerInfo.id);
  const message =
    `Salaam! Thank you for choosing ${providerInfo.brandName} 🙏 ` +
    `If you were happy with us, please leave a review on Tijarah, the Dawoodi Bohra community's business app. It really helps us.\n${link}`;

  const share = async () => {
    const r = await shareContent({ title: `Review ${providerInfo.brandName}`, text: message });
    if (r === "copied") notify({ title: "Message copied", subtitle: "Paste it in WhatsApp to your customers.", variant: "success" });
    if (r === "failed") notify({ title: "Couldn't open sharing", subtitle: link, variant: "error" });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify({ title: "Review link copied", variant: "success" });
    } catch {
      notify({ title: "Your review link", subtitle: link, variant: "info" });
    }
  };

  return (
    <Card>
      <p className="text-[15px] font-bold text-slate-900 dark:text-white">Get more reviews</p>
      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
        Send your review link to happy customers on WhatsApp. Reviews help new customers trust you, and each one brings someone new to Tijarah.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => void share()}
          className="flex-1 h-11 rounded-xl text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "#25D366" }}
        >
          <IonIcon icon={logoWhatsapp} className="text-lg" />
          Share review link
        </button>
        <button
          onClick={() => void copy()}
          aria-label="Copy review link"
          className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center active:scale-[0.96] transition-transform"
        >
          <IonIcon icon={linkOutline} className="text-lg" />
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mt-2">Ask honestly: reviews can&apos;t be traded for discounts or gifts.</p>
    </Card>
  );
}
