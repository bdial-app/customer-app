"use client";

import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import type { FeatureFlags } from "@/services/feature-flags.service";

interface FeatureGateProps {
  flag: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh] p-8">
    <div className="text-center max-w-sm">
      {/* Abstract icon */}
      <div className="relative mx-auto w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-xl bg-slate-100 dark:bg-slate-800 rotate-3" />
        <div className="absolute inset-0 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200/60 dark:border-slate-600/40 flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
        Feature Unavailable
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
        This feature is temporarily disabled. Our team is working on it and it will be available again soon.
      </p>
    </div>
  </div>
);

export default function FeatureGate({ flag, children, fallback }: FeatureGateProps) {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) return <>{children}</>;

  const value = flags?.[flag];
  if (value === false) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  return <>{children}</>;
}
