import type { Metadata } from "next";
import { searchMetadata } from "../layout-metadata";

export const metadata: Metadata = searchMetadata;

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
