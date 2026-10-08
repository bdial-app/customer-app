"use client";

import { Suspense } from "react";
import CollectionPageContent from "@/app/components/home/collection-page-content";

export default function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CollectionPageContent />
    </Suspense>
  );
}
