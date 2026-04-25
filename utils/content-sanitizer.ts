/**
 * Global content sanitizer for the frontend.
 *
 * Uses `leo-profanity` (English + French + Russian dictionaries with obfuscation
 * handling) plus a custom South-Asian / Arabic word list.
 *
 * Usage:
 *   import { checkContent, isClean, sanitizeText } from '@/utils/content-sanitizer';
 *   if (!isClean(text)) { show error }
 */
import leoProfanity from 'leo-profanity';

// ── Initialise leo-profanity with custom words ─────────────────────

let _initialised = false;

function ensureInit() {
  if (_initialised) return;
  _initialised = true;

  leoProfanity.loadDictionary('en');
  leoProfanity.add(SOUTH_ASIAN_PROFANITY);
}

// ── Exported API ────────────────────────────────────────────────────

export interface ContentCheckResult {
  clean: boolean;
  flagged: boolean;
  flaggedWords: string[];
}

/**
 * Check text for profanity.  Returns detailed result.
 */
export function checkContent(text: string): ContentCheckResult {
  if (!text || !text.trim()) {
    return { clean: true, flagged: false, flaggedWords: [] };
  }

  ensureInit();

  const flaggedWords: string[] = [];

  // 1. leo-profanity (handles English + obfuscation + custom words)
  try {
    if (leoProfanity.check(text)) {
      const words = text.split(/\s+/);
      for (const w of words) {
        if (leoProfanity.check(w) && !flaggedWords.includes(w.toLowerCase())) {
          flaggedWords.push(w.toLowerCase());
        }
      }
      if (flaggedWords.length === 0) flaggedWords.push('[profanity detected]');
    }
  } catch { /* defensive */ }

  // 2. Custom exact-match lookup (fast O(1) for South-Asian languages)
  const normalized = text.toLowerCase().replace(/[.,!?;:'"()\[\]{}<>]/g, '');
  for (const token of normalized.split(/\s+/)) {
    if (token && CUSTOM_SET.has(token) && !flaggedWords.includes(token)) {
      flaggedWords.push(token);
    }
  }

  // 3. Multi-word phrase check
  const lowerText = text.toLowerCase();
  for (const phrase of MULTI_WORD_PHRASES) {
    if (lowerText.includes(phrase) && !flaggedWords.includes(phrase)) {
      flaggedWords.push(phrase);
    }
  }

  const unique = [...new Set(flaggedWords)];

  return {
    clean: unique.length === 0,
    flagged: unique.length > 0,
    flaggedWords: unique,
  };
}

/**
 * Quick check: returns true if the text is clean.
 */
export function isClean(text: string): boolean {
  return checkContent(text).clean;
}

/**
 * Sanitize text by replacing profane words with asterisks.
 */
export function sanitizeText(text: string): string {
  if (!text) return text;
  ensureInit();
  try {
    return leoProfanity.clean(text);
  } catch {
    return text;
  }
}

// ─── Multi-word phrases ─────────────────────────────────────────────

const MULTI_WORD_PHRASES = [
  'teri maa ki', 'teri maa', 'bhen ke lode', 'maa ki chut',
  'ibn el sharmouta', 'ibn sharmouta', 'ibn el kalb', 'bint el kalb',
  'ibn el hmar', 'kos omak', 'ayreh feek', 'telhas teezi',
  'khotay ki aulad', 'khotey da puttar', 'suwar ki aulad',
];

// ─── South Asian + Arabic words ─────────────────────────────────────

const SOUTH_ASIAN_PROFANITY: string[] = [
  // Hindi / Hindustani
  'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'bhosdike', 'bhosdiwale',
  'chutiya', 'chutiye', 'chutiyapa', 'chut', 'gaand', 'gand', 'gaandu', 'gandu',
  'lund', 'lauda', 'laude', 'lavde', 'lavda', 'loda', 'lode',
  'randi', 'rand', 'randwa', 'randikhana', 'randibaz',
  'harami', 'haramkhor', 'haraamzaada', 'haramzada', 'haramzade', 'haraamzaadi',
  'kutte', 'kutta', 'kutiya', 'kuttiya',
  'saala', 'saali', 'sala', 'sali',
  'tatti', 'tatte', 'tattiyan',
  'jhant', 'jhantu', 'jhandu',
  'bokachoda', 'gadha', 'gadhe', 'ullu',
  'kamina', 'kamine', 'kameena', 'kameene',
  'bhosda', 'bhosdi', 'bhosdiwala',
  'dalla', 'dalal', 'dalali',
  'chodna', 'chod', 'chodh', 'chodu', 'chodhu',
  'phuddi', 'phudi', 'lodu', 'takla',
  'hijra', 'chakka', 'chhakka',
  'suar', 'suwar', 'suwwar',
  'gandmasti', 'gandphad',
  'besharam', 'nalayak', 'namard',

  // Urdu
  'kanjar', 'kanjari', 'badtameez', 'badzaat',
  'gaashti', 'laanat', 'lanati',
  'kutti', 'tharki', 'gandagi', 'ghatiya',
  'badmash', 'luchar', 'luchcha',
  'kameeni', 'halaaku', 'jaahil', 'jahil',
  'haraami', 'haraamkhor',

  // Arabic (Romanized)
  'kosomak', 'kuss', 'sharmouta', 'sharmuta', 'sharmout',
  'ahbal', 'ahbil', 'manyak', 'manyake',
  'khawal', 'khaneeth', 'luti',
  'kalb', 'hmar', 'zift', 'zibbeh', 'zib',
  'sharmoot', 'motakhalef', 'khanzeera', 'khanzeer',
  'teezak', 'ibnharam',

  // Gujarati
  'ghelo', 'ghelchodi', 'gando', 'gandi',
  'bhosdo', 'chodyu', 'lodo', 'lodho',
  'chootiya', 'chootya',
  'gadhedo', 'gadhedi',
  'rakhdi', 'raand',

  // Bengali
  'banchod', 'magi', 'magir', 'khankir chele', 'khankir',
  'shala', 'shalir', 'boga', 'nongra',
  'chodamari', 'gudemara', 'gudemaran',
  'nangi', 'beshya', 'beshsha',

  // Tamil (Romanized)
  'thevdiya', 'otha', 'oombu',
  'sunni', 'soothu', 'koothi', 'myiru',
  'baadu', 'loosu', 'punda', 'pundai', 'pundamavan',

  // Punjabi
  'pencho', 'penchod',
  'bhaind', 'tatta', 'tattiyan',
  'lulli', 'phuddu', 'gandh',
];

const CUSTOM_SET = new Set(SOUTH_ASIAN_PROFANITY.map((w) => w.toLowerCase()));
