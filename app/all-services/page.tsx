import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Services - Tijarah",
  description: "Browse all available services and find trusted providers near you on Tijarah",
};

import AllServicesContent from "../components/all-services-content";

export default function AllServicesPage() {
  return <AllServicesContent />;
}
