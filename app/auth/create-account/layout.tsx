import type { Metadata } from "next";
import { createAccountMetadata } from "../../layout-metadata";

export const metadata: Metadata = createAccountMetadata;

export default function CreateAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
