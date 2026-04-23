import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import locationReducer from "./slices/locationSlice";
import chatReducer from "./slices/chatSlice";
import searchReducer from "./slices/searchSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    chat: chatReducer,
    search: searchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
