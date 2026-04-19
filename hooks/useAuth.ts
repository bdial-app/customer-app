import { useMutation } from "@tanstack/react-query";
import {
  sendOtp,
  verifyOtp,
  createAccount,
  SendOtpPayload,
  VerifyOtpPayload,
  CreateAccountPayload,
} from "@/services/auth.service";
import { useAppDispatch } from "./useAppStore";
import { setUser, setProfile, setToken } from "@/store/slices/authSlice";

export const useSendOtp = () =>
  useMutation({
    mutationFn: (payload: SendOtpPayload) => sendOtp(payload),
  });

export const useVerifyOtp = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtp(payload),
    onSuccess: (data: any) => {
      const jwt = data.accessToken ?? data.token;
      if (jwt && typeof window !== "undefined") {
        localStorage.setItem("token", jwt);
        dispatch(setToken(jwt));
      }
      if (data.user) {
        dispatch(setProfile(data.user));
      }
    },
  });
};
export const useCreateAccountMutation = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: (user) => {
      // Step 3 (PATCH /users/me) returns only the profile, the token stays in state/localStorage
      dispatch(setProfile(user));
    },
  });
};
