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
  /** No push notifications for this chat (newer APIs). */
  isMuted?: boolean;
  /** Trust line a customer sees about the business (newer APIs). */
  business?: { verified: boolean; rating: number; reviewCount: number; replyMinutes: number | null } | null;
}

/** Free-form message metadata; known keys are used by image and enquiry messages. */
export interface ChatMessageMetadata {
  url?: string;
  storageKey?: string;
  productId?: string;
  productSlug?: string;
  providerSlug?: string;
  productName?: string;
  productImage?: string | null;
  productPrice?: string | number | null;
  productType?: "product" | "service";
  currency?: string;
  /** file */
  fileName?: string;
  size?: number;
  caption?: string | null;
  /** deal */
  offerId?: string;
  providerId?: string;
  title?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number | null;
  endsAt?: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string | null;
  messageType: "text" | "image" | "enquiry" | "system" | "quote_request" | "file" | "product" | "deal";
  metadata: ChatMessageMetadata | null;
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
  initialMessageMetadata?: Record<string, unknown>;
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

/** The customer a business is chatting with (business side only). */
export interface ChatCustomerProfile {
  userId: string;
  name: string;
  memberSince: string;
  lastSeenAt: string | null;
  verified: boolean;
  reviewsWritten: number;
  withYou: {
    firstContactAt: string | null;
    conversations: number;
    askedAbout: { name: string; productId: string | null }[];
    savedYou: boolean;
    review: { rating: number; text: string | null; postedAt: string } | null;
  };
  lead: {
    id: string;
    tier: "hot" | "warm" | "soft" | "cold";
    score: number;
    source: string | null;
    searchQuery: string | null;
    productsViewed: { id: string; name: string }[];
    isUnlocked: boolean;
  } | null;
  /** Only once this business has unlocked them as a lead. */
  contact: { phone: string | null; email: string | null; city: string | null; area: string | null } | null;
}

export async function getChatCustomerProfile(conversationId: string): Promise<ChatCustomerProfile> {
  const res = await apiClient.get(CHAT_URLS.CUSTOMER(conversationId));
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
    messageType?: "text" | "image" | "enquiry" | "quote_request" | "file" | "product" | "deal";
    metadata?: Record<string, unknown>;
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

export async function getUnreadCount(): Promise<{ unreadCount: number; customerUnreadCount: number; providerUnreadCount: number }> {
  const res = await apiClient.get(CHAT_URLS.UNREAD_COUNT);
  return res.data;
}

export async function uploadChatMedia(
  conversationId: string,
  file: File
): Promise<{ url: string; storageKey: string }> {
  const { optimizeImage } = await import("@/utils/compress-image");
  const compressed = await optimizeImage(file, "chat");
  const formData = new FormData();
  formData.append("file", compressed);
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

export async function blockConversation(conversationId: string): Promise<{ success: boolean }> {
  const res = await apiClient.patch(CHAT_URLS.BLOCK(conversationId));
  return res.data;
}

// ─── Mute · quick replies ──────────────────────

export async function setConversationMuted(conversationId: string, muted: boolean): Promise<{ muted: boolean }> {
  const res = await apiClient.patch(CHAT_URLS.MUTE(conversationId), { muted });
  return res.data;
}

export async function getQuickReplies(): Promise<{ replies: string[] }> {
  const res = await apiClient.get(CHAT_URLS.QUICK_REPLIES);
  return res.data;
}

export async function saveQuickReplies(replies: string[]): Promise<{ replies: string[] }> {
  const res = await apiClient.put(CHAT_URLS.QUICK_REPLIES, { replies });
  return res.data;
}
