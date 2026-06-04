import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EULA - Tijarah",
  description: "End User License Agreement for the Tijarah app",
};

export default function EulaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
