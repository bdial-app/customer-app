"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  trendingUpOutline,
  star,
  starOutline,
  eyeOutline,
  chatbubbleOutline,
  cubeOutline,
  timeOutline,
  chevronForwardOutline,
  arrowUpOutline,
  arrowDownOutline,
  flashOutline,
  heartOutline,
  shareSocialOutline,
  bookmarkOutline,
  callOutline,
  locationOutline,
  ribbonOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  closeCircleOutline,
  sparklesOutline,
  imageOutline,
  walletOutline,
  megaphoneOutline,
  peopleOutline,
  pulseOutline,
  calendarOutline,
  todayOutline,
  thumbsUpOutline,
  notifications,
  warningOutline,
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
  PieChart,
  Pie,
} from "recharts";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Period = "7d" | "30d" | "90d";

interface KPI {
  label: string;
  value: string;
  sub: string;
  change: number;
  icon: string;
  accent: string;
  bg: string;
}

// â”€â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KPI_DATA: Record<Period, KPI[]> = {
  "7d": [
    { label: "Views", value: "142", sub: "profile visits", change: 12.5, icon: eyeOutline, accent: "text-blue-600", bg: "bg-blue-500" },
    { label: "Enquiries", value: "23", sub: "new leads", change: 8.3, icon: callOutline, accent: "text-emerald-600", bg: "bg-emerald-500" },
    { label: "Rating", value: "4.6", sub: "avg stars", change: 0.2, icon: star, accent: "text-amber-600", bg: "bg-amber-500" },
    { label: "Reviews", value: "7", sub: "new this week", change: -14.3, icon: chatbubbleOutline, accent: "text-violet-600", bg: "bg-violet-500" },
  ],
  "30d": [
    { label: "Views", value: "580", sub: "profile visits", change: 18.2, icon: eyeOutline, accent: "text-blue-600", bg: "bg-blue-500" },
    { label: "Enquiries", value: "89", sub: "new leads", change: 22.1, icon: callOutline, accent: "text-emerald-600", bg: "bg-emerald-500" },
    { label: "Rating", value: "4.5", sub: "avg stars", change: -0.1, icon: star, accent: "text-amber-600", bg: "bg-amber-500" },
    { label: "Reviews", value: "24", sub: "this month", change: 33.3, icon: chatbubbleOutline, accent: "text-violet-600", bg: "bg-violet-500" },
  ],
  "90d": [
    { label: "Views", value: "1.8K", sub: "profile visits", change: 24.7, icon: eyeOutline, accent: "text-blue-600", bg: "bg-blue-500" },
    { label: "Enquiries", value: "246", sub: "total leads", change: 15.8, icon: callOutline, accent: "text-emerald-600", bg: "bg-emerald-500" },
    { label: "Rating", value: "4.5", sub: "avg stars", change: 0.3, icon: star, accent: "text-amber-600", bg: "bg-amber-500" },
    { label: "Reviews", value: "68", sub: "total reviews", change: 41.6, icon: chatbubbleOutline, accent: "text-violet-600", bg: "bg-violet-500" },
  ],
};

const VIEWS_DATA: Record<Period, { name: string; views: number; enquiries: number }[]> = {
  "7d": [
    { name: "Mon", views: 18, enquiries: 3 }, { name: "Tue", views: 24, enquiries: 5 },
    { name: "Wed", views: 16, enquiries: 2 }, { name: "Thu", views: 22, enquiries: 4 },
    { name: "Fri", views: 28, enquiries: 6 }, { name: "Sat", views: 19, enquiries: 3 },
    { name: "Sun", views: 15, enquiries: 2 },
  ],
  "30d": [
    { name: "W1", views: 120, enquiries: 18 }, { name: "W2", views: 148, enquiries: 22 },
    { name: "W3", views: 135, enquiries: 25 }, { name: "W4", views: 177, enquiries: 24 },
  ],
  "90d": [
    { name: "Jan", views: 420, enquiries: 65 }, { name: "Feb", views: 520, enquiries: 78 },
    { name: "Mar", views: 680, enquiries: 103 },
  ],
};

