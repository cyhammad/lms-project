// Local storage utilities for teachers data

import type { Teacher } from '@/types';

const STORAGE_KEY = 'edflo_teachers';

export const getTeachers = (): Teacher[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const teachers = JSON.parse(stored);
    return teachers.map((teacher: any) => ({
      ...teacher,
      createdAt: new Date(teacher.createdAt),
      updatedAt: new Date(teacher.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading teachers from localStorage:', error);
    return [];
  }
};

export const saveTeachers = (teachers: Teacher[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
  } catch (error) {
    console.error('Error saving teachers to localStorage:', error);
  }
};

export const addTeacher = (teacherData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>): Teacher => {
  const teachers = getTeachers();
  const newTeacher: Teacher = {
    ...teacherData,
    id: `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  teachers.push(newTeacher);
  saveTeachers(teachers);
  return newTeacher;
};

export const updateTeacher = (id: string, updates: Partial<Teacher>): Teacher | null => {
  const teachers = getTeachers();
  const index = teachers.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  teachers[index] = {
    ...teachers[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveTeachers(teachers);
  return teachers[index];
};

export const deleteTeacher = (id: string): boolean => {
  const teachers = getTeachers();
  const filtered = teachers.filter(t => t.id !== id);
  if (filtered.length === teachers.length) return false;
  
  saveTeachers(filtered);
  return true;
};

export const getTeacherById = (id: string): Teacher | null => {
  const teachers = getTeachers();
  return teachers.find(t => t.id === id) || null;
};

export const getTeachersBySchool = (schoolId: string): Teacher[] => {
  const teachers = getTeachers();
  return teachers.filter(t => t.schoolId === schoolId);
};
