import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Extract Supabase hostname from env var for image remote patterns
const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "";
  } catch {
    return "";
  }
})();

// Where shared links point: the production website, whose /business/… pages
// are the ones search engines index. Hard-set here on purpose: Vercel builds
// don't see .env and each environment's own NEXT_APP_BASE_URL (e.g. develop's)
// would otherwise put a different domain in every share. Set
// NEXT_PUBLIC_SHARE_ORIGIN to point a build's shares elsewhere.
const shareOrigin = (process.env.NEXT_PUBLIC_SHARE_ORIGIN || "https://www.tijarahapp.in").trim();

// Two builds from one codebase. The app (Capacitor) ships a static export in
// ./out, as every local build does. The website on Vercel runs as a server,
// so each business and item page can carry its own title, link preview and
// structured data for search engines. Files only the server can serve are
// named *.web.tsx / *.web.ts (the /business/… pages, robots, sitemap) and only
// the server build picks them up. NEXT_OUTPUT=server|export overrides.
const webServer =
  process.env.NEXT_OUTPUT === "server" || (process.env.NEXT_OUTPUT !== "export" && !!process.env.VERCEL);

const nextConfig: NextConfig = {
  output: webServer ? undefined : "export",
  pageExtensions: webServer ? ["web.tsx", "web.ts", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  env: {
    NEXT_PUBLIC_SHARE_ORIGIN: shareOrigin,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            port: "",
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  // Strip console.log/warn in production builds (keep console.error)
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default withNextIntl(nextConfig);
