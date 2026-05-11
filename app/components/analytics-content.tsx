"use client";
import { useState, useMemo } from "react";
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
  megaphoneOutline,
  cashOutline,
  mailOutline,
  locationOutline,
  funnelOutline,
  swapVerticalOutline,
  closeOutline,
  chevronDownOutline,
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
import { useProviderAnalytics, useMySponsorships } from "@/hooks/useMyProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import OfflineFallback from "./offline-fallback";
import {
  useAnalyticsSummary,
  useTopProducts,
  usePeakHours,
  useLeads,
  useLeadDetail,
  useUnlockLead,
  useVisitorInsights,
} from "@/hooks/useProviderAnalytics";
import { useLeadUnlockInfo, useMonetizationConfig } from "@/hooks/useMonetizationConfig";
import { LeadUnlockSheet } from "@/app/components/monetization/lead-unlock-sheet";
import { QuotaIndicator } from "@/app/components/monetization/quota-indicator";
import { MonetizationBanner } from "@/app/components/monetization/monetization-banner";
import { ActivePlanBanner, ActiveBoostBanner } from "@/app/components/provider/active-status-cards";
import { useQuery } from "@tanstack/react-query";
import { getCurrentSubscription } from "@/services/payment.service";
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

      {/* Contact info — shown for unlocked non-anonymous leads */}
      {detail.isUnlocked && !detail.isAnonymous && (detail.visitor.phone || detail.visitor.email || detail.visitor.city) && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2.5">Contact Information</h4>
          <div className="space-y-2">
            {detail.visitor.phone && (
              <a href={`tel:${detail.visitor.phone}`} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center">
                  <IonIcon icon={callOutline} className="text-emerald-600 dark:text-emerald-400 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{detail.visitor.phone}</p>
                  <p className="text-[9px] text-slate-400">Tap to call</p>
                </div>
              </a>
            )}
            {detail.visitor.email && (
              <a href={`mailto:${detail.visitor.email}`} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
                  <IonIcon icon={mailOutline} className="text-blue-600 dark:text-blue-400 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{detail.visitor.email}</p>
                  <p className="text-[9px] text-slate-400">Tap to email</p>
                </div>
              </a>
            )}
            {detail.visitor.city && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center">
                  <IonIcon icon={locationOutline} className="text-violet-600 dark:text-violet-400 text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{detail.visitor.city}</p>
                  <p className="text-[9px] text-slate-400">Location</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
  const { isOnline } = useNetworkStatus();
  const [period, setPeriod] = useState<Period>("7d");
  const [view, setView] = useState<View>("overview");
  const [leadTier, setLeadTier] = useState<string | undefined>(undefined);
  const [leadPage, setLeadPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<"unlocked" | "locked" | undefined>(undefined);
  const [leadSource, setLeadSource] = useState<string | undefined>(undefined);
  const [leadDateRange, setLeadDateRange] = useState<string>("all"); // "today" | "7d" | "30d" | "90d" | "all"
  const [leadSortBy, setLeadSortBy] = useState<"score" | "lastSeen" | "firstSeen" | "duration">("score");
  const [leadSortOrder, setLeadSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [leadSearch, setLeadSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const leadFilters = useMemo(() => {
    const f: Record<string, any> = {
      tier: leadTier,
      page: leadPage,
      limit: 20,
      status: leadStatus,
      source: leadSource,
      sortBy: leadSortBy,
      sortOrder: leadSortOrder,
    };
    if (leadSearch.trim()) f.search = leadSearch.trim();
    if (leadDateRange !== "all") {
      const now = new Date();
      const from = new Date();
      if (leadDateRange === "today") from.setHours(0, 0, 0, 0);
      else if (leadDateRange === "7d") from.setDate(now.getDate() - 7);
      else if (leadDateRange === "30d") from.setDate(now.getDate() - 30);
      else if (leadDateRange === "90d") from.setDate(now.getDate() - 90);
      f.dateFrom = from.toISOString();
    }
    // Strip undefined values
    return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined));
  }, [leadTier, leadPage, leadStatus, leadSource, leadDateRange, leadSortBy, leadSortOrder, leadSearch]);

  const activeFilterCount = [leadStatus, leadSource, leadDateRange !== "all" ? leadDateRange : undefined, leadSearch.trim() || undefined, leadSortBy !== "score" ? leadSortBy : undefined].filter(Boolean).length;

  const { data: analytics } = useProviderAnalytics();
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useAnalyticsSummary(period);
  const { data: topProducts } = useTopProducts(period);
  const { data: peakHours } = usePeakHours(period);
  const { data: leadsData, isLoading: leadsLoading } = useLeads(leadFilters);
  const unlockMutation = useUnlockLead();
  const { data: leadUnlockInfo } = useLeadUnlockInfo();
  const { data: monetizationConfig } = useMonetizationConfig();
  const { data: currentSub } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: getCurrentSubscription,
    staleTime: 1000 * 60 * 2,
  });
  const { data: sponsorships } = useMySponsorships();
  const { data: visitorInsights } = useVisitorInsights(period);
  const [unlockSheetLead, setUnlockSheetLead] = useState<{ id: string; tier: string } | null>(null);

  const hasActivePlan = currentSub && currentSub.status === "active" && currentSub.plan;
  const activeSponsorships = sponsorships?.filter(
    (s) => s.isActive && new Date(s.endsAt) > new Date(),
  ) ?? [];

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

  // Offline + no cached analytics data → show fallback
  if (!isOnline && !summary) {
    return <OfflineFallback message="Connect to the internet to view your analytics." />;
  }

  // Error state — show retry UI instead of eternal loading skeletons
  if (summaryError && !summary) {
    return (
      <div className="pb-24">
        <div
          className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700"
          style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
        >
          <div className="px-4 py-3">
            <h1 className="text-lg font-bold text-white">Analytics</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <IonIcon icon={pulseOutline} className="text-3xl text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Unable to load analytics</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Something went wrong. Please try again.</p>
          <button
            onClick={() => refetchSummary()}
            className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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

      {/* Active plan & boost banners — only on overview */}
      {view === "overview" && (hasActivePlan || activeSponsorships.length > 0) && (
        <div className="pt-3">
          {hasActivePlan && (
            <ActivePlanBanner subscription={currentSub!} onManage={() => {}} />
          )}
          {activeSponsorships.length > 0 && (
            <ActiveBoostBanner sponsorships={activeSponsorships} onManage={() => {}} />
          )}
        </div>
      )}

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

          {/* ═══ AUDIENCE INSIGHTS ═══ */}
          {visitorInsights && visitorInsights.totalVisitors > 0 && (() => {
            const { anonymous: anon, registered: reg, topSearchQueries, topSources } = visitorInsights;
            const tiers = anon.tiers;
            const totalTiers = tiers.hot + tiers.warm + tiers.soft + tiers.cold;
            return (
              <div className="px-4 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center">
                      <IonIcon icon={peopleOutline} className="text-base text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Audience Insights</h3>
                      <p className="text-[10px] text-slate-400">{visitorInsights.totalVisitors.toLocaleString()} total visitors</p>
                    </div>
                  </div>

                  {/* Visitor split bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Visitor Breakdown</span>
                    </div>
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                      <div
                        className="bg-indigo-500 transition-all"
                        style={{ width: `${reg.percentage}%` }}
                      />
                      <div
                        className="bg-slate-300 dark:bg-slate-500 transition-all"
                        style={{ width: `${anon.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Registered {reg.count} ({reg.percentage}%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500" />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Anonymous {anon.count} ({anon.percentage}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Engagement comparison */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Avg Score", reg: reg.avgScore, anon: anon.avgScore },
                      { label: "Avg Duration", reg: `${Math.round(reg.avgDurationSec / 60)}m`, anon: `${Math.round(anon.avgDurationSec / 60)}m` },
                      { label: "Products", reg: reg.avgProductsViewed.toFixed(1), anon: anon.avgProductsViewed.toFixed(1) },
                    ].map((m) => (
                      <div key={m.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
                        <p className="text-[8px] font-semibold text-slate-400 uppercase mb-1">{m.label}</p>
                        <div className="flex items-center justify-center gap-2">
                          <div>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{m.reg}</p>
                            <p className="text-[7px] text-slate-400">Reg</p>
                          </div>
                          <div className="w-px h-5 bg-slate-200 dark:bg-slate-600" />
                          <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{m.anon}</p>
                            <p className="text-[7px] text-slate-400">Anon</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Anonymous intent tiers */}
                  {totalTiers > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Anonymous Intent Levels</p>
                      <div className="flex gap-1.5">
                        {[
                          { key: "hot", count: tiers.hot, color: "bg-red-500", label: "Hot" },
                          { key: "warm", count: tiers.warm, color: "bg-orange-400", label: "Warm" },
                          { key: "soft", count: tiers.soft, color: "bg-yellow-400", label: "Soft" },
                          { key: "cold", count: tiers.cold, color: "bg-slate-300 dark:bg-slate-600", label: "Cold" },
                        ].map((t) => (
                          <div key={t.key} className="flex-1 text-center">
                            <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 mb-1">
                              <div className={`h-full rounded-full ${t.color}`} style={{ width: `${totalTiers ? (t.count / totalTiers) * 100 : 0}%` }} />
                            </div>
                            <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{t.count}</p>
                            <p className="text-[7px] text-slate-400">{t.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top search queries */}
                  {topSearchQueries.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Top Searches</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topSearchQueries.slice(0, 6).map((q) => (
                          <span key={q.query} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-[10px] text-slate-600 dark:text-slate-300">
                            <IonIcon icon={searchOutline} className="text-[8px] text-slate-400" />
                            {q.query}
                            <span className="text-[8px] text-slate-400 ml-0.5">({q.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top sources */}
                  {topSources.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Traffic Sources</p>
                      <div className="space-y-1">
                        {topSources.slice(0, 4).map((s) => {
                          const maxCount = topSources[0]?.count || 1;
                          return (
                            <div key={s.source} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-600 dark:text-slate-300 w-16 truncate shrink-0">{s.source}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-400" style={{ width: `${(s.count / maxCount) * 100}%` }} />
                              </div>
                              <span className="text-[9px] text-slate-400 w-6 text-right shrink-0">{s.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            );
          })()}

          {/* ═══ BOOST PERFORMANCE ═══ */}
          {activeSponsorships.length > 0 && (() => {
            const totalImpressions = activeSponsorships.reduce((s, b) => s + (b.impressions ?? 0), 0);
            const totalClicks = activeSponsorships.reduce((s, b) => s + (b.clicks ?? 0), 0);
            const totalSpent = activeSponsorships.reduce((s, b) => s + (b.spentAmount ?? 0), 0);
            const totalBudget = activeSponsorships.reduce((s, b) => s + (b.budgetAmount ?? 0), 0);
            const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
            const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
            const budgetUsedPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

            const boostTypeLabels: Record<string, string> = {
              carousel: "Carousel",
              inline: "Inline",
              top_result: "Top Result",
            };

            return (
              <div className="px-4 mb-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-700 to-orange-700 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <IonIcon icon={megaphoneOutline} className="text-white text-base" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Boost Performance</h3>
                        <p className="text-[9px] text-white/90">
                          {activeSponsorships.length} active boost{activeSponsorships.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" />
                      <span className="text-[8px] font-bold text-white">LIVE</span>
                    </div>
                  </div>

                  {/* Aggregate stats */}
                  <div className="grid grid-cols-4 divide-x divide-slate-100 dark:divide-slate-700 border-b border-slate-100 dark:border-slate-700">
                    {[
                      { label: "Impressions", value: totalImpressions.toLocaleString(), icon: eyeOutline, color: "text-blue-500" },
                      { label: "Clicks", value: totalClicks.toLocaleString(), icon: flashOutline, color: "text-amber-500" },
                      { label: "CTR", value: `${ctr.toFixed(1)}%`, icon: trendingUpOutline, color: "text-emerald-500" },
                      { label: "Avg CPC", value: `₹${cpc.toFixed(1)}`, icon: cashOutline, color: "text-violet-500" },
                    ].map((stat) => (
                      <div key={stat.label} className="py-3 text-center">
                        <IonIcon icon={stat.icon} className={`text-sm ${stat.color}`} />
                        <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{stat.value}</div>
                        <div className="text-[7px] text-slate-400 font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Budget bar */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">Budget Used</span>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-white">
                        ₹{totalSpent.toLocaleString()} / ₹{totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          budgetUsedPct > 80
                            ? "bg-gradient-to-r from-red-400 to-red-500"
                            : budgetUsedPct > 50
                              ? "bg-gradient-to-r from-amber-400 to-orange-500"
                              : "bg-gradient-to-r from-emerald-400 to-teal-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(budgetUsedPct, 1)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">
                      {budgetUsedPct.toFixed(0)}% used · ₹{(totalBudget - totalSpent).toLocaleString()} remaining
                    </div>
                  </div>

                  {/* Per-boost breakdown */}
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Breakdown by Type</div>
                    <div className="space-y-2">
                      {activeSponsorships.map((b) => {
                        const bCtr = b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(1) : "0.0";
                        const bBudgetPct = b.budgetAmount > 0 ? Math.min(100, (b.spentAmount / b.budgetAmount) * 100) : 0;
                        const daysLeft = Math.max(0, Math.ceil((new Date(b.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                        return (
                          <div key={b.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${
                                  b.type === "carousel" ? "bg-blue-500" : b.type === "inline" ? "bg-emerald-500" : "bg-amber-500"
                                }`} />
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                  {boostTypeLabels[b.type] ?? b.type}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400">{daysLeft}d left</span>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] text-slate-500 dark:text-slate-400">
                              <span>{b.impressions.toLocaleString()} imp</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span>{b.clicks} clicks</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span>{bCtr}% CTR</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span>₹{b.spentAmount}/{b.budgetAmount}</span>
                            </div>
                            <div className="mt-1.5 h-1 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  b.type === "carousel" ? "bg-blue-500" : b.type === "inline" ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${Math.max(bBudgetPct, 1)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      ) : (
        /* ═══ LEADS VIEW ═══ */
        <div className="px-4 pt-3 space-y-4">

          {/* Hot Leads CTA */}
          {leadsData && leadsData.data.filter((l) => l.tier === "hot").length > 0 && !leadTier && !showFilters && (
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

          {/* ─── Search + Filter Bar ─── */}
          <div className="space-y-3">
            {/* Search input + Filter toggle */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <IonIcon icon={searchOutline} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search leads by name..."
                  value={leadSearch}
                  onChange={(e) => { setLeadSearch(e.target.value); setLeadPage(1); }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors"
                />
                {leadSearch && (
                  <button
                    onClick={() => { setLeadSearch(""); setLeadPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    <IonIcon icon={closeOutline} className="text-sm text-slate-400" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  showFilters || activeFilterCount > 0
                    ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800"
                    : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                <IonIcon icon={funnelOutline} className="text-sm" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Tier pills row */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {([
                { key: undefined as string | undefined, label: "All" },
                { key: "hot", label: "🔥 Hot" },
                { key: "warm", label: "🟠 Warm" },
                { key: "soft", label: "🟡 Soft" },
                { key: "cold", label: "🔵 Cold" },
              ]).map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setLeadTier(t.key); setLeadPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    leadTier === t.key
                      ? "bg-slate-800 dark:bg-white text-white dark:text-slate-800 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 active:bg-slate-200 dark:active:bg-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Expandable filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-4">
                    {/* Date Range */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                        <IonIcon icon={calendarOutline} className="text-[10px] mr-1" />
                        Date Range
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { key: "all", label: "All Time" },
                          { key: "today", label: "Today" },
                          { key: "7d", label: "7 Days" },
                          { key: "30d", label: "30 Days" },
                          { key: "90d", label: "90 Days" },
                        ]).map((d) => (
                          <button
                            key={d.key}
                            onClick={() => { setLeadDateRange(d.key); setLeadPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                              leadDateRange === d.key
                                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-800"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                        <IonIcon icon={lockOpenOutline} className="text-[10px] mr-1" />
                        Status
                      </p>
                      <div className="flex gap-1.5">
                        {([
                          { key: undefined as "unlocked" | "locked" | undefined, label: "All" },
                          { key: "unlocked" as const, label: "Unlocked" },
                          { key: "locked" as const, label: "Locked" },
                        ]).map((s) => (
                          <button
                            key={s.label}
                            onClick={() => { setLeadStatus(s.key); setLeadPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                              leadStatus === s.key
                                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-800"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Source */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                        <IonIcon icon={navigateOutline} className="text-[10px] mr-1" />
                        Source
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { key: undefined as string | undefined, label: "All" },
                          { key: "search", label: "Search" },
                          { key: "direct", label: "Direct" },
                          { key: "home_feed", label: "Feed" },
                          { key: "explore", label: "Explore" },
                          { key: "saved", label: "Saved" },
                          { key: "chat", label: "Chat" },
                          { key: "product_link", label: "Product Link" },
                        ]).map((s) => (
                          <button
                            key={s.label}
                            onClick={() => { setLeadSource(s.key); setLeadPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                              leadSource === s.key
                                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-800"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                        <IonIcon icon={swapVerticalOutline} className="text-[10px] mr-1" />
                        Sort By
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { key: "score" as const, label: "Score" },
                          { key: "lastSeen" as const, label: "Last Seen" },
                          { key: "firstSeen" as const, label: "First Seen" },
                          { key: "duration" as const, label: "Time Spent" },
                        ]).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => {
                              if (leadSortBy === s.key) {
                                setLeadSortOrder(leadSortOrder === "DESC" ? "ASC" : "DESC");
                              } else {
                                setLeadSortBy(s.key);
                                setLeadSortOrder("DESC");
                              }
                              setLeadPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                              leadSortBy === s.key
                                ? "bg-slate-800 dark:bg-white text-white dark:text-slate-800"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {s.label}
                            {leadSortBy === s.key && (
                              <IonIcon
                                icon={leadSortOrder === "DESC" ? arrowDownOutline : arrowUpOutline}
                                className="text-[9px]"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear all filters */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => {
                          setLeadStatus(undefined);
                          setLeadSource(undefined);
                          setLeadDateRange("all");
                          setLeadSortBy("score");
                          setLeadSortOrder("DESC");
                          setLeadSearch("");
                          setLeadPage(1);
                        }}
                        className="w-full py-2 text-center text-[11px] font-semibold text-red-500 dark:text-red-400 active:opacity-70"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter chips (when panel is closed) */}
            {!showFilters && activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {leadStatus && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {leadStatus === "unlocked" ? "🔓" : "🔒"} {leadStatus}
                    <button onClick={() => { setLeadStatus(undefined); setLeadPage(1); }}>
                      <IonIcon icon={closeOutline} className="text-[10px] text-slate-400" />
                    </button>
                  </span>
                )}
                {leadSource && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    📍 {leadSource.replace("_", " ")}
                    <button onClick={() => { setLeadSource(undefined); setLeadPage(1); }}>
                      <IonIcon icon={closeOutline} className="text-[10px] text-slate-400" />
                    </button>
                  </span>
                )}
                {leadDateRange !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    📅 {leadDateRange}
                    <button onClick={() => { setLeadDateRange("all"); setLeadPage(1); }}>
                      <IonIcon icon={closeOutline} className="text-[10px] text-slate-400" />
                    </button>
                  </span>
                )}
                {leadSortBy !== "score" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    ↕ {leadSortBy === "lastSeen" ? "Last Seen" : leadSortBy === "firstSeen" ? "First Seen" : "Duration"}
                    <button onClick={() => { setLeadSortBy("score"); setLeadSortOrder("DESC"); setLeadPage(1); }}>
                      <IonIcon icon={closeOutline} className="text-[10px] text-slate-400" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          {leadsData && (
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                {leadsData.meta.total} lead{leadsData.meta.total !== 1 ? "s" : ""} found
              </p>
              {leadsData.meta.totalPages > 1 && (
                <p className="text-[10px] text-slate-400">
                  Page {leadsData.meta.page} of {leadsData.meta.totalPages}
                </p>
              )}
            </div>
          )}

          {/* Leads list */}
          {leadsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !leadsData?.data.length ? (
            <div className="text-center py-12">
              <IonIcon icon={activeFilterCount > 0 ? funnelOutline : personOutline} className="text-4xl text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">
                {activeFilterCount > 0 ? "No leads match your filters" : "No leads yet"}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {activeFilterCount > 0
                  ? "Try adjusting or clearing your filters"
                  : "Leads appear when customers interact with your profile"}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setLeadTier(undefined);
                    setLeadStatus(undefined);
                    setLeadSource(undefined);
                    setLeadDateRange("all");
                    setLeadSortBy("score");
                    setLeadSortOrder("DESC");
                    setLeadSearch("");
                    setLeadPage(1);
                  }}
                  className="mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 active:scale-[0.97]"
                >
                  Clear All Filters
                </button>
              )}
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
                          {lead.isUnlocked ? (
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {lead.visitor.name}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <div className="h-3 w-24 rounded-full bg-slate-600/60 dark:bg-slate-500/50 animate-pulse" />
                              <div className="h-3 w-14 rounded-full bg-slate-600/40 dark:bg-slate-500/30 animate-pulse" />
                            </div>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {lead.tier}
                          </span>
                        </div>

                        {/* Contact info for unlocked leads */}
                        {lead.isUnlocked && (lead.visitor.phone || lead.visitor.email) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                            {lead.visitor.phone && (
                              <a href={`tel:${lead.visitor.phone}`} className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <IonIcon icon={callOutline} className="text-[10px]" />
                                {lead.visitor.phone}
                              </a>
                            )}
                            {lead.visitor.email && (
                              <a href={`mailto:${lead.visitor.email}`} className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                <IonIcon icon={mailOutline} className="text-[10px]" />
                                {lead.visitor.email}
                              </a>
                            )}
                            {lead.visitor.city && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <IonIcon icon={locationOutline} className="text-[10px]" />
                                {lead.visitor.city}
                              </span>
                            )}
                          </div>
                        )}

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
