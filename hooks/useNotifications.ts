import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} from "@/services/notification.service";
import type { NotificationPreferences } from "@/services/notification.service";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { setNotificationCounts, decrementUnread, clearUnread } from "@/store/slices/notificationSlice";
import { useAppContext } from "@/app/context/AppContext";

const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number, type?: string, status?: string, targetMode?: string) =>
    [...notificationKeys.all, "list", page, type, status, targetMode] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  preferences: ["notifications", "preferences"] as const,
};

export function useNotifications(page = 1, type?: string, status?: "all" | "read" | "unread") {
  const { userMode } = useAppContext();
  return useQuery({
    queryKey: notificationKeys.list(page, type, status, userMode),
    queryFn: () => getNotifications(page, 20, type, status, userMode),
  });
}

export function useUnreadCount() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const [customerResult, providerResult] = await Promise.all([
        getUnreadCount("customer"),
        getUnreadCount("provider"),
      ]);
      dispatch(setNotificationCounts({
        customer: customerResult.count,
        provider: providerResult.count,
      }));
      return { customer: customerResult.count, provider: providerResult.count };
    },
    refetchInterval: 60_000, // Poll every 60s
    refetchOnWindowFocus: true,
    enabled: !!user,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const { userMode } = useAppContext();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      dispatch(decrementUnread(userMode));
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const { userMode } = useAppContext();

  return useMutation({
    mutationFn: () => markAllAsRead(userMode),
    onSuccess: () => {
      dispatch(clearUnread(userMode));
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: getPreferences,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) => updatePreferences(prefs),
    onMutate: async (newPrefs) => {
      await qc.cancelQueries({ queryKey: notificationKeys.preferences });
      const previous = qc.getQueryData<NotificationPreferences>(notificationKeys.preferences);
      qc.setQueryData<NotificationPreferences>(notificationKeys.preferences, (old) =>
        old ? { ...old, ...newPrefs } : (newPrefs as NotificationPreferences),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(notificationKeys.preferences, context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.preferences });
    },
  });
}
