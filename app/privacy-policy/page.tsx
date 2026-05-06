"use client";

import { Page } from "konsta/react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";

export default function PrivacyPolicyPage() {
  const { goBack } = useBackNavigation();

  return (
    <Page className="bg-white dark:bg-slate-900!">
      <div
        className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800"
        style={{ paddingTop: "max(var(--sat,0px), 8px)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => goBack("/")}
            className="text-blue-500 font-semibold text-sm active:opacity-50 flex items-center gap-1"
          >
            <IonIcon icon={arrowBack} className="text-lg" />
            Back
          </button>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">
            Privacy Policy
          </h2>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pb-20">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Effective Date: 1 May 2026 · Last Updated: April 2026
          </p>
        </div>

        <p>
          Tijarah (BohriConnect) connects users with Bohra-owned businesses
          across food, fashion, retail, and local services. This Privacy
          Policy explains what personal information we collect, how we use it,
          and your rights over it.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">
          1. Information We Collect
        </h4>
        <p className="font-medium text-slate-700">A. Information You Provide</p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>Name</strong> — optional, to personalise your experience</li>
          <li><strong>Phone number</strong> — for account login and in-app contact</li>
          <li><strong>Email</strong> — optional, for account recovery</li>
          <li><strong>Profile photo</strong> — optional, displayed on reviews</li>
          <li><strong>Business details</strong> — if you register a listing</li>
          <li><strong>Reviews & ratings</strong> — content you write</li>
          <li><strong>Reports</strong> — details you submit when reporting content</li>
        </ul>
        <p className="font-medium text-slate-700 mt-2">
          B. Identity Documents (Optional — Business Owners Only)
        </p>
        <p className="text-xs">
          To receive the 'Verified' badge, business owners may voluntarily
          submit an Aadhaar Card, PAN Card, or Ejmaat Card. Submission is
          entirely optional. These documents are stored in an encrypted,
          access-controlled Supabase Storage bucket separate from all other
          app data, accessible only to authorised Tijarah administrators, and
          are never shared with other users or third parties.
        </p>
        <p className="font-medium text-slate-700 mt-2">C. Automatically Collected</p>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>Location</strong> — only if you grant permission</li>
          <li><strong>Device info</strong> — type, OS version, app version</li>
          <li><strong>Usage data</strong> — features used, search terms, interactions</li>
          <li><strong>Crash reports</strong> — anonymous technical data</li>
        </ul>

        <h4 className="font-bold text-slate-800 dark:text-white">
          2. How We Use Your Information
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li>Create and manage your account</li>
          <li>Display and operate Bohra business listings</li>
          <li>Enable search, filtering, and nearby discovery</li>
          <li>Power in-app chat and call features</li>
          <li>Display community reviews and business posts</li>
          <li>Review identity documents for the Verified badge</li>
          <li>Send app notifications (with your permission)</li>
          <li>Detect and respond to reports of inappropriate content</li>
          <li>Fix technical bugs and improve performance</li>
        </ul>
        <p className="text-xs italic">
          We do not use your information for advertising targeting or sale to
          any third party.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">
          3. Data Storage — Supabase
        </h4>
        <p className="text-xs">
          All data in transit is encrypted via HTTPS/TLS. Data at rest —
          including identity documents — is encrypted by Supabase. Identity
          documents are stored in a restricted, separately scoped Supabase
          Storage bucket. Supabase is hosted on AWS infrastructure and is
          GDPR-compliant.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">
          4. How We Share Your Information
        </h4>
        <p className="text-xs">
          We do not sell, rent, or trade your personal data. Information is
          shared only in these limited circumstances: when you initiate
          contact with a business through the app, with trusted third-party
          service providers (Supabase, Apple, Google) under confidentiality
          obligations, and where required by law.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">
          5. Your Rights
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Access", "Request a summary of your data"],
            ["Correction", "Update your info in the app"],
            ["Deletion", "Delete account + data within 30 days"],
            ["Document Withdrawal", "Remove identity docs anytime"],
            ["Location Withdrawal", "Revoke via device Settings"],
            ["Data Portability", "Request a copy of your data"],
          ].map(([right, desc]) => (
            <div
              key={right}
              className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5"
            >
              <p className="font-semibold text-slate-800 dark:text-white">{right}</p>
              <p className="text-slate-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        <h4 className="font-bold text-slate-800 dark:text-white">
          6. Children's Privacy
        </h4>
        <p className="text-xs">
          Tijarah is not intended for users under 13. We do not knowingly
          collect data from children. If you believe a child under 13 has
          submitted information, contact us immediately.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">
          7. Data Retention
        </h4>
        <p className="text-xs">
          Account data is retained while your account is active. Identity
          documents are deleted within 30 days of a written request. You may
          request full account and data deletion at any time.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">
          8. Changes to This Policy
        </h4>
        <p className="text-xs">
          We will notify you of material changes via in-app notification and
          update the 'Last Updated' date. Continued use after changes
          constitutes acceptance.
        </p>

        <h4 className="font-bold text-slate-800 dark:text-white">9. Contact</h4>
        <p>
          Privacy enquiries:{" "}
          <span className="text-blue-600 font-medium">privacy@tijarah.app</span>
        </p>

        <p className="text-xs text-slate-400 pt-2 text-center">
          © 2026 Tijarah (BohriConnect). All rights reserved. · v2.0 · May 2026
        </p>
      </div>
    </Page>
  );
}
