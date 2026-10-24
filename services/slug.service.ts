import apiClient from "@/utils/axios";
import { SLUG_URLS } from "@/utils/urls";

export interface ResolvedBusiness {
  id: string;
  /** The current slug; differs from the one asked for when that was an old one or an id. */
  slug: string;
}

export interface ResolvedProduct {
  providerId: string;
  providerSlug: string;
  productId: string;
  productSlug: string;
}

/** The business a slug (or an old slug, or an id) belongs to. 404 when hidden or unknown. */
export const resolveBusinessSlug = async (slug: string): Promise<ResolvedBusiness> => {
  const { data } = await apiClient.get(SLUG_URLS.BUSINESS(slug));
  return data;
};

/** The product or service at /business/<slug>/<product slug>. */
export const resolveProductSlug = async (slug: string, productSlug: string): Promise<ResolvedProduct> => {
  const { data } = await apiClient.get(SLUG_URLS.PRODUCT(slug, productSlug));
  return data;
};

export interface SlugCheck {
  slug: string;
  available: boolean;
  reason: string | null;
}

/** Whether the signed-in owner's business could use this link. */
export const checkMySlug = async (slug: string): Promise<SlugCheck> => {
  const { data } = await apiClient.get(SLUG_URLS.MINE_CHECK, { params: { slug } });
  return data;
};

/** Change the signed-in owner's business link; the old one keeps working. */
export const setMySlug = async (slug: string): Promise<{ slug: string }> => {
  const { data } = await apiClient.patch(SLUG_URLS.MINE, { slug });
  return data;
};
