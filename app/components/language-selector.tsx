"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { checkmarkCircle, chevronForward, globeOutline } from "ionicons/icons";
import { useLanguage } from "../context/LanguageContext";
import { LANGUAGE_OPTIONS, type Locale } from "@/i18n/config";
import { useTranslations } from "next-intl";

interface LanguageSelectorProps {
  /** If provided, called after locale change (e.g. to save to backend) */
  onLanguageChange?: (locale: Locale) => void;
  /** Inline mode renders without the slide-page wrapper (for use inside steppers) */
  inline?: boolean;
}

export const LanguageSelector = ({ onLanguageChange, inline }: LanguageSelectorProps) => {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("language");

  const handleSelect = (code: Locale) => {
    setLocale(code);
    onLanguageChange?.(code);
  };

  if (inline) {
    return (
      <LanguageGrid
        currentLocale={locale}
        onSelect={handleSelect}
        t={t}
      />
    );
  }

  return (
    <div className="px-1">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">{t("selectLanguage")}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
      </div>
      <LanguageGrid currentLocale={locale} onSelect={handleSelect} t={t} />
    </div>
  );
};

function LanguageGrid({
  currentLocale,
  onSelect,
  t,
}: {
  currentLocale: Locale;
  onSelect: (code: Locale) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {LANGUAGE_OPTIONS.map((lang) => {
        const isSelected = lang.code === currentLocale;
        return (
          <motion.button
            key={lang.code}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(lang.code)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
              isSelected
                ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100/50"
                : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  isSelected ? "text-amber-700" : "text-slate-800"
                }`}
              >
                {lang.nativeLabel}
              </p>
              <p className="text-[11px] text-slate-400">{lang.label}</p>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0"
              >
                <IonIcon icon={checkmarkCircle} className="text-amber-500 text-xl" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Compact button to open language picker — used in menu rows */
export const LanguageMenuButton = ({
  onClick,
}: {
  onClick: () => void;
}) => {
  const { locale } = useLanguage();
  const currentLang = LANGUAGE_OPTIONS.find((l) => l.code === locale);

  return (
    <motion.div
      whileTap={{ scale: 0.98, backgroundColor: "#f8fafc" }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-slate-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-violet-50">
        <IonIcon icon={globeOutline} className="text-lg text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-slate-800">Language</span>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {currentLang?.flag} {currentLang?.nativeLabel ?? "English"}
        </p>
      </div>
      <IonIcon icon={chevronForward} className="text-slate-300 text-sm" />
    </motion.div>
  );
};
