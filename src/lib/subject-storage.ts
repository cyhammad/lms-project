// Local storage utilities for subjects data

import type { Subject } from '@/types';

const STORAGE_KEY = 'edflo_subjects';

export const getSubjects = (): Subject[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const subjects = JSON.parse(stored);
    return subjects.map((subject: any) => ({
      ...subject,
      createdAt: new Date(subject.createdAt),
      updatedAt: new Date(subject.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading subjects from localStorage:', error);
    return [];
  }
};

export const saveSubjects = (subjects: Subject[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  } catch (error) {
    console.error('Error saving subjects to localStorage:', error);
  }
};

export const addSubject = (subjectData: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Subject => {
  const subjects = getSubjects();
  const newSubject: Subject = {
    ...subjectData,
    id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  subjects.push(newSubject);
  saveSubjects(subjects);
  return newSubject;
};

export const updateSubject = (id: string, updates: Partial<Subject>): Subject | null => {
  const subjects = getSubjects();
  const index = subjects.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  subjects[index] = {
    ...subjects[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveSubjects(subjects);
  return subjects[index];
};

export const deleteSubject = (id: string): boolean => {
  const subjects = getSubjects();
  const filtered = subjects.filter(s => s.id !== id);
  if (filtered.length === subjects.length) return false;
  
  saveSubjects(filtered);
  return true;
};

export const getSubjectById = (id: string): Subject | null => {
  const subjects = getSubjects();
  return subjects.find(s => s.id === id) || null;
};

export const getSubjectsBySchool = (schoolId: string): Subject[] => {
  const subjects = getSubjects();
  return subjects.filter(s => s.schoolId === schoolId);
};

export const getSubjectsByClass = (classId: string): Subject[] => {
  const subjects = getSubjects();
  return subjects.filter(s => s.classId === classId);
};
