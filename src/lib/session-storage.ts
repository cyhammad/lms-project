// Local storage utilities for sessions data

import type { AcademicSession } from '@/types';

const STORAGE_KEY = 'edflo_sessions';

export const getSessions = (): AcademicSession[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const sessions = JSON.parse(stored);
    return sessions.map((session: any) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading sessions from localStorage:', error);
    return [];
  }
};

export const saveSessions = (sessions: AcademicSession[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving sessions to localStorage:', error);
  }
};

export const addSession = (sessionData: Omit<AcademicSession, 'id' | 'createdAt' | 'updatedAt'>): AcademicSession => {
  const sessions = getSessions();
  
  const newSession: AcademicSession = {
    ...sessionData,
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sessions.push(newSession);
  saveSessions(sessions);
  return newSession;
};

export const updateSession = (id: string, updates: Partial<AcademicSession>): AcademicSession | null => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveSessions(sessions);
  return sessions[index];
};

export const deleteSession = (id: string): boolean => {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  if (filtered.length === sessions.length) return false;
  
  saveSessions(filtered);
  return true;
};

export const getSessionById = (id: string): AcademicSession | null => {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
};

export const getSessionsBySchool = (schoolId: string): AcademicSession[] => {
  const sessions = getSessions();
  return sessions.filter(s => s.schoolId === schoolId);
};

