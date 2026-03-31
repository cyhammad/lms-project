'use client';

import { useState, useEffect } from 'react';
import type { Subject } from '@/types';
import { getSubjects, addSubject, updateSubject, deleteSubject } from '@/lib/subject-storage';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = () => {
      setLoading(true);
      const data = getSubjects();
      setSubjects(data);
      setLoading(false);
    };

    loadSubjects();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_subjects') {
        loadSubjects();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createSubject = (subjectData: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSubject = addSubject(subjectData);
    setSubjects(prev => [...prev, newSubject]);
    return newSubject;
  };

  const updateSubjectById = (id: string, updates: Partial<Subject>) => {
    const updated = updateSubject(id, updates);
    if (updated) {
      setSubjects(prev => prev.map(s => s.id === id ? updated : s));
    }
    return updated;
  };

  const removeSubject = (id: string) => {
    const success = deleteSubject(id);
    if (success) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    }
    return success;
  };

  return {
    subjects,
    loading,
    createSubject,
    updateSubject: updateSubjectById,
    deleteSubject: removeSubject,
    refresh: () => {
      setSubjects(getSubjects());
    },
  };
}
