"use client";

import { Page } from "konsta/react";
import { useRouter } from "next/navigation";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { IonIcon } from "@ionic/react";
import {
  arrowBack,
  peopleOutline,
  shareSocialOutline,
  copyOutline,
  logoWhatsapp,
  checkmarkCircle,
} from "ionicons/icons";
import { useState } from "react";
import { shareInvite, buildInviteLink } from "@/utils/sharing";
import { trackInvite } from "@/services/invite.service";
import { useAuthGate } from "@/hooks/useAuthGate";
import PrivateRoute from "@/app/components/private-route";

function InviteFriendsContent() {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const [copied, setCopied] = useState(false);

  const handleShare = async (method: string) => {
    const result = await shareInvite();
    if (result === "shared" || result === "copied") {
      try {
        await trackInvite(method);
      } catch {
        // silent — tracking is best-effort
      }
    }
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const link = buildInviteLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      try {
        await trackInvite("copy_link");
      } catch {
        // silent
      }
    } catch {
      // fallback
    }
  };

  const handleWhatsApp = async () => {
    const link = buildInviteLink();
    const text = encodeURIComponent(
      `Hey! Check out Tijarah Connect — discover amazing local businesses near you! ${link}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    try {
      await trackInvite("whatsapp");
    } catch {
      // silent
    }
  };

  return (
    <Page className="bg-gray-50 dark:!bg-slate-900">
      <div className="h-full overflow-y-auto overscroll-contain">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800" style={{ paddingTop: "var(--sat,0px)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => goBack("/")}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center active:bg-gray-200 dark:active:bg-slate-700 transition-colors"
            >
              <IonIcon icon={arrowBack} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Invite Friends</h1>
          </div>
        </div>

        <div className="px-5 pt-8 pb-20 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
            <IonIcon icon={peopleOutline} className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Grow Your Community
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
              Help friends and family discover trusted local businesses.
              Together we make our community stronger!
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
            Why Invite Friends?
          </h3>
          {[
            {
              emoji: "🏪",
              title: "Support Local Businesses",
              desc: "More users means more visibility for local providers",
            },
            {
              emoji: "⭐",
              title: "Better Reviews & Ratings",
              desc: "A bigger community means more honest reviews",
            },
            {
              emoji: "🤝",
              title: "Stronger Together",
              desc: "Build a trusted network of service providers near you",
            },
            {
              emoji: "🔍",
              title: "Discover More",
              desc: "More members help uncover hidden gems in your area",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </p>
                <p className="text-[12px] text-gray-500 dark:text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Share Actions */}
        <div className="space-y-3">
          <h3 className="text-[15px] font-bold text-gray-900 dark:text-white px-1">
            Share With Friends
          </h3>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={logoWhatsapp} className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Share via WhatsApp
              </p>
              <p className="text-[12px] text-gray-500">
                Send to friends or groups
              </p>
            </div>
          </button>

          {/* Native Share */}
          <button
            onClick={() => handleShare("native_share")}
            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <IonIcon
                icon={shareSocialOutline}
                className="w-6 h-6 text-blue-600"
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Share via Other Apps
              </p>
              <p className="text-[12px] text-gray-500">
                SMS, Email, Telegram & more
              </p>
            </div>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100/80 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <IonIcon
                icon={copied ? checkmarkCircle : copyOutline}
                className={`w-6 h-6 ${copied ? "text-green-600" : "text-amber-600"}`}
              />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {copied ? "Link Copied!" : "Copy Invite Link"}
              </p>
              <p className="text-[12px] text-gray-500">
                {copied
                  ? "Paste it anywhere to share"
                  : "Copy link to share manually"}
              </p>
            </div>
          </button>
        </div>
      </div>
      </div> {/* end h-full scroll container */}
    </Page>
  );
}

export default function InviteFriendsPage() {
  return (
    <PrivateRoute
      title="Invite Friends"
      description="Sign in to share Tijarah Connect with friends and help your community discover local businesses."
    >
      <InviteFriendsContent />
    </PrivateRoute>
  );
}
