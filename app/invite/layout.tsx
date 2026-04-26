import type { Metadata } from "next";
import { inviteMetadata } from "../layout-metadata";

export const metadata: Metadata = inviteMetadata;

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
