"use client";

import { useMaintenanceMode } from "@/hooks/useFeatureFlags";

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { isMaintenanceMode, maintenanceMessage, isLoading } = useMaintenanceMode();

  if (isLoading) return <>{children}</>;

  if (isMaintenanceMode) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-100/40 dark:bg-amber-900/10 blur-3xl" />
          <div className="absolute -bottom-48 -left-24 w-[30rem] h-[30rem] rounded-full bg-slate-200/50 dark:bg-slate-700/20 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-amber-50/60 dark:bg-amber-950/10 blur-2xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="relative z-10 text-center max-w-md px-8">
          {/* Abstract icon */}
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 dark:from-amber-400/10 dark:to-amber-600/10 rotate-6" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-700 shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20 flex items-center justify-center">
              <svg className="w-9 h-9 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
            Scheduled Maintenance
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed mb-6">
            {maintenanceMessage}
          </p>

          {/* Divider */}
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent mx-auto mb-6" />

          {/* Status info */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Maintenance in progress
              </span>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
              Our team is working to improve your experience. The app will be back shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
