import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TypingUser {
  userName: string;
  timestamp: number;
}

interface ChatState {
  totalUnreadCount: number;
  customerUnreadCount: number;
  providerUnreadCount: number;
  activeConversationId: string | null;
  typingUsers: Record<string, TypingUser>; // keyed by `${conversationId}:${userId}`
  /** Set when navigating to a specific chat from outside the home page */
  pendingChatOpen: string | null;
}

const initialState: ChatState = {
  totalUnreadCount: 0,
  customerUnreadCount: 0,
  providerUnreadCount: 0,
  activeConversationId: null,
  typingUsers: {},
  pendingChatOpen: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<{ total: number; customer: number; provider: number }>) {
      state.totalUnreadCount = action.payload.total;
      state.customerUnreadCount = action.payload.customer;
      state.providerUnreadCount = action.payload.provider;
    },
    incrementUnread(state, action: PayloadAction<"customer" | "provider" | undefined>) {
      state.totalUnreadCount += 1;
      if (action.payload === "provider") state.providerUnreadCount += 1;
      else state.customerUnreadCount += 1;
    },
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    setTyping(
      state,
      action: PayloadAction<{
        conversationId: string;
        userId: string;
        userName: string;
        isTyping: boolean;
      }>
    ) {
      const key = `${action.payload.conversationId}:${action.payload.userId}`;
      if (action.payload.isTyping) {
        state.typingUsers[key] = {
          userName: action.payload.userName,
          timestamp: Date.now(),
        };
      } else {
        delete state.typingUsers[key];
      }
    },
    clearAllTyping(state) {
      state.typingUsers = {};
    },
    openChat(state, action: PayloadAction<string>) {
      state.pendingChatOpen = action.payload;
    },
    clearPendingChat(state) {
      state.pendingChatOpen = null;
    },
  },
});

export const {
  setUnreadCount,
  incrementUnread,
  setActiveConversation,
  setTyping,
  clearAllTyping,
  openChat,
  clearPendingChat,
} = chatSlice.actions;

export default chatSlice.reducer;
