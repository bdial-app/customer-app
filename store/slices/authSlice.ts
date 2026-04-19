import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthResponse } from "@/services/auth.service";

interface AuthState {
  user: AuthResponse["user"] | null;
  token: string | null;
  hasSkippedAuth: boolean;
}

const getInitialUser = () => {
  if (typeof window !== "undefined") {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getInitialToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const getInitialSkipped = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("skippedAuth") === "true";
  }
  return false;
};

const initialState: AuthState = {
  user: getInitialUser(),
  token: getInitialToken(),
  hasSkippedAuth: getInitialSkipped(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Sets everything (token + user) — usually after login/OTP verify
    setUser(state, action: PayloadAction<AuthResponse>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
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
  },
});

export const { setUser, setProfile, setToken, clearUser, setSkippedAuth } =
  authSlice.actions;
export default authSlice.reducer;
