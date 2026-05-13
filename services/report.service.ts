import apiClient from "@/utils/axios";

export type ReportEntityType = "provider" | "product" | "message" | "deal" | "review" | "customer";

export type ReportReason =
  | "fake_business"
  | "inappropriate_content"
  | "fraud_scam"
  | "harassment"
  | "impersonation"
  | "wrong_category"
  | "fake_product"
  | "counterfeit"
  | "prohibited_item"
  | "wrong_price"
  | "spam"
  | "fraud"
  | "misleading_offer"
  | "expired_deal"
  | "fake_discount"
  | "fake_review"
  | "offensive_language"
  | "irrelevant_content"
  | "abusive_behavior"
  | "fake_account"
  | "spam_messages"
  | "other";

export interface ReportReasonOption {
  value: ReportReason;
  label: string;
}

export const PROVIDER_REASONS: ReportReasonOption[] = [
  { value: "fake_business", label: "Fake or misleading business" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "fraud_scam", label: "Fraud or scam" },
  { value: "harassment", label: "Harassment" },
  { value: "impersonation", label: "Impersonating someone" },
  { value: "wrong_category", label: "Wrong category" },
  { value: "other", label: "Other" },
];

export const PRODUCT_REASONS: ReportReasonOption[] = [
  { value: "fake_product", label: "Fake or misleading product" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "counterfeit", label: "Counterfeit product" },
  { value: "prohibited_item", label: "Prohibited item" },
  { value: "wrong_price", label: "Misleading price" },
  { value: "other", label: "Other" },
];

export const MESSAGE_REASONS: ReportReasonOption[] = [
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "fraud", label: "Fraud" },
  { value: "other", label: "Other" },
];

export const DEAL_REASONS: ReportReasonOption[] = [
  { value: "misleading_offer", label: "Misleading or false offer" },
  { value: "expired_deal", label: "Expired deal still showing" },
  { value: "fake_discount", label: "Fake discount" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export const REVIEW_REASONS: ReportReasonOption[] = [
  { value: "fake_review", label: "Fake or paid review" },
  { value: "offensive_language", label: "Offensive language" },
  { value: "irrelevant_content", label: "Irrelevant content" },
  { value: "other", label: "Other" },
];

export const CUSTOMER_REASONS: ReportReasonOption[] = [
  { value: "abusive_behavior", label: "Abusive behavior" },
  { value: "fake_account", label: "Fake account" },
  { value: "spam_messages", label: "Spam messages" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
];

export const REASONS_BY_TYPE: Record<ReportEntityType, ReportReasonOption[]> = {
  provider: PROVIDER_REASONS,
  product: PRODUCT_REASONS,
  message: MESSAGE_REASONS,
  deal: DEAL_REASONS,
  review: REVIEW_REASONS,
  customer: CUSTOMER_REASONS,
};

export async function submitReport(
  entityType: ReportEntityType,
  entityId: string,
  reason: ReportReason,
  description?: string,
) {
  const { data } = await apiClient.post("/reports", {
    entityType,
    entityId,
    reason,
    ...(description ? { description } : {}),
  });
  return data;
}

export async function getMyWarnings() {
  const { data } = await apiClient.get("/providers/my-warnings");
  return data;
}

export async function getWarningsUnreadCount() {
  const { data } = await apiClient.get("/providers/my-warnings/unread-count");
  return data;
}

export async function markWarningRead(warningId: string) {
  const { data } = await apiClient.patch(
    `/providers/my-warnings/${warningId}/read`,
  );
  return data;
}
