"use client"
import { useState, useMemo, useCallback } from "react";
import { Navbar, Page, List, ListInput } from "konsta/react";
import { IonIcon } from "@ionic/react";
import { arrowBack, filter, search } from "ionicons/icons";
import { useRouter } from "next/navigation";

import { ALL_PROVIDERS } from "../data/providers";
import ProviderList from "../components/provider-list";
import FilterChips from "../components/filter-chips";
import FilterSheet from "../components/filter-sheet";
import EmptyState from "../components/empty-state";

const AllServicesContent = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [sheetOpened, setSheetOpened] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  // --- Filter providers by search + categories ---
  const filteredProviders = useMemo(() => {
    let result = ALL_PROVIDERS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.service.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    if (selectedFilters.size > 0) {
      result = result.filter((p) =>
        p.categories.some((cat) => selectedFilters.has(cat))
      );
    }

    return result;
  }, [searchQuery, selectedFilters]);

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
      />

      {/* Search Bar */}
      <List strongIos insetIos className="mt-4! relative">
        <ListInput
          type="text"
          placeholder="Search services or providers..."
          media={<IonIcon icon={search} />}
          autoFocus
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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

      {/* Active Filter Chips */}
      <FilterChips
        selectedFilters={selectedFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Provider Results */}
      <ProviderList providerList={filteredProviders} />

      {/* Empty State */}
      {filteredProviders.length === 0 && (
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
