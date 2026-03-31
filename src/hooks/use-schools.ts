'use client';

import { useState, useEffect } from 'react';
import type { School } from '@/types';
import { getSchools, addSchool, updateSchool, deleteSchool } from '@/lib/storage';

export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load schools from localStorage
    const loadSchools = () => {
      setLoading(true);
      const data = getSchools();
      setSchools(data);
      setLoading(false);
    };

    loadSchools();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_schools') {
        loadSchools();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createSchool = (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSchool = addSchool(schoolData);
    setSchools(prev => [...prev, newSchool]);
    return newSchool;
  };

  const updateSchoolById = (id: string, updates: Partial<School>) => {
    const updated = updateSchool(id, updates);
    if (updated) {
      setSchools(prev => prev.map(s => s.id === id ? updated : s));
    }
    return updated;
  };

  const removeSchool = (id: string) => {
    const success = deleteSchool(id);
    if (success) {
      setSchools(prev => prev.filter(s => s.id !== id));
    }
    return success;
  };

  return {
    schools,
    loading,
    createSchool,
    updateSchool: updateSchoolById,
    deleteSchool: removeSchool,
    refresh: () => {
      setSchools(getSchools());
    },
  };
}
