"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmPayment } from "@/services/payment.service";

export default function DealPaymentReturnPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const sessionId = params.get("session_id");
    const payment = params.get("payment");

    if (payment === "cancelled") {
      router.replace("/?tab=business&subtab=deals");
      return;
    }

    if (sessionId) {
      confirmPayment(sessionId)
        .then(() => {
          setStatus("success");
          setTimeout(() => router.replace("/?tab=business&subtab=deals"), 1500);
        })
        .catch(() => {
          setStatus("error");
          setTimeout(() => router.replace("/?tab=business&subtab=deals"), 2000);
        });
    } else {
      router.replace("/?tab=business&subtab=deals");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 p-6">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Confirming payment...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Deal Created!</h2>
            <p className="text-sm text-slate-500">Redirecting to your deals...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✗</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Something went wrong</h2>
            <p className="text-sm text-slate-500">Redirecting back...</p>
          </>
        )}
      </div>
    </div>
  );
}
