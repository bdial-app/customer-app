import type { Metadata } from "next";
import { productDetailsMetadata } from "../layout-metadata";

export const metadata: Metadata = productDetailsMetadata;

export default function ProductDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
