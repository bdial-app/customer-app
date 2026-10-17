import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use - Tijarah",
  description: "The terms for using Tijarah, the business app of the Dawoodi Bohra community",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
