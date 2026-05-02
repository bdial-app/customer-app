"use client";

import { Suspense } from "react";
import SearchPageContent from "@/app/components/search/search-page-content";
import FeatureGate from "@/app/components/feature-gate";

export default function SearchPage() {
  return (
    <FeatureGate flag="search_enabled">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-white">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SearchPageContent />
      </Suspense>
    </FeatureGate>
  );
}
