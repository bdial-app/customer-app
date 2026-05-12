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
import * as leoProfanity from 'leo-profanity';

// ── Hardcoded English fallback (used when leo-profanity fails to load) ──

const ENGLISH_FALLBACK = new Set([
  'fuck', 'fucked', 'fucking', 'fuckin', 'shit', 'shitty', 'ass', 'asshole',
  'bitch', 'bitches', 'bastard', 'damn', 'dick', 'dicks', 'cock', 'cocks',
  'cunt', 'cunts', 'piss', 'pissed', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'fag', 'retard', 'retarded', 'boob', 'boobs', 'penis', 'vagina',
  'anus', 'blowjob', 'dildo', 'porn', 'pussy', 'rape', 'wanker', 'twat',
]);

// ── Initialise leo-profanity with custom words ─────────────────────

let _initialised = false;
let _leoAvailable = false;

function ensureInit() {
  if (_initialised) return;
  _initialised = true;

  try {
    // Resolve the actual export — handle CJS default export wrapping
    const lib = (leoProfanity as any).default || leoProfanity;
    if (typeof lib.loadDictionary === 'function') {
      lib.loadDictionary('en');
      lib.add(SOUTH_ASIAN_PROFANITY);
      _leoAvailable = lib.list().length > 0;
    }
    if (!_leoAvailable) {
      console.error('[content-sanitizer] leo-profanity dictionary is empty after init');
    }
  } catch (err) {
    console.error('[content-sanitizer] Failed to initialise leo-profanity:', err);
    _leoAvailable = false;
  }
}

/** Get the resolved leo-profanity instance */
function leo(): typeof leoProfanity {
  return (leoProfanity as any).default || leoProfanity;
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
  if (_leoAvailable) {
    try {
      const lib = leo();
      if (lib.check(text)) {
        const words = text.split(/\s+/);
        for (const w of words) {
          if (lib.check(w) && !flaggedWords.includes(w.toLowerCase())) {
            flaggedWords.push(w.toLowerCase());
          }
        }
        if (flaggedWords.length === 0) flaggedWords.push('[profanity detected]');
      }
    } catch (err) {
      console.error('[content-sanitizer] leo-profanity.check() error:', err);
    }
  } else {
    // Fallback: check against hardcoded English words
    const tokens = text.toLowerCase().replace(/[.,!?;:'"()\[\]{}<>]/g, '').split(/\s+/);
    for (const token of tokens) {
      if (token && ENGLISH_FALLBACK.has(token) && !flaggedWords.includes(token)) {
        flaggedWords.push(token);
      }
    }
  }

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
    if (_leoAvailable) return leo().clean(text);
    // Fallback: replace known bad words with asterisks
    return text.replace(/\b\w+\b/g, (word) => {
      const lower = word.toLowerCase();
      if (ENGLISH_FALLBACK.has(lower) || CUSTOM_SET.has(lower)) {
        return '*'.repeat(word.length);
      }
      return word;
    });
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
  'aaichya gaand', 'aaichya gavat', 'aichya gavat',
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
  'fattu', 'fuddi', 'fuddu', 'chinal', 'randio',
  'chodlo', 'ghelchodyo', 'bhondhu', 'bhadvo', 'bhadvi',

  // Marathi
  'zavnya', 'zavnya', 'zhavnya', 'zhavalya', 'zavlya',
  'chiknya', 'chikne', 'madharchod', 'aichya gavat',
  'bhikarchot', 'bolkya', 'gandya', 'bhadvya', 'bhadvyaa',
  'raandecha', 'randecha', 'chhinaal', 'chinaal', 'chhinal',
  'gavat', 'gavti', 'halkat', 'halkya',
  'khandya', 'lundya', 'pucchya', 'popat',
  'satak', 'satakli', 'shengdana',
  'tatya', 'thobad', 'thobadya', 'bokya',
  'gandhya', 'gandul', 'gandu',
  'aaichya gaand', 'aaichya gavat',
  'maderchod', 'bhosadchya', 'bhosadya',
  'lavdya', 'goticha', 'jhavnya',

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
