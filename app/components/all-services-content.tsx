"use client";
import { useState, useMemo, useCallback } from "react";
import { Navbar, Page, List, ListInput, Block } from "konsta/react";
import { IonIcon } from "@ionic/react";
import { arrowBack, filter, search } from "ionicons/icons";
import { useRouter } from "next/navigation";

import { ALL_PROVIDERS } from "../data/providers";
import ProviderList from "../components/provider-list";
import FilterChips from "../components/filter-chips";
import FilterSheet from "../components/filter-sheet";
import EmptyState from "../components/empty-state";
import InfiniteScroll from "../components/infinite-scroll";
import { useReverseGeocode } from "@/hooks/useGeocode";
import { useNearbyProviders } from "@/hooks/useProvider";
import { useAppSelector } from "@/hooks/useAppStore";
import { useDebounce } from "@/hooks/useDebounce"; // Need to ensure this exists or create it

const AllServicesContent = ({ isSheet = false }: { isSheet?: boolean }) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [sheetOpened, setSheetOpened] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(
    new Set(),
  );

  const user = useAppSelector((state) => state.auth.user as any);

  // Fetch address metadata to keep providers in sync with the current location
  const { data: addressData } = useReverseGeocode(
    user?.latitude && user?.longitude
      ? { lat: user.latitude, lng: user.longitude }
      : null,
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isProvidersLoading,
  } = useNearbyProviders({
    lat: user?.latitude || 18.5204,
    lng: user?.longitude || 73.8567,
    search: debouncedSearch,
    city: addressData?.city, // Re-trigger when city is resolved
    categoryIds: Array.from(selectedFilters),
    limit: 10,
    radius: 10,
  });

  const providers = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) =>
      page.data.map((p: any) => ({
        ...p,
        name: p.brandName,
        image:
          p.profilePhotoUrl ||
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
        location: `${p.area}, ${p.city}`,
        rating: 4.5, // Mock until added to API
        reviews: 0,
        service: p.description.split(",")[0] || "Services",
      })),
    );
  }, [data]);

  const activeFilterCount = selectedFilters.size;

  // --- Callbacks ---
  const handleRemoveFilter = useCallback((filterId: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      next.delete(filterId);
      return next;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedFilters(new Set());
  }, []);

  const handleApplyFilters = useCallback((filters: Set<string>) => {
    setSelectedFilters(new Set(filters));
    setSheetOpened(false);
  }, []);

  return (
    <Page
      style={{
        background: "radial-gradient(at 0% 10%, #f0eff4, #f0ecff)",
      }}
    >
      <Navbar
        centerTitle={false}
        title="All Services"
        titleClassName="ml-2"
        innerClassName="justify-start"
        leftClassName="w-11"
        className="mb-0!"
        left={
          <a onClick={() => router.back()}>
            <IonIcon icon={arrowBack} />
          </a>
        }
        subnavbarClassName="w-full !px-0 mt-4"
        subnavbar={
          <List strongIos insetIos className="flex-1 mt-4! relative">
            <ListInput
              type="text"
              placeholder="Search services or providers..."
              media={<IonIcon icon={search} />}
              autoFocus
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
            <button
              className="absolute top-3 right-4 text-slate-600"
              onClick={() => setSheetOpened(true)}
            >
              <IonIcon icon={filter} />
              {activeFilterCount > 0 && (
                <div className="h-4 min-w-4 px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full absolute top-[-4px] right-[-8px] flex items-center justify-center">
                  {activeFilterCount}
                </div>
              )}
            </button>
          </List>
        }
      />

      {/* Active Filter Chips */}
      <FilterChips
        selectedFilters={selectedFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Provider Results with Infinite Scroll */}
      {isProvidersLoading ? (
        <Block className="grid grid-cols-2 gap-2 !mt-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`bg-white rounded-md p-2 h-48 animate-pulse ${i % 2 !== 0 ? "relative top-10" : ""}`}
            >
              <div className="w-full h-32 bg-slate-100 rounded-md mb-2"></div>
              <div className="h-4 w-3/4 bg-slate-100 rounded mb-1"></div>
              <div className="h-3 w-1/2 bg-slate-50 rounded"></div>
            </div>
          ))}
        </Block>
      ) : (
        <InfiniteScroll
          hasMore={!!hasNextPage}
          isLoading={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        >
          <ProviderList providerList={providers} />
        </InfiniteScroll>
      )}

      {/* Empty State */}
      {!isProvidersLoading && providers.length === 0 && (
        <EmptyState
          searchQuery={searchQuery}
          activeFilterCount={activeFilterCount}
          onClearSearch={() => setSearchQuery("")}
          onClearFilters={handleClearAllFilters}
        />
      )}

      {/* iOS 17 Filter Sheet */}
      <FilterSheet
        opened={sheetOpened}
        selectedFilters={selectedFilters}
        onClose={() => setSheetOpened(false)}
        onApply={handleApplyFilters}
      />
    </Page>
  );
};

export default AllServicesContent;
