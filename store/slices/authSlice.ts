import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthResponse } from "@/services/auth.service";

interface AuthState {
  user: AuthResponse["user"] | null;
  token: string | null;
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

const initialState: AuthState = {
  user: getInitialUser(),
  token: getInitialToken(),
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
    clearUser(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, setProfile, setToken, clearUser } = authSlice.actions;
export default authSlice.reducer;
