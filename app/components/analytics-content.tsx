"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  trendingUpOutline,
  star,
  eyeOutline,
  chatbubbleOutline,
  cubeOutline,
  timeOutline,
  arrowUpOutline,
  arrowDownOutline,
  flashOutline,
  heartOutline,
  shareSocialOutline,
  bookmarkOutline,
  callOutline,
  sparklesOutline,
  walletOutline,
  peopleOutline,
  pulseOutline,
  calendarOutline,
  todayOutline,
  searchOutline,
  navigateOutline,
  flameOutline,
  lockOpenOutline,
  lockClosedOutline,
  personOutline,
  chevronForwardOutline,
  arrowBack,
} from "ionicons/icons";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useProviderAnalytics } from "@/hooks/useMyProvider";
import {
  useAnalyticsSummary,
  useTopProducts,
  usePeakHours,
  useLeads,
  useLeadDetail,
  useUnlockLead,
} from "@/hooks/useProviderAnalytics";
import { useLeadUnlockInfo, useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { LeadUnlockSheet } from "@/app/components/monetization/lead-unlock-sheet";
import { QuotaIndicator } from "@/app/components/monetization/quota-indicator";
import { MonetizationBanner } from "@/app/components/monetization/monetization-banner";
import type { StatWithTrend } from "@/services/analytics.service";

type Period = "7d" | "30d" | "90d";
type View = "overview" | "leads" | "lead-detail";

// ─── Custom Tooltip ───────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 text-white rounded-lg px-2.5 py-1.5 text-[10px] shadow-lg">
      <div className="font-bold mb-0.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Tier Badge Styles ────────────────────────────────────────────────
const TIER_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  hot: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  warm: { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-400" },
  soft: { bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-400" },
  cold: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Timeline Event Info ──────────────────────────────────────────────
const TIMELINE_EVENTS: Record<string, { label: string; description: string; icon: string; color: string; bg: string }> = {
  profile_view: { label: "Viewed Your Profile", description: "Opened your business page", icon: eyeOutline, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  product_view: { label: "Viewed a Product", description: "Checked out one of your products", icon: cubeOutline, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/30" },
  search_appear: { label: "Found via Search", description: "Your business appeared in their search", icon: searchOutline, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
  call_click: { label: "Tapped Call", description: "Clicked to call your business", icon: callOutline, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  direction_click: { label: "Got Directions", description: "Opened directions to your location", icon: navigateOutline, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-900/30" },
  save: { label: "Saved Your Business", description: "Added you to their saved list", icon: bookmarkOutline, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
  share: { label: "Shared Your Profile", description: "Shared your business with someone", icon: shareSocialOutline, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/30" },
  enquiry: { label: "Sent an Enquiry", description: "Reached out with a question", icon: chatbubbleOutline, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
  like: { label: "Liked Your Business", description: "Showed appreciation for your page", icon: heartOutline, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/30" },
};
const getTimelineEventInfo = (eventType: string) =>
  TIMELINE_EVENTS[eventType] || {
    label: eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: "Interacted with your business",
    icon: pulseOutline,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-700",
  };

// ─── Lead Detail View ─────────────────────────────────────────────────
function LeadDetailView({ leadId, onBack }: { leadId: string; onBack: () => void }) {
  const { data: detail, isLoading } = useLeadDetail(leadId);

  if (isLoading || !detail) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const badge = TIER_BADGE[detail.tier] || TIER_BADGE.cold;
  const visitMinutes = Math.round(detail.totalDuration / 60);
  const hasSearchQuery = !!detail.searchQuery;

  // Generate actionable insights
  const insights: { icon: string; text: string; color: string }[] = [];
  if (detail.productsViewed.length >= 3) insights.push({ icon: "🔥", text: `Viewed ${detail.productsViewed.length} products — high purchase intent`, color: "text-red-600" });
  if (visitMinutes >= 5) insights.push({ icon: "⏱️", text: `Spent ${visitMinutes} min browsing — very engaged visitor`, color: "text-blue-600" });
  if (hasSearchQuery) insights.push({ icon: "🔍", text: `Searched for "${detail.searchQuery}" — knows what they want`, color: "text-violet-600" });
  if (detail.actionsPerformed.includes("share") || detail.actionsPerformed.includes("save")) insights.push({ icon: "⭐", text: "Saved or shared your profile — strong interest signal", color: "text-amber-600" });
  if (detail.tier === "hot") insights.push({ icon: "💰", text: "Hot lead — highest conversion probability", color: "text-emerald-600" });

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{detail.visitor.name}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {detail.tier} · Score {detail.score}
          </span>
        </div>
      </div>

      {/* Contact hint — masked info to encourage unlock */}
      {!detail.isUnlocked && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <IonIcon icon={lockClosedOutline} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Contact Info Locked</span>
          </div>
          <div className="space-y-1.5">
            {detail.visitor.userId && (
              <div className="flex items-center gap-2">
                <IonIcon icon={callOutline} className="text-slate-400 text-sm" />
                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">+91 •••••• ••{Math.floor(Math.random() * 90 + 10)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <IonIcon icon={chatbubbleOutline} className="text-slate-400 text-sm" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Direct chat available after unlock</span>
            </div>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
            Unlock to reveal phone number and start a conversation
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{detail.productsViewed.length}</p>
          <p className="text-[10px] text-slate-400">Products</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{visitMinutes}</p>
          <p className="text-[10px] text-slate-400">Minutes</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{detail.actionsPerformed.length}</p>
          <p className="text-[10px] text-slate-400">Actions</p>
        </div>
      </div>

      {/* Insights — actionable tips */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
            <IonIcon icon={sparklesOutline} className="text-amber-500" />
            Insights
          </h4>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm shrink-0">{ins.icon}</span>
                <p className={`text-xs ${ins.color} dark:opacity-90 leading-relaxed`}>{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search query */}
      {hasSearchQuery && (
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 border border-violet-100 dark:border-violet-800">
          <p className="text-[10px] text-violet-500 font-bold uppercase tracking-wider mb-1">Search Query</p>
          <p className="text-sm font-medium text-violet-800 dark:text-violet-200">&ldquo;{detail.searchQuery}&rdquo;</p>
        </div>
      )}

      {/* Products Viewed */}
      {detail.products.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Products Viewed</h4>
          <div className="space-y-2">
            {detail.products.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <IonIcon icon={cubeOutline} className="text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
          <IonIcon icon={timeOutline} className="text-blue-500" />
          Activity Timeline
        </h4>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-600" />
          <div className="space-y-0">
            {detail.timeline.slice(0, 20).map((ev, i) => {
              const info = getTimelineEventInfo(ev.eventType);
              const time = new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={i} className="flex items-start gap-3 relative py-2">
                  <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 ${info.bg}`}>
                    <IonIcon icon={info.icon} className={`text-sm ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{info.label}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {info.description}
                      {ev.duration ? ` · ${ev.duration}s` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
const AnalyticsContent = () => {
  const [period, setPeriod] = useState<Period>("7d");
  const [view, setView] = useState<View>("overview");
  const [leadTier, setLeadTier] = useState<string | undefined>(undefined);
  const [leadPage, setLeadPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: analytics } = useProviderAnalytics();
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(period);
  const { data: topProducts } = useTopProducts(period);
  const { data: peakHours } = usePeakHours(period);
  const { data: leadsData, isLoading: leadsLoading } = useLeads(leadTier, leadPage);
  const unlockMutation = useUnlockLead();
  const { data: leadUnlockInfo } = useLeadUnlockInfo();
  const { data: monetizationConfig } = useMonetizationConfig();
  const [unlockSheetLead, setUnlockSheetLead] = useState<{ id: string; tier: string } | null>(null);

  // Build sparkline chart data from summary
  const chartData = summary?.profileViews.sparkline?.map((v, i) => ({
    name: `${i + 1}`,
    views: v,
    enquiries: summary.enquiries.sparkline?.[i] || 0,
  })) || [];

  // Peak hours chart data
  const peakHoursData = peakHours?.map((v, i) => ({ hour: `${i}`, val: v })) || [];
  const peakMax = Math.max(...(peakHours || [0]), 1);
  const peakHourIdx = peakHours?.indexOf(Math.max(...(peakHours || [0]))) ?? 0;
  const peakLabel = `${peakHourIdx}:00–${peakHourIdx + 1}:00`;

  const totalReviews = analytics?.totalReviews ?? 0;
  const avgRating = analytics?.averageRating ?? 0;

  // KPI helper
  const kpi = (stat: StatWithTrend | undefined, label: string, icon: string, accent: string, bg: string) => ({
    label,
    value: stat?.count?.toLocaleString() ?? "0",
    sub: label.toLowerCase(),
    change: stat?.trend ?? 0,
    icon,
    accent,
    bg,
  });

  const kpis = summary
    ? [
        kpi(summary.profileViews, "Views", eyeOutline, "text-blue-600", "bg-blue-500"),
        kpi(summary.searchAppearances, "Searches", searchOutline, "text-violet-600", "bg-violet-500"),
        kpi(summary.enquiries, "Enquiries", chatbubbleOutline, "text-emerald-600", "bg-emerald-500"),
        kpi(summary.calls, "Calls", callOutline, "text-amber-600", "bg-amber-500"),
        kpi(summary.directions, "Directions", navigateOutline, "text-teal-600", "bg-teal-500"),
        kpi(summary.saves, "Saves", bookmarkOutline, "text-pink-600", "bg-pink-500"),
      ]
    : [];

  // Lead detail drill-in
  if (view === "lead-detail" && selectedLeadId) {
    return (
      <div className="pb-24">
        <div
          className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700"
          style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={() => { setView("leads"); setSelectedLeadId(null); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <IonIcon icon={arrowBack} className="text-white text-base" />
            </button>
            <h1 className="text-lg font-bold text-white">Lead Details</h1>
          </div>
        </div>
        <LeadDetailView leadId={selectedLeadId} onBack={() => { setView("leads"); setSelectedLeadId(null); }} />
      </div>
    );
  }

  return (
    <div className="pb-24">

      {/* ═══ HEADER ═══ */}
      <div
        className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700"
        style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Analytics</h1>
            <p className="text-[11px] text-white/50">Performance & insights</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold">Live</span>
          </div>
        </div>

        {/* View switcher: Overview | Leads */}
        <div className="flex px-4 pb-2.5 gap-1">
          <button
            onClick={() => setView("overview")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              view === "overview" ? "bg-white text-slate-800" : "bg-white/10 text-white/60"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView("leads")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
              view === "leads" ? "bg-white text-slate-800" : "bg-white/10 text-white/60"
            }`}
          >
            Leads
            {summary && (summary.leads.hot + summary.leads.warm) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {summary.leads.hot + summary.leads.warm}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === "overview" ? (
        <>
          {/* ═══ HERO SCORE CARD ═══ */}
          <div className="mx-4 mt-3 mb-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[20px] p-5 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-amber-500/10 blur-xl" />
              <div className="absolute left-1/2 -bottom-12 w-40 h-40 rounded-full bg-blue-500/8 blur-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <IonIcon icon={pulseOutline} className="text-amber-400 text-lg" />
                    </div>
                    <div>
                      <div className="text-white/90 font-bold text-[13px]">Business Dashboard</div>
                      <div className="text-white/40 text-[10px]">Updated just now</div>
                    </div>
                  </div>
                  {summary && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                      <span className="text-emerald-400 text-[10px] font-bold">{summary.conversionRate.toFixed(1)}% CVR</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {/* Circular score */}
                  <div className="relative w-[72px] h-[72px] flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <motion.circle
                        cx="36" cy="36" r="30" fill="none"
                        stroke="url(#heroGrad)" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(summary?.conversionRate ?? 0) / 100 * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                        animate={{ strokeDashoffset: (1 - (summary?.conversionRate ?? 0) / 100) * 2 * Math.PI * 30 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white font-black text-xl leading-none">{summary?.conversionRate?.toFixed(0) ?? "–"}</span>
                      <span className="text-white/40 text-[8px] font-medium">CVR %</span>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                      <div className="text-white font-bold text-base">{summary?.profileViews.count ?? 0}</div>
                      <div className="text-white/40 text-[9px]">Views</div>
                    </div>
                    <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                      <div className="text-emerald-400 font-bold text-base">{summary?.enquiries.count ?? 0}</div>
                      <div className="text-white/40 text-[9px]">Enquiries</div>
                    </div>
                    <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                      <div className="text-amber-400 font-bold text-base">{totalReviews}</div>
                      <div className="text-white/40 text-[9px]">Reviews</div>
                    </div>
                    <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                      <div className="text-blue-400 font-bold text-base">{summary?.saves.count ?? 0}</div>
                      <div className="text-white/40 text-[9px]">Saves</div>
                    </div>
                  </div>
                </div>

                {/* Lead funnel highlight — CTA */}
                {summary && (summary.leads.hot + summary.leads.warm) > 0 && (
                  <button
                    onClick={() => setView("leads")}
                    className="w-full bg-white/[0.06] rounded-xl px-3 py-2 flex items-center gap-2 active:bg-white/10 transition-colors"
                  >
                    <IonIcon icon={flameOutline} className="text-orange-400 text-sm" />
                    <span className="text-white/70 text-[11px] flex-1 text-left">
                      <span className="text-amber-400 font-bold">{summary.leads.hot} hot</span>
                      {summary.leads.warm > 0 && <>, <span className="text-orange-300 font-bold">{summary.leads.warm} warm</span></>} leads waiting
                    </span>
                    <IonIcon icon={chevronForwardOutline} className="text-white/30 text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══ PERIOD SELECTOR ═══ */}
          <div className="px-4 mb-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 gap-1">
              {([
                { value: "7d" as Period, label: "7 Days", icon: todayOutline },
                { value: "30d" as Period, label: "30 Days", icon: calendarOutline },
                { value: "90d" as Period, label: "90 Days", icon: timeOutline },
              ]).map((o) => (
                <button
                  key={o.value}
                  onClick={() => setPeriod(o.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                    period === o.value
                      ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <IonIcon icon={o.icon} className="text-xs" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══ KPI CARDS ═══ */}
          {summaryLoading ? (
            <div className="px-4 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-[76px] bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 mb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={period}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-3 gap-2"
                >
                  {kpis.map((k, i) => (
                    <motion.div
                      key={k.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[2px] ${k.bg} rounded-t-2xl`} />
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                          <IonIcon icon={k.icon} className={`text-xs ${k.accent}`} />
                        </div>
                        {k.change !== 0 && (
                          <div className={`flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded ${
                            k.change >= 0 ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                          }`}>
                            <IonIcon icon={k.change >= 0 ? arrowUpOutline : arrowDownOutline} className="text-[6px]" />
                            {Math.abs(k.change)}%
                          </div>
                        )}
                      </div>
                      <div className="text-[18px] font-black text-slate-800 dark:text-white leading-none">{k.value}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{k.sub}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ═══ VIEWS & ENQUIRIES CHART ═══ */}
          {chartData.length > 1 && (
            <div className="px-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Views & Enquiries</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-[8px] text-slate-400">Views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[8px] text-slate-400">Enquiries</span>
                    </div>
                  </div>
                </div>
                <div className="h-[120px] -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="enqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="views" stroke="#60a5fa" strokeWidth={1.5} fill="url(#viewsGrad)" dot={false} />
                      <Area type="monotone" dataKey="enquiries" stroke="#34d399" strokeWidth={1.5} fill="url(#enqGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LEAD FUNNEL ═══ */}
          {summary && (summary.leads.hot + summary.leads.warm + summary.leads.soft + summary.leads.cold) > 0 && (
            <div className="px-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <IonIcon icon={flameOutline} className="text-sm text-orange-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white">Lead Funnel</h3>
                  </div>
                  <button onClick={() => setView("leads")} className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                    View all <IonIcon icon={chevronForwardOutline} className="text-[9px]" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {(["hot", "warm", "soft", "cold"] as const).map((tier) => {
                    const total = summary.leads.hot + summary.leads.warm + summary.leads.soft + summary.leads.cold;
                    const pct = total > 0 ? Math.round((summary.leads[tier] / total) * 100) : 0;
                    const colors = { hot: "bg-red-500", warm: "bg-orange-400", soft: "bg-yellow-400", cold: "bg-blue-400" };
                    return (
                      <div key={tier} className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 w-9 capitalize">{tier}</span>
                        <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${colors[tier]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 2)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-7 text-right">{summary.leads[tier]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ PEAK HOURS ═══ */}
          {peakHoursData.length > 0 && peakMax > 0 && (
            <div className="px-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Peak Hours</h3>
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg">
                    <IonIcon icon={flashOutline} className="text-amber-600 text-[9px]" />
                    <span className="text-[8px] font-bold text-amber-700 dark:text-amber-400">{peakLabel}</span>
                  </div>
                </div>
                <div className="h-[80px] -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHoursData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 7, fill: "#94a3b8" }}
                        interval={5}
                      />
                      <YAxis hide />
                      <Bar dataKey="val" radius={[3, 3, 0, 0]} maxBarSize={16}>
                        {peakHoursData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.val >= peakMax * 0.8 ? "#f59e0b" : "#e2e8f0"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TOP PRODUCTS ═══ */}
          {topProducts && topProducts.length > 0 && (
            <div className="px-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <IonIcon icon={cubeOutline} className="text-sm text-teal-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Top Products</h3>
                </div>
                <div className="space-y-2">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold text-slate-300 w-3">#{i + 1}</span>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <IonIcon icon={cubeOutline} className="text-xs text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.views} views · {p.uniqueVisitors} visitors</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SMART INSIGHTS ═══ */}
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Smart Insights</h3>
              <IonIcon icon={sparklesOutline} className="text-amber-500 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  icon: trendingUpOutline,
                  color: "from-blue-500 to-indigo-600",
                  title: "Growth",
                  value: `${(summary?.profileViews.trend ?? 0) >= 0 ? "+" : ""}${summary?.profileViews.trend ?? 0}%`,
                  desc: "vs previous period",
                },
                {
                  icon: walletOutline,
                  color: "from-amber-500 to-orange-600",
                  title: "Conversion",
                  value: `${summary?.conversionRate?.toFixed(1) ?? 0}%`,
                  desc: "Views → actions",
                },
                {
                  icon: peopleOutline,
                  color: "from-violet-500 to-purple-600",
                  title: "Hot Leads",
                  value: String(summary?.leads.hot ?? 0),
                  desc: "High-intent visitors",
                },
                {
                  icon: star,
                  color: "from-emerald-500 to-teal-600",
                  title: "Rating",
                  value: avgRating.toFixed(1),
                  desc: `${totalReviews} reviews`,
                },
              ].map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl bg-gradient-to-br ${insight.color} p-3 relative overflow-hidden`}
                >
                  <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-white/10" />
                  <IonIcon icon={insight.icon} className="text-white/40 text-sm mb-1" />
                  <div className="text-white font-black text-lg leading-none">{insight.value}</div>
                  <div className="text-white/90 text-[9px] font-bold mt-0.5">{insight.title}</div>
                  <div className="text-white/50 text-[8px] mt-0.5">{insight.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ═══ ENGAGEMENT STRIP ═══ */}
          <div className="px-4 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-3.5 pt-3 pb-1.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Engagement</h3>
              </div>
              <div className="flex divide-x divide-slate-100 dark:divide-slate-700">
                {[
                  { icon: heartOutline, label: "Saves", value: String(summary?.saves.count ?? 0), color: "text-pink-500" },
                  { icon: shareSocialOutline, label: "Shares", value: String(summary?.shares.count ?? 0), color: "text-blue-500" },
                  { icon: navigateOutline, label: "Dirs", value: String(summary?.directions.count ?? 0), color: "text-violet-500" },
                  { icon: callOutline, label: "Calls", value: String(summary?.calls.count ?? 0), color: "text-emerald-500" },
                ].map((e) => (
                  <div key={e.label} className="flex-1 py-2.5 text-center">
                    <IonIcon icon={e.icon} className={`text-base ${e.color}`} />
                    <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{e.value}</div>
                    <div className="text-[7px] text-slate-400 font-medium">{e.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ═══ LEADS VIEW ═══ */
        <div className="px-4 pt-3 space-y-4">

          {/* Hot Leads CTA */}
          {leadsData && leadsData.data.filter((l) => l.tier === "hot").length > 0 && !leadTier && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <IonIcon icon={flameOutline} className="text-lg" />
                <span className="text-sm font-bold">Hot Leads Available!</span>
              </div>
              <p className="text-[11px] opacity-90">
                You have {leadsData.data.filter((l) => l.tier === "hot").length} highly interested visitors. Unlock to connect!
              </p>
              <button
                onClick={() => { setLeadTier("hot"); setLeadPage(1); }}
                className="mt-3 px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-xs font-bold active:scale-[0.97]"
              >
                View Hot Leads
              </button>
            </div>
          )}

          {/* Quota indicator */}
          {leadUnlockInfo && monetizationConfig?.flags.leadsMonetizationEnabled && (
            <div className="flex items-center justify-between mb-2">
              <QuotaIndicator
                used={leadUnlockInfo.freeUsedThisMonth}
                total={monetizationConfig.freeQuotas.leadsPerMonth}
                label="free/mo"
                unlimited={leadUnlockInfo.isProSubscriber}
              />
              {leadUnlockInfo.subscriptionCreditsRemaining > 0 && !leadUnlockInfo.isProSubscriber && (
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  +{leadUnlockInfo.subscriptionCreditsRemaining} plan credits
                </span>
              )}
            </div>
          )}
          {leadUnlockInfo && !monetizationConfig?.flags.leadsMonetizationEnabled && (
            <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                All lead unlocks are free during launch
              </span>
            </div>
          )}

          {/* Tier filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {([
              { key: undefined as string | undefined, label: "All" },
              { key: "hot", label: "Hot" },
              { key: "warm", label: "Warm" },
              { key: "soft", label: "Soft" },
              { key: "cold", label: "Cold" },
            ]).map((t) => (
              <button
                key={t.label}
                onClick={() => { setLeadTier(t.key); setLeadPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  leadTier === t.key
                    ? "bg-slate-800 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Leads list */}
          {leadsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !leadsData?.data.length ? (
            <div className="text-center py-12">
              <IonIcon icon={personOutline} className="text-4xl text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No leads yet</p>
              <p className="text-xs text-slate-300 mt-1">Leads appear when customers interact with your profile</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leadsData.data.map((lead) => {
                const badge = TIER_BADGE[lead.tier] || TIER_BADGE.cold;
                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 relative">
                        {lead.isUnlocked && lead.visitor.avatar ? (
                          <img src={lead.visitor.avatar} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <IonIcon icon={personOutline} className="text-xl text-slate-400" />
                        )}
                        {!lead.isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-slate-200/60 dark:bg-slate-600/60 backdrop-blur-[2px] flex items-center justify-center">
                            <IonIcon icon={lockClosedOutline} className="text-sm text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${lead.isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                            {lead.visitor.name}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {lead.tier}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
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
                        <p className="text-[10px] text-slate-300 mt-1">Last seen {timeAgo(lead.lastSeenAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{lead.score}</span>
                        <p className="text-[9px] text-slate-400 uppercase">Score</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {lead.isUnlocked ? (
                        <button
                          onClick={() => { setSelectedLeadId(lead.id); setView("lead-detail"); }}
                          className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => setUnlockSheetLead({ id: lead.id, tier: lead.tier || "cold" })}
                          disabled={unlockMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                        >
                          <IonIcon icon={lockOpenOutline} className="text-sm" />
                          {(() => {
                            const info = leadUnlockInfo;
                            const config = monetizationConfig;
                            if (!config?.flags.leadsMonetizationEnabled || !info) return "Unlock Lead";
                            if (info.isProSubscriber || info.subscriptionCreditsRemaining > 0 || info.freeRemaining > 0) return "Unlock Free";
                            const tier = (lead.tier || "cold") as "hot" | "warm" | "soft" | "cold";
                            const price = info.isGrowthSubscriber
                              ? config.leadPricing[`${tier}Discounted` as keyof typeof config.leadPricing]
                              : config.leadPricing[tier];
                            return `Unlock ₹${price}`;
                          })()}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {leadsData && leadsData.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pb-4">
              <button
                disabled={leadPage <= 1}
                onClick={() => setLeadPage((p) => p - 1)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                {leadPage} / {leadsData.meta.totalPages}
              </span>
              <button
                disabled={leadPage >= leadsData.meta.totalPages}
                onClick={() => setLeadPage((p) => p + 1)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lead Unlock Sheet */}
      {unlockSheetLead && (
        <LeadUnlockSheet
          open={!!unlockSheetLead}
          onClose={() => setUnlockSheetLead(null)}
          onUnlock={(voucherCode) => {
            unlockMutation.mutate(
              { leadId: unlockSheetLead.id, voucherCode },
              { onSuccess: (data) => { if (data.unlocked) setUnlockSheetLead(null); } }
            );
          }}
          tier={(unlockSheetLead.tier as "hot" | "warm" | "soft" | "cold") || "cold"}
          price={(() => {
            if (!monetizationConfig) return 49;
            const tier = unlockSheetLead.tier as "hot" | "warm" | "soft" | "cold";
            return leadUnlockInfo?.isGrowthSubscriber
              ? monetizationConfig.leadPricing[`${tier}Discounted` as keyof typeof monetizationConfig.leadPricing]
              : monetizationConfig.leadPricing[tier];
          })()}
          originalPrice={(() => {
            if (!monetizationConfig || !leadUnlockInfo?.isGrowthSubscriber) return undefined;
            const tier = unlockSheetLead.tier as "hot" | "warm" | "soft" | "cold";
            return monetizationConfig.leadPricing[tier];
          })()}
          freeRemaining={leadUnlockInfo?.freeRemaining ?? 5}
          freeTotal={monetizationConfig?.freeQuotas.leadsPerMonth ?? 5}
          subscriptionCreditsRemaining={leadUnlockInfo?.subscriptionCreditsRemaining ?? 0}
          isProSubscriber={leadUnlockInfo?.isProSubscriber ?? false}
          isGrowthSubscriber={leadUnlockInfo?.isGrowthSubscriber ?? false}
          monetizationEnabled={monetizationConfig?.flags.leadsMonetizationEnabled ?? false}
          isLoading={unlockMutation.isPending}
        />
      )}
    </div>
  );
};

export default AnalyticsContent;
