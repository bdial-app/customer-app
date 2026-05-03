"use client";

import { Suspense } from "react";
import WomenLedPageContent from "@/app/components/women-led/women-led-page-content";

export default function WomenLedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WomenLedPageContent />
    </Suspense>
  );
}
