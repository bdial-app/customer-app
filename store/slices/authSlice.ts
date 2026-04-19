import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthResponse } from "@/services/auth.service";

interface AuthState {
  user: AuthResponse["user"] | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
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
    },
    // Sets only the token
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, setProfile, setToken, clearUser } = authSlice.actions;
export default authSlice.reducer;