const RATING_DIST = [
  { stars: 5, count: 64, pct: 48 },
  { stars: 4, count: 38, pct: 28 },
  { stars: 3, count: 18, pct: 13 },
  { stars: 2, count: 9, pct: 7 },
  { stars: 1, count: 5, pct: 4 },
];

const HOURLY_DATA = [
  { hour: "6a", val: 4 }, { hour: "8a", val: 8 }, { hour: "10a", val: 14 },
  { hour: "12p", val: 18 }, { hour: "2p", val: 22 }, { hour: "4p", val: 28 },
  { hour: "6p", val: 35 }, { hour: "8p", val: 30 }, { hour: "10p", val: 15 },
];

const CATEGORY_DATA = [
  { name: "Mehendi", value: 42, fill: "#f59e0b" },
  { name: "Tailoring", value: 28, fill: "#8b5cf6" },
  { name: "Catering", value: 18, fill: "#10b981" },
  { name: "Other", value: 12, fill: "#94a3b8" },
];

const LISTINGS = [
  { id: "1", name: "Mehendi & Henna Art", status: "live" as const, views: 245, enquiries: 34, rating: 4.7, products: 8, trend: 18 },
  { id: "2", name: "Tailoring & Alterations", status: "live" as const, views: 182, enquiries: 22, rating: 4.4, products: 12, trend: -5 },
  { id: "3", name: "Catering Services", status: "pending" as const, views: 0, enquiries: 0, rating: 0, products: 5, trend: 0 },
];

const RECENT_REVIEWS = [
  { id: "1", name: "Fatima B.", rating: 5, text: "Amazing henna work! Intricate and beautiful designs.", time: "2h ago", listing: "Mehendi & Henna" },
  { id: "2", name: "Aisha K.", rating: 4, text: "Good quality tailoring. Delivered on time as promised.", time: "1d ago", listing: "Tailoring" },
  { id: "3", name: "Maryam S.", rating: 5, text: "Best caterer in the area. Absolutely delicious food!", time: "3d ago", listing: "Catering" },
];

const GROWTH_TIPS = [
  { icon: imageOutline, title: "Add 3 more photos", desc: "Listings with 5+ photos get 3Ã— more views", priority: "high" as const },
  { icon: cubeOutline, title: "Complete your catalog", desc: "3 products missing descriptions", priority: "medium" as const },
  { icon: chatbubbleOutline, title: "Reply to 2 reviews", desc: "Responding boosts trust & ranking", priority: "high" as const },
  { icon: megaphoneOutline, title: "Share your listing", desc: "Get 20% more reach with social sharing", priority: "low" as const },
];

