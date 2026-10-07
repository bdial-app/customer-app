"use client";

import { Suspense } from "react";
import SellerCatalogueContent from "@/app/components/shop/seller-catalogue-content";

/** One business's whole catalogue (/shop/?id=<provider id>) — where shared /c/<id> links open. */
export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white dark:bg-slate-900">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SellerCatalogueContent />
    </Suspense>
  );
}
