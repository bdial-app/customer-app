"use client"
import { useState, useCallback } from "react";
import { Button, List, ListItem, Sheet, Toolbar, ToolbarPane, Link } from "konsta/react";
import { IonIcon } from "@ionic/react";
import { close, chevronDown, chevronForward, checkmarkCircle } from "ionicons/icons";
import { Category, CATEGORIES, getChildIds } from "../data/categories";

interface FilterSheetProps {
  opened: boolean;
  selectedFilters: Set<string>;
  onClose: () => void;
  onApply: (filters: Set<string>) => void;
}

type ParentState = "none" | "some" | "all";

const FilterSheet = ({ opened, selectedFilters, onClose, onApply }: FilterSheetProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [tempFilters, setTempFilters] = useState<Set<string>>(new Set(selectedFilters));

  // Sync temp filters when sheet opens
  const handleOpen = useCallback(() => {
    setTempFilters(new Set(selectedFilters));
  }, [selectedFilters]);

  // Keep temp in sync when selectedFilters changes while closed
  if (opened && tempFilters !== selectedFilters) {
    // This is handled by the parent calling with new selectedFilters
  }

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

  // --- Reset ---
  const resetFilters = useCallback(() => {
    setTempFilters(new Set());
  }, []);

  // --- Parent selection state ---
  const getParentState = useCallback(
    (category: Category): ParentState => {
      const childIds = getChildIds(category);
      if (childIds.length === 0) return "none";
      const selectedCount = childIds.filter((id) => tempFilters.has(id)).length;
      if (selectedCount === 0) return "none";
      if (selectedCount === childIds.length) return "all";
      return "some";
    },
    [tempFilters]
  );

  return (
    <Sheet
      className="pb-safe"
      opened={opened}
      onBackdropClick={onClose}
      style={{ maxHeight: "85vh" }}
    >
      {/* Header */}
      <Toolbar top className="justify-between ios:pt-4">
        <ToolbarPane>
          <Link onClick={resetFilters}>
            <span style={{ color: "#007AFF", fontSize: "15px" }}>Reset</span>
          </Link>
        </ToolbarPane>
        <ToolbarPane>
          <span className="font-semibold text-base">Filters</span>
        </ToolbarPane>
        <ToolbarPane>
          <Link iconOnly onClick={onClose}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "rgba(120,120,128,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IonIcon icon={close} style={{ fontSize: "18px", color: "#8e8e93" }} />
            </div>
          </Link>
        </ToolbarPane>
      </Toolbar>

      {/* Scrollable Category List */}
      <div className="overflow-auto ios:mt-2" style={{ maxHeight: "calc(85vh - 140px)" }}>
        {CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const parentState = getParentState(category);

          return (
            <div key={category.id} className="mb-1">
              {/* Parent Row */}
              <List strongIos insetIos className="my-0!">
                <ListItem
                  className="cursor-pointer"
                  title={
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium text-[15px]">{category.name}</span>
                    </div>
                  }
                  after={
                    <div className="flex items-center gap-2">
                      {parentState !== "none" && (
                        <span
                          className="text-[12px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            background: parentState === "all" ? "rgba(0,122,255,0.12)" : "rgba(0,122,255,0.08)",
                            color: "#007AFF",
                          }}
                        >
                          {parentState === "all"
                            ? "All"
                            : `${getChildIds(category).filter((id) => tempFilters.has(id)).length}`}
                        </span>
                      )}
                      <IonIcon
                        icon={isExpanded ? chevronDown : chevronForward}
                        style={{
                          fontSize: "16px",
                          color: "#C7C7CC",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </div>
                  }
                  onClick={() => toggleExpand(category.id)}
                />
              </List>

              {/* Children — collapsible */}
              <div
                style={{
                  maxHeight: isExpanded ? `${(category.children?.length ?? 0) * 56 + 20}px` : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <List strongIos insetIos className="my-0! ml-4!">
                  {/* Select All */}
                  <ListItem
                    className="cursor-pointer"
                    title={
                      <span className="text-[14px] font-medium" style={{ color: "#007AFF" }}>
                        {parentState === "all" ? "Deselect All" : "Select All"}
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
                            <span className="text-base">{child.icon}</span>
                            <span className="text-[15px]">{child.name}</span>
                          </div>
                        }
                        after={
                          <IonIcon
                            icon={checkmarkCircle}
                            style={{
                              fontSize: "22px",
                              color: isSelected ? "#007AFF" : "#D1D1D6",
                              transition: "color 0.2s ease, transform 0.15s ease",
                              transform: isSelected ? "scale(1)" : "scale(0.85)",
                            }}
                          />
                        }
                        onClick={() => toggleChildFilter(child.id)}
                      />
                    );
                  })}
                </List>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Button */}
      <div className="px-4 pb-4 pt-2">
        <Button large rounded onClick={() => onApply(tempFilters)} className="font-semibold">
          {tempFilters.size > 0 ? `Apply Filters (${tempFilters.size})` : "Show All Results"}
        </Button>
      </div>
    </Sheet>
  );
};

export default FilterSheet;
