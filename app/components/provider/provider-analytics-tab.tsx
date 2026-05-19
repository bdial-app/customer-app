"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  eyeOutline,
  searchOutline,
  chatbubbleOutline,
  callOutline,
  navigateOutline,
  bookmarkOutline,
  shareOutline,
  trendingUpOutline,
  trendingDownOutline,
  flameOutline,
  timeOutline,
  cubeOutline,
} from "ionicons/icons";
import { useAnalyticsSummary, useTopProducts, usePeakHours } from "@/hooks/useProviderAnalytics";
import { InfoTip } from "../info-tip";
import type { StatWithTrend } from "@/services/analytics.service";

const PERIODS = ["7d", "30d", "90d"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = { "7d": "7 Days", "30d": "30 Days", "90d": "90 Days" };

// ─── Sparkline ──────────────────────────────────────────────────────

function MiniSparkline({ data, color = "#f59e0b" }: { data?: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 64;
  const h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({ icon, label, stat, color }: { icon: string; label: string; stat: StatWithTrend; color: string }) {
  const trend = stat.trend;
  const up = trend >= 0;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-sm border border-gray-100/60 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <IonIcon icon={icon} className="text-base text-white" />
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <MiniSparkline data={stat.sparkline} color={up ? "#22c55e" : "#ef4444"} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count.toLocaleString()}</span>
        {trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-green-500" : "text-red-500"}`}>
            <IonIcon icon={up ? trendingUpOutline : trendingDownOutline} className="text-xs" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Lead Funnel ────────────────────────────────────────────────────

const TIER_COLORS = { hot: "bg-red-500", warm: "bg-orange-400", soft: "bg-yellow-400", cold: "bg-blue-400" };
const TIER_LABELS = { hot: "Hot", warm: "Warm", soft: "Soft", cold: "Cold" };

function LeadFunnel({ leads }: { leads: { hot: number; warm: number; soft: number; cold: number } }) {
  const total = leads.hot + leads.warm + leads.soft + leads.cold;
  if (total === 0) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100/60 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <IonIcon icon={flameOutline} className="text-lg text-orange-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Lead Funnel</h3>
        <InfoTip text="Shows how interested visitors are — Hot means ready to buy, Cold means just browsing" size={12} />
        <span className="ml-auto text-xs text-gray-400">{total} total</span>
      </div>
      <div className="space-y-2">
        {(["hot", "warm", "soft", "cold"] as const).map((tier) => {
          const pct = total > 0 ? Math.round((leads[tier] / total) * 100) : 0;
          return (
            <div key={tier} className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 w-10">{TIER_LABELS[tier]}</span>
              <div className="flex-1 h-5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${TIER_COLORS[tier]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 w-8 text-right">{leads[tier]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Peak Hours ─────────────────────────────────────────────────────

function PeakHoursChart({ hours }: { hours: number[] }) {
  if (!hours || hours.length < 24) return null;
  const max = Math.max(...hours, 1);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100/60 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <IonIcon icon={timeOutline} className="text-lg text-violet-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Peak Hours</h3>
      </div>
      <div className="flex items-end gap-[3px] h-20">
        {hours.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className={`w-full rounded-sm transition-all ${v === max ? "bg-amber-500" : "bg-amber-200"}`}
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
            />
            {i % 6 === 0 && <span className="text-[8px] text-gray-400">{i}h</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Products ───────────────────────────────────────────────────

function TopProductsList({ period }: { period: Period }) {
  const { data: products } = useTopProducts(period);
  if (!products?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100/60 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <IonIcon icon={cubeOutline} className="text-lg text-teal-500" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Products</h3>
      </div>
      <div className="space-y-2.5">
        {products.slice(0, 5).map((p, i) => (
          <div key={p.productId} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
            {p.photoUrl ? (
              <img src={p.photoUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100" loading="lazy" decoding="async" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <IonIcon icon={cubeOutline} className="text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{p.name}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">{p.views} views · {p.uniqueVisitors} visitors</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ProviderAnalyticsTab() {
  const [period, setPeriod] = useState<Period>("7d");
  const { data: summary, isLoading } = useAnalyticsSummary(period);
  const { data: peakHours } = usePeakHours(period);

  if (isLoading || !summary) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Period Selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              period === p
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 active:bg-gray-200"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={eyeOutline} label="Views" stat={summary.profileViews} color="bg-blue-500" />
        <StatCard icon={searchOutline} label="Searches" stat={summary.searchAppearances} color="bg-violet-500" />
        <StatCard icon={chatbubbleOutline} label="Enquiries" stat={summary.enquiries} color="bg-teal-500" />
        <StatCard icon={callOutline} label="Calls" stat={summary.calls} color="bg-amber-500" />
        <StatCard icon={navigateOutline} label="Directions" stat={summary.directions} color="bg-green-500" />
        <StatCard icon={bookmarkOutline} label="Saves" stat={summary.saves} color="bg-pink-500" />
      </div>

      {/* Conversion Rate */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">Conversion Rate</p>
          <InfoTip text="% of people who viewed your profile and then took action (enquired, called, got directions)" size={11} className="text-white/60 mb-1" />
        </div>
        <p className="text-3xl font-bold">{summary.conversionRate.toFixed(1)}%</p>
        <p className="text-[11px] opacity-70 mt-1">Profile views → enquiries/calls</p>
      </div>

      {/* Lead Funnel */}
      <LeadFunnel leads={summary.leads} />

      {/* Peak Hours */}
      {peakHours && <PeakHoursChart hours={peakHours} />}

      {/* Top Products */}
      <TopProductsList period={period} />
    </div>
  );
}
