"use client";
import { memo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IonIcon } from "@ionic/react";
import { arrowForward } from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import { useHomeCollections } from "@/hooks/useHomeCollections";
import type { HomeCollection } from "@/services/home.service";
import { countLabel, themeOf } from "./collection-theme";
import { NeedArt } from "./need-illustrations";

/** A few real items, as overlapping avatars: "these are actual listings". */
function PhotoStack({ c }: { c: HomeCollection }) {
  const shown = c.photos.slice(0, 2);
  if (shown.length === 0) return null;
  const more = c.itemCount - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- tiny avatars; next/image adds nothing here
        <img
          key={p.url}
          src={p.url}
          alt=""
          loading="lazy"
          className="w-7 h-7 rounded-full object-cover ring-2 ring-white/90 bg-white/40"
          style={{ marginLeft: i ? -9 : 0, zIndex: 3 - i }}
        />
      ))}
      {more > 0 && (
        <span className="ml-1.5 text-[11px] font-bold text-white/95 drop-shadow-sm">+{more}</span>
      )}
    </div>
  );
}

function NeedBanner({ c, onOpen }: { c: HomeCollection; onOpen: () => void }) {
  const t = themeOf(c.theme);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative snap-start shrink-0 w-[86%] max-w-[380px] h-[184px] rounded-[26px] overflow-hidden text-left bg-gradient-to-br ${t.hero} shadow-[0_14px_30px_-16px_rgba(15,23,42,0.55)] active:scale-[0.98] transition-transform`}
      aria-label={`${c.title} — ${countLabel(c)}`}
    >
      {/* Depth: a big soft light, a dotted texture, and a shade behind the words */}
      <span className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/20 blur-2xl" />
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.2px)", backgroundSize: "14px 14px" }}
      />
      <span className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/15 to-transparent" />

      <div className="absolute right-[-10px] bottom-[-6px] w-[52%] h-[90%] drop-shadow-[0_10px_14px_rgba(0,0,0,0.22)]">
        <NeedArt name={c.illustration} className="w-full h-full" />
      </div>

      <div className="relative z-10 h-full w-[60%] p-4 flex flex-col">
        <span className="self-start inline-flex items-center px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-sm text-[10.5px] font-extrabold uppercase tracking-wider text-white">
          {countLabel(c)}
        </span>
        <p className="mt-2 text-[19px] leading-[1.12] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] line-clamp-2">{c.title}</p>
        {c.subtitle && <p className="mt-1 text-[11.5px] leading-snug text-white/90 line-clamp-2">{c.subtitle}</p>}
        <div className="mt-auto flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 h-8 pl-3 pr-2.5 rounded-full bg-white text-slate-900 text-[12px] font-extrabold shadow-md">
            Explore
            <IonIcon icon={arrowForward} className="text-[12px]" />
          </span>
          <PhotoStack c={c} />
        </div>
      </div>
    </button>
  );
}

/**
 * "What do you need today?" — big, illustrated banners (admin-managed), each
 * opening every product and service for that need. Swipe for more.
 */
const NeedCollections = () => {
  const router = useRouter();
  const { data, isLoading } = useHomeCollections();
  const collections = (data ?? []).slice(0, 8);
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Which banner is in view, for the dots.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const onScroll = () => {
      const first = row.firstElementChild as HTMLElement | null;
      const step = first ? first.offsetWidth + 12 : row.clientWidth;
      setActive(Math.min(collections.length - 1, Math.round(row.scrollLeft / step)));
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => row.removeEventListener("scroll", onScroll);
  }, [collections.length]);

  if (!isLoading && collections.length === 0) return null;

  return (
    <section className="pt-5 pb-1" aria-label="What do you need today?">
      <div className="px-4 mb-3">
        <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white leading-tight">What do you need today?</h2>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Everything for it, from businesses near you</p>
      </div>
      {isLoading && collections.length === 0 ? (
        <div className="flex gap-3 px-4 overflow-hidden">
          <div className="shrink-0 w-[86%] h-[184px] rounded-[26px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="shrink-0 w-[86%] h-[184px] rounded-[26px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : (
        <>
          <div ref={rowRef} className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 snap-x snap-mandatory scroll-px-4">
            {collections.map((c) => (
              <NeedBanner
                key={c.id}
                c={c}
                onOpen={() => router.push(`${ROUTE_PATH.COLLECTION}?id=${c.id}`)}
              />
            ))}
          </div>
          {collections.length > 1 && (
            <div className="flex justify-center gap-1.5 pt-2.5" aria-hidden>
              {collections.map((c, i) => (
                <span
                  key={c.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-5 bg-slate-800 dark:bg-white" : "w-1.5 bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default memo(NeedCollections);
