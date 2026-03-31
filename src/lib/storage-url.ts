const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

/**
 * Resolves a student photo value to a displayable URL.
 * Handles: R2 keys, base64 data URLs, full URLs, and null/empty values.
 */
export function getStorageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('data:')) return key;
  if (key.startsWith('http://') || key.startsWith('https://')) return key;
  return `${BACKEND_URL}/storage/${key}`;
}
