import apiClient from "@/utils/axios";
import { NOTIFICATION_URLS } from "@/utils/urls";

// ─── Types ─────────────────────────────────────

export type NotificationType =
  | "chat_message"
  | "review_received"
  | "provider_status"
  | "verification_update"
  | "booking_update"
  | "promotional"
  | "system_announcement"
  | "report_update"
  | "new_enquiry";

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string | null;
  source: "system" | "admin";
  batchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  pushEnabled: boolean;
  chatMessages: boolean;
  reviewsReceived: boolean;
  providerStatusUpdates: boolean;
  verificationUpdates: boolean;
  bookingUpdates: boolean;
  promotional: boolean;
  systemAnnouncements: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── API Calls ─────────────────────────────────

export async function getNotifications(
  page = 1,
  limit = 20,
  type?: string,
  status?: "all" | "read" | "unread"
): Promise<PaginatedResponse<NotificationItem>> {
  const params: Record<string, any> = { page, limit };
  if (type) params.type = type;
  if (status && status !== "all") params.status = status;
  const { data } = await apiClient.get(NOTIFICATION_URLS.LIST, { params });
  return data;
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const { data } = await apiClient.get(NOTIFICATION_URLS.UNREAD_COUNT);
  return data;
}

export async function markAsRead(notificationId: string): Promise<void> {
  await apiClient.patch(NOTIFICATION_URLS.MARK_READ(notificationId));
}

export async function markAllAsRead(): Promise<{ updated: number }> {
  const { data } = await apiClient.patch(NOTIFICATION_URLS.MARK_ALL_READ);
  return data;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(NOTIFICATION_URLS.DELETE(notificationId));
}

export async function getPreferences(): Promise<NotificationPreferences> {
  const { data } = await apiClient.get(NOTIFICATION_URLS.PREFERENCES);
  return data;
}

export async function updatePreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const { data } = await apiClient.patch(NOTIFICATION_URLS.PREFERENCES, prefs);
  return data;
}

export async function registerDevice(
  token: string,
  platform: "web" | "android" | "ios" = "web",
  deviceInfo?: Record<string, any>
): Promise<void> {
  await apiClient.post(NOTIFICATION_URLS.REGISTER_DEVICE, {
    token,
    platform,
    deviceInfo,
  });
}

export async function unregisterDevice(token: string): Promise<void> {
  await apiClient.delete(NOTIFICATION_URLS.UNREGISTER_DEVICE, {
    data: { token },
  });
}
