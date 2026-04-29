import type { Metadata } from "next";
import { providerOnboardingMetadata } from "../layout-metadata";

export const metadata: Metadata = providerOnboardingMetadata;

export default function ProviderOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