// â”€â”€â”€ Custom Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AnalyticsContent = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const kpis = KPI_DATA[period];
  const chartData = VIEWS_DATA[period];

  const totalReviews = RATING_DIST.reduce((s, r) => s + r.count, 0);
  const avgRating = RATING_DIST.reduce((s, r) => s + r.stars * r.count, 0) / totalReviews;
  const liveListings = LISTINGS.filter((l) => l.status === "live").length;
  const pendingListings = LISTINGS.filter((l) => l.status === "pending").length;

  return (
    <div className="pb-8 overflow-x-hidden">

      {/* Analytics header */}
      <div
        className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700"
        style={{ paddingTop: "max(env(safe-area-inset-top), 8px)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Analytics</h1>
            <p className="text-[11px] text-white/50">Performance &amp; insights</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold">Live</span>
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HERO SCORE CARD
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="mx-4 mt-3 mb-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[20px] p-5 relative overflow-hidden">
          {/* Abstract bg shapes */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-amber-500/10 blur-xl" />
          <div className="absolute left-1/2 -bottom-12 w-40 h-40 rounded-full bg-blue-500/8 blur-2xl" />

          <div className="relative z-10">
            {/* Top row */}
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
              <div className="flex items-center gap-1.5 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-bold">Active</span>
              </div>
            </div>

            {/* Score + summary */}
            <div className="flex items-center gap-4 mb-4">
              {/* Circular score */}
              <div className="relative w-[72px] h-[72px] flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                  <motion.circle
                    cx="36" cy="36" r="30" fill="none"
                    stroke="url(#heroGrad)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${0.82 * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                    animate={{ strokeDashoffset: (1 - 0.82) * 2 * Math.PI * 30 }}
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
                  <span className="text-white font-black text-xl leading-none">82</span>
                  <span className="text-white/40 text-[8px] font-medium">SCORE</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                  <div className="text-white font-bold text-base">{LISTINGS.length}</div>
                  <div className="text-white/40 text-[9px]">Listings</div>
                </div>
                <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                  <div className="text-emerald-400 font-bold text-base">{liveListings}</div>
                  <div className="text-white/40 text-[9px]">Live</div>
                </div>
                <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                  <div className="text-amber-400 font-bold text-base">{totalReviews}</div>
                  <div className="text-white/40 text-[9px]">Reviews</div>
                </div>
                <div className="bg-white/[0.06] rounded-xl px-3 py-2">
                  <div className="text-blue-400 font-bold text-base">89</div>
                  <div className="text-white/40 text-[9px]">Bookmarks</div>
                </div>
              </div>
            </div>

            {/* Bottom insight */}
            <div className="bg-white/[0.06] rounded-xl px-3 py-2 flex items-center gap-2">
              <IonIcon icon={trendingUpOutline} className="text-emerald-400 text-sm" />
              <span className="text-white/70 text-[11px]">
                You're outperforming <span className="text-amber-400 font-bold">82%</span> of providers in your area
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PERIOD SELECTOR
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          KPI CARDS (horizontal scroll)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] ${k.bg} rounded-t-2xl`} />
                <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mb-2.5`}>
                  <IonIcon icon={k.icon} className={`text-base ${k.accent}`} />
                </div>
                <div className="text-[22px] font-black text-slate-800 leading-none tracking-tight">{k.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
                <div className={`inline-flex items-center gap-0.5 mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  k.change >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
                }`}>
                  <IonIcon icon={k.change >= 0 ? arrowUpOutline : arrowDownOutline} className="text-[7px]" />
                  {Math.abs(k.change)}%
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          VIEWS & ENQUIRIES CHART
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PEAK HOURS BAR CHART
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="px-4 mb-5">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">Peak Activity Hours</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">When your customers visit most</p>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
              <IonIcon icon={flashOutline} className="text-amber-600 text-[10px]" />
              <span className="text-[9px] font-bold text-amber-700">6â€“8 PM</span>
            </div>
          </div>
          <div className="h-[100px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#94a3b8" }} />
                <YAxis hide />
                <Bar dataKey="val" radius={[4, 4, 0, 0]} maxBarSize={20}>
                  {HOURLY_DATA.map((entry, idx) => (
                    <Cell key={idx} fill={entry.val >= 28 ? "#f59e0b" : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          RATING BREAKDOWN + CATEGORY SPLIT (side by side)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="px-4 mb-5 flex gap-3">
        {/* Rating card */}
        <div className="flex-1 bg-white rounded-2xl p-3.5 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-2.5">
            <IonIcon icon={star} className="text-amber-400 text-sm" />
            <span className="text-lg font-black text-slate-800">{avgRating.toFixed(1)}</span>
            <span className="text-[9px] text-slate-400 ml-auto">({totalReviews})</span>
          </div>
          <div className="space-y-1.5">
            {RATING_DIST.map((r) => (
              <div key={r.stars} className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-500 w-2.5">{r.stars}</span>
                <div className="flex-1 h-[6px] bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${r.pct}%` }}
                    transition={{ duration: 0.8, delay: (5 - r.stars) * 0.08 }}
                    className={`h-full rounded-full ${
                      r.stars >= 4 ? "bg-emerald-400" : r.stars === 3 ? "bg-amber-400" : "bg-red-400"
                    }`}
                  />
                </div>
                <span className="text-[8px] text-slate-400 w-5 text-right">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category split */}
        <div className="w-[140px] bg-white rounded-2xl p-3.5 border border-slate-100">
          <div className="text-[11px] font-bold text-slate-800 mb-1.5">By Category</div>
          <div className="flex justify-center">
            <PieChart width={80} height={80}>
              <Pie
                data={CATEGORY_DATA}
                cx={40} cy={40}
                innerRadius={22} outerRadius={36}
                dataKey="value"
                strokeWidth={0}
              />
            </PieChart>
          </div>
          <div className="space-y-1 mt-1.5">
            {CATEGORY_DATA.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.fill }} />
                <span className="text-[8px] text-slate-600 truncate">{c.name}</span>
                <span className="text-[8px] text-slate-400 ml-auto">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SMART INSIGHTS (horizontal cards)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-2.5">
          <h3 className="text-[13px] font-bold text-slate-800">Smart Insights</h3>
          <IonIcon icon={sparklesOutline} className="text-amber-500 text-sm" />
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
          {[
            { icon: trendingUpOutline, color: "from-blue-500 to-indigo-600", title: "Growth Trend", value: "+18%", desc: "Views up compared to last period" },
            { icon: locationOutline, color: "from-emerald-500 to-teal-600", title: "Local Reach", value: "72%", desc: "Visitors from your city" },
            { icon: peopleOutline, color: "from-violet-500 to-purple-600", title: "Returning", value: "38%", desc: "Customers visited 2+ times" },
            { icon: walletOutline, color: "from-amber-500 to-orange-600", title: "Conversion", value: "16%", desc: "Views that became enquiries" },
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ENGAGEMENT STRIP
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="px-4 mb-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 pt-3.5 pb-2">
            <h3 className="text-[13px] font-bold text-slate-800">Engagement</h3>
          </div>
          <div className="flex divide-x divide-slate-100">
            {[
              { icon: heartOutline, label: "Saves", value: "89", color: "text-pink-500" },
              { icon: shareSocialOutline, label: "Shares", value: "34", color: "text-blue-500" },
              { icon: bookmarkOutline, label: "Bookmarks", value: "56", color: "text-violet-500" },
              { icon: thumbsUpOutline, label: "Recommends", value: "42", color: "text-emerald-500" },
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MY LISTINGS
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-bold text-slate-800">Listing Performance</h3>
          <button className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
            Manage <IonIcon icon={chevronForwardOutline} className="text-[9px]" />
          </button>
        </div>
        <div className="space-y-2.5">
          {LISTINGS.map((l, i) => {
            const statusCfg = {
              live: { label: "Live", cls: "text-emerald-700 bg-emerald-50", icon: checkmarkCircleOutline },
              pending: { label: "Pending", cls: "text-amber-700 bg-amber-50", icon: hourglassOutline },
              rejected: { label: "Rejected", cls: "text-red-700 bg-red-50", icon: closeCircleOutline },
              inactive: { label: "Inactive", cls: "text-slate-600 bg-slate-50", icon: alertCircleOutline },
            }[l.status];

            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-3.5 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[13px] font-bold text-slate-800 truncate flex-1 mr-2">{l.name}</div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${statusCfg.cls}`}>
                    <IonIcon icon={statusCfg.icon} className="text-[9px]" />
                    {statusCfg.label}
                  </span>
                </div>
                {l.status === "live" && (
                  <div className="flex items-center gap-1">
                    <div className="flex-1 bg-slate-50 rounded-lg px-2.5 py-1.5 text-center">
                      <div className="text-[13px] font-bold text-slate-800">{l.views}</div>
                      <div className="text-[8px] text-slate-400">Views</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-2.5 py-1.5 text-center">
                      <div className="text-[13px] font-bold text-slate-800">{l.enquiries}</div>
                      <div className="text-[8px] text-slate-400">Enquiries</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-2.5 py-1.5 text-center">
                      <div className="text-[13px] font-bold text-amber-600 flex items-center justify-center gap-0.5">
                        <IonIcon icon={star} className="text-[10px] text-amber-400" />
                        {l.rating}
                      </div>
                      <div className="text-[8px] text-slate-400">Rating</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-2.5 py-1.5 text-center">
                      <div className={`text-[13px] font-bold flex items-center justify-center gap-0.5 ${l.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        <IonIcon icon={l.trend >= 0 ? arrowUpOutline : arrowDownOutline} className="text-[8px]" />
                        {Math.abs(l.trend)}%
                      </div>
                      <div className="text-[8px] text-slate-400">Trend</div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsContent;
