import type { Metadata } from "next";
import { allServicesMetadata } from "../layout-metadata";

export const metadata: Metadata = allServicesMetadata;

export default function AllServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
