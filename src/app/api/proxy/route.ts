import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}

async function proxyRequest(request: NextRequest, method: string) {
  const path = request.nextUrl.searchParams.get('path');
  if (!path || !path.startsWith('/')) {
    return NextResponse.json(
      { success: false, error: { message: 'Missing or invalid path' } },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  url.searchParams.delete('path');
  const queryString = url.searchParams.toString();
  const backendUrl = `${BACKEND_URL}${path}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const body = await request.text();
      if (body) init.body = body;
    } catch {
      // no body
    }
  }

  try {
    const backendResponse = await fetch(backendUrl, init);
    const contentType = backendResponse.headers.get('content-type');
    let data: unknown;
    if (contentType?.includes('application/json')) {
      data = await backendResponse.json();
    } else {
      data = { message: await backendResponse.text() };
    }

    return NextResponse.json(data, {
      status: backendResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to reach API' } },
      { status: 502 }
    );
  }
}
