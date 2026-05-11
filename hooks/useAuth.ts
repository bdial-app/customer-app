import { useMutation } from "@tanstack/react-query";
import {
  sendOtp,
  verifyOtp,
  createAccount,
  googleSignIn,
  sendRegistrationOtp,
  SendOtpPayload,
  VerifyOtpPayload,
  CreateAccountPayload,
  GoogleSignInPayload,
} from "@/services/auth.service";
import { useAppDispatch } from "./useAppStore";
import { setUser, setProfile, setToken } from "@/store/slices/authSlice";
import { setItemSync } from "@/utils/storage";

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
        setItemSync("token", jwt);
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
      dispatch(setProfile(user));
    },
  });
};

export const useGoogleSignIn = () => {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: GoogleSignInPayload) => googleSignIn(payload),
    onSuccess: (data: any) => {
      const jwt = data.accessToken ?? data.token;
      if (jwt && typeof window !== "undefined") {
        setItemSync("token", jwt);
        dispatch(setToken(jwt));
      }
      if (data.user) {
        dispatch(setProfile(data.user));
      }
    },
  });
};

export const useRegistrationSendOtp = () =>
  useMutation({
    mutationFn: (payload: SendOtpPayload) => sendRegistrationOtp(payload),
  });
