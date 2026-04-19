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
import { setUser } from "@/store/slices/authSlice";

export const useSendOtp = () =>
  useMutation({
    mutationFn: (payload: SendOtpPayload) => sendOtp(payload),
  });

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: (payload: VerifyOtpPayload) => verifyOtp(payload),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        // Handle both 'accessToken' and 'token' field names from the backend
        const jwt = data.accessToken ?? data.token;
        if (jwt) localStorage.setItem("token", jwt);
      }
    },
  });

export const useCreateAccountMutation = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: (user) => {
      // Token was already saved after verifyOtp; just sync the profile to Redux
      const token = typeof window !== "undefined"
        ? (localStorage.getItem("token") ?? "")
        : "";
      dispatch(setUser({ token, user }));
    },
  });
};
