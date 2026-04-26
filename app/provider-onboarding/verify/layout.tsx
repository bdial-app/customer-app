import type { Metadata } from "next";
import { verifyMetadata } from "../../layout-metadata";

export const metadata: Metadata = verifyMetadata;

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
