"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/useAppStore";
import { useAppContext } from "@/app/context/AppContext";
import { hasSeenWelcomeTour } from "@/utils/welcome-tour";
import { onOpenCustomerTour, readCustomerTour, recordCustomerTour, subscribeCustomerTour } from "@/utils/customer-tour";
import { openExploreSegment, openMainTab, openProviderTab } from "@/utils/tour-nav";
import { browseCatalog } from "@/services/catalog.service";
import SpotlightTour from "../business-tour/spotlight-tour";
import TourPicker from "../business-tour/tour-picker";
import type { TourChapter, TourStep } from "../business-tour/tour-content";
import { buildCustomerFinale, buildCustomerTour, type TourSample } from "./customer-tour-content";

const BUSINESS_STATUSES = ["pending", "in_review", "approved", "unverified", "suspended"];

/** Nothing full-screen (welcome slides, splash, permission prompt) is in the way. */
const screenIsClear = () => hasSeenWelcomeTour() && !document.querySelector("[data-blocks-tour]");

const here = () => `${window.location.pathname}${window.location.search}`;

/**
 * A real, well-filled listing to walk through: a priced product with a photo,
 * preferably from a rated, verified shop — the business page and the product
 * page then come from the same place.
 */
async function pickSample(location: { lat?: number; lng?: number; city?: string }): Promise<TourSample | null> {
  try {
    const { data } = await browseCatalog({ type: "product", sort: "popular", priced: true, limit: 20, ...location });
    const withPhoto = data.filter((i) => i.photoUrl);
    const best =
      withPhoto.find((i) => i.verified && i.rating > 0) ?? withPhoto.find((i) => i.verified) ?? withPhoto[0] ?? data[0];
    if (!best) return null;
    return { providerId: best.providerId, shopName: best.providerName, productId: best.id, productName: best.name };
  } catch {
    return null;
  }
}

/**
 * Owns the customer tour. It lives in the app shell (not the home screen) so
 * it keeps running while it opens a business page and a product page. Offered
 * once per device after the welcome slides; replayable from Profile.
 */
export default function CustomerTourController() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const selectedCity = useAppSelector((state) => state.location.selectedCity);
  const guestCoords = useAppSelector((state) => state.location.guestCoords);
  const { providerStatus, userMode } = useAppContext();
  const owner = user?.id ?? "guest";
  const active = userMode === "customer";

  const location = useMemo(
    () => ({
      lat: user?.latitude ?? guestCoords?.lat ?? undefined,
      lng: user?.longitude ?? guestCoords?.lng ?? undefined,
      city: selectedCity ?? user?.city ?? undefined,
    }),
    [user?.latitude, user?.longitude, user?.city, guestCoords, selectedCity],
  );

  const ctx = useMemo(
    () => ({
      firstName: (user?.name ?? "").trim().split(/\s+/)[0] ?? "",
      signedIn: !!user,
      hasBusiness: BUSINESS_STATUSES.includes(providerStatus),
      city: selectedCity ?? user?.city ?? "",
    }),
    [user, providerStatus, selectedCity],
  );

  // Guest progress counts too: someone who toured before signing in isn't offered it again.
  const snapshot = useSyncExternalStore(
    subscribeCustomerTour,
    () => JSON.stringify([readCustomerTour(owner), owner === "guest" ? null : readCustomerTour("guest")]),
    () => "[]",
  );
  const [mine, asGuest] = useMemo(
    () => JSON.parse(snapshot) as [{ chapters?: string[]; dismissed?: boolean } | undefined, { chapters?: string[]; dismissed?: boolean } | null],
    [snapshot],
  );
  const seenBefore = [mine, asGuest].some((r) => r && (r.dismissed || (r.chapters?.length ?? 0) > 0));

  const [running, setRunning] = useState<TourChapter[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  // The picker lists chapters before a sample is chosen; titles don't depend on it.
  const pickerChapters = useMemo(() => buildCustomerTour(ctx, null), [ctx]);

  const start = useCallback(
    async (chapterId?: string) => {
      if (starting) return;
      setStarting(true);
      setPickerOpen(false);
      const needsSample = !chapterId || chapterId === "business-page" || chapterId === "product-page";
      const sample = needsSample ? await pickSample(location) : null;
      const chapters = buildCustomerTour(ctx, sample);
      if (!chapterId) {
        setRunning([...chapters, buildCustomerFinale(ctx)]);
      } else {
        const chapter = chapters.find((c) => c.id === chapterId);
        // A single chapter skips the welcome card and starts on the real screen.
        if (chapter) setRunning([{ ...chapter, steps: chapter.steps.filter((s) => !s.secondary) }]);
      }
      setStarting(false);
    },
    [starting, location, ctx],
  );

  // Offer it once, on the home screen, as soon as the screen is clear (it stays clear for a beat first).
  useEffect(() => {
    if (!active || running || starting || seenBefore || pathname !== "/") return;
    let clearTicks = 0;
    const timer = setInterval(() => {
      clearTicks = screenIsClear() ? clearTicks + 1 : 0;
      if (clearTicks >= 3) {
        clearInterval(timer);
        void start();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [active, running, starting, seenBefore, pathname, start]);

  useEffect(
    () =>
      onOpenCustomerTour((chapterId) => {
        if (chapterId === "all") void start();
        else if (chapterId) void start(chapterId);
        else setPickerOpen(true);
      }),
    [start],
  );

  /** Opens whatever a step needs. True when a new page has to load first. */
  const navigate = useCallback(
    (step: TourStep): boolean => {
      if (step.route) {
        const changed = here() !== step.route;
        if (changed) router.push(step.route);
        if (step.providerTab) {
          const tab = step.providerTab;
          // Once now (page already open), and again in case it's still mounting.
          openProviderTab(tab);
          setTimeout(() => openProviderTab(tab), 700);
        }
        return changed;
      }
      if (step.exploreSegment) openExploreSegment(step.exploreSegment);
      openMainTab(step.tab);
      if (window.location.pathname !== "/") {
        router.push("/");
        return true;
      }
      return false;
    },
    [router],
  );

  const close = useCallback(
    ({ completedChapters, finished }: { completedChapters: string[]; finished: boolean }) => {
      recordCustomerTour(owner, completedChapters.filter((c) => c !== "finale"), !finished);
      setRunning(null);
      openMainTab("home");
      if (window.location.pathname !== "/") router.push("/");
    },
    [owner, router],
  );

  if (!active) return null;

  return (
    <>
      {running && <SpotlightTour chapters={running} onNavigate={navigate} onClose={close} />}
      <TourPicker
        opened={pickerOpen}
        onClose={() => setPickerOpen(false)}
        chapters={pickerChapters}
        done={new Set([...(mine?.chapters ?? []), ...(asGuest?.chapters ?? [])])}
        onStartAll={() => void start()}
        onStartChapter={(id) => void start(id)}
        fullTourBlurb="Every screen, plus a real business and product page"
        gradient="linear-gradient(135deg, #F59E0B, #F97316 50%, #6366F1)"
      />
    </>
  );
}
