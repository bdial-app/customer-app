import apiClient from "@/utils/axios";
import { AUTH_URLS } from "@/utils/urls";

export interface SendOtpPayload {
  mobileNumber: string;
}

export interface VerifyOtpPayload {
  mobileNumber: string;
  otp: string;
}

export interface CreateAccountPayload {
  mobile: string;
  otp: string;
  name: string;
  gender: string;
  city: string;
  area?: string;
  pincode: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    mobile: string;
    gender: string;
    city: string;
    area?: string;
    pincode: string;
  };
}

// Step 1 — send OTP to mobile
export const sendOtp = async (payload: SendOtpPayload): Promise<void> => {
  await apiClient.post(AUTH_URLS.SEND_OTP, payload);
};

// Step 2 — verify OTP
export const verifyOtp = async (
  payload: VerifyOtpPayload
): Promise<{ accessToken: string }> => {
  const { data } = await apiClient.post(AUTH_URLS.VERIFY_OTP, payload);
  return data;
};

// Step 3 — create account (final step)
export const createAccount = async (
  payload: CreateAccountPayload
): Promise<AuthResponse> => {
  const { data } = await apiClient.post(AUTH_URLS.REGISTER, payload);
  return data;
};
