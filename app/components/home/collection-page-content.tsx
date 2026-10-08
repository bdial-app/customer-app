"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IonIcon } from "@ionic/react";
import { chevronBackOutline, searchOutline, sparkles } from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useHomeCollection } from "@/hooks/useHomeCollections";
import type { CatalogType } from "@/services/catalog.service";
import CatalogResults from "@/app/components/catalog/catalog-results";
import { DEFAULT_FILTERS, type CatalogFilters } from "@/app/components/catalog/catalog-utils";
import SwipeBackGesture from "../swipe-back-gesture";
import { countLabel, themeOf } from "./collection-theme";
import { NeedArt } from "./need-illustrations";

/**
 * Everything for one need ("Get your home fixed"): its products and services
 * from all the categories it covers, with a chip per category to narrow it.
 */
export default function CollectionPageContent() {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const id = useSearchParams().get("id");
  const { data: c, isLoading, isError } = useHomeCollection(id);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Products or services — whichever it has more of, unless chosen.
  const [chosenType, setChosenType] = useState<CatalogType | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);

  const bothTypes = !!c && c.listingType === "all" && c.productCount > 0 && c.serviceCount > 0;
  const type: CatalogType =
    chosenType ??
    (c?.listingType === "service" || (c?.listingType === "all" && c.serviceCount > c.productCount) ? "service" : "product");

  const resultFilters = useMemo<CatalogFilters>(
    () => ({ ...filters, categoryId: undefined, categoryIds: categoryId ?? c?.categoryIds.join(",") }),
    [filters, categoryId, c?.categoryIds],
  );

  const t = themeOf(c?.theme);
  const top = () => scrollRef.current?.scrollTo({ top: 0 });

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-slate-900">
      <SwipeBackGesture onBack={() => goBack("/")} />
      <div className="shrink-0 z-30 bg-white dark:bg-slate-900" style={{ paddingTop: "var(--sat,0px)" }}>
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => goBack("/")}
            aria-label="Back"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-90 transition-transform"
          >
            <IonIcon icon={chevronBackOutline} className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <h1 className="flex-1 min-w-0 text-[17px] font-extrabold text-slate-900 dark:text-white truncate">{c?.title ?? ""}</h1>
          <button
            onClick={() => router.push(ROUTE_PATH.SEARCH)}
            aria-label="Search"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-90 transition-transform"
          >
            <IonIcon icon={searchOutline} className="w-[18px] h-[18px] text-slate-700 dark:text-slate-200" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain"
        style={{ paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 24px)" }}
      >
        {isLoading ? (
          <div className="px-4 pt-2">
            <div className="h-36 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : isError || !c ? (
          <div className="px-6 pt-20 text-center">
            <p className="text-[15px] font-bold text-slate-800 dark:text-white">This collection isn&apos;t available</p>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">It may have ended. Have a look around the home screen instead.</p>
            <button onClick={() => router.replace("/")} className="mt-4 h-11 px-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-bold">
              Go home
            </button>
          </div>
        ) : (
          <CatalogResults
            type={type}
            filters={resultFilters}
            // Categories come from the chips; keep only sort and filters.
            onFiltersChange={(next) => setFilters({ ...next, categoryId: undefined, categoryIds: undefined })}
            toolbarClassName="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800"
            heading={
              <div className="px-4 pt-1 pb-3">
                {/* Banner */}
                <div className={`relative overflow-hidden rounded-3xl p-4 pb-3 bg-gradient-to-br ${t.hero} text-white shadow-lg`}>
                  <div className="pointer-events-none absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
                  <div className="relative flex gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 text-[10.5px] font-extrabold uppercase tracking-wider">
                        <IonIcon icon={sparkles} className="text-[11px]" />
                        {countLabel(c)}
                      </span>
                      <h2 className="mt-2 text-[21px] leading-tight font-extrabold">{c.title}</h2>
                      {c.subtitle && <p className="mt-1 text-[12.5px] leading-snug text-white/90">{c.subtitle}</p>}
                    </div>
                    <div className="w-[128px] h-[104px] shrink-0 -mr-2 -mb-2 self-end drop-shadow-[0_8px_12px_rgba(0,0,0,0.2)]">
                      <NeedArt name={c.illustration} className="w-full h-full" />
                    </div>
                  </div>
                </div>

                {/* Products ⇄ Services */}
                {bothTypes && (
                  <div className="mt-3 flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    {(["product", "service"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => {
                          if (k === type) return;
                          setChosenType(k);
                          top();
                        }}
                        className={`flex-1 py-2 rounded-lg text-[12.5px] font-bold transition-all ${
                          k === type ? `bg-white dark:bg-slate-700 shadow-sm ${t.accent}` : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {k === "service" ? `Services · ${c.serviceCount}` : `Products · ${c.productCount}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* One chip per category it covers */}
                {c.categories.length > 1 && (
                  <div className="mt-3 -mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
                    {[{ id: null as string | null, name: "All" }, ...c.categories].map((cat) => {
                      const on = categoryId === cat.id;
                      return (
                        <button
                          key={cat.id ?? "all"}
                          onClick={() => {
                            if (on) return;
                            setCategoryId(cat.id);
                            top();
                          }}
                          className={`shrink-0 h-9 px-3.5 rounded-full text-[12.5px] font-semibold border transition-colors ${
                            on ? t.chipOn : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
