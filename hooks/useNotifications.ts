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
import { useAppDispatch } from "@/hooks/useAppStore";
import { setUnreadCount, decrementUnread, clearUnread } from "@/store/slices/notificationSlice";

const notificationKeys = {
  all: ["notifications"] as const,
  list: (page: number, type?: string, status?: string) =>
    [...notificationKeys.all, "list", page, type, status] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  preferences: ["notifications", "preferences"] as const,
};

export function useNotifications(page = 1, type?: string, status?: "all" | "read" | "unread") {
  return useQuery({
    queryKey: notificationKeys.list(page, type, status),
    queryFn: () => getNotifications(page, 20, type, status),
  });
}

export function useUnreadCount() {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: async () => {
      const result = await getUnreadCount();
      dispatch(setUnreadCount(result.count));
      return result;
    },
    refetchInterval: 60_000, // Poll every 60s
    refetchOnWindowFocus: true,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      dispatch(decrementUnread());
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      dispatch(clearUnread());
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.preferences });
    },
  });
}
