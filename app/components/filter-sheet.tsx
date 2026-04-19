"use client";
import { useState, useCallback } from "react";
import {
  Button,
  List,
  ListItem,
  Sheet,
  Toolbar,
  Link,
  Navbar,
  Preloader,
} from "konsta/react";
import { IonIcon } from "@ionic/react";
import { chevronDown, chevronForward, checkmarkCircle } from "ionicons/icons";
import { useAllCategories } from "@/hooks/useCategories";
import { Category } from "@/services/category.service";

interface FilterSheetProps {
  opened: boolean;
  selectedFilters: Set<string>;
  onClose: () => void;
  onApply: (filters: Set<string>) => void;
}

type ParentState = "none" | "some" | "all";

// Fallback icon mapping for API categories
const apiIconMapping: Record<string, string> = {
  "Bohri Ridha & Burka Tailoring": "👔",
  "Tuition & Classes": "📚",
  "Beauty & Mehandi": "💅",
  "Jewellery & Accessories": "💍",
  Others: "➕",
};

const getChildIds = (category: Category): string[] => {
  return category.children?.map((c) => c.id) ?? [];
};

const FilterSheet = ({
  opened,
  selectedFilters,
  onClose,
  onApply,
}: FilterSheetProps) => {
  const { data: categoryResponse, isLoading } = useAllCategories(1, 100);
  const categories =
    categoryResponse?.data.filter((c) => c.parentId === null) ?? [];

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [tempFilters, setTempFilters] = useState<Set<string>>(
    new Set(selectedFilters),
  );

  // Sync temp filters when sheet opens
  const handleOpen = useCallback(() => {
    setTempFilters(new Set(selectedFilters));
  }, [selectedFilters]);

  // --- Expand / Collapse ---
  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  }, []);

  // --- Select / Deselect a child filter ---
  const toggleChildFilter = useCallback((childId: string) => {
    setTempFilters((prev) => {
      const next = new Set(prev);
      next.has(childId) ? next.delete(childId) : next.add(childId);
      return next;
    });
  }, []);

  // --- Select / Deselect ALL children of a parent ---
  const toggleParentFilter = useCallback((category: Category) => {
    setTempFilters((prev) => {
      const next = new Set(prev);
      const childIds = getChildIds(category);
      const allSelected = childIds.every((id) => next.has(id));

      if (allSelected) {
        childIds.forEach((id) => next.delete(id));
        next.delete(category.id);
      } else {
        childIds.forEach((id) => next.add(id));
        next.add(category.id);
      }
      return next;
    });
  }, []);

  // --- Parent selection state ---
  const getParentState = useCallback(
    (category: Category): ParentState => {
      const childIds = getChildIds(category);
      if (childIds.length === 0)
        return tempFilters.has(category.id) ? "all" : "none";
      const selectedCount = childIds.filter((id) => tempFilters.has(id)).length;
      if (selectedCount === 0) return "none";
      if (selectedCount === childIds.length) return "all";
      return "some";
    },
    [tempFilters],
  );

  return (
    <Sheet
      className="pb-safe"
      opened={opened}
      onBackdropClick={onClose}
      onOpen={handleOpen}
      style={{ maxHeight: "85vh" }}
    >
      {/* Header */}
      {/* Scrollable Category List */}
      <div
        className="overflow-auto ios:mt-2 min-h-[300px]"
        style={{ maxHeight: "calc(85vh - 140px)" }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Preloader />
          </div>
        ) : (
          categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const parentState = getParentState(category);
            const icon = apiIconMapping[category.name] || "📂";

            return (
              <div key={category.id} className="mb-1">
                {/* Parent Row */}
                <List strongIos insetIos className="my-0!">
                  <ListItem
                    className="cursor-pointer"
                    title={
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{icon}</span>
                        <span className="font-medium text-[15px]">
                          {category.name}
                        </span>
                      </div>
                    }
                    after={
                      <div className="flex items-center gap-2">
                        {parentState !== "none" &&
                          getChildIds(category).length > 0 && (
                            <div
                              className="text-[12px] font-medium px-1.5 py-0.5 rounded-full"
                              style={
                                {
                                  // background:
                                  //   parentState === "all"
                                  //     ? "rgba(0,122,255,0.12)"
                                  //     : "rgba(0,122,255,0.08)",
                                  // color: "#007AFF",
                                }
                              }
                            >
                              {parentState === "all" ? (
                                <IonIcon
                                  icon={checkmarkCircle}
                                  style={{ fontSize: "20px", color: "#007AFF" }}
                                />
                              ) : (
                                `${getChildIds(category).filter((id) => tempFilters.has(id)).length}`
                              )}
                            </div>
                          )}
                        {getChildIds(category).length > 0 ? (
                          <IonIcon
                            icon={isExpanded ? chevronDown : chevronForward}
                            style={{
                              fontSize: "16px",
                              color: "#C7C7CC",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        ) : (
                          <IonIcon
                            icon={checkmarkCircle}
                            style={{
                              fontSize: "22px",
                              color: tempFilters.has(category.id)
                                ? "#007AFF"
                                : "#D1D1D6",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChildFilter(category.id);
                            }}
                          />
                        )}
                      </div>
                    }
                    onClick={() =>
                      getChildIds(category).length > 0
                        ? toggleExpand(category.id)
                        : toggleChildFilter(category.id)
                    }
                  />
                </List>

                {/* Children — collapsible */}
                {getChildIds(category).length > 0 && (
                  <div
                    style={{
                      maxHeight: isExpanded
                        ? `${(category.children?.length ?? 0) * 56 + 50}px`
                        : "0px",
                      overflow: "hidden",
                      transition:
                        "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <List strongIos insetIos className="my-0! ml-4!">
                      {/* Select All */}
                      <ListItem
                        className="cursor-pointer px-1!"
                        title={
                          <span
                            className="text-[14px] font-medium"
                            style={{ color: "#007AFF" }}
                          >
                            {parentState === "all"
                              ? "Deselect All"
                              : "Select All"}
                          </span>
                        }
                        onClick={() => toggleParentFilter(category)}
                      />

                      {category.children?.map((child) => {
                        const isSelected = tempFilters.has(child.id);
                        return (
                          <ListItem
                            key={child.id}
                            className="cursor-pointer"
                            title={
                              <div className="flex items-center gap-2.5">
                                <span className="text-[15px]">
                                  {child.name}
                                </span>
                              </div>
                            }
                            after={
                              <IonIcon
                                icon={checkmarkCircle}
                                style={{
                                  fontSize: "22px",
                                  color: isSelected ? "#007AFF" : "#D1D1D6",
                                  transition:
                                    "color 0.2s ease, transform 0.15s ease",
                                  transform: isSelected
                                    ? "scale(1)"
                                    : "scale(0.85)",
                                }}
                              />
                            }
                            onClick={() => toggleChildFilter(child.id)}
                          />
                        );
                      })}
                    </List>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Apply Button */}
      <div className="px-4 pb-4 pt-2">
        <Button
          large
          rounded
          onClick={() => onApply(tempFilters)}
          className="font-semibold"
        >
          {tempFilters.size > 0
            ? `Apply Filters (${tempFilters.size})`
            : "Show All Results"}
        </Button>
      </div>
    </Sheet>
  );
};

export default FilterSheet;
