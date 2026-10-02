/**
 * Profile links built from whatever a business owner typed into the form.
 *
 * The handle fields accept free text, so the stored values range from a clean
 * username to a pasted URL to a mangled one that lost its punctuation on
 * import ("httpswww.instagram.comhamofain"). Building `instagram.com/${raw}`
 * from those produces a dead link, so each platform pulls the real handle out
 * first and returns null when there is nothing usable — a null link is shown
 * as "not added" rather than as a link that goes nowhere.
 */

/** Everything before the handle: protocol, www, the domain itself, with or without punctuation. */
const afterDomain = (raw: string, domain: string): string | null => {
  const re = new RegExp(`${domain.replace(/\./g, "\\.?")}/?(.*)$`, "i");
  const m = raw.match(re);
  return m ? m[1] ?? "" : null;
};

/**
 * Strips the leading @ and any trailing path, query or fragment. A handle never
 * contains whitespace, so free text ("not a handle!!") yields nothing rather
 * than a link built from its first word.
 */
const bareHandle = (raw: string) => {
  const value = raw.trim().replace(/^@+/, "").split(/[/?#]/)[0]?.trim() ?? "";
  return /\s/.test(value) ? "" : value;
};

const firstUrl = (raw: string) => raw.match(/https?:\/\/\S+/i)?.[0] ?? null;

/** Instagram usernames: letters, digits, dots and underscores, up to 30. */
const IG_HANDLE = /^[A-Za-z0-9._]{1,30}$/;

export function instagramUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  // A pasted URL — including one whose slashes were eaten — still names the handle.
  const fromDomain = afterDomain(value, "instagram.com");
  const handle = bareHandle(fromDomain !== null ? fromDomain : value);
  return handle && IG_HANDLE.test(handle) ? `https://instagram.com/${handle}` : null;
}

export function facebookUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const fromDomain = afterDomain(value, "facebook.com");
  if (fromDomain !== null) {
    const path = fromDomain.replace(/^\/+/, "").trim();
    return path && !/\s/.test(path) ? `https://facebook.com/${path}` : null;
  }
  if (/^https?:\/\//i.test(value)) return value;
  const handle = bareHandle(value);
  return handle ? `https://facebook.com/${handle}` : null;
}

export function youtubeUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (/youtube\.com|youtu\.be/i.test(value)) {
    return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  const handle = bareHandle(value);
  return handle ? `https://youtube.com/@${handle}` : null;
}

export function linkedinUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  // Some rows hold a sentence with a link in it; the link is the usable part.
  if (/\s/.test(value)) {
    const url = firstUrl(value);
    return url && /linkedin\.com/i.test(url) ? url : null;
  }
  const fromDomain = afterDomain(value, "linkedin.com");
  if (fromDomain !== null) {
    const path = fromDomain.replace(/^\/+/, "").trim();
    return path && !/\s/.test(path) ? `https://linkedin.com/${path}` : null;
  }
  if (/^https?:\/\//i.test(value)) return value;
  // "in/name" and "company/name" are already paths; a bare name is a person.
  const path = /^(in|company|school)\//i.test(value) ? value : `in/${bareHandle(value)}`;
  return path.split("/")[1] ? `https://linkedin.com/${path}` : null;
}

/** WhatsApp needs digits only, and a number too short to dial is not a link. */
export function whatsappUrl(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export function websiteUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}
