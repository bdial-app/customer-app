"use client";

import { Page } from "konsta/react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { IonIcon } from "@ionic/react";
import { arrowBack, globeOutline, mailOutline, callOutline, logoWhatsapp } from "ionicons/icons";

export default function AboutUsPage() {
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
            About Us
          </h2>
          <div className="w-12" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 py-5 space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed pb-20">
          {/* Tijarah Hero */}
          <div className="text-center pb-2">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-200/40 dark:shadow-amber-900/30">
              <span className="text-3xl font-black text-white tracking-tight">T</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">
              Tijarah
            </h3>
          </div>

          {/* Tagline */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/15 border border-amber-200/60 dark:border-amber-800/30 rounded-2xl px-4 py-3.5 text-center">
            <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300 italic leading-relaxed">
              Making the community&apos;s entrepreneurial spirit visible, connected, and celebrated.
            </p>
          </div>

          {/* About Tijarah */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Our Story</h4>
            <p className="text-[13px]">
              The Dawoodi Bohra community has always been a community of traders, creators, and entrepreneurs. For centuries, commerce has been woven into our identity &mdash; guided by values of honesty, hard work, and mutual support.
            </p>
            <p className="text-[13px] mt-2">
              But finding Bohra businesses meant relying on WhatsApp forwards, word-of-mouth chains, and personal phone directories. There was no single place to search, browse, and connect with Bohra businesses in your city.
            </p>
            <p className="text-[13px] mt-2 font-medium text-slate-700 dark:text-slate-200">
              Tijarah was built to change that.
            </p>
          </div>

          {/* What Tijarah Does */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">What Tijarah Does</h4>
            <p className="text-[13px] mb-3">
              Tijarah is a community directory app &mdash; a connector between community members who need something and the Bohra business owners who provide it.
            </p>
            <div className="space-y-2">
              {[
                "Browse Bohra-owned businesses across categories: food, rida & fashion, home services, retail, tutoring, events & more",
                "View detailed business profiles with photos, descriptions, contact details & operating hours",
                "Connect directly via a single tap — call or WhatsApp instantly",
                "Read community reviews from fellow Bohra users",
                "Discover verified businesses with confirmed community membership",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="text-[13px]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Our Values */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Our Values</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { icon: "🤝", title: "Trust Above All", desc: "Every feature is filtered through one question: does this make the community trust us more?" },
                { icon: "🕌", title: "Community First", desc: "Built specifically for the Bohra community, shaped by its culture, values, and way of doing business." },
                { icon: "✨", title: "Simplicity", desc: "Simple enough for anyone in the community to use — no training or tutorials needed." },
                { icon: "🔒", title: "Privacy & Respect", desc: "We collect only what is necessary and protect what we hold with the utmost care." },
                { icon: "💛", title: "Free for Community", desc: "Basic listings and discovery will always be free. Built for the community, not to extract value from it." },
              ].map((v, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-3">
                  <span className="text-lg mt-0.5">{v.icon}</span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800 dark:text-white">{v.title}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">How It Works</h4>
            <div className="space-y-2.5">
              <div className="bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30 rounded-xl px-3.5 py-3">
                <p className="text-[12px] font-bold text-blue-700 dark:text-blue-300">For Community Members</p>
                <p className="text-[12px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Browse or search for what you need and connect directly with a Bohra-owned business in one tap. No account required to explore.</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/30 rounded-xl px-3.5 py-3">
                <p className="text-[12px] font-bold text-green-700 dark:text-green-300">For Business Owners</p>
                <p className="text-[12px] text-green-600/80 dark:text-green-400/80 mt-0.5">Create a free listing in minutes — or let us do it for you. Optionally get a &apos;Verified&apos; badge by confirming your community membership.</p>
              </div>
            </div>
          </div>

          {/* Where We Are */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Where We Are</h4>
            <p className="text-[13px]">
              Launched in <strong>Pune</strong> in 2026 — home to one of Maharashtra&apos;s most active Bohra communities.
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5">
              Next: Mumbai · Surat · Hyderabad · Nagpur · Indore
            </p>
          </div>

          {/* Powered by Pronttera */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/80 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-5">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/40">
                <span className="text-xl font-black text-white">P</span>
              </div>
              <h4 className="text-base font-black text-slate-800 dark:text-white">
                Powered by Pronttera
              </h4>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                Technology & Digital Innovation
              </p>
            </div>

            <p className="text-[13px] text-center text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Tijarah is a digital product owned, designed, and developed by <strong className="text-blue-700 dark:text-blue-400">Pronttera</strong> — a technology company focused on building meaningful digital solutions that serve real communities.
            </p>

            {/* Pronttera Contact Links */}
            <div className="space-y-2.5">
              <a
                href="https://www.pronttera.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-800/40 rounded-2xl px-4 py-3 active:bg-blue-50 dark:active:bg-blue-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={globeOutline} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Website</p>
                  <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">www.pronttera.com</p>
                </div>
              </a>

              <a
                href="mailto:info@pronttera.com"
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl px-4 py-3 active:bg-indigo-50 dark:active:bg-indigo-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={mailOutline} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">info@pronttera.com</p>
                </div>
              </a>

              <a
                href="https://wa.me/919834174885"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-green-100 dark:border-green-800/40 rounded-2xl px-4 py-3 active:bg-green-50 dark:active:bg-green-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={logoWhatsapp} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">WhatsApp</p>
                  <p className="text-[13px] font-semibold text-green-600 dark:text-green-400">+91 98341 74885</p>
                </div>
              </a>
            </div>
          </div>

          {/* Tijarah Contact */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Tijarah Support</h4>
            <div className="space-y-2.5">
              <a
                href="mailto:support@tijarahapp.in"
                className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl px-4 py-3 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={mailOutline} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Email Support</p>
                  <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400">support@tijarahapp.in</p>
                </div>
              </a>

              <a
                href="https://wa.me/919834174885"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-2xl px-4 py-3 active:bg-green-100 dark:active:bg-green-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={logoWhatsapp} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">WhatsApp</p>
                  <p className="text-[13px] font-semibold text-green-600 dark:text-green-400">+91 98341 74885</p>
                </div>
              </a>

              <a
                href="tel:+919834174885"
                className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl px-4 py-3 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <IonIcon icon={callOutline} className="text-white text-base" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Call Us</p>
                  <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">+91 98341 74885</p>
                </div>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-2 space-y-1.5">
            <p className="text-[11px] text-slate-400">
              Tijarah · A Pronttera Digital Product
            </p>
            <p className="text-[11px] text-slate-400">
              Pune, Maharashtra, India
            </p>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} Pronttera. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}
