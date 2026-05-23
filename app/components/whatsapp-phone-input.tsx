"use client";
import { useState, useRef, useEffect } from "react";
import { IonIcon } from "@ionic/react";
import { chevronDown, logoWhatsapp, checkmarkCircle } from "ionicons/icons";
import { motion, AnimatePresence } from "framer-motion";

// Country codes relevant to Dawoodi Bohra community (most common first)
const COUNTRY_CODES = [
  { code: "+91", country: "IN", flag: "🇮🇳", label: "India", maxDigits: 10 },
  { code: "+966", country: "SA", flag: "🇸🇦", label: "Saudi Arabia", maxDigits: 9 },
  { code: "+971", country: "AE", flag: "🇦🇪", label: "UAE", maxDigits: 9 },
  { code: "+968", country: "OM", flag: "🇴🇲", label: "Oman", maxDigits: 8 },
  { code: "+973", country: "BH", flag: "🇧🇭", label: "Bahrain", maxDigits: 8 },
  { code: "+965", country: "KW", flag: "🇰🇼", label: "Kuwait", maxDigits: 8 },
  { code: "+974", country: "QA", flag: "🇶🇦", label: "Qatar", maxDigits: 8 },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "UK", maxDigits: 10 },
  { code: "+1", country: "US", flag: "🇺🇸", label: "USA / Canada", maxDigits: 10 },
  { code: "+92", country: "PK", flag: "🇵🇰", label: "Pakistan", maxDigits: 10 },
  { code: "+254", country: "KE", flag: "🇰🇪", label: "Kenya", maxDigits: 9 },
  { code: "+255", country: "TZ", flag: "🇹🇿", label: "Tanzania", maxDigits: 9 },
  { code: "+94", country: "LK", flag: "🇱🇰", label: "Sri Lanka", maxDigits: 9 },
  { code: "+60", country: "MY", flag: "🇲🇾", label: "Malaysia", maxDigits: 10 },
  { code: "+65", country: "SG", flag: "🇸🇬", label: "Singapore", maxDigits: 8 },
  { code: "+61", country: "AU", flag: "🇦🇺", label: "Australia", maxDigits: 9 },
  { code: "+27", country: "ZA", flag: "🇿🇦", label: "South Africa", maxDigits: 9 },
  { code: "+962", country: "JO", flag: "🇯🇴", label: "Jordan", maxDigits: 9 },
  { code: "+20", country: "EG", flag: "🇪🇬", label: "Egypt", maxDigits: 10 },
  { code: "+90", country: "TR", flag: "🇹🇷", label: "Turkey", maxDigits: 10 },
] as const;

type CountryEntry = (typeof COUNTRY_CODES)[number];

interface WhatsAppPhoneInputProps {
  value: string; // Full value like "+919876543210" or ""
  onChange: (fullNumber: string) => void;
  error?: string;
  touched?: boolean;
}

/**
 * Parse a full phone string like "+919876543210" into { code, number }
 */
function parsePhoneValue(value: string): { countryCode: string; number: string } {
  if (!value) return { countryCode: "+91", number: "" };
  
  // Try to match against known country codes (longest first to avoid partial matches)
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const entry of sorted) {
    if (value.startsWith(entry.code)) {
      return { countryCode: entry.code, number: value.slice(entry.code.length) };
    }
  }
  
  // Fallback: if starts with +, try to split
  if (value.startsWith("+")) {
    // Assume first 2-4 chars are code
    return { countryCode: "+91", number: value.replace(/^\+\d{1,4}/, "") };
  }
  
  return { countryCode: "+91", number: value };
}

export default function WhatsAppPhoneInput({ value, onChange, error, touched }: WhatsAppPhoneInputProps) {
  const parsed = parsePhoneValue(value);
  const [selectedCode, setSelectedCode] = useState<string>(parsed.countryCode);
  const [phoneNumber, setPhoneNumber] = useState<string>(parsed.number);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

  // Sync from external value changes
  useEffect(() => {
    const p = parsePhoneValue(value);
    setSelectedCode(p.countryCode);
    setPhoneNumber(p.number);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const handleNumberChange = (raw: string) => {
    // Only allow digits
    const digits = raw.replace(/\D/g, "").slice(0, selectedCountry.maxDigits);
    setPhoneNumber(digits);
    // Emit combined value only if there are digits
    if (digits) {
      onChange(`${selectedCode}${digits}`);
    } else {
      onChange("");
    }
  };

  const handleCodeSelect = (entry: CountryEntry) => {
    setSelectedCode(entry.code);
    setShowDropdown(false);
    // Re-emit with new code
    if (phoneNumber) {
      const trimmed = phoneNumber.slice(0, entry.maxDigits);
      setPhoneNumber(trimmed);
      onChange(`${entry.code}${trimmed}`);
    }
    // Focus input after selection
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const hasError = touched && error;
  const isValid = phoneNumber.length >= 7 && !error;

  return (
    <div className="px-4 mb-3 relative" ref={dropdownRef}>
      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
        WhatsApp Number
      </label>
      <div
        className={`flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all overflow-hidden ${
          hasError
            ? "border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/30"
            : "border-slate-100 dark:border-slate-700 focus-within:border-green-300 dark:focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100 dark:focus-within:ring-green-900/30"
        }`}
      >
        {/* WhatsApp icon */}
        <div className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <IonIcon icon={logoWhatsapp} className="text-[#25D366] text-base" />
          </div>
        </div>

        {/* Country code selector */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1 px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shrink-0"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{selectedCode}</span>
          <IonIcon icon={chevronDown} className="text-[10px] text-slate-400" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 shrink-0" />

        {/* Phone number input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={phoneNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={`${"0".repeat(selectedCountry.maxDigits).replace(/(\d{5})(\d+)/, "$1 $2")}`}
          className="flex-1 min-w-0 px-3 py-3 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
        />

        {/* Valid indicator */}
        {isValid && (
          <div className="pr-3 shrink-0">
            <IonIcon icon={checkmarkCircle} className="text-green-500 text-lg" />
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-medium">{error}</p>
      )}

      {/* Helper text */}
      {!hasError && !phoneNumber && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-1">
          Customers will message you on this WhatsApp number
        </p>
      )}

      {/* Country code dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 max-h-[260px] overflow-y-auto overscroll-contain"
          >
            {COUNTRY_CODES.map((entry) => (
              <button
                key={entry.code}
                type="button"
                onClick={() => handleCodeSelect(entry)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  entry.code === selectedCode
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700"
                }`}
              >
                <span className="text-lg">{entry.flag}</span>
                <span className="flex-1 min-w-0">
                  <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">{entry.label}</span>
                </span>
                <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">{entry.code}</span>
                {entry.code === selectedCode && (
                  <IonIcon icon={checkmarkCircle} className="text-green-500 text-sm" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
