"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { IonIcon } from "@ionic/react";
import { arrowBack, arrowForward, compass, storefront } from "ionicons/icons";
import { hasSeenWelcomeTour, markWelcomeTourSeen, subscribeWelcomeTour } from "@/utils/welcome-tour";
import { FindVisual, TrustVisual, ConnectVisual } from "./tour-visuals";
import {
  ClosedCircleVisual, AlwaysOpenVisual, AnswersVisual, VouchVisual,
  EnquiryVisual, LeversVisual,
} from "./business-visuals";

type Track = "customer" | "business";

interface Slide {
  title: string;
  body: string;
  visual: React.ReactNode;
}

const CUSTOMER_SLIDES: Slide[] = [
  {
    title: "Find it close to home",
    body:
      "Search for what you need — tiffin, mehndi, rida, tuitions, repairs — or browse by category. " +
      "Every listing shows how far away it is, so you can start with the nearest one.",
    visual: <FindVisual />,
  },
  {
    title: "Know who you're dealing with",
    body:
      "A green tick means we have confirmed the owner is from the community. Reviews come from other " +
      "members, and businesses run by women carry their own mark.",
    visual: <TrustVisual />,
  },
  {
    title: "One tap to reach them",
    body:
      "Call, message on WhatsApp, or get directions straight from the listing. No forms, no middleman, " +
      "and no account needed just to look around.",
    visual: <ConnectVisual />,
  },
];

const BUSINESS_SLIDES: Slide[] = [
  {
    title: "Right now, you travel by forward",
    body:
      "Your number reaches as far as the group it was posted in, then stops. Someone two lanes away who " +
      "wants exactly what you make has no way to find you — they ask in their own group instead.",
    visual: <ClosedCircleVisual />,
  },
  {
    title: "Your shop stays open while you sleep",
    body:
      "Once you are listed, people searching at midnight, on a festival day, or while you are cooking " +
      "still find you. You are being found on days you did nothing at all.",
    visual: <AlwaysOpenVisual />,
  },
  {
    title: "Answer the same questions once",
    body:
      "What do you make, how much, where are you, are you open? Photos, a price on every item, your map " +
      "and your timings answer all four before anyone messages. Fewer time-wasting chats, more real orders.",
    visual: <AnswersVisual />,
  },
  {
    title: "Give a stranger a reason to try you",
    body:
      "This is the hard part of any first order. The green tick says we have checked you are from the " +
      "community, and your reviews come from people they know. That is what turns a look into an order.",
    visual: <VouchVisual />,
  },
  {
    title: "Interest you can actually act on",
    body:
      "Every enquiry lands in your dashboard instead of getting lost in a group, and people reach you on " +
      "WhatsApp or a call — where you already are. There is nothing new to learn.",
    visual: <EnquiryVisual />,
  },
  {
    title: "Two levers for a quiet week",
    body:
      "Run an offer before a festival and it shows in the Deals tab, free. Boost your listing to sit at " +
      "the top when you want to reach further than your own street. Both are your choice, never required.",
    visual: <LeversVisual />,
  },
];

/**
 * A short, skippable introduction for anyone opening Tijarah for the first
 * time, in two tracks: someone looking for a business, and someone who runs
 * one. It explains what the app is before asking for anything.
 *
 * Deliberately never shown over a deep link — somebody who followed a link to
 * a specific shop wants that shop, not a tour.
 */
