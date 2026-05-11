"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { NextIntlClientProvider } from "next-intl";
import { type Locale, defaultLocale, isRTL, locales } from "@/i18n/config";
import { useAppSelector } from "@/hooks/useAppStore";
import { getItemSync, setItemSync } from "@/utils/storage";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  isRtl: false,
});

export const useLanguage = () => useContext(LanguageContext);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = getItemSync("preferredLanguage");
  if (stored && locales.includes(stored as Locale)) return stored as Locale;
  return defaultLocale;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load messages for a given locale
  const loadMessages = useCallback(async (loc: Locale) => {
    const msgs = (await import(`../../messages/${loc}.json`)).default;
    setMessages(msgs);
  }, []);

  // Hydrate locale from localStorage on mount
  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    loadMessages(stored).then(() => setHydrated(true));
  }, [loadMessages]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      setItemSync("preferredLanguage", newLocale);
      loadMessages(newLocale);

      // Update document direction and lang
      document.documentElement.lang = newLocale;
      document.documentElement.dir = isRTL(newLocale) ? "rtl" : "ltr";
    },
    [loadMessages],
  );

  // Set initial dir/lang
  useEffect(() => {
    if (hydrated) {
      document.documentElement.lang = locale;
      document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
    }
  }, [hydrated, locale]);

  const value = useMemo(
    () => ({ locale, setLocale, isRtl: isRTL(locale) }),
    [locale, setLocale],
  );

  if (!hydrated || !messages) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

/**
 * Hook to sync user's backend language preference on login/hydrate.
 * Call this in a component inside both ReduxProvider and LanguageProvider.
 */
export function useLanguageSync() {
  const user = useAppSelector((state) => state.auth.user as any);
  const { locale, setLocale } = useLanguage();

  useEffect(() => {
    if (user?.preferredLanguage && locales.includes(user.preferredLanguage) && user.preferredLanguage !== locale) {
      setLocale(user.preferredLanguage as Locale);
    }
  }, [user?.preferredLanguage]); // eslint-disable-line react-hooks/exhaustive-deps
}
