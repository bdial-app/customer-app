"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { checkmark, closeOutline, shieldCheckmarkOutline, femaleOutline, pricetagOutline, sparklesOutline } from "ionicons/icons";
import { useQuery } from "@tanstack/react-query";
import BottomSheet from "@/app/components/bottom-sheet";
import { browseCatalog, type CatalogType } from "@/services/catalog.service";
import { useCatalogLocation } from "@/hooks/useCatalog";
import { AREA_OPTIONS, DEFAULT_FILTERS, PRICE_BANDS, SORT_OPTIONS, typeNoun, type CatalogFilters } from "./catalog-utils";

const RATING_OPTIONS = [
  { value: undefined, label: "Any" },
  { value: 3.5, label: "3.5★ +" },
  { value: 4, label: "4★ +" },
  { value: 4.5, label: "4.5★ +" },
];

interface Props {
  opened: boolean;
  onClose: () => void;
  type: CatalogType;
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
  /** Accent per type: amber for products, indigo for services. */
  accent: "amber" | "indigo";
}

const ACCENT = {
  amber: { soft: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700", button: "bg-amber-500 shadow-amber-200" },
  indigo: { soft: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700", button: "bg-indigo-600 shadow-indigo-200" },
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">{children}</p>
);

export default function CatalogFilterSheet({ opened, onClose, type, value, onApply, accent }: Props) {
  // Draft edits; re-seeded from `value` each time the sheet opens.
  const [draft, setDraft] = useState<CatalogFilters>(value);
  const [wasOpen, setWasOpen] = useState(opened);
  if (opened !== wasOpen) {
    setWasOpen(opened);
    if (opened) setDraft(value);
  }

  const location = useCatalogLocation();
  const hasLocation = location.lat != null && location.lng != null;
  const a = ACCENT[accent];
  const set = (patch: Partial<CatalogFilters>) => setDraft((d) => ({ ...d, ...patch }));

  // Live result count for the draft, so "Show results" never leads to an empty page.
  const { data: preview, isFetching } = useQuery({
    queryKey: ["catalog-filter-preview", type, draft, location],
    queryFn: () => browseCatalog({ type, ...draft, ...location, page: 1, limit: 1 }),
    enabled: opened,
    staleTime: 60_000,
  });
  const count = preview?.total;

  const chip = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors active:scale-95 ${
      selected ? a.soft : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
    }`;

  const toggles: { key: "verified" | "womenLed" | "priced" | "featured"; label: string; icon: string }[] = [
    { key: "verified", label: "Verified sellers", icon: shieldCheckmarkOutline },
    { key: "womenLed", label: "Women-led", icon: femaleOutline },
    { key: "priced", label: "Shows a price", icon: pricetagOutline },
    { key: "featured", label: "Featured", icon: sparklesOutline },
  ];

  return (
    <BottomSheet
      opened={opened}
      onClose={onClose}
      title="Sort & filter"
      headerLeft={
        <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <IonIcon icon={closeOutline} className="text-lg text-slate-600 dark:text-slate-300" />
        </button>
      }
      headerRight={
        <button
          onClick={() => setDraft({ ...DEFAULT_FILTERS, categoryId: draft.categoryId })}
          className="text-[12px] font-semibold text-slate-500 dark:text-slate-400"
        >
          Reset
        </button>
      }
    >
      <div className="overflow-y-auto px-4 pt-4 pb-3 space-y-5">
        <div>
          <SectionTitle>Sort by</SectionTitle>
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {SORT_OPTIONS.filter((o) => !o.needsLocation || hasLocation).map((o) => {
              const selected = (draft.sort ?? "recommended") === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => set({ sort: o.value })}
                  className="w-full flex items-center justify-between px-3.5 py-3 text-left bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800"
                >
                  <span className={`text-[13px] ${selected ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-300"}`}>
                    {o.label}
                  </span>
                  {selected && <IonIcon icon={checkmark} className={`text-base ${accent === "amber" ? "text-amber-500" : "text-indigo-600"}`} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Area</SectionTitle>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {AREA_OPTIONS.filter(
              (o) => (o.value !== "nearby" || hasLocation) && (o.value !== "city" || hasLocation || !!location.city),
            ).map((o) => (
              <button
                key={o.value}
                onClick={() => set({ area: o.value })}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                  (draft.area ?? "all") === o.value ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Price</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {PRICE_BANDS[type].map((band) => {
              const selected = draft.minPrice === band.min && draft.maxPrice === band.max;
              return (
                <button
                  key={band.label}
                  onClick={() => set(selected ? { minPrice: undefined, maxPrice: undefined } : { minPrice: band.min, maxPrice: band.max })}
                  className={chip(selected)}
                >
                  {band.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Seller rating</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map((o) => (
              <button key={o.label} onClick={() => set({ minRating: o.value })} className={chip(draft.minRating === o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Show only</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {toggles.map((t) => (
              <button
                key={t.key}
                onClick={() => set({ [t.key]: draft[t.key] ? undefined : true })}
                className={`flex items-center gap-1.5 ${chip(!!draft[t.key])}`}
              >
                <IonIcon icon={t.icon} className="text-[13px]" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-2 pb-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          disabled={count === 0}
          className={`w-full h-12 rounded-2xl text-white text-[14px] font-bold shadow-sm dark:shadow-none active:scale-[0.98] transition-transform disabled:opacity-50 ${a.button}`}
        >
          {count === undefined || isFetching
            ? "Show results"
            : count === 0
              ? `No ${typeNoun(type)} match`
              : `Show ${count} ${typeNoun(type, count !== 1)}`}
        </button>
      </div>
    </BottomSheet>
  );
}
