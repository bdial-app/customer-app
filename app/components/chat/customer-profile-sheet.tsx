"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  shieldCheckmark,
  heart,
  star,
  callOutline,
  logoWhatsapp,
  mailOutline,
  locationOutline,
  lockClosedOutline,
  searchOutline,
  chatbubblesOutline,
  pricetagOutline,
  eyeOutline,
} from "ionicons/icons";
import { Sheet } from "@/app/components/ui/sheet";
import { getChatCustomerProfile, type ChatCustomerProfile } from "@/services/chat.service";
import { LEAD_TIERS } from "@/app/components/leads/lead-insights";
import { LeadUnlockSheet } from "@/app/components/monetization/lead-unlock-sheet";
import { useLeadUnlockInfo, useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { useUnlockLead } from "@/hooks/useProviderAnalytics";

const monthYear = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
const dayMonth = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const SOURCE: Record<string, string> = {
  search: "Found you in search",
  home_feed: "Found you on the home feed",
  explore: "Found you on Explore",
  saved: "Came back from their saved list",
  chat: "Came through a chat",
  product_link: "Opened a shared product link",
  direct: "Opened your page directly",
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/**
 * Who a business is chatting with: the customer's standing on Tijarah and
 * their history with this business. Contact details follow the leads rule —
 * shown once unlocked, with the unlock offered right here.
 */
export function CustomerProfileSheet({
  conversationId,
  open,
  onClose,
  online,
  lastSeen,
}: {
  conversationId: string;
  open: boolean;
  onClose: () => void;
  online: boolean;
  lastSeen: string;
}) {
  const qc = useQueryClient();
  const key = ["chat-customer", conversationId];
  const { data: p, isLoading } = useQuery<ChatCustomerProfile>({
    queryKey: key,
    queryFn: () => getChatCustomerProfile(conversationId),
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <Sheet open={open} onClose={onClose} label="Customer profile" zIndex={9999} maxHeight="88dvh" className="bg-white dark:bg-slate-800">
      {isLoading || !p ? (
        <div className="px-5 pt-2 pb-8 space-y-3">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse mx-auto" />
          <div className="h-4 w-40 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse mx-auto" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
        </div>
      ) : (
        <Profile p={p} online={online} lastSeen={lastSeen} onUnlocked={() => qc.invalidateQueries({ queryKey: key })} />
      )}
    </Sheet>
  );
}

function Profile({
  p,
  online,
  lastSeen,
  onUnlocked,
}: {
  p: ChatCustomerProfile;
  online: boolean;
  lastSeen: string;
  onUnlocked: () => void;
}) {
  const interested = [
    ...p.withYou.askedAbout.map((a) => ({ name: a.name, asked: true })),
    ...(p.lead?.productsViewed ?? [])
      .filter((v) => !p.withYou.askedAbout.some((a) => a.name === v.name))
      .map((v) => ({ name: v.name, asked: false })),
  ];
  const tier = p.lead ? LEAD_TIERS[p.lead.tier] : null;

  return (
    <div className="px-5 pb-6 pt-1 sm:pt-6">
      {/* Who */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{initials(p.name)}</span>
          </div>
          {online && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800" />}
        </div>
        <h3 className="mt-2.5 flex items-center gap-1.5 text-[18px] font-extrabold text-slate-900 dark:text-white">
          {p.name}
          {p.verified && <IonIcon icon={shieldCheckmark} className="text-[17px] text-emerald-500" aria-label="Verified" />}
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
          {`On Tijarah since ${monthYear(p.memberSince)} · `}
          <span className={online ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>{online ? "Online" : lastSeen}</span>
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {p.verified && <Chip tone="emerald" icon={shieldCheckmark}>Verified member</Chip>}
          {p.withYou.savedYou && <Chip tone="rose" icon={heart}>Saved your business</Chip>}
          {p.withYou.review && <Chip tone="amber" icon={star}>{`Rated you ${p.withYou.review.rating}★`}</Chip>}
          {p.reviewsWritten > 0 && !p.withYou.review && (
            <Chip tone="slate" icon={star}>{`${p.reviewsWritten} review${p.reviewsWritten === 1 ? "" : "s"} on Tijarah`}</Chip>
          )}
        </div>
      </div>

      {/* With you */}
      <Section title="With your business">
        {p.lead && tier && (
          <Row icon={tier.icon} iconClass={tier.iconColor}>
            <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${tier.badgeClass}`}>{tier.badge}</span>
            <span className="ml-1.5 text-[12px] text-slate-500 dark:text-slate-400">{tier.meaning}</span>
          </Row>
        )}
        {p.lead?.searchQuery ? (
          <Row icon={searchOutline}>{`Searched “${p.lead.searchQuery}” and found you`}</Row>
        ) : p.lead?.source && SOURCE[p.lead.source] ? (
          <Row icon={eyeOutline}>{SOURCE[p.lead.source]}</Row>
        ) : null}
        {p.withYou.firstContactAt && (
          <Row icon={chatbubblesOutline}>
            {p.withYou.conversations > 1
              ? `${p.withYou.conversations} chats with you since ${dayMonth(p.withYou.firstContactAt)}`
              : `First messaged you on ${dayMonth(p.withYou.firstContactAt)}`}
          </Row>
        )}
        {interested.length > 0 && (
          <div className="pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Interested in</p>
            <div className="flex flex-wrap gap-1.5">
              {interested.map((i) => (
                <span
                  key={i.name}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200"
                >
                  <IonIcon icon={i.asked ? chatbubblesOutline : pricetagOutline} className="text-[12px]" />
                  {i.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {p.withYou.review && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 px-3 py-2.5">
            <p className="text-[12px] font-bold text-amber-500">{"★".repeat(p.withYou.review.rating)}</p>
            {p.withYou.review.text && (
              <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-3">{`“${p.withYou.review.text}”`}</p>
            )}
          </div>
        )}
      </Section>

      {/* Contact */}
      <Section title="Contact">
        {p.contact ? (
          <ContactDetails contact={p.contact} name={p.name} />
        ) : p.lead ? (
          <LockedContact lead={p.lead} onUnlocked={onUnlocked} />
        ) : (
          <p className="text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Keep the conversation here — they&apos;ll get your replies as notifications.
          </p>
        )}
      </Section>
    </div>
  );
}

function ContactDetails({ contact, name }: { contact: NonNullable<ChatCustomerProfile["contact"]>; name: string }) {
  const phone = contact.phone?.replace(/\D/g, "") ?? "";
  const wa = phone.length === 10 ? `91${phone}` : phone;
  return (
    <div className="flex flex-col gap-2">
      {contact.phone && (
        <div className="flex gap-2">
          <a
            href={`tel:${contact.phone}`}
            className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <IonIcon icon={callOutline} className="text-[16px]" />
            {`Call ${name.split(" ")[0]}`}
          </a>
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-11 rounded-xl bg-[#25D366] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <IonIcon icon={logoWhatsapp} className="text-[16px]" />
            WhatsApp
          </a>
        </div>
      )}
      {contact.phone && <Row icon={callOutline}>{contact.phone}</Row>}
      {contact.email && <Row icon={mailOutline}>{contact.email}</Row>}
      {(contact.area || contact.city) && <Row icon={locationOutline}>{[contact.area, contact.city].filter(Boolean).join(", ")}</Row>}
    </div>
  );
}

/** Phone and email are a lead unlock — the same price and flow as in Leads. */
function LockedContact({ lead, onUnlocked }: { lead: NonNullable<ChatCustomerProfile["lead"]>; onUnlocked: () => void }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: info } = useLeadUnlockInfo();
  const { data: config } = useMonetizationConfig();
  const unlock = useUnlockLead();
  const priceFor = (t: typeof lead.tier) => {
    if (!config) return 49;
    return info?.isGrowthSubscriber
      ? config.leadPricing[`${t}Discounted` as keyof typeof config.leadPricing]
      : config.leadPricing[t];
  };
  const free =
    !config?.flags.leadsMonetizationEnabled ||
    !!info?.isProSubscriber ||
    (info?.subscriptionCreditsRemaining ?? 0) > 0 ||
    (info?.freeRemaining ?? 0) > 0;

  return (
    <>
      <div className="rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-3.5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <IonIcon icon={lockClosedOutline} className="text-[18px] text-slate-500 dark:text-slate-300" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-900 dark:text-white">Phone, email &amp; area</p>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Call or WhatsApp them directly</p>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="shrink-0 h-9 px-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[12px] font-bold active:scale-95 transition-transform"
        >
          {free ? "Get contact free" : `Get contact · ₹${priceFor(lead.tier)}`}
        </button>
      </div>
      {sheetOpen && (
        <LeadUnlockSheet
          open
          onClose={() => setSheetOpen(false)}
          onUnlock={(voucherCode) =>
            unlock.mutate(
              { leadId: lead.id, voucherCode },
              {
                onSuccess: (data) => {
                  if (data.unlocked) {
                    setSheetOpen(false);
                    onUnlocked();
                  }
                },
              },
            )
          }
          tier={lead.tier}
          price={priceFor(lead.tier)}
          originalPrice={config && info?.isGrowthSubscriber ? config.leadPricing[lead.tier] : undefined}
          freeRemaining={info?.freeRemaining ?? 5}
          freeTotal={config?.freeQuotas.leadsPerMonth ?? 5}
          subscriptionCreditsRemaining={info?.subscriptionCreditsRemaining ?? 0}
          isProSubscriber={info?.isProSubscriber ?? false}
          isGrowthSubscriber={info?.isGrowthSubscriber ?? false}
          monetizationEnabled={config?.flags.leadsMonetizationEnabled ?? false}
          vouchersEnabled={config?.flags.vouchersEnabled !== false}
          isLoading={unlock.isPending}
        />
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h4 className="text-[13px] font-extrabold text-slate-900 dark:text-white mb-2">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({ icon, iconClass, children }: { icon: string; iconClass?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200 min-w-0">
      <IonIcon icon={icon} className={`text-[15px] shrink-0 ${iconClass ?? "text-slate-400 dark:text-slate-500"}`} />
      <span className="min-w-0 flex flex-wrap items-center">{children}</span>
    </div>
  );
}

function Chip({ tone, icon, children }: { tone: "emerald" | "rose" | "amber" | "slate"; icon: string; children: React.ReactNode }) {
  const cls = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${cls}`}>
      <IonIcon icon={icon} className="text-[12px]" />
      {children}
    </span>
  );
}
