"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/utils/axios";

export default function SponsorshipReturn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    const finish = () => {
      const params = new URLSearchParams();
      params.set("tab", "listings");
      params.set("subTab", "boost");
      if (payment) params.set("payment", payment);
      router.replace(`/?${params.toString()}`);
    };

    if (payment === "success" && sessionId) {
      apiClient
        .get("/payments/confirm", { params: { session_id: sessionId } })
        .catch(() => {})
        .finally(finish);
    } else {
      finish();
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-slate-500 mr-3">Confirming payment…</p>
      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}
