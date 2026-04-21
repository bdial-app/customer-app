import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  toggleSavedItem,
  getSavedItems,
  getSavedItemIds,
  checkSavedItem,
  SavedItemData,
  SavedItemId,
} from "@/services/saved-item.service";
import { useAppSelector } from "./useAppStore";

export const useSavedItems = () => {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery<SavedItemData[]>({
    queryKey: ["saved-items"],
    queryFn: getSavedItems,
    enabled: !!user,
    staleTime: 60_000,
  });
};

export const useSavedItemIds = () => {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery<SavedItemId[]>({
    queryKey: ["saved-item-ids"],
    queryFn: () => getSavedItemIds(),
    enabled: !!user,
    staleTime: 30_000,
  });
};

export const useIsSaved = (
  itemId: string,
  itemType: "provider" | "product",
) => {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery<{ saved: boolean }>({
    queryKey: ["saved-check", itemId, itemType],
    queryFn: () => checkSavedItem(itemId, itemType),
    enabled: !!user && !!itemId,
    staleTime: 30_000,
  });
};

export const useToggleSaved = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      itemType,
    }: {
      itemId: string;
      itemType: "provider" | "product";
    }) => toggleSavedItem(itemId, itemType),
    onSuccess: (_data, variables) => {
      // Invalidate all saved-related queries
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      queryClient.invalidateQueries({ queryKey: ["saved-item-ids"] });
      queryClient.invalidateQueries({
        queryKey: ["saved-check", variables.itemId, variables.itemType],
      });
    },
  });
};
