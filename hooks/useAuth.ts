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
        localStorage.setItem("token", data.accessToken);
      }
    },
  });

export const useCreateAccount = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) => createAccount(payload),
    onSuccess: (data) => {
      // Persist token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
      // Store user details in Redux
      dispatch(setUser(data));
    },
  });
};
