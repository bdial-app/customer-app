"use client";

import { Sheet } from "@/app/components/ui/sheet";
import { useLegalDocument } from "@/hooks/useLegal";
import { LEGAL_FALLBACK } from "@/utils/legal-content";
import LegalMarkdown from "./legal-markdown";

/** A legal document in a sheet, for reading it without leaving a form. */
export default function LegalDocumentSheet({
  slug,
  onClose,
  onOpenDoc,
}: {
  slug: string | null;
  onClose: () => void;
  /** Links to another legal document open it here instead of leaving the page. */
  onOpenDoc: (slug: string) => void;
}) {
  const { data } = useLegalDocument(slug);
  const fallback = LEGAL_FALLBACK.find((d) => d.slug === slug);
  const title = data?.title ?? fallback?.title ?? "";
  const content = data?.content ?? fallback?.content ?? "";
  return (
    <Sheet open={!!slug} onClose={onClose} label={title} zIndex={10060} maxHeight="88dvh" className="bg-white dark:bg-slate-800">
      <div className="px-5 pt-2 pb-8 sm:pt-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
        <LegalMarkdown
          content={content}
          onInternalLink={(href) => {
            const doc = /[?&]doc=([a-z0-9-]+)/.exec(href)?.[1];
            if (doc) onOpenDoc(doc);
          }}
        />
        <button
          onClick={onClose}
          className="mt-6 w-full h-11 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          Done
        </button>
      </div>
    </Sheet>
  );
}
