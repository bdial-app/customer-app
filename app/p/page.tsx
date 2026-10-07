import type { Metadata } from "next";
import OpenInApp from "@/app/components/share/open-in-app";

// Shared links (/p/<id>) land here when the app didn't open them. Vercel
// rewrites /p/<id> to this page; the id is read from the address.
export const metadata: Metadata = {
  title: "On Tijarah Connect",
  description: "Open it in the Tijarah Connect app — businesses from the community, in one place.",
  robots: { index: false },
  // Safari's Smart App Banner: "Open" when the app is installed, "Get" when it isn't.
  other: { "apple-itunes-app": "app-id=6772507338" },
};

export default function SharedLinkPage() {
  return <OpenInApp kind="product" />;
}
