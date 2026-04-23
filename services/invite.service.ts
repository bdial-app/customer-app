import apiClient from "@/utils/axios";
import { INVITE_URLS } from "@/utils/urls";

export const trackInvite = async (method: string): Promise<void> => {
  await apiClient.post(INVITE_URLS.TRACK, { method });
};

export const getInviteCount = async (): Promise<{ count: number }> => {
  const { data } = await apiClient.get(INVITE_URLS.COUNT);
  return data;
};
