"use client";

import { Page } from "konsta/react";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useLegalDocument } from "@/hooks/useLegal";
import { LEGAL_FALLBACK } from "@/utils/legal-content";
import LegalMarkdown from "./legal-markdown";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/**
 * A legal document as a full page. The live, published version comes from
 * the API; until it arrives (or if it can't), the copy bundled with the app
 * is shown, so the page is never empty.
 */
export default function LegalDocumentScreen({ slug }: { slug: string }) {
  const { goBack } = useBackNavigation();
  const { data, isError, isLoading } = useLegalDocument(slug);
  const fallback = LEGAL_FALLBACK.find((d) => d.slug === slug);
  const title = data?.title ?? fallback?.title ?? "Legal";
  const content = data?.content ?? fallback?.content ?? null;

  return (
    <Page className="bg-white dark:bg-slate-900! flex flex-col">
      <div
        className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shrink-0"
        style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <button
            onClick={() => goBack("/")}
            className="text-blue-500 font-semibold text-sm active:opacity-50 flex items-center gap-1 shrink-0"
          >
            <IonIcon icon={arrowBack} className="text-lg" />
            Back
          </button>
          <h2 className="text-base font-bold text-slate-800 dark:text-white truncate">{title}</h2>
          <div className="w-12 shrink-0" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 py-5 pb-20 max-w-2xl mx-auto">
          {content ? (
            <>
              <LegalMarkdown content={content} />
              <p className="text-xs text-slate-400 pt-8 text-center">
                {data
                  ? `Version ${data.version} · Published ${formatDate(data.publishedAt)}`
                  : "Tijarah · Pronttera"}
              </p>
            </>
          ) : isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[80, 95, 60, 90, 70].map((w, i) => (
                <div key={i} className="h-3 rounded-full bg-slate-100 dark:bg-slate-800" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-slate-500 text-center pt-10">
              We couldn&apos;t load this document. Check your connection and try again.
            </p>
          ) : null}
        </div>
      </div>
    </Page>
  );
}