export default function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const router = useRouter();
  const pathname = usePathname();

  // Decided after mount: storage is not readable while rendering on the server.
  useEffect(() => {
    const decide = () => setOpen(!hasSeenWelcomeTour() && pathname === "/");
    decide();
    return subscribeWelcomeTour(decide);
  }, [pathname]);

  const finish = useCallback(
    (next?: string) => {
      markWelcomeTourSeen();
      setOpen(false);
      if (next) router.push(next);
    },
    [router],
  );

  const slides = track === "business" ? BUSINESS_SLIDES : CUSTOMER_SLIDES;
  const isLast = index === slides.length - 1;

  const go = (delta: number) => {
    setDirection(delta);
    setIndex((i) => Math.min(Math.max(i + delta, 0), slides.length - 1));
  };

  const back = () => {
    if (index === 0) { setTrack(null); return; }
    go(-1);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex flex-col bg-white dark:bg-slate-900"
        style={{
          paddingTop: "max(var(--sat,0px), 16px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
        }}
      >
        {track === null ? (
          <TrackChooser onPick={(t) => { setTrack(t); setIndex(0); setDirection(1); }} onSkip={() => finish()} />
        ) : (
          <>
            {/* Progress and escape hatches */}
            <div className="flex items-center gap-3 px-5 pb-3">
              <button onClick={back} aria-label="Back" className="w-8 h-8 -ml-1 flex items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                <IonIcon icon={arrowBack} className="text-slate-500 dark:text-slate-400 text-lg" />
              </button>
              <div className="flex-1 flex gap-1.5">
                {slides.map((s, i) => (
                  <span
                    key={s.title}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{ background: i <= index ? TONES[track].bar : "rgba(148,163,184,0.3)" }}
                  />
                ))}
              </div>
              <button onClick={() => finish()} className="text-xs font-semibold text-slate-400 active:opacity-60">
                Skip
              </button>
            </div>

            {/* Slide */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={`${track}-${index}`}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -60 && !isLast) go(1);
                    if (info.offset.x > 60) back();
                  }}
                  className="absolute inset-0 flex flex-col justify-center px-7"
                >
                  <div className="mb-8">{slides[index].visual}</div>
                  <h2 className="text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    {slides[index].title}
                  </h2>
                  <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 mt-2">
                    {slides[index].body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action */}
            <div className="px-7 pt-4 space-y-2.5">
              {isLast ? (
                track === "business" ? (
                  <>
                    <p className="text-[11px] text-center text-slate-400 pb-1">
                      Free to list · about 10 minutes · we can set it up for you if you&apos;d rather
                    </p>
                    <PrimaryButton tone={track} onClick={() => finish("/provider-onboarding")}>
                      List my business — it&apos;s free
                    </PrimaryButton>
                    <button onClick={() => finish()} className="w-full py-2.5 text-[13px] font-semibold text-slate-400 active:opacity-60">
                      I&apos;ll look around first
                    </button>
                  </>
                ) : (
                  <>
                    <PrimaryButton tone={track} onClick={() => finish()}>Start exploring</PrimaryButton>
                    <button onClick={() => { setTrack("business"); setIndex(0); setDirection(1); }} className="w-full py-2.5 text-[13px] font-semibold text-slate-400 active:opacity-60">
                      I run a business — show me that
                    </button>
                  </>
                )
              ) : (
                <PrimaryButton tone={track} onClick={() => go(1)}>
                  Next <IonIcon icon={arrowForward} className="text-base" />
                </PrimaryButton>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

const TONES = {
  customer: { background: "linear-gradient(135deg, #F59E0B, #F97316)", boxShadow: "0 8px 20px rgba(245,158,11,0.32)", bar: "#F59E0B" },
  business: { background: "linear-gradient(135deg, #4338CA, #312E81)", boxShadow: "0 8px 20px rgba(67,56,202,0.35)", bar: "#4338CA" },
} as const;

function PrimaryButton({ onClick, tone, children }: { onClick: () => void; tone: Track; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-1.5 shadow-lg"
      style={{ background: TONES[tone].background, boxShadow: TONES[tone].boxShadow }}
    >
      {children}
    </motion.button>
  );
}

/** The one question that decides which half of the app matters to you. */
function TrackChooser({ onPick, onSkip }: { onPick: (t: Track) => void; onSkip: () => void }) {
  const options = [
    {
      key: "customer" as const,
      icon: compass,
      title: "I'm looking for something",
      body: "Tiffin, tailoring, tuitions, repairs and more — run by people from the community.",
      // Amber is the customer side of the app; indigo is the business side.
      // The cards borrow those colours so the choice already looks like where
      // it leads.
      tint: "bg-amber-50 dark:bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      key: "business" as const,
      icon: storefront,
      title: "I run a business",
      body: "Get your work in front of the community.",
      chip: "Free",
      tint: "bg-indigo-50 dark:bg-indigo-500/10",
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <div className="flex-1 flex flex-col px-7 relative overflow-hidden">
      {/* A soft wash so the screen is not a flat rectangle */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full opacity-[0.18] dark:opacity-25"
        style={{ background: "radial-gradient(circle, #4338CA 0%, transparent 70%)" }}
      />

      <div className="flex justify-end relative z-10">
        <button
          onClick={onSkip}
          className="text-xs font-semibold text-slate-400 dark:text-slate-500 active:opacity-60 py-1 px-2 -mr-2"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Image
            src="/icons/512.png"
            alt="Tijarah"
            width={72}
            height={72}
            priority
            className="rounded-[22px] shadow-lg shadow-indigo-900/25 dark:shadow-black/40 mb-6"
          />
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            The community&apos;s
            <br />
            businesses, in one place.
          </h1>
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 mt-3">
            A directory of Dawoodi Bohra–owned businesses in your city — the ones that used to travel by
            WhatsApp forward and word of mouth.
          </p>
        </motion.div>

        <div className="mt-8 space-y-3">
          {options.map((o, i) => (
            <motion.button
              key={o.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 + i * 0.08 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onPick(o.key)}
              className="w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 active:bg-slate-50 dark:active:bg-slate-700 shadow-sm"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${o.tint}`}>
                <IonIcon icon={o.icon} className={`text-xl ${o.iconColor}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-slate-900 dark:text-white">{o.title}</span>
                  {o.chip && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {o.chip}
                    </span>
                  )}
                </span>
                <span className="block text-[12px] leading-snug text-slate-500 dark:text-slate-400 mt-1">{o.body}</span>
              </span>
              <IonIcon icon={arrowForward} className="text-slate-300 dark:text-slate-600 text-base shrink-0" />
            </motion.button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pb-1 relative z-10">
        About 30 seconds. Skip whenever you like.
      </p>
    </div>
  );
}
