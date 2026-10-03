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

// Where shared /b, /p and /c links point: the NEXT_APP_BASE_URL value from
// .env — the UAT web app for now. Hard-set here on purpose: Vercel builds don't
// see .env and each environment's own NEXT_APP_BASE_URL (e.g. develop's) would
// otherwise put a different domain in every share. Change it here, or set
// NEXT_PUBLIC_SHARE_ORIGIN, when links move to the production domain.
const shareOrigin = (process.env.NEXT_PUBLIC_SHARE_ORIGIN || "https://uat.tijarahapp.in").trim();

const nextConfig: NextConfig = {
  output: "export",
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
