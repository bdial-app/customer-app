import apiClient from "@/utils/axios";
import { AUTH_URLS } from "@/utils/urls";
import { UserProfile } from "@/services/user.service";

export interface SendOtpPayload {
  mobileNumber: string;
}

export interface VerifyOtpPayload {
  mobileNumber: string;
  otp: string;
}

export interface CreateAccountPayload {
  name: string;
  gender: string;
  city: string;
  area?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    mobileNumber: string;
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
  payload: VerifyOtpPayload,
): Promise<AuthResponse> => {
  const { data } = await apiClient.post(AUTH_URLS.VERIFY_OTP, payload);
  return data;
};

// Step 3 — complete profile (PATCH /users/me with mobile + otp for identity)
export const createAccount = async (
  payload: CreateAccountPayload,
): Promise<UserProfile> => {
  const { data } = await apiClient.patch(AUTH_URLS.REGISTER, payload);
  return data;
};
