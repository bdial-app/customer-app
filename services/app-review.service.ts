import apiClient from "@/utils/axios";
import { USER_URLS } from "@/utils/urls";

/**
 * Tell the server an ask was spent on this person (or that they want no more).
 *
 * Best-effort: the in-app prompt has already happened by the time this runs,
 * and the local record is what governs it. This only keeps WhatsApp and push
 * campaigns from asking the same person twice over.
 */
export const noteAppReviewAsked = async (
  channel: "in_app" = "in_app",
  optOut = false,
): Promise<void> => {
  try {
    await apiClient.post(USER_URLS.APP_REVIEW_ASKED, { channel, optOut });
  } catch {
    // offline, or an older API — never surface this
  }
};
