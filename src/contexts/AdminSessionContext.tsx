'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AcademicSession } from '@/types';
import { setAdminSessionCookie } from '@/lib/admin-session-cookie';

interface AdminSessionContextValue {
  /** Current session id (from cookie or first session). */
  sessionId: string | null;
  /** Resolved session object, or null. */
  session: AcademicSession | null;
  /** All sessions for the school. */
  sessions: AcademicSession[];
  /** Set the global admin session (writes cookie and refreshes). */
  setSessionId: (sessionId: string) => void;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSession(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error('useAdminSession must be used within AdminSessionProvider');
  }
  return ctx;
}

/** Optional hook: returns null if used outside provider (e.g. on non-admin pages). */
export function useAdminSessionOptional(): AdminSessionContextValue | null {
  return useContext(AdminSessionContext);
}

interface AdminSessionProviderProps {
  children: React.ReactNode;
  /** Session id from server (cookie or first session). */
  initialSessionId: string | null;
  sessions: AcademicSession[];
}

export function AdminSessionProvider({
  children,
  initialSessionId,
  sessions,
}: AdminSessionProviderProps) {
  const router = useRouter();
  const [sessionId, setSessionIdState] = useState<string | null>(initialSessionId);

  useEffect(() => {
    setSessionIdState(initialSessionId);
  }, [initialSessionId]);

  const session = useMemo(() => {
    if (!sessionId || !sessions.length) return null;
    return sessions.find((s) => s.id === sessionId) ?? null;
  }, [sessionId, sessions]);

  const setSessionId = useCallback(
    (id: string) => {
      setAdminSessionCookie(id);
      setSessionIdState(id);
      router.refresh();
    },
    [router]
  );

  const value = useMemo<AdminSessionContextValue>(
    () => ({
      sessionId,
      session,
      sessions,
      setSessionId,
    }),
    [sessionId, session, sessions, setSessionId]
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}
