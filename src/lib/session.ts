import { jwtVerify, decodeJwt } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@/types';

const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  exp: number;
  iat: number;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return session;
}
