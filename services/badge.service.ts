import apiClient from "@/utils/axios";

/** One badge on the owner's "Your badges" card: held, or how close they are. */
export interface MyBadge {
  key: string;
  label: string;
  kind: "automatic" | "curated";
  meaning: string;
  rule: string;
  held: boolean;
  since: string | null;
  expiresAt: string | null;
  /** For badges not held yet: where the business stands, in a sentence. */
  progress: string | null;
  /** False when the business can no longer earn it (Rising Star after 90 days). */
  possible: boolean;
}

/** The signed-in owner's badges, with progress towards the rest. */
export const getMyBadges = async (): Promise<{ badges: MyBadge[] }> => {
  const { data } = await apiClient.get("/badges/mine");
  return data;
};
