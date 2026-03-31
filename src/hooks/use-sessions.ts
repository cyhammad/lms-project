'use client';

import { useState, useEffect } from 'react';
import type { AcademicSession } from '@/types';
import { getSessions, addSession, updateSession, deleteSession } from '@/lib/session-storage';

export function useSessions() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = () => {
      setLoading(true);
      const data = getSessions();
      setSessions(data);
      setLoading(false);
    };

    loadSessions();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_sessions') {
        loadSessions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createSession = (sessionData: Omit<AcademicSession, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSession = addSession(sessionData);
    setSessions(prev => [...prev, newSession]);
    return newSession;
  };

  const updateSessionById = (id: string, updates: Partial<AcademicSession>) => {
    const updated = updateSession(id, updates);
    if (updated) {
      setSessions(prev => prev.map(s => s.id === id ? updated : s));
    }
    return updated;
  };

  const removeSession = (id: string) => {
    const success = deleteSession(id);
    if (success) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
    return success;
  };

  return {
    sessions,
    loading,
    createSession,
    updateSession: updateSessionById,
    deleteSession: removeSession,
    refresh: () => {
      setSessions(getSessions());
    },
  };
}
