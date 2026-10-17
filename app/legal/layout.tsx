import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal - Tijarah",
  description: "Tijarah's terms, policies and guidelines",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
