import type { Metadata } from "next";
import { addLocationMetadata } from "../layout-metadata";

export const metadata: Metadata = addLocationMetadata;

export default function AddLocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
