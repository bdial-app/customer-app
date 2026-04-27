import type { Metadata } from "next";
import { galleryMetadata } from "../layout-metadata";

export const metadata: Metadata = galleryMetadata;

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
