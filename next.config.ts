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

// Where shared /b and /p links point: NEXT_APP_BASE_URL from .env. For now
// that's the UAT web app — the domain that serves the app-link files the
// installed apps check — so builds without the variable (e.g. on Vercel) use
// it too. NEXT_PUBLIC_SHARE_ORIGIN overrides both.
const shareOrigin = (
  process.env.NEXT_PUBLIC_SHARE_ORIGIN ||
  process.env.NEXT_APP_BASE_URL ||
  "https://uat.tijarahapp.in"
).trim();

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
