import apiClient from "@/utils/axios";
import { USER_URLS } from "@/utils/urls";

export interface UpdateUserPayload {
  name?: string;
  gender?: string;
  city?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  preferredMode?: 'customer' | 'provider';
  preferredLanguage?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  mobileNumber: string;
  gender: string;
  city: string;
  area?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export const updateUser = async (
  payload: UpdateUserPayload,
): Promise<UserProfile> => {
  const { data } = await apiClient.patch(USER_URLS.ME, payload);
  return data;
};

export const deleteMyAccount = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.delete(USER_URLS.DELETE_ME);
  return data;
};

export const pauseMyAccount = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.patch(USER_URLS.PAUSE_ME);
  return data;
};

export const resumeMyAccount = async (): Promise<any> => {
  const { data } = await apiClient.patch(USER_URLS.RESUME_ME);
  return data;
};

export const exportMyData = async (): Promise<any> => {
  const { data } = await apiClient.get(USER_URLS.DATA_EXPORT);
  return data;
};
