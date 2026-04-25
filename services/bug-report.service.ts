import apiClient from "@/utils/axios";
import { BUG_REPORT_URLS } from "@/utils/urls";

export type BugCategory =
  | "crash"
  | "ui_issue"
  | "feature_not_working"
  | "performance"
  | "login_auth"
  | "payment"
  | "other";

export interface SubmitBugReportPayload {
  category: BugCategory;
  description: string;
  stepsToReproduce?: string;
  deviceInfo?: string;
}

export const BUG_CATEGORY_LABELS: Record<BugCategory, string> = {
  crash: "App Crash",
  ui_issue: "UI / Display Issue",
  feature_not_working: "Feature Not Working",
  performance: "Slow / Performance",
  login_auth: "Login / Auth Issue",
  payment: "Payment Issue",
  other: "Other",
};

export async function submitBugReport(payload: SubmitBugReportPayload) {
  const { data } = await apiClient.post(BUG_REPORT_URLS.CREATE, payload);
  return data;
}
