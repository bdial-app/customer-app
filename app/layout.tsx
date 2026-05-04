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
    title: "Tijarah",
    description:
      "Community-driven marketplace connecting customers with trusted local service providers",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Tijarah",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/icons/196.png",
      apple: "/icons/196.png",
    },
    metadataBase: new URL("https://www.tijarah.com"),
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
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content"
        />
        <meta
          name="theme-color"
          content="#F59E0B"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0f172a"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Tijarah" />
        <meta name="msapplication-TileColor" content="#F59E0B" />
        <link rel="icon" href="/icons/196.png" />
        <link rel="apple-touch-icon" href="/icons/196.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#FAFAFA] dark:bg-slate-900 transition-colors duration-300 overflow-hidden h-full"
        suppressHydrationWarning
      >
        <CSPostHogProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </CSPostHogProvider>
      </body>
    </html>
  );
}
