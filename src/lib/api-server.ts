import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

function buildUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BACKEND_URL}${path}`;
}

export async function apiServer<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const url = buildUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect('/login');
  }

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || `API request failed (${response.status})`;
    const hint = response.status === 404 ? ` — Endpoint: ${endpoint}, URL: ${url}` : '';
    throw new Error(msg + hint);
  }

  if (data.success && data.data) {
    return data.data as T;
  }

  return data as T;
}

/**
 * Like {@link apiServer}, but returns `fallback` when the response is not OK (e.g. 403 subscription tier).
 * Still redirects to login on 401.
 */
export async function apiServerOr<T>(
  endpoint: string,
  fallback: T,
  options: FetchOptions = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const url = buildUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect('/login');
  }

  const data = await response.json();

  if (!response.ok) {
    return fallback;
  }

  if (data.success && data.data) {
    return data.data as T;
  }

  return data as T;
}
