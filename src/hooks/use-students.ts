'use client';

import { useState, useEffect } from 'react';
import type { Student } from '@/types';
import { getStudents, addStudent, updateStudent, deleteStudent } from '@/lib/student-storage';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = () => {
      setLoading(true);
      const data = getStudents();
      setStudents(data);
      setLoading(false);
    };

    loadStudents();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edflo_students') {
        loadStudents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createStudent = (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStudent = addStudent(studentData);
    setStudents(prev => [...prev, newStudent]);
    return newStudent;
  };

  const updateStudentById = (id: string, updates: Partial<Student>) => {
    const updated = updateStudent(id, updates);
    if (updated) {
      setStudents(prev => prev.map(s => s.id === id ? updated : s));
    }
    return updated;
  };

  const removeStudent = (id: string) => {
    const success = deleteStudent(id);
    if (success) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
    return success;
  };

  return {
    students,
    loading,
    createStudent,
    updateStudent: updateStudentById,
    deleteStudent: removeStudent,
    refresh: () => {
      setStudents(getStudents());
    },
  };
}
