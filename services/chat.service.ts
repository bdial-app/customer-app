import apiClient from "@/utils/axios";
import { CHAT_URLS } from "@/utils/urls";

// ─── Types ─────────────────────────────────────

export interface ChatParticipant {
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  role: "customer" | "provider" | null;
  providerId: string | null;
}

export interface ConversationListItem {
  id: string;
  type: "direct" | "enquiry";
  contextType: "product" | "provider" | null;
  contextId: string | null;
  contextTitle: string | null;
  contextImageUrl: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  lastMessageStatus: "sent" | "delivered" | "read" | null;
  unreadCount: number;
  createdAt: string;
  otherParticipant: ChatParticipant;
}

export interface ConversationDetail extends ConversationListItem {
  status: "active" | "archived" | "closed";
  myRole: "customer" | "provider" | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string | null;
  messageType: "text" | "image" | "enquiry" | "system" | "quote_request";
  metadata: Record<string, any> | null;
  status: "sent" | "delivered" | "read";
  createdAt: string;
  clientMessageId?: string | null;
}

export interface ConversationsResponse {
  conversations: ConversationListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  oldestTimestamp: string | null;
}

// ─── API Calls ─────────────────────────────────

export async function createConversation(data: {
  providerId: string;
  contextType?: "product" | "provider";
  contextId?: string;
  initialMessage?: string;
  initialMessageMetadata?: Record<string, any>;
}): Promise<ConversationDetail> {
  const res = await apiClient.post(CHAT_URLS.CONVERSATIONS, data);
  return res.data;
}

export async function getConversations(params?: {
  page?: number;
  limit?: number;
  filter?: "all" | "unread" | "enquiries";
  search?: string;
  role?: "customer" | "provider";
}): Promise<ConversationsResponse> {
  const res = await apiClient.get(CHAT_URLS.CONVERSATIONS, { params });
  return res.data;
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const res = await apiClient.get(CHAT_URLS.CONVERSATION(id));
  return res.data;
}

export async function getMessages(
  conversationId: string,
  params?: { limit?: number; before?: string }
): Promise<MessagesResponse> {
  const res = await apiClient.get(CHAT_URLS.MESSAGES(conversationId), { params });
  return res.data;
}

export async function sendMessage(
  conversationId: string,
  data: {
    content?: string;
    messageType?: "text" | "image" | "enquiry" | "quote_request";
    metadata?: Record<string, any>;
    clientMessageId?: string;
  }
): Promise<ChatMessage> {
  const res = await apiClient.post(CHAT_URLS.MESSAGES(conversationId), data);
  return res.data;
}

export async function markAsRead(
  conversationId: string,
  upToMessageId?: string
): Promise<{ success: boolean; messagesRead: number }> {
  const res = await apiClient.patch(CHAT_URLS.MARK_READ(conversationId), {
    upToMessageId,
  });
  return res.data;
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  const res = await apiClient.get(CHAT_URLS.UNREAD_COUNT);
  return res.data;
}

export async function uploadChatMedia(
  conversationId: string,
  file: File
): Promise<{ url: string; storageKey: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post(CHAT_URLS.UPLOAD_MEDIA(conversationId), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function sendTypingIndicator(
  conversationId: string,
  isTyping: boolean
): Promise<void> {
  await apiClient.post(CHAT_URLS.TYPING(conversationId), { isTyping });
}

// ─── Presence / Online Status ──────────────────

export interface PresenceInfo {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export async function sendHeartbeat(): Promise<void> {
  await apiClient.post(CHAT_URLS.HEARTBEAT);
}

export async function getPresence(userId: string): Promise<PresenceInfo> {
  const res = await apiClient.get(CHAT_URLS.PRESENCE(userId));
  return res.data;
}

export async function archiveConversation(conversationId: string): Promise<{ success: boolean }> {
  const res = await apiClient.patch(CHAT_URLS.ARCHIVE(conversationId));
  return res.data;
}
