"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SponsorshipReturn() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get("payment");
    const params = new URLSearchParams();
    params.set("tab", "listings");
    params.set("subTab", "boost");
    if (payment) params.set("payment", payment);
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
}
