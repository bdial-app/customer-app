"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LegalDocumentScreen from "@/app/components/legal/legal-document-screen";

/** Any legal document: /legal?doc=terms, /legal?doc=business-terms… */
function LegalPageContent() {
  const slug = useSearchParams().get("doc") || "terms";
  return <LegalDocumentScreen key={slug} slug={slug} />;
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-900" />}>
      <LegalPageContent />
    </Suspense>
  );
}
