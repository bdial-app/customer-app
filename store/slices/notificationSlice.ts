import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PermissionStatus = "default" | "granted" | "denied" | "unsupported";

interface NotificationState {
  customerUnreadCount: number;
  providerUnreadCount: number;
  permissionStatus: PermissionStatus;
  fcmToken: string | null;
  /** Whether the user has been shown the soft prompt this session */
  softPromptShown: boolean;
}

const initialState: NotificationState = {
  customerUnreadCount: 0,
  providerUnreadCount: 0,
  permissionStatus: "default",
  fcmToken: null,
  softPromptShown: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotificationCounts(state, action: PayloadAction<{ customer: number; provider: number }>) {
      state.customerUnreadCount = action.payload.customer;
      state.providerUnreadCount = action.payload.provider;
    },
    decrementUnread(state, action: PayloadAction<"customer" | "provider">) {
      const key = action.payload === "provider" ? "providerUnreadCount" : "customerUnreadCount";
      if (state[key] > 0) state[key] -= 1;
    },
    clearUnread(state, action: PayloadAction<"customer" | "provider">) {
      const key = action.payload === "provider" ? "providerUnreadCount" : "customerUnreadCount";
      state[key] = 0;
    },
    setPermissionStatus(state, action: PayloadAction<PermissionStatus>) {
      state.permissionStatus = action.payload;
    },
    setFcmToken(state, action: PayloadAction<string | null>) {
      state.fcmToken = action.payload;
    },
    setSoftPromptShown(state) {
      state.softPromptShown = true;
    },
  },
});

export const {
  setNotificationCounts,
  decrementUnread,
  clearUnread,
  setPermissionStatus,
  setFcmToken,
  setSoftPromptShown,
} = notificationSlice.actions;

export default notificationSlice.reducer;
