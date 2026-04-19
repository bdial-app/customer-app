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
