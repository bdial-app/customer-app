"use client";
import { useEffect, useState, type ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import {
  arrowForward,
  bulbOutline,
  cameraOutline,
  checkmark,
  close,
  copyOutline,
  cubeOutline,
  documentTextOutline,
  imagesOutline,
  phonePortraitOutline,
  refreshOutline,
  searchOutline,
  star,
  storefrontOutline,
} from "ionicons/icons";
import { Screen } from "@/app/components/ui/screen";
import { useNotification } from "@/app/context/NotificationContext";
import { Card } from "../manage/kit";
import {
  ABOUT_AVOID,
  ABOUT_BEFORE,
  ABOUT_FORMULA,
  CHECKLIST,
  COVER_TIPS,
  GALLERY_PLAN,
  GUIDE_FACTS,
  ITEM_FORMULA,
  ITEM_SHOTS,
  LOGO_TIPS,
  NAME_FIXES,
  PHONE_TRICKS,
  PHOTO_DONTS,
  PHOTO_DOS,
  SEARCH_WORDS,
  TEMPLATES,
  type FormulaTone,
} from "./guide-copy";

/**
 * The Selling guide: what photos and words to put on a business page so a
 * visitor becomes an enquiry.
 *
 * Owners kept uploading one dark photo and a line in capitals, then asking why
 * nobody called. Most of the fix is technique, not money, so this teaches it
 * with what customers actually see: the cover and logo, the gallery, an item's
 * name and description.
 *
 * Static content, no API. The only state is the closing checklist, kept on
 * this device so it survives a trip to the editor and back.
 */

export type GuideSection = "start" | "photos" | "items" | "about" | "templates" | "checklist";

/** Where the checklist's buttons can take an owner (the listings sub-tabs). */
export type GuideDestination = "details" | "photos" | "products";

const SECTIONS: { id: GuideSection; label: string; icon: string }[] = [
  { id: "photos", label: "Photos", icon: cameraOutline },
  { id: "items", label: "Products", icon: cubeOutline },
  { id: "about", label: "About", icon: documentTextOutline },
  { id: "templates", label: "Templates", icon: copyOutline },
  { id: "checklist", label: "Checklist", icon: checkmark },
];

const TONE: Record<FormulaTone, string> = {
  indigo: "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-200",
  rose: "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200",
  violet: "bg-violet-100 text-violet-900 dark:bg-violet-500/20 dark:text-violet-200",
  sky: "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
  emerald: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
};

const CHECKLIST_KEY = "tijarah.selling-guide.checklist";

const sectionId = (s: GuideSection) => `selling-guide-${s}`;

function scrollTo(s: GuideSection) {
  document.getElementById(sectionId(s))?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SellingGuideScreen({
  open,
  onClose,
  section = "start",
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  /** Where to open: links from the photos or catalogue screens land on their part. */
  section?: GuideSection;
  /** Given on the dashboard, so the checklist can send the owner to the editor. */
  onNavigate?: (to: GuideDestination) => void;
}) {
  // Wait for the slide-in to finish before jumping, or the jump is lost.
  useEffect(() => {
    if (!open || section === "start") return;
    const t = setTimeout(() => scrollTo(section), 320);
    return () => clearTimeout(t);
  }, [open, section]);

  const go = onNavigate
    ? (to: GuideDestination) => {
        onClose();
        onNavigate(to);
      }
    : undefined;

  return (
    <Screen
      open={open}
      onClose={onClose}
      title="Selling guide"
      subtitle="Photos and words that bring more customers"
      className="bg-slate-50 dark:bg-slate-950"
      bodyClassName="px-4 pt-4 pb-10 gap-9"
    >
      <Hero />

      <GuideBlock id="photos" step={1} title="Photos that win trust" lead="Customers decide with their eyes. Before they read a word, your photos have already said “yes” or “scroll on”.">
        <HeaderComparison />
        <TwoTips title="Cover photo" icon={imagesOutline} items={COVER_TIPS} />
        <TwoTips title="Logo" icon={storefrontOutline} items={LOGO_TIPS} />
        <GalleryPlan />
        <DoDont />
        <PhoneTricks />
      </GuideBlock>

      <GuideBlock id="items" step={2} title="Products and services that sell" lead="Each item is a small shop window. Up to 5 photos, a clear name, a price and a few honest lines.">
        <ItemShots />
        <NameFixes />
        <Formula title="The item description formula" parts={ITEM_FORMULA} />
        <SearchWords />
        <StarTip />
      </GuideBlock>

      <GuideBlock id="about" step={3} title="An “About” that answers questions" lead="Write it like you'd introduce your business to a new customer at the counter.">
        <Formula title="Five parts, in this order" parts={ABOUT_FORMULA} />
        <BeforeAfter />
        <Avoid />
      </GuideBlock>

      <GuideBlock id="templates" step={4} title="Copy-ready templates" lead="Copy one into “About your business”, fill in the [brackets], and make it sound like you.">
        <div className="flex flex-col gap-3">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.kind} kind={t.kind} text={t.text} />
          ))}
        </div>
      </GuideBlock>

      <GuideBlock id="checklist" step={5} title="Your page checklist" lead="Tick these off one by one. Ten ticks means a page that's ready to bring customers.">
        <Checklist onGo={go} onDone={onClose} />
      </GuideBlock>
    </Screen>
  );
}

