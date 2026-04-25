import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "./layoutWrapper";
import { CSPostHogProvider } from "./providers/PostHogProvider";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Bohri Connect",
    description:
      "Community-driven marketplace connecting customers with trusted local service providers",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Bohri Connect",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/icon-192x192.png",
      apple: "/icon-192x192.png",
    },
    metadataBase: new URL("https://www.bohriconnect.com"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
        />
        <meta name="theme-color" content="#F59E0B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bohri Connect" />
        <link rel="icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <CSPostHogProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
