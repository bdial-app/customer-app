"use client";

import { Suspense } from "react";
import DealsPageContent from "@/app/components/deals/deals-page-content";

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DealsPageContent />
    </Suspense>
  );
}
