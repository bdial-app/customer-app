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

      const previousItems = queryClient.getQueryData<SavedItemData[]>(["saved-items"]);
      const previousIds = queryClient.getQueryData<SavedItemId[]>(["saved-item-ids"]);

      // Optimistically remove from saved-items list
      queryClient.setQueryData<SavedItemData[]>(["saved-items"], (old = []) =>
        old.filter((i) => !(i.itemId === itemId && i.itemType === itemType)),
      );

      // Optimistically remove from saved-item-ids list
      queryClient.setQueryData<SavedItemId[]>(["saved-item-ids"], (old = []) =>
        old.filter((i) => !(i.itemId === itemId && i.itemType === itemType)),
      );

      return { previousItems, previousIds };
    },

    onError: (_err, _variables, context) => {
      // Rollback on failure
      if (context?.previousItems !== undefined)
        queryClient.setQueryData(["saved-items"], context.previousItems);
      if (context?.previousIds !== undefined)
        queryClient.setQueryData(["saved-item-ids"], context.previousIds);
    },

    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      queryClient.invalidateQueries({ queryKey: ["saved-item-ids"] });
      queryClient.invalidateQueries({
        queryKey: ["saved-check", variables.itemId, variables.itemType],
      });
    },
  });
};
