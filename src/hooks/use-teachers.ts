'use client';

import { useState, useEffect } from 'react';
import type { Teacher } from '@/types';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from '@/lib/teacher-storage';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeachers = () => {
      setLoading(true);
      const data = getTeachers();
      setTeachers(data);
      setLoading(false);
    };

    loadTeachers();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_teachers') {
        loadTeachers();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createTeacher = (teacherData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTeacher = addTeacher(teacherData);
    setTeachers(prev => [...prev, newTeacher]);
    return newTeacher;
  };

  const updateTeacherById = (id: string, updates: Partial<Teacher>) => {
    const updated = updateTeacher(id, updates);
    if (updated) {
      setTeachers(prev => prev.map(t => t.id === id ? updated : t));
    }
    return updated;
  };

  const removeTeacher = (id: string) => {
    const success = deleteTeacher(id);
    if (success) {
      setTeachers(prev => prev.filter(t => t.id !== id));
    }
    return success;
  };

  return {
    teachers,
    loading,
    createTeacher,
    updateTeacher: updateTeacherById,
    deleteTeacher: removeTeacher,
    refresh: () => {
      setTeachers(getTeachers());
    },
  };
}
