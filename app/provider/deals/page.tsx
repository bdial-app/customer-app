"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function DealPaymentReturnPage() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=business&subtab=deals");
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 p-6">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}
