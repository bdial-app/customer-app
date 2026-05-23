"use client";
import { useState, useRef, useEffect } from "react";
import { IonIcon } from "@ionic/react";
import { logoLinkedin, checkmarkCircle, closeCircle } from "ionicons/icons";

interface LinkedInInputProps {
  value: string; // stored as handle path e.g. "in/john-doe" or "company/acme"
  onChange: (normalized: string) => void;
  error?: string;
  touched?: boolean;
}

/**
 * Extract the LinkedIn path from various input formats:
 * - "https://www.linkedin.com/in/john-doe" → "in/john-doe"
 * - "https://linkedin.com/company/acme" → "company/acme"
 * - "linkedin.com/in/john-doe" → "in/john-doe"
 * - "in/john-doe" → "in/john-doe"
 * - "john-doe" → "in/john-doe" (assume personal profile)
 */
function normalizeLinkedIn(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Strip full URL prefix variations
  let path = trimmed
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/?/, "")
    .replace(/^(www\.)?linkedin\.com\/?/, "")
    .replace(/\/+$/, "") // trailing slashes
    .replace(/^\/+/, ""); // leading slashes

  // If already has a valid prefix like "in/" or "company/"
  if (/^(in|company)\//.test(path)) {
    return path;
  }

  // If it's just a handle (no slashes), assume personal profile
  if (path && !path.includes("/")) {
    return `in/${path}`;
  }

  return path || "";
}

/** Check if a LinkedIn path looks valid */
function isValidLinkedInPath(path: string): boolean {
  if (!path) return false;
  // Must be in/handle or company/handle format
  return /^(in|company)\/[a-zA-Z0-9\-_.%]{1,100}$/.test(path);
}

export default function LinkedInInput({ value, onChange, error, touched }: LinkedInInputProps) {
  // Display the raw text the user is typing (not the normalized value)
  const [displayValue, setDisplayValue] = useState<string>(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from external value changes
  useEffect(() => {
    if (value && !displayValue) {
      setDisplayValue(value);
    }
  }, [value]);

  const handleChange = (raw: string) => {
    setDisplayValue(raw);
    const normalized = normalizeLinkedIn(raw);
    onChange(normalized);
  };

  const handleClear = () => {
    setDisplayValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const hasError = touched && error;
  const normalized = normalizeLinkedIn(displayValue);
  const isValid = !error && isValidLinkedInPath(normalized);

  return (
    <div className="px-4 mb-3">
      <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
        LinkedIn
      </label>
      <div
        className={`flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all overflow-hidden ${
          hasError
            ? "border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/30"
            : "border-slate-100 dark:border-slate-700 focus-within:border-blue-300 dark:focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30"
        }`}
      >
        {/* LinkedIn icon */}
        <div className="pl-3 pr-1.5 flex items-center justify-center shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <IonIcon icon={logoLinkedin} className="text-[#0A66C2] text-base" />
          </div>
        </div>

        {/* URL prefix (visual only) */}
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 select-none">
          linkedin.com/
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. in/fatema-shah"
          className="flex-1 min-w-0 px-1.5 py-3 text-[13px] font-medium text-slate-800 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
        />

        {/* Valid / Clear indicator */}
        {isValid && (
          <div className="pr-3 shrink-0">
            <IonIcon icon={checkmarkCircle} className="text-blue-500 text-lg" />
          </div>
        )}
        {displayValue && !isValid && (
          <button type="button" onClick={handleClear} className="pr-3 shrink-0">
            <IonIcon icon={closeCircle} className="text-slate-300 dark:text-slate-600 text-lg" />
          </button>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 ml-1 font-medium">{error}</p>
      )}

      {/* Normalized preview */}
      {displayValue && isValid && (
        <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 ml-1 truncate">
          linkedin.com/{normalized}
        </p>
      )}

      {/* Helper */}
      {!hasError && !displayValue && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-1">
          Paste your profile URL or enter handle (e.g. in/name or company/name)
        </p>
      )}
    </div>
  );
}
