"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import dynamic from "next/dynamic";
const IonIcon = dynamic(() => import("@ionic/react").then((m) => m.IonIcon), { ssr: false });
import {
  chevronBackOutline,
  shareSocialOutline,
  checkmarkCircle,
  star,
  searchOutline,
  closeCircle,
  storefrontOutline,
  chatbubbleOutline,
  locationOutline,
  bookOutline,
} from "ionicons/icons";
import OptimizedImage from "@/app/components/ui/optimized-image";
import ProductCard, { ProductCardSkeleton } from "@/app/components/catalog/product-card";
import { ServiceListCard } from "@/app/components/catalog/service-card";
import { useCatalogCardActions } from "@/app/components/catalog/catalog-results";
import { useSellerCatalogue } from "@/hooks/useCatalog";
import { useShareCatalogue } from "@/hooks/useShare";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useCreateConversation } from "@/hooks/useChat";
import { openChat } from "@/store/slices/chatSlice";
import { store } from "@/store";
import { ROUTE_PATH } from "@/utils/contants";
import type { CatalogItem } from "@/services/catalog.service";

type TypeFilter = "all" | "product" | "service";
const OTHER = "Other";
const groupOf = (i: CatalogItem) => i.categoryName ?? OTHER;

/** Products as a 2-column grid, services as a list — the same cards as everywhere else. */
function ItemBlock({ items, actions }: { items: CatalogItem[]; actions: ReturnType<typeof useCatalogCardActions> }) {
  const products = items.filter((i) => i.productType === "product");
  const services = items.filter((i) => i.productType === "service");
  return (
    <div className="space-y-3">
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {products.map((item, i) => (
            <ProductCard key={item.id} item={item} priority={i < 4} isSaved={actions.isSaved(item.id)} onToggleSave={actions.toggle} />
          ))}
        </div>
      )}
      {services.length > 0 && (
        <div className="space-y-2.5">
          {services.map((item) => (
            <ServiceListCard
              key={item.id}
              item={item}
              isSaved={actions.isSaved(item.id)}
              onToggleSave={actions.toggle}
              onEnquire={actions.enquire}
              enquiring={actions.isEnquiring(item)}
              isOwn={actions.isOwn(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One business's whole catalogue — what a shared /c/<id> link opens. Every
 * live product and service, grouped by category, with search and filters,
 * and a way to message the shop or open its full page.
 */
export default function SellerCatalogueContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { goBack } = useBackNavigation();
  const { requireAuth } = useAuthGate();
  const providerId = useSearchParams().get("id") ?? "";
  const { data, isLoading, isError } = useSellerCatalogue(providerId);
  const actions = useCatalogCardActions();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const isOwner = !!userId && data?.provider.userId === userId;
  const { share, busy: sharing } = useShareCatalogue(providerId || undefined, { asOwner: isOwner });
  const { mutate: createConversation, isPending: messaging } = useCreateConversation();

  const [type, setType] = useState<TypeFilter>("all");
  const [group, setGroup] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const items = useMemo(() => data?.items ?? [], [data]);
  const byType = useMemo(() => (type === "all" ? items : items.filter((i) => i.productType === type)), [items, type]);
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    byType.forEach((i) => counts.set(groupOf(i), (counts.get(groupOf(i)) ?? 0) + 1));
    return [...counts.entries()].sort(([a, x], [b, y]) => (a === OTHER ? 1 : b === OTHER ? -1 : y - x));
  }, [byType]);
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      byType.filter(
        (i) =>
          (!group || groupOf(i) === group) &&
          (!q || i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)),
      ),
    [byType, group, q],
  );
  // Grouped under category headings unless the list is already narrowed down.
  const sections = useMemo(() => {
    if (group || q) return [{ name: null as string | null, items: visible }];
    return groups.map(([name]) => ({ name, items: visible.filter((i) => groupOf(i) === name) })).filter((s) => s.items.length);
  }, [group, q, groups, visible]);

  const message = () =>
    requireAuth(() => {
      if (!data) return;
      // Re-check after sign-in — they may have signed in as this business.
      const me = store.getState().auth.user;
      if (me && me.id === data.provider.userId) return;
      createConversation(
        { providerId: data.provider.id, contextType: "provider", contextId: data.provider.id },
        {
          onSuccess: (conv) => {
            dispatch(openChat(conv.id));
            router.push("/");
          },
          onError: (err) => {
            const msg = isAxiosError<{ message?: string | string[] }>(err) ? err.response?.data?.message : undefined;
            alert(Array.isArray(msg) ? msg.join(", ") : msg || "Could not start conversation");
          },
        },
      );
    });

  const p = data?.provider;
  const hasBothTypes = (data?.counts.products ?? 0) > 0 && (data?.counts.services ?? 0) > 0;
  const shopHref = p ? `${ROUTE_PATH.PROVIDER_DETAILS}?id=${p.id}` : "/";

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-slate-900">

      {/* Header: whose catalogue this is */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" style={{ paddingTop: "var(--sat,0px)" }}>
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          <button
            onClick={() => goBack("/")}
            aria-label="Back"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-90 transition-transform"
          >
            <IonIcon icon={chevronBackOutline} className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          {p ? (
            <Link href={shopHref} className="flex-1 min-w-0 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-50 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                {p.logoUrl ? (
                  <OptimizedImage src={p.logoUrl} alt={p.name} className="w-full h-full" width={40} height={40} preset="avatar" />
                ) : (
                  <IonIcon icon={storefrontOutline} className="text-lg text-indigo-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="text-[15px] font-extrabold text-slate-900 dark:text-white truncate">{p.name}</h1>
                  {p.verified && <IonIcon icon={checkmarkCircle} className="text-[15px] text-emerald-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  {p.rating > 0 && (
                    <span className="flex items-center gap-0.5 font-bold text-slate-700 dark:text-slate-200">
                      <IonIcon icon={star} className="text-[10px] text-amber-500" />
                      {p.rating.toFixed(1)}
                    </span>
                  )}
                  {p.rating > 0 && <span>·</span>}
                  <span className="truncate">{[p.area, p.city].filter(Boolean).join(", ") || "Catalogue"}</span>
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          )}
          <button
            onClick={() => void share()}
            disabled={!data || sharing}
            aria-label="Share this catalogue"
            className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 active:scale-90 transition-transform ${sharing ? "animate-pulse" : ""}`}
          >
            <IonIcon icon={shareSocialOutline} className="w-[18px] h-[18px] text-slate-700 dark:text-slate-200" />
          </button>
        </div>

        {data && (
          <>
            {/* Search within this shop */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                <IonIcon icon={searchOutline} className="text-slate-400 text-[15px]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${items.length} item${items.length === 1 ? "" : "s"}`}
                  className="flex-1 bg-transparent outline-none text-[13.5px] text-slate-800 dark:text-white placeholder:text-slate-400"
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search">
                    <IonIcon icon={closeCircle} className="text-slate-400 text-[17px]" />
                  </button>
                )}
              </div>
            </div>

            {hasBothTypes && (
              <div className="px-4 pb-2">
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {([
                    ["all", `All ${items.length}`],
                    ["product", `Products ${data.counts.products}`],
                    ["service", `Services ${data.counts.services}`],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => {
                        setType(value);
                        setGroup(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                        type === value ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {groups.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2.5">
                {[[null, byType.length] as [string | null, number], ...groups].map(([name, count]) => {
                  const selected = group === name;
                  return (
                    <button
                      key={name ?? "all"}
                      onClick={() => setGroup(name)}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                        selected
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {name ?? "All"}
                      <span className={selected ? "opacity-70" : "text-slate-400"}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain" style={{ paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 96px)" }}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center text-center px-8 py-20">
            <IonIcon icon={bookOutline} className="text-4xl text-slate-300" />
            <p className="mt-3 text-[15px] font-bold text-slate-800 dark:text-white">This catalogue isn&apos;t available</p>
            <p className="mt-1 text-[12.5px] text-slate-400">The business may have paused its listing.</p>
            <Link href="/" className="mt-5 text-[13px] font-bold text-white bg-indigo-600 px-5 py-2.5 rounded-full">
              Explore other businesses
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center px-8 py-20">
            <IonIcon icon={bookOutline} className="text-4xl text-slate-300" />
            <p className="mt-3 text-[15px] font-bold text-slate-800 dark:text-white">Nothing listed yet</p>
            <p className="mt-1 text-[12.5px] text-slate-400">
              {isOwner ? "Add products and services from the Business tab, then share this page." : `${p?.name} hasn't added products or services yet.`}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center text-center px-8 py-16">
            <IonIcon icon={searchOutline} className="text-3xl text-slate-300" />
            <p className="mt-3 text-[14px] font-bold text-slate-800 dark:text-white">No items match “{query}”</p>
            <button onClick={() => setQuery("")} className="mt-3 text-[12.5px] font-bold text-indigo-600">
              Clear search
            </button>
          </div>
        ) : (
          <div className="px-4 pt-3 space-y-6">
            {sections.map((section) => (
              <section key={section.name ?? "results"}>
                {section.name && (
                  <div className="flex items-baseline justify-between mb-2.5">
                    <h2 className="text-[16px] font-extrabold tracking-tight text-slate-900 dark:text-white">{section.name}</h2>
                    <span className="text-[11.5px] font-semibold text-slate-400">
                      {section.items.length} {section.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                )}
                <ItemBlock items={section.items} actions={actions} />
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {data && (
        <div
          className="fixed bottom-0 inset-x-0 z-30 px-4 pt-3 bg-gradient-to-t from-white via-white to-white/0 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/0"
          style={{ paddingBottom: "calc(var(--sab, env(safe-area-inset-bottom)) + 12px)" }}
        >
          {isOwner ? (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/40 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold text-indigo-900 dark:text-indigo-200">This is your catalogue</p>
                <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70">Share it — one link shows everything you sell.</p>
              </div>
              <button
                onClick={() => void share()}
                disabled={sharing}
                className="shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 text-white text-[13px] font-bold active:scale-95 transition-transform disabled:opacity-60"
              >
                <IonIcon icon={shareSocialOutline} className="text-[15px]" />
                Share
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <Link
                href={shopHref}
                className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[13.5px] font-bold active:scale-[0.98] transition-transform"
              >
                <IonIcon icon={locationOutline} className="text-[16px]" />
                Visit shop
              </Link>
              <button
                onClick={message}
                disabled={messaging}
                className="flex-[1.4] flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-amber-500 text-white text-[13.5px] font-bold shadow-sm shadow-amber-200 dark:shadow-none active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                <IonIcon icon={chatbubbleOutline} className="text-[16px]" />
                {messaging ? "Opening chat…" : `Message ${p?.name ?? ""}`.trim()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
