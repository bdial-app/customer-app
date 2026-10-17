import apiClient from "@/utils/axios";
import { LEGAL_URLS } from "@/utils/urls";
import { getNativePlatform } from "@/utils/platform";

export type LegalRequiredFor = "everyone" | "business" | "none";

export interface LegalDocumentSummary {
  slug: string;
  title: string;
  summary: string;
  /** Who must accept it: everyone signed in, business owners, or nobody. */
  requiredFor: LegalRequiredFor;
  version: number;
  publishedAt: string;
}

export interface LegalDocument extends LegalDocumentSummary {
  /** A small Markdown subset (see LegalMarkdown). */
  content: string;
  changeNote: string | null;
}

export interface PendingLegalDocument extends LegalDocumentSummary {
  /** They accepted an earlier version: this is an update, not a first ask. */
  updated: boolean;
  changeNote: string | null;
}

export interface MyLegalStatus {
  isOwner: boolean;
  pending: PendingLegalDocument[];
  accepted: { slug: string; version: number; acceptedAt: string }[];
}

export type LegalAcceptMethod = "signin_prompt" | "business_onboarding";

export async function getLegalDocuments(): Promise<LegalDocumentSummary[]> {
  const { data } = await apiClient.get(LEGAL_URLS.DOCUMENTS);
  return data;
}

export async function getLegalDocument(slug: string): Promise<LegalDocument> {
  const { data } = await apiClient.get(LEGAL_URLS.DOCUMENT(slug));
  return data;
}

export async function getMyLegalStatus(): Promise<MyLegalStatus> {
  const { data } = await apiClient.get(LEGAL_URLS.ME);
  return data;
}

/** Records the tick, with the versions that were on screen. */
export async function acceptLegalDocuments(
  documents: { slug: string; version: number }[],
  method: LegalAcceptMethod,
): Promise<MyLegalStatus> {
  const { data } = await apiClient.post(LEGAL_URLS.ACCEPT, {
    documents,
    method,
    platform: getNativePlatform(),
  });
  return data;
}
