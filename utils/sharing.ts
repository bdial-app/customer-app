/**
 * Open directions to a location in Google Maps.
 * On mobile: tries to open the native Maps app.
 * On desktop: opens Google Maps in a new tab.
 */
export function openDirections(lat: number, lng: number, label?: string) {
  const destination = `${lat},${lng}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isAndroid) {
    // Android: open Google Maps app via intent URI
    window.location.href = `google.navigation:q=${destination}`;
  } else if (isIOS) {
    // iOS: open Apple Maps with Google Maps fallback
    window.location.href = `maps://maps.apple.com/?daddr=${destination}&dirflg=d`;
  } else {
    // Desktop: open Google Maps in new tab
    const query = label ? encodeURIComponent(label) : destination;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving`,
      '_blank',
      'noopener,noreferrer',
    );
  }
}

/**
 * Share content using the Web Share API with clipboard fallback.
 */
export async function shareContent(data: {
  title: string;
  text: string;
  url: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch {
      // User cancelled or error — fallback to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/**
 * Build an invite link for the app.
 */
export function buildInviteLink(referrerName?: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const params = referrerName
    ? `?ref=${encodeURIComponent(referrerName)}`
    : '';
  return `${base}${params}`;
}

/**
 * Share an invite to join the app.
 */
export async function shareInvite(referrerName?: string): Promise<'shared' | 'copied' | 'failed'> {
  const link = buildInviteLink(referrerName);
  return shareContent({
    title: 'Join Tijarah Connect',
    text: referrerName
      ? `${referrerName} invites you to discover amazing local businesses on Tijarah Connect!`
      : 'Discover amazing local businesses on Tijarah Connect!',
    url: link,
  });
}
