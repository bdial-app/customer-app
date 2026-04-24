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
  hot: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  warm: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-400" },
  soft: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  cold: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Lead Detail View ─────────────────────────────────────────────────
function LeadDetailView({ leadId, onBack }: { leadId: string; onBack: () => void }) {
  const { data: detail, isLoading } = useLeadDetail(leadId);

  if (isLoading || !detail) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const badge = TIER_BADGE[detail.tier] || TIER_BADGE.cold;

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
          <IonIcon icon={arrowBack} className="text-lg text-slate-600" />
        </button>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900">{detail.visitor.name}</h3>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.bg} ${badge.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            {detail.tier} · Score {detail.score}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{detail.productsViewed.length}</p>
          <p className="text-[10px] text-slate-400">Products</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{Math.round(detail.totalDuration / 60)}</p>
          <p className="text-[10px] text-slate-400">Minutes</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{detail.actionsPerformed.length}</p>
          <p className="text-[10px] text-slate-400">Actions</p>
        </div>
      </div>

      {detail.products.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Products Viewed</h4>
          <div className="space-y-2">
            {detail.products.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <IonIcon icon={cubeOutline} className="text-slate-400" />
                <span className="text-sm text-slate-700">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Activity Timeline</h4>
        <div className="space-y-3">
          {detail.timeline.slice(0, 20).map((ev, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700">{ev.eventType.replace(/_/g, " ")}</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(ev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {ev.duration ? ` · ${ev.duration}s` : ""}
                </p>
              </div>
            </div>
          ))}
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
      <div className="pb-8 overflow-x-hidden">
        <div
          className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700"
          style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
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
    <div className="pb-8 overflow-x-hidden">

      {/* ═══ HEADER ═══ */}
      <div
        className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
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
            <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
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
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500"
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
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 mb-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-[140px] h-[120px] bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="mb-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={period}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1"
                >
                  {kpis.map((k, i) => (
                    <motion.div
                      key={k.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex-shrink-0 w-[140px] bg-white rounded-2xl p-3.5 border border-slate-100 relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[3px] ${k.bg} rounded-t-2xl`} />
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2.5">
                        <IonIcon icon={k.icon} className={`text-base ${k.accent}`} />
                      </div>
                      <div className="text-[22px] font-black text-slate-800 leading-none tracking-tight">{k.value}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
                      {k.change !== 0 && (
                        <div className={`inline-flex items-center gap-0.5 mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          k.change >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
                        }`}>
                          <IonIcon icon={k.change >= 0 ? arrowUpOutline : arrowDownOutline} className="text-[7px]" />
                          {Math.abs(k.change)}%
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ═══ VIEWS & ENQUIRIES CHART ═══ */}
          {chartData.length > 1 && (
            <div className="px-4 mb-5">
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-800">Views & Enquiries</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Visitor activity over time</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-[9px] text-slate-500">Views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[9px] text-slate-500">Enquiries</span>
                    </div>
                  </div>
                </div>
                <div className="h-[140px] -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="views" stroke="#60a5fa" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
                      <Area type="monotone" dataKey="enquiries" stroke="#34d399" strokeWidth={2} fill="url(#enqGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LEAD FUNNEL ═══ */}
          {summary && (summary.leads.hot + summary.leads.warm + summary.leads.soft + summary.leads.cold) > 0 && (
            <div className="px-4 mb-5">
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IonIcon icon={flameOutline} className="text-lg text-orange-500" />
                    <h3 className="text-[13px] font-bold text-slate-800">Lead Funnel</h3>
                  </div>
                  <button onClick={() => setView("leads")} className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                    View all <IonIcon icon={chevronForwardOutline} className="text-[9px]" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(["hot", "warm", "soft", "cold"] as const).map((tier) => {
                    const total = summary.leads.hot + summary.leads.warm + summary.leads.soft + summary.leads.cold;
                    const pct = total > 0 ? Math.round((summary.leads[tier] / total) * 100) : 0;
                    const colors = { hot: "bg-red-500", warm: "bg-orange-400", soft: "bg-yellow-400", cold: "bg-blue-400" };
                    return (
                      <div key={tier} className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 w-10 capitalize">{tier}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${colors[tier]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 2)}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{summary.leads[tier]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ PEAK HOURS ═══ */}
          {peakHoursData.length > 0 && peakMax > 0 && (
            <div className="px-4 mb-5">
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-800">Peak Activity Hours</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">When your customers visit most</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <IonIcon icon={flashOutline} className="text-amber-600 text-[10px]" />
                    <span className="text-[9px] font-bold text-amber-700">{peakLabel}</span>
                  </div>
                </div>
                <div className="h-[100px] -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peakHoursData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 8, fill: "#94a3b8" }}
                        interval={5}
                      />
                      <YAxis hide />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} maxBarSize={20}>
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
            <div className="px-4 mb-5">
              <div className="bg-white rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <IonIcon icon={cubeOutline} className="text-lg text-teal-500" />
                  <h3 className="text-[13px] font-bold text-slate-800">Top Products</h3>
                </div>
                <div className="space-y-2.5">
                  {topProducts.slice(0, 5).map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300 w-4">#{i + 1}</span>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <IonIcon icon={cubeOutline} className="text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.views} views · {p.uniqueVisitors} visitors</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SMART INSIGHTS ═══ */}
          <div className="mb-5">
            <div className="flex items-center justify-between px-4 mb-2.5">
              <h3 className="text-[13px] font-bold text-slate-800">Smart Insights</h3>
              <IonIcon icon={sparklesOutline} className="text-amber-500 text-sm" />
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
              {[
                {
                  icon: trendingUpOutline,
                  color: "from-blue-500 to-indigo-600",
                  title: "Growth",
                  value: `${(summary?.profileViews.trend ?? 0) >= 0 ? "+" : ""}${summary?.profileViews.trend ?? 0}%`,
                  desc: "Views vs previous period",
                },
                {
                  icon: walletOutline,
                  color: "from-amber-500 to-orange-600",
                  title: "Conversion",
                  value: `${summary?.conversionRate?.toFixed(1) ?? 0}%`,
                  desc: "Views → enquiries/calls",
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
                  desc: `${totalReviews} total reviews`,
                },
              ].map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex-shrink-0 w-[155px] rounded-2xl bg-gradient-to-br ${insight.color} p-3.5 relative overflow-hidden`}
                >
                  <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-white/10" />
                  <IonIcon icon={insight.icon} className="text-white/40 text-lg mb-2" />
                  <div className="text-white font-black text-xl leading-none">{insight.value}</div>
                  <div className="text-white/90 text-[10px] font-bold mt-1">{insight.title}</div>
                  <div className="text-white/50 text-[9px] mt-0.5 leading-snug">{insight.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ═══ ENGAGEMENT STRIP ═══ */}
          <div className="px-4 mb-5">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-4 pt-3.5 pb-2">
                <h3 className="text-[13px] font-bold text-slate-800">Engagement</h3>
              </div>
              <div className="flex divide-x divide-slate-100">
                {[
                  { icon: heartOutline, label: "Saves", value: String(summary?.saves.count ?? 0), color: "text-pink-500" },
                  { icon: shareSocialOutline, label: "Shares", value: String(summary?.shares.count ?? 0), color: "text-blue-500" },
                  { icon: navigateOutline, label: "Directions", value: String(summary?.directions.count ?? 0), color: "text-violet-500" },
                  { icon: callOutline, label: "Calls", value: String(summary?.calls.count ?? 0), color: "text-emerald-500" },
                ].map((e) => (
                  <div key={e.label} className="flex-1 py-3 text-center">
                    <IonIcon icon={e.icon} className={`text-lg ${e.color}`} />
                    <div className="text-base font-bold text-slate-800 mt-0.5">{e.value}</div>
                    <div className="text-[8px] text-slate-400 font-medium">{e.label}</div>
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
                    : "bg-slate-100 text-slate-500 active:bg-slate-200"
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
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
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
                    className="bg-white rounded-2xl p-4 border border-slate-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0 relative">
                        {lead.isUnlocked && lead.visitor.avatar ? (
                          <img src={lead.visitor.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <IonIcon icon={personOutline} className="text-xl text-slate-400" />
                        )}
                        {!lead.isUnlocked && (
                          <div className="absolute inset-0 rounded-full bg-slate-200/60 backdrop-blur-[2px] flex items-center justify-center">
                            <IonIcon icon={lockClosedOutline} className="text-sm text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${lead.isUnlocked ? "text-slate-900" : "text-slate-500"}`}>
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
                        <span className="text-lg font-bold text-slate-800">{lead.score}</span>
                        <p className="text-[9px] text-slate-400 uppercase">Score</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {lead.isUnlocked ? (
                        <button
                          onClick={() => { setSelectedLeadId(lead.id); setView("lead-detail"); }}
                          className="flex-1 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform"
                        >
                          View Details
                        </button>
                      ) : (
                        <button
                          onClick={() => unlockMutation.mutate(lead.id)}
                          disabled={unlockMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
                        >
                          <IonIcon icon={lockOpenOutline} className="text-sm" />
                          {unlockMutation.isPending ? "Unlocking..." : "Unlock Lead"}
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
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                {leadPage} / {leadsData.meta.totalPages}
              </span>
              <button
                disabled={leadPage >= leadsData.meta.totalPages}
                onClick={() => setLeadPage((p) => p + 1)}
                className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AnalyticsContent;
