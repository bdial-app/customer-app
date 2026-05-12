import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "./layoutWrapper";
import { CSPostHogProvider } from "./providers/PostHogProvider";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tijarah",
    description:
      "Community-driven marketplace connecting customers with trusted local service providers",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Tijarah",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icons/48.png", sizes: "48x48", type: "image/png" },
        { url: "/icons/96.png", sizes: "96x96", type: "image/png" },
        { url: "/icons/192.png", sizes: "192x192", type: "image/png" },
        { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/icons/apple-touch-icon.png", sizes: "192x192", type: "image/png" },
      ],
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
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/apple-touch-icon.png" />
        <meta name="msapplication-TileImage" content="/icons/192.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Apple splash screens — required to prevent white screen on old iOS PWA launch */}
        {/* iPad 1/2 (768×1024 @1x) */}
        <link rel="apple-touch-startup-image" href="/splash-screen.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 1) and (orientation: portrait)" />
        {/* iPad 3/4/Air/mini-retina/Pro-9.7 (768×1024 @2x) */}
        <link rel="apple-touch-startup-image" href="/splash-screen.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iPad Pro 10.5 */}
        <link rel="apple-touch-startup-image" href="/splash-screen.png"
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iPad Pro 11 */}
        <link rel="apple-touch-startup-image" href="/splash-screen.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* iPad Pro 12.9 */}
        <link rel="apple-touch-startup-image" href="/splash-screen.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        {/* Generic fallback for any iPad not matched above */}
        <link rel="apple-touch-startup-image" href="/splash-screen.png" />
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
