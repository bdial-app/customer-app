import apiClient from "@/utils/axios";

export type ReportEntityType = "provider" | "product" | "message";

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

export const REASONS_BY_TYPE: Record<ReportEntityType, ReportReasonOption[]> = {
  provider: PROVIDER_REASONS,
  product: PRODUCT_REASONS,
  message: MESSAGE_REASONS,
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
