"use client";
import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import { chevronBackOutline, searchOutline } from "ionicons/icons";
import { ROUTE_PATH } from "@/utils/contants";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useCatalogShelves } from "@/hooks/useCatalog";
import type { CatalogType } from "@/services/catalog.service";
import CatalogResults from "./catalog-results";
import { catalogHref, filtersFromSearchParams, typeNoun, type CatalogFilters } from "./catalog-utils";

export default function CatalogPageContent() {
  const router = useRouter();
  const { goBack } = useBackNavigation();
  const searchParams = useSearchParams();

  const type: CatalogType = searchParams.get("type") === "service" ? "service" : "product";
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const title = searchParams.get("title") || `All ${typeNoun(type)}`;

  const { data: shelves } = useCatalogShelves(type);
  const categories = shelves?.categories ?? [];

  // The URL is the state, so back/forward and shared links restore the view.
  const navigate = useCallback(
    (next: { type?: CatalogType; title?: string; filters: CatalogFilters }) =>
      router.replace(catalogHref(next.type ?? type, { title: next.title ?? title, filters: next.filters }), { scroll: false }),
    [router, type, title],
  );

  // The app shell locks the window (html/body overflow: hidden), so this page
  // scrolls inside its own container, like the other full-screen pages.
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectCategory = (id: string | undefined, name?: string) => {
    scrollRef.current?.scrollTo({ top: 0 });
    navigate({ title: name ?? `All ${typeNoun(type)}`, filters: { ...filters, categoryId: id } });
  };

  const accent = type === "service" ? "indigo" : "amber";

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-slate-900">
      <div className="shrink-0 z-30 bg-white dark:bg-slate-900" style={{ paddingTop: "var(--sat,0px)" }}>
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => goBack("/")}
            aria-label="Back"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-90 transition-transform"
          >
            <IonIcon icon={chevronBackOutline} className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <h1 className="flex-1 min-w-0 text-[17px] font-extrabold text-slate-900 dark:text-white truncate">{title}</h1>
          <button
            onClick={() => router.push(ROUTE_PATH.SEARCH)}
            aria-label="Search"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-90 transition-transform"
          >
            <IonIcon icon={searchOutline} className="w-[18px] h-[18px] text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        {/* Products ⇄ Services */}
        <div className="px-4 pb-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {(["product", "service"] as const).map((t) => (
              <button
                key={t}
                onClick={() => t !== type && navigate({ type: t, title: `All ${typeNoun(t)}`, filters: { sort: filters.sort, area: filters.area } })}
                className={`flex-1 py-1.5 rounded-lg text-[12.5px] font-bold transition-all ${
                  t === type
                    ? `bg-white dark:bg-slate-700 shadow-sm ${t === "service" ? "text-indigo-600 dark:text-indigo-300" : "text-amber-600 dark:text-amber-300"}`
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {t === "service" ? "Services" : "Products"}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
            {[{ id: undefined as string | undefined, name: "All" }, ...categories].map((cat) => {
              const selected = filters.categoryId === cat.id;
              return (
                <button
                  key={cat.id ?? "all"}
                  onClick={() => !selected && selectCategory(cat.id, cat.id ? cat.name : undefined)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                    selected
                      ? accent === "amber"
                        ? "bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                        : "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain"
        style={{ paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 24px)" }}
      >
        <CatalogResults
          type={type}
          filters={filters}
          onFiltersChange={(next) => navigate({ filters: next })}
          toolbarClassName="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800"
        />
      </div>
    </div>
  );
}