/* ───────────── Layout ───────────── */

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-700 to-violet-600 p-5 text-white shadow-lg shadow-indigo-900/20">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-2xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
          <IonIcon icon={bulbOutline} className="text-[13px]" />
          Tips &amp; tricks
        </span>
        <h1 className="mt-3 text-[24px] font-extrabold leading-tight tracking-tight">
          Your photos sell before you do
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/80">
          You don&apos;t need a fancy camera. You need bright photos, clear names and words that answer a
          customer&apos;s questions. Here&apos;s how to get all three with your phone.
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {GUIDE_FACTS.map((f) => (
            <div key={f.label} className="rounded-2xl bg-white/10 px-2 py-2.5 ring-1 ring-white/15">
              <p className="text-[18px] font-extrabold leading-none">{f.value}</p>
              <p className="mt-1.5 text-[10px] leading-tight text-white/75">{f.label}</p>
            </div>
          ))}
        </div>

        <nav aria-label="Guide sections" className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none]">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12.5px] font-semibold text-indigo-700 active:scale-95 transition-transform"
            >
              <IonIcon icon={s.icon} className="text-[14px]" />
              {s.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function GuideBlock({
  id,
  step,
  title,
  lead,
  children,
}: {
  id: GuideSection;
  step: number;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section id={sectionId(id)} aria-labelledby={`${sectionId(id)}-title`} className="scroll-mt-3 flex flex-col gap-4">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Step {step}</p>
        <h2 id={`${sectionId(id)}-title`} className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{lead}</p>
      </header>
      {children}
    </section>
  );
}

/** A small titled group inside a step. */
function Sub({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 text-[14.5px] font-bold text-slate-800 dark:text-slate-100">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60">
          <IonIcon icon={icon} className="text-[15px] text-indigo-600 dark:text-indigo-300" />
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Tick({ good }: { good: boolean }) {
  return (
    <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white ${good ? "bg-emerald-500" : "bg-rose-500"}`}>
      <IonIcon icon={good ? checkmark : close} className="text-[11px]" />
    </span>
  );
}

/* ───────────── Photos ───────────── */

/**
 * The top of a business page, twice: a bare one and a cared-for one. Drawn in
 * CSS rather than photographed, so it never looks like a real shop's page.
 */
function HeaderComparison() {
  return (
    <Card className="!p-3">
      <p className="px-1 pb-2.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
        The top of your page, as a customer sees it:
      </p>
      <div className="flex flex-col gap-3">
        <MockHeader weak />
        <MockHeader />
      </div>
    </Card>
  );
}

function MockHeader({ weak = false }: { weak?: boolean }) {
  return (
    <figure>
      <div className="relative aspect-[2.4/1] overflow-hidden rounded-2xl">
        {weak ? (
          <div className="h-full w-full bg-gradient-to-br from-stone-500 via-stone-600 to-yellow-900 blur-[1px]">
            {/* A tilted, dim shot of a shutter half down */}
            <div className="absolute left-[20%] top-[15%] h-[85%] w-[70%] -rotate-6 rounded-sm bg-stone-700">
              <div className="h-1/2 w-full bg-[repeating-linear-gradient(180deg,#78716c_0_3px,#57534e_3px_6px)]" />
            </div>
            <div className="absolute -left-4 -top-6 h-16 w-16 rounded-full bg-yellow-200/40 blur-xl" />
          </div>
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 dark:from-sky-300 dark:via-sky-200 dark:to-amber-100">
            {/* A shop front in daylight: board, awning, open shutter */}
            <div className="absolute inset-x-[14%] bottom-0 top-[18%] rounded-t-md bg-white shadow-md">
              <div className="mx-auto mt-[5%] flex h-[20%] w-[70%] items-center justify-center rounded bg-indigo-700 text-[9px] font-extrabold tracking-wide text-white">
                HUSAIN MOTORS
              </div>
              <div className="mt-[4%] h-[14%] w-full bg-[repeating-linear-gradient(90deg,#f43f5e_0_12px,#fff_12px_24px)]" />
              <div className="mx-auto mt-[4%] flex h-[42%] w-[80%] items-end justify-center gap-[6%] rounded-t bg-slate-700 px-[6%]">
                <div className="h-[70%] w-[30%] rounded-t-sm bg-amber-200" />
                <div className="h-[55%] w-[30%] rounded-t-sm bg-sky-300" />
              </div>
            </div>
          </div>
        )}
        <span
          className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white ${weak ? "bg-rose-600" : "bg-emerald-600"}`}
        >
          <IonIcon icon={weak ? close : checkmark} className="text-[11px]" />
          {weak ? "Gets skipped" : "Gets the call"}
        </span>
      </div>
      <div className="flex items-start gap-2.5 px-3">
        <div
          className={`relative -mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold ring-4 ring-white dark:ring-slate-900 ${
            weak ? "bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400" : "bg-indigo-600 text-white"
          }`}
        >
          {weak ? "H" : "HM"}
        </div>
        <div className="min-w-0 pt-1.5">
          <p className="truncate text-[14px] font-bold text-slate-900 dark:text-white">
            {weak ? "HUSAIN MOTORS 98XXXXXXXX" : "Husain Motors"}
          </p>
          <p className="truncate text-[11.5px] text-slate-500 dark:text-slate-400">
            {weak ? (
              "No photos · No description"
            ) : (
              <>
                Car repair · Camp, Pune · <IonIcon icon={star} className="relative top-[1px] text-[11px] text-amber-500" /> 4.8
              </>
            )}
          </p>
        </div>
      </div>
    </figure>
  );
}

function TwoTips({ title, icon, items }: { title: string; icon: string; items: readonly string[] }) {
  return (
    <Sub title={title} icon={icon}>
      <Card className="!py-1">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((t) => (
            <li key={t} className="flex items-start gap-2.5 py-2.5 text-[13px] leading-snug text-slate-700 dark:text-slate-200">
              <Tick good />
              {t}
            </li>
          ))}
        </ul>
      </Card>
    </Sub>
  );
}

function GalleryPlan() {
  return (
    <Sub title="The 10-photo gallery plan" icon={imagesOutline}>
      <Card padded={false} className="overflow-hidden">
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {GALLERY_PLAN.map((g) => (
            <li key={g.title} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-1.5 text-[12px] font-extrabold text-white">
                {g.slots}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{g.title}</p>
                <p className="text-[12px] leading-snug text-slate-500 dark:text-slate-400">{g.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </Sub>
  );
}

function DoDont() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ListCard good title="Do" items={PHOTO_DOS} />
      <ListCard good={false} title="Don't" items={PHOTO_DONTS} />
    </div>
  );
}

function ListCard({ good, title, items }: { good: boolean; title: string; items: readonly string[] }) {
  return (
    <div
      className={`rounded-2xl p-4 ring-1 ${
        good
          ? "bg-emerald-50/70 ring-emerald-200 dark:bg-emerald-500/5 dark:ring-emerald-500/25"
          : "bg-rose-50/70 ring-rose-200 dark:bg-rose-500/5 dark:ring-rose-500/25"
      }`}
    >
      <p className={`flex items-center gap-2 text-[14px] font-extrabold ${good ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`}>
        <Tick good={good} />
        {title}
      </p>
      <ul className="mt-2.5 flex flex-col gap-2">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-[13px] leading-snug text-slate-700 dark:text-slate-200">
            <IonIcon
              icon={good ? checkmark : close}
              className={`mt-0.5 shrink-0 text-[14px] ${good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneTricks() {
  return (
    <Sub title="Phone camera tricks" icon={phonePortraitOutline}>
      <div className="grid grid-cols-2 gap-2.5">
        {PHONE_TRICKS.map((t) => (
          <Card key={t.title} className="!p-3.5">
            <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">{t.title}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-slate-500 dark:text-slate-400">{t.body}</p>
          </Card>
        ))}
      </div>
    </Sub>
  );
}

/* ───────────── Products & services ───────────── */

function ItemShots() {
  return (
    <Sub title="The 5 photos for every item" icon={cameraOutline}>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(ITEM_SHOTS).map(([kind, shots]) => (
          <Card key={kind}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{kind}</p>
            <ol className="mt-2 flex flex-col gap-2">
              {shots.map((s, i) => (
                <li key={s} className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-700 dark:text-slate-200">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10.5px] font-bold text-white">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
      <p className="px-1 text-[12px] text-slate-500 dark:text-slate-400">The first photo is the one customers see in lists, so make it your best.</p>
    </Sub>
  );
}

function NameFixes() {
  return (
    <Sub title="Name it the way customers search" icon={searchOutline}>
      <Card padded={false} className="overflow-hidden">
        {NAME_FIXES.map((n) => (
          <div key={n.before} className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
            <span className="w-16 shrink-0 text-[12.5px] text-slate-400 line-through decoration-rose-500/70">{n.before}</span>
            <IonIcon icon={arrowForward} className="shrink-0 text-[13px] text-slate-400" />
            <span className="min-w-0 text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{n.after}</span>
          </div>
        ))}
      </Card>
    </Sub>
  );
}

function Formula({ title, parts }: { title: string; parts: { label: string; example: string; tone: FormulaTone }[] }) {
  return (
    <Card>
      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{title}</p>
      <ol className="mt-2.5 flex flex-wrap gap-1.5">
        {parts.map((p, i) => (
          <li key={p.label} className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${TONE[p.tone]}`}>
            {i + 1}. {p.label}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[10.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Put together</p>
      <p className="mt-1.5 text-[14.5px] leading-[1.75] text-slate-800 dark:text-slate-100">
        {parts.map((p) => (
          <span key={p.label}>
            <mark className={`rounded-md px-1 py-0.5 [box-decoration-break:clone] ${TONE[p.tone]}`}>{p.example}</mark>{" "}
          </span>
        ))}
      </p>
    </Card>
  );
}

function SearchWords() {
  return (
    <Card className="!p-4">
      <p className="flex items-center gap-2 text-[14px] font-bold text-slate-800 dark:text-slate-100">
        <IonIcon icon={searchOutline} className="text-[15px] text-indigo-600 dark:text-indigo-300" />
        Fill in “Search words”
      </p>
      <p className="mt-1 text-[12.5px] leading-snug text-slate-500 dark:text-slate-400">
        Add the words people actually type, including other spellings. For “{SEARCH_WORDS.item}”:
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SEARCH_WORDS.words.map((w) => (
          <span key={w} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[12px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {w}
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-[11.5px] text-slate-400">Only words that fit the item. Unrelated words don&apos;t bring the right customers.</p>
    </Card>
  );
}

function StarTip() {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/25">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
        <IonIcon icon={star} className="text-[17px]" />
      </span>
      <div>
        <p className="text-[13.5px] font-bold text-amber-900 dark:text-amber-200">Star your 3 best sellers</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-amber-800/80 dark:text-amber-200/70">
          Starred items show first on your page. Pick the ones most customers ask for, and give them your best photos.
        </p>
      </div>
    </div>
  );
}

/* ───────────── About ───────────── */

function BeforeAfter() {
  const after = ABOUT_FORMULA.map((p) => p.example).join(" ");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-rose-50/70 p-4 ring-1 ring-rose-200 dark:bg-rose-500/5 dark:ring-rose-500/25">
        <p className="flex items-center gap-2 text-[13px] font-bold text-rose-800 dark:text-rose-300">
          <Tick good={false} /> Before
        </p>
        <p className="mt-2 font-mono text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200">{ABOUT_BEFORE}</p>
        <p className="mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">Shouting, and it says nothing a customer can use.</p>
      </div>
      <div className="rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200 dark:bg-emerald-500/5 dark:ring-emerald-500/25">
        <p className="flex items-center gap-2 text-[13px] font-bold text-emerald-800 dark:text-emerald-300">
          <Tick good /> After
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{after}</p>
        <p className="mt-2 text-[11.5px] text-slate-500 dark:text-slate-400">Who, what, why, where and how, in five short sentences.</p>
      </div>
    </div>
  );
}

function Avoid() {
  return (
    <Sub title="Leave these out" icon={close}>
      <div className="flex flex-col gap-2.5">
        {ABOUT_AVOID.map((a) => (
          <Card key={a.title} className="!p-3.5">
            <p className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">{a.title}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500 dark:text-slate-400">{a.body}</p>
          </Card>
        ))}
      </div>
    </Sub>
  );
}

/* ───────────── Templates ───────────── */

function TemplateCard({ kind, text }: { kind: string; text: string }) {
  const { notify } = useNotification();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify({ title: `${kind} template copied`, subtitle: "Paste it into “About your business”.", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify({ title: "Couldn't copy", subtitle: "Press and hold the text to copy it instead.", variant: "error" });
    }
  };

  // The [brackets] are what the owner fills in, so they're the bit to see first.
  const parts = text.split(/(\[[^\]]+\])/g);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{kind}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-colors active:scale-95 ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
          }`}
        >
          <IonIcon icon={copied ? checkmark : copyOutline} className="text-[14px]" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 select-text">
        {parts.map((p, i) =>
          p.startsWith("[") ? (
            <span key={i} className="rounded bg-amber-100 px-1 font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </Card>
  );
}

/* ───────────── Checklist ───────────── */

function readChecklist(): number[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function Checklist({ onGo, onDone }: { onGo?: (to: GuideDestination) => void; onDone: () => void }) {
  const [done, setDone] = useState<number[]>(readChecklist);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(done));
    } catch {
      // Private mode or blocked storage: the ticks just won't survive a reload.
    }
  }, [done]);

  const toggle = (i: number) => setDone((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i]));
  const count = done.length;
  const total = CHECKLIST.length;
  const complete = count === total;

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
            {complete ? "Your page is ready to sell 🎉" : `${count} of ${total} done`}
          </p>
          {count > 0 && (
            <button
              type="button"
              onClick={() => setDone([])}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-400 active:text-slate-600"
            >
              <IonIcon icon={refreshOutline} className="text-[13px]" />
              Reset
            </button>
          )}
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
            style={{ width: `${(count / total) * 100}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {CHECKLIST.map((item, i) => {
          const on = done.includes(i);
          return (
            <li key={item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(i)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-slate-50 dark:active:bg-slate-800/60"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                    on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {on && <IonIcon icon={checkmark} className="text-[14px]" />}
                </span>
                <span className={`text-[13.5px] leading-snug ${on ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
        {onGo ? (
          <>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">Fix the first unticked one now:</p>
            <div className="grid grid-cols-3 gap-2">
              <GoButton icon={storefrontOutline} label="Cover & about" onClick={() => onGo("details")} />
              <GoButton icon={imagesOutline} label="Photos" onClick={() => onGo("photos")} />
              <GoButton icon={cubeOutline} label="Products" onClick={() => onGo("products")} />
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onDone}
            className="h-11 rounded-xl bg-indigo-600 text-[14px] font-semibold text-white active:scale-[0.98] transition-transform"
          >
            Back to editing
          </button>
        )}
      </div>
    </Card>
  );
}

function GoButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl bg-white py-2.5 text-[11.5px] font-semibold text-indigo-700 ring-1 ring-slate-200 active:scale-95 transition-transform dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700"
    >
      <IonIcon icon={icon} className="text-[18px]" />
      {label}
    </button>
  );
}
