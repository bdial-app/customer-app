import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthResponse } from "@/services/auth.service";
import {
  getTokenSync,
  getUserSync,
  setItem,
  removeItem,
  setTokenCache,
  setUserCache,
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
      // Persist to platform storage (async, fire-and-forget)
      const token = state.token;
      const user = state.user;
      if (token) {
        setTokenCache(token);
        setItem("token", token);
      }
      if (user) {
        const userJson = JSON.stringify(user);
        setUserCache(userJson);
        setItem("user", userJson);
      }
    },
    // Sets only the user profile — usually after PATCH /users/me
    setProfile(state, action: PayloadAction<AuthResponse["user"]>) {
      state.user = action.payload;
      const userJson = JSON.stringify(state.user);
      setUserCache(userJson);
      setItem("user", userJson);
    },
    // Sets only the token
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      setTokenCache(state.token);
      setItem("token", state.token);
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      setTokenCache(null);
      setUserCache(null);
      removeItem("token");
      removeItem("user");
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
