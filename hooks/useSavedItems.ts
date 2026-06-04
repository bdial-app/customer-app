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

    onMutate: async ({ itemId, itemType }) => {
      // Cancel in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["saved-items"] });
      await queryClient.cancelQueries({ queryKey: ["saved-item-ids"] });
      await queryClient.cancelQueries({ queryKey: ["saved-check", itemId, itemType] });

      // Snapshot all relevant caches for rollback
      const previousItems = queryClient.getQueryData<SavedItemData[]>(["saved-items"]);
      const previousIds = queryClient.getQueryData<SavedItemId[]>(["saved-item-ids"]);
      const previousCheck = queryClient.getQueryData<{ saved: boolean }>(["saved-check", itemId, itemType]);

      // Determine current saved state from whichever cache is available
      const idsCache = previousIds ?? [];
      const currentlySaved =
        previousCheck?.saved ??
        idsCache.some((i) => i.itemId === itemId && i.itemType === itemType);

      const nextSaved = !currentlySaved;

      // Optimistically flip the per-item saved-check cache (used by detail pages)
      queryClient.setQueryData<{ saved: boolean }>(
        ["saved-check", itemId, itemType],
        { saved: nextSaved },
      );

      // Optimistically update the ids list (used by explore / card grids)
      queryClient.setQueryData<SavedItemId[]>(["saved-item-ids"], (old = []) =>
        nextSaved
          ? [...old.filter((i) => !(i.itemId === itemId && i.itemType === itemType)), { itemId, itemType }]
          : old.filter((i) => !(i.itemId === itemId && i.itemType === itemType)),
      );

      // Optimistically remove from full saved-items list when unsaving
      // (we don't have full item data to add when saving — server provides it)
      if (!nextSaved) {
        queryClient.setQueryData<SavedItemData[]>(["saved-items"], (old = []) =>
          old.filter((i) => !(i.itemId === itemId && i.itemType === itemType)),
        );
      }

      return { previousItems, previousIds, previousCheck };
    },

    onError: (_err, variables, context) => {
      // Rollback all caches on failure
      if (context?.previousItems !== undefined)
        queryClient.setQueryData(["saved-items"], context.previousItems);
      if (context?.previousIds !== undefined)
        queryClient.setQueryData(["saved-item-ids"], context.previousIds);
      if (context?.previousCheck !== undefined)
        queryClient.setQueryData(["saved-check", variables.itemId, variables.itemType], context.previousCheck);
    },

    onSettled: (_data, _err, variables) => {
      // Background re-sync to ensure consistency after the API call
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      queryClient.invalidateQueries({ queryKey: ["saved-item-ids"] });
      queryClient.invalidateQueries({
        queryKey: ["saved-check", variables.itemId, variables.itemType],
      });
    },
  });
};
