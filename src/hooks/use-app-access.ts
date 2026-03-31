// React hook for managing app access credentials

import { useState, useEffect, useCallback } from 'react';
import {
  getAppAccesses,
  addAppAccess,
  updateAppAccess,
  deleteAppAccess,
  getAppAccessById,
  getAppAccessesBySchoolId,
  getAppAccessesByStaffId,
  getAppAccessByStudentId,
} from '@/lib/app-access-storage';
import type { AppAccess } from '@/types';

export function useAppAccess(schoolId?: string) {
  const [accesses, setAccesses] = useState<AppAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const allAccesses = getAppAccesses();
      if (schoolId) {
        setAccesses(allAccesses.filter(a => a.schoolId === schoolId));
      } else {
        setAccesses(allAccesses);
      }
    } catch (error) {
      console.error('Error loading app accesses:', error);
      setAccesses([]);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createAccess = useCallback((access: Omit<AppAccess, 'id' | 'createdAt' | 'updatedAt'>): AppAccess => {
    const newAccess = addAppAccess(access);
    refresh();
    return newAccess;
  }, [refresh]);

  const updateAccess = useCallback((id: string, updates: Partial<AppAccess>): AppAccess | null => {
    const updated = updateAppAccess(id, updates);
    if (updated) {
      refresh();
    }
    return updated;
  }, [refresh]);

  const removeAccess = useCallback((id: string): boolean => {
    const deleted = deleteAppAccess(id);
    if (deleted) {
      refresh();
    }
    return deleted;
  }, [refresh]);

  const getAccessById = useCallback((id: string): AppAccess | null => {
    return getAppAccessById(id);
  }, []);

  const getAccessesByType = useCallback((type: 'staff' | 'parent'): AppAccess[] => {
    if (schoolId) {
      return getAppAccessesBySchoolId(schoolId, type);
    }
    return accesses.filter(a => a.type === type);
  }, [schoolId, accesses]);

  const getAccessByStaffId = useCallback((staffId: string): AppAccess | null => {
    const staffAccesses = getAppAccessesByStaffId(staffId);
    return staffAccesses.length > 0 ? staffAccesses[0] : null;
  }, []);

  const getAccessByStudentId = useCallback((studentId: string): AppAccess | null => {
    return getAppAccessByStudentId(studentId);
  }, []);

  return {
    accesses,
    loading,
    refresh,
    createAccess,
    updateAccess,
    removeAccess,
    getAccessById,
    getAccessesByType,
    getAccessByStaffId,
    getAccessByStudentId,
  };
}
