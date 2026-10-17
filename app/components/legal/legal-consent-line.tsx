"use client";

import { useState } from "react";
import LegalDocumentSheet from "./legal-document-sheet";

/**
 * "By continuing you agree to our Terms of Use and Privacy Policy", with
 * both opening in a sheet so nobody loses their place while signing in.
 * (The tick itself is asked for right after sign-in, by LegalGate.)
 */
export default function LegalConsentLine({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  const [doc, setDoc] = useState<string | null>(null);
  const link = (slug: string, label: string) => (
    <button type="button" onClick={() => setDoc(slug)} className={linkClassName ?? "underline underline-offset-2 font-medium"}>
      {label}
    </button>
  );
  return (
    <>
      <p className={className}>
        By continuing you agree to our {link("terms", "Terms of Use")} and {link("privacy", "Privacy Policy")}
      </p>
      <LegalDocumentSheet slug={doc} onClose={() => setDoc(null)} onOpenDoc={setDoc} />
    </>
  );
}
