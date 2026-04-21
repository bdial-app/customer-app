import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthResponse } from "@/services/auth.service";

interface AuthState {
  user: AuthResponse["user"] | null;
  token: string | null;
  hasSkippedAuth: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  hasSkippedAuth: false,
};

function hydrateFromStorage(): Partial<AuthState> {
  if (typeof window === "undefined") return {};
  try {
    const storedUser = localStorage.getItem("user");
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      token: localStorage.getItem("token") ?? null,
      hasSkippedAuth: localStorage.getItem("skippedAuth") === "true",
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
    },
    // Sets only the user profile — usually after PATCH /users/me
    setProfile(state, action: PayloadAction<AuthResponse["user"]>) {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    // Sets only the token
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem("token", state.token);
    },
    setSkippedAuth(state, action: PayloadAction<boolean>) {
      state.hasSkippedAuth = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("skippedAuth", String(action.payload));
      }
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.hasSkippedAuth = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("skippedAuth");
      }
    },
    hydrateAuth(state) {
      const stored = hydrateFromStorage();
      if (stored.user !== undefined) state.user = stored.user;
      if (stored.token !== undefined) state.token = stored.token;
      if (stored.hasSkippedAuth !== undefined)
        state.hasSkippedAuth = stored.hasSkippedAuth;
    },
  },
});

export const {
  setUser,
  setProfile,
  setToken,
  clearUser,
  setSkippedAuth,
  hydrateAuth,
} = authSlice.actions;
export default authSlice.reducer;
