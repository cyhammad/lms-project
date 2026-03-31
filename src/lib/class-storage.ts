// Local storage utilities for classes data

import type { Class } from '@/types';

const STORAGE_KEY = 'edflo_classes';

export const getClasses = (): Class[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const classes = JSON.parse(stored);
    return classes.map((cls: any) => ({
      ...cls,
      createdAt: new Date(cls.createdAt),
      updatedAt: new Date(cls.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading classes from localStorage:', error);
    return [];
  }
};

export const saveClasses = (classes: Class[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch (error) {
    console.error('Error saving classes to localStorage:', error);
  }
};

export const addClass = (classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Class => {
  const classes = getClasses();
  const newClass: Class = {
    ...classData,
    id: `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  classes.push(newClass);
  saveClasses(classes);
  return newClass;
};

export const updateClass = (id: string, updates: Partial<Class>): Class | null => {
  const classes = getClasses();
  const index = classes.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  classes[index] = {
    ...classes[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveClasses(classes);
  return classes[index];
};

export const deleteClass = (id: string): boolean => {
  const classes = getClasses();
  const filtered = classes.filter(c => c.id !== id);
  if (filtered.length === classes.length) return false;
  
  saveClasses(filtered);
  return true;
};

export const getClassById = (id: string): Class | null => {
  const classes = getClasses();
  return classes.find(c => c.id === id) || null;
};

export const getClassesBySchool = (schoolId: string): Class[] => {
  const classes = getClasses();
  return classes.filter(c => c.schoolId === schoolId);
};
