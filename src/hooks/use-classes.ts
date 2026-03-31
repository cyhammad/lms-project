'use client';

import { useState, useEffect } from 'react';
import type { Class } from '@/types';
import { getClasses, addClass, updateClass, deleteClass } from '@/lib/class-storage';

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClasses = () => {
      setLoading(true);
      const data = getClasses();
      setClasses(data);
      setLoading(false);
    };

    loadClasses();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_classes') {
        loadClasses();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createClass = (classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClass = addClass(classData);
    setClasses(prev => [...prev, newClass]);
    return newClass;
  };

  const updateClassById = (id: string, updates: Partial<Class>) => {
    const updated = updateClass(id, updates);
    if (updated) {
      setClasses(prev => prev.map(c => c.id === id ? updated : c));
    }
    return updated;
  };

  const removeClass = (id: string) => {
    const success = deleteClass(id);
    if (success) {
      setClasses(prev => prev.filter(c => c.id !== id));
    }
    return success;
  };

  return {
    classes,
    loading,
    createClass,
    updateClass: updateClassById,
    deleteClass: removeClass,
    refresh: () => {
      setClasses(getClasses());
    },
  };
}
