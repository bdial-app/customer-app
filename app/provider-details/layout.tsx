import type { Metadata } from "next";
import { providerDetailsMetadata } from "../layout-metadata";

export const metadata: Metadata = providerDetailsMetadata;

export default function ProviderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
