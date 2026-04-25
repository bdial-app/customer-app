import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PermissionStatus = "default" | "granted" | "denied" | "unsupported";

interface NotificationState {
  unreadCount: number;
  permissionStatus: PermissionStatus;
  fcmToken: string | null;
  /** Whether the user has been shown the soft prompt this session */
  softPromptShown: boolean;
}

const initialState: NotificationState = {
  unreadCount: 0,
  permissionStatus: "default",
  fcmToken: null,
  softPromptShown: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    decrementUnread(state) {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    clearUnread(state) {
      state.unreadCount = 0;
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
  setUnreadCount,
  decrementUnread,
  clearUnread,
  setPermissionStatus,
  setFcmToken,
  setSoftPromptShown,
} = notificationSlice.actions;

export default notificationSlice.reducer;
