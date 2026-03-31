/**
 * Cookie key for the admin panel's selected academic session.
 * Used so the whole admin panel shows data for one session; change via header switcher.
 */
export const ADMIN_SESSION_COOKIE_NAME = 'edflo_admin_session_id';

const MAX_AGE_DAYS = 365;

/**
 * Set the admin session ID in a cookie (client-side only).
 * Call router.refresh() after this so server components re-read the cookie.
 */
export function setAdminSessionCookie(sessionId: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Get the admin session ID from the cookie (client-side only).
 * For server-side, use getAdminSessionIdFromCookies from next/headers.
 */
export function getAdminSessionCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_SESSION_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
