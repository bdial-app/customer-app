"use client";

import { Page } from "konsta/react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { IonIcon } from "@ionic/react";
import { arrowBack } from "ionicons/icons";

export default function EulaPage() {
  const { goBack } = useBackNavigation();

  return (
    <Page className="bg-white dark:bg-slate-900! flex flex-col">
      <div
        className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shrink-0"
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
            EULA
          </h2>
          <div className="w-12" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 py-5 space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pb-20">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Last Updated: June 1, 2026 · Effective Date: June 1, 2026
            </p>
          </div>

          <h3 className="text-base font-black text-slate-800 dark:text-white">
            End User License Agreement
          </h3>

          <h4 className="font-bold text-slate-800 dark:text-white">
            1. Introduction
          </h4>
          <p className="text-xs">
            Welcome to Tijarah ("the App"). This End User License Agreement
            ("Agreement") is a legal agreement between you ("User," "you," or
            "your") and Tijarah Community Commerce ("Company," "we," "us," or
            "our"). By downloading, installing, or using the Tijarah App on any
            device, you agree to be bound by this Agreement. If you do not agree
            to these terms, please do not use the App.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            2. Grant of License
          </h4>
          <p className="text-xs">
            We grant you a limited, non-exclusive, non-transferable, revocable
            license to use the Tijarah App solely for your personal,
            non-commercial use, in accordance with this Agreement. This license
            does not include:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>The right to modify, adapt, translate, or create derivative works based on the App</li>
            <li>The right to reverse engineer, decompile, or disassemble the App</li>
            <li>The right to rent, lease, loan, or lend the App</li>
            <li>The right to remove any proprietary notices or labels</li>
            <li>The right to use the App for commercial purposes without authorization</li>
          </ul>

          <h4 className="font-bold text-slate-800 dark:text-white">
            3. User Eligibility
          </h4>
          <p className="text-xs">
            You must be at least 14 years of age to use the Tijarah App. By
            using the App, you represent and warrant that you are at least 14
            years old, have the legal authority to enter into this Agreement (or
            have parental/guardian consent if under 18), are not prohibited by
            law from using the App, and that all information you provide is
            true, accurate, and complete.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <strong>Note:</strong> Users aged 14–17 should have parental or guardian permission to use the App.
            </p>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            4. User Accounts
          </h4>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">4.1 Account Registration</p>
          <p className="text-xs">
            To access certain features, you may need to create an account. You
            agree to provide accurate and complete information, maintain the
            confidentiality of your login credentials, accept responsibility for
            all activities under your account, and notify us immediately of any
            unauthorized access.
          </p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-2">4.2 Account Termination</p>
          <p className="text-xs">
            We reserve the right to suspend or terminate your account if you
            violate this Agreement, engage in fraudulent or illegal activity,
            violate community guidelines, or we determine it is necessary to
            protect other users or the platform.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            5. User Conduct
          </h4>
          <p className="text-xs">You agree not to use the Tijarah App to:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Engage in harassment, bullying, threats, or abuse</li>
            <li>Post or transmit obscene, defamatory, or hate speech content</li>
            <li>Violate anyone&apos;s intellectual property rights</li>
            <li>Attempt to gain unauthorized access to the App or other accounts</li>
            <li>Distribute viruses, malware, or any malicious code</li>
            <li>Spam, phish, or scam other users</li>
            <li>Impersonate any person or entity</li>
            <li>Engage in any illegal activity</li>
            <li>Interfere with the proper functioning of the App</li>
          </ul>

          <h4 className="font-bold text-slate-800 dark:text-white">
            6. Service Providers &amp; Bookings
          </h4>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200">6.1 Independent Service Providers</p>
          <p className="text-xs">
            Service providers listed on Tijarah are independent. Tijarah does
            not employ or control service providers, is not responsible for
            service quality or delivery, does not guarantee service provider
            performance, and is not liable for disputes between users and service
            providers.
          </p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-2">6.2 Booking Responsibility</p>
          <p className="text-xs">
            When you book a service, you are entering into a direct agreement
            with the service provider. You are responsible for confirming
            details, and Tijarah is not responsible for cancelled, delayed, or
            unfulfilled services.
          </p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-2">6.3 User Reviews &amp; Ratings</p>
          <p className="text-xs">
            Reviews must be truthful and based on actual experience. You agree
            not to post false, defamatory, or misleading reviews. Tijarah
            reserves the right to remove inappropriate reviews.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            7. Payments &amp; In-App Purchases
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">7.1 Payment Processing</p>
              <p>Payments are processed through Razorpay and Apple/Google payment systems. All payments are in Indian Rupees (INR). Prices are subject to change with notice.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200 mt-2">7.2 Subscriptions</p>
              <p>Auto-renewable subscriptions are subject to renewal. You can cancel subscriptions anytime through your device settings. Subscription cancellation does not entitle you to refunds.</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200 mt-2">7.3 Refund Policy</p>
              <p>Refund requests must be submitted within 7 days of purchase. Virtual goods and credits are non-refundable once used.</p>
            </div>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            8. Intellectual Property Rights
          </h4>
          <p className="text-xs">
            The Tijarah App, including all content, code, design, and materials,
            is the exclusive property of Tijarah Community Commerce. All rights
            are reserved. When you post content (reviews, messages, portfolio
            images), you retain ownership of your content but grant Tijarah a
            worldwide, royalty-free, perpetual license to use, display, and
            distribute your content within the platform.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            9. Privacy &amp; Data Protection
          </h4>
          <p className="text-xs">
            Our Privacy Policy governs data collection and use. You consent to
            the collection and use of data as described in the Privacy Policy.
            Location data is used only to show nearby service providers. Your
            personal information is protected according to applicable laws.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            10. Limitations of Liability
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">IMPORTANT</p>
            <p className="text-xs">
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY
              OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, TIJARAH IS
              NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY CLAIM EXCEEDING THE AMOUNT YOU PAID FOR
              THE APP IN THE PAST 12 MONTHS.
            </p>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            11. Indemnification
          </h4>
          <p className="text-xs">
            You agree to indemnify, defend, and hold harmless Tijarah and its
            officers, directors, employees, and agents from any claims, damages,
            or expenses arising from your use of the App, violation of this
            Agreement, violation of any law or third-party rights, or content
            you post or transmit.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            12. Dispute Resolution
          </h4>
          <p className="text-xs">
            This Agreement is governed by the laws of Maharashtra, India. Any
            legal action or proceeding shall be resolved exclusively in the
            courts of Pune, Maharashtra, India.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs space-y-1">
            <p className="font-medium text-slate-700 dark:text-slate-300">Dispute Process:</p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              <li>Contact us at <span className="text-blue-600 dark:text-blue-400">support@tijarah.app</span> with details</li>
              <li>We will attempt to resolve within 30 days</li>
              <li>If unresolved, proceed to legal action</li>
            </ol>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            13. Community Guidelines
          </h4>
          <p className="text-xs">Users agree to be respectful to other community members, maintain professional communication, provide accurate information about services, report inappropriate content or conduct, and support the integrity of the Tijarah community.</p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            14. Verification &amp; Authenticity
          </h4>
          <p className="text-xs">
            Tijarah uses Aadhaar and iJamat verification for community trust.
            Verification is not a guarantee of service quality. Users are
            responsible for verifying service provider credentials. False
            verification information may result in account termination.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            15. Changes to This Agreement
          </h4>
          <p className="text-xs">
            Tijarah reserves the right to modify this Agreement at any time.
            Changes become effective upon posting to the App. Continued use
            constitutes acceptance of modified terms. We will notify you of
            material changes via the App.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            16. Termination
          </h4>
          <p className="text-xs">
            Tijarah may terminate or suspend your access immediately without
            notice if you violate this Agreement, engage in illegal activity, or
            we determine it is necessary for platform security. Upon termination,
            your access is immediately revoked, content may be deleted, and
            liability limitations continue to apply.
          </p>

          <h4 className="font-bold text-slate-800 dark:text-white">
            17. Contact &amp; Support
          </h4>
          <p className="text-xs">
            For questions about this Agreement:
          </p>
          <div className="space-y-1 text-xs">
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Email:</span>{" "}<span className="text-blue-600 dark:text-blue-400">support@tijarah.app</span></p>
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Website:</span>{" "}https://tijarah.app</p>
          </div>

          <h4 className="font-bold text-slate-800 dark:text-white">
            18. Appendix: Additional Terms for India
          </h4>
          <p className="text-xs">This App is designed primarily for users in India. Indian users further agree to comply with:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Information Technology Act, 2000</li>
            <li>Reserve Bank of India guidelines on digital payments</li>
            <li>Consumer Protection Act, 2019</li>
            <li>Data Protection laws applicable in India</li>
          </ul>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold text-center">
              BY DOWNLOADING AND USING THE TIJARAH APP, YOU ACKNOWLEDGE THAT
              YOU HAVE READ THIS AGREEMENT, UNDERSTAND IT, AND AGREE TO BE
              BOUND BY ITS TERMS.
            </p>
          </div>

          <p className="text-xs text-slate-400 pt-2 text-center">
            © 2026 Tijarah Community Commerce. All rights reserved. · v1.0 · June 2026
          </p>
        </div>
      </div>
    </Page>
  );
}
