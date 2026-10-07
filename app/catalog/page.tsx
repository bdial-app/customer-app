"use client";

import { Suspense } from "react";
import CatalogPageContent from "@/app/components/catalog/catalog-page-content";

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CatalogPageContent />
    </Suspense>
  );
}
