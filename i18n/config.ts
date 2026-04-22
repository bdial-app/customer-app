export const locales = ['en', 'hi', 'ar', 'fr', 'ur', 'mr', 'bn', 'ta', 'te', 'gu'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const RTL_LOCALES: Locale[] = ['ar', 'ur'];

export const LANGUAGE_OPTIONS: { code: Locale; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', flag: '🇵🇰' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
