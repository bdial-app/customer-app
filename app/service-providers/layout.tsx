import type { Metadata } from "next";
import { serviceProvidersMetadata } from "../layout-metadata";

export const metadata: Metadata = serviceProvidersMetadata;

export default function ServiceProvidersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
