import apiClient from "@/utils/axios";
import { LINK_URLS } from "@/utils/urls";

/** Where a message link (tijarahapp.in/go?c=…) goes in the app. */
export async function resolveGoLink(code: string): Promise<{ target: string }> {
  const { data } = await apiClient.get(LINK_URLS.GO(code));
  return data;
}

/** Record the tap; `withoutApp` when this page is sending them to the store. */
export async function openGoLink(code: string, withoutApp: boolean): Promise<{ target: string }> {
  const { data } = await apiClient.post(LINK_URLS.GO_OPEN(code), { withoutApp });
  return data;
}

/** After sign-in: the screen they tried to open before installing. */
export async function takePendingGoLink(): Promise<string | null> {
  const { data } = await apiClient.get(LINK_URLS.GO_PENDING);
  return data?.target ?? null;
}

/** A review started on the web page, kept for after they sign in with this number. */
export async function startReviewOnWeb(body: { phone: string; providerId: string; stars?: number }): Promise<void> {
  await apiClient.post(LINK_URLS.REVIEW_START, body);
}

export async function takeMyReviewIntent(): Promise<{ providerId: string; stars: number | null } | null> {
  const { data } = await apiClient.get(LINK_URLS.REVIEW_MINE);
  return data?.intent ?? null;
}
