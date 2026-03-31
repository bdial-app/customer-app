import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Only English locale
  locales: ["en"],
  defaultLocale: "en",
  // Don't use locale prefix in URLs (no /en/)
  localePrefix: "never",
});
