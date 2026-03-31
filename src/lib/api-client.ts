'use client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// From the browser, cookies are not sent to a different origin. Use the same-origin proxy
// so the server can attach the session token to the backend request.
const getClientBaseUrl = () =>
  typeof window !== 'undefined' ? '/api/proxy' : BACKEND_URL;

type FetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

export async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const baseUrl = getClientBaseUrl();
  let url: string;
  if (baseUrl === '/api/proxy') {
    const [pathname, search] = endpoint.includes('?') ? endpoint.split('?', 2) : [endpoint, ''];
    const params = new URLSearchParams({ path: pathname });
    if (search) new URLSearchParams(search).forEach((v, k) => params.set(k, v));
    url = `/api/proxy?${params.toString()}`;
  } else {
    url = `${baseUrl}${endpoint}`;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Note: Session cookie is httpOnly, so it's automatically sent with credentials: 'include'
  // The backend should read the token from cookies, not from Authorization header
  // If backend requires Authorization header, we'd need a server action or API route proxy

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // This sends cookies automatically
  });

  // Check for 401 before trying to parse JSON
  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Parse response
  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    // If not JSON, read as text
    const text = await response.text();
    data = { message: text || 'API request failed' };
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.message || 'API request failed');
  }

  if (data.success && data.data) {
    return data.data as T;
  }

  return data as T;
}
