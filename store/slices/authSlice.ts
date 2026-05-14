import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthResponse } from "@/services/auth.service";
import {
  getTokenSync,
  getUserSync,
  setItemSync,
  removeItemSync,
} from "@/utils/storage";

interface AuthState {
  user: AuthResponse["user"] | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
};

function hydrateFromStorage(): Partial<AuthState> {
  if (typeof window === "undefined") return {};
  try {
    const storedUser = getUserSync();
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: getTokenSync() ?? null,
    };
  } catch {
    return {};
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Sets everything (token + user) — usually after login/OTP verify
    setUser(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.token = action.payload.token ?? action.payload.accessToken ?? null;
      if (state.token) setItemSync("token", state.token);
      if (state.user) setItemSync("user", JSON.stringify(state.user));
    },
    // Sets only the user profile — usually after PATCH /users/me
    setProfile(state, action: PayloadAction<AuthResponse["user"]>) {
      state.user = action.payload;
      setItemSync("user", JSON.stringify(state.user));
    },
    // Sets only the token
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      setItemSync("token", state.token);
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      removeItemSync("token");
      removeItemSync("user");
      removeItemSync("tijarah_user_mode");
      removeItemSync("tijarah_provider_status");
    },
    hydrateAuth(state) {
      const stored = hydrateFromStorage();
      if (stored.user !== undefined) state.user = stored.user;
      if (stored.token !== undefined) state.token = stored.token;
    },
  },
});

export const {
  setUser,
  setProfile,
  setToken,
  clearUser,
  hydrateAuth,
} = authSlice.actions;
export default authSlice.reducer;
