// Local storage utilities for app access credentials

import type { AppAccess, Student } from '@/types';
import { getStudents } from './student-storage';

const STORAGE_KEY = 'edflo_app_access';

export const getAppAccesses = (): AppAccess[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const accesses = JSON.parse(stored);
    // Convert date strings back to Date objects
    return accesses.map((access: any) => ({
      ...access,
      createdAt: new Date(access.createdAt),
      updatedAt: new Date(access.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading app accesses from localStorage:', error);
    return [];
  }
};

export const saveAppAccesses = (accesses: AppAccess[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accesses));
  } catch (error) {
    console.error('Error saving app accesses to localStorage:', error);
  }
};

export const addAppAccess = (access: Omit<AppAccess, 'id' | 'createdAt' | 'updatedAt'>): AppAccess => {
  const accesses = getAppAccesses();
  
  // Check for duplicate username
  const existing = accesses.find(a => a.username.toLowerCase() === access.username.toLowerCase() && a.schoolId === access.schoolId);
  if (existing) {
    throw new Error('Username already exists');
  }
  
  const newAccess: AppAccess = {
    ...access,
    id: `app-access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  accesses.push(newAccess);
  saveAppAccesses(accesses);
  return newAccess;
};

export const updateAppAccess = (id: string, updates: Partial<AppAccess>): AppAccess | null => {
  const accesses = getAppAccesses();
  const index = accesses.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  // Check for duplicate username if username is being updated
  if (updates.username) {
    const existing = accesses.find(
      a => a.id !== id && 
      a.username.toLowerCase() === updates.username!.toLowerCase() && 
      a.schoolId === accesses[index].schoolId
    );
    if (existing) {
      throw new Error('Username already exists');
    }
  }
  
  accesses[index] = {
    ...accesses[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveAppAccesses(accesses);
  return accesses[index];
};

export const deleteAppAccess = (id: string): boolean => {
  const accesses = getAppAccesses();
  const filtered = accesses.filter(a => a.id !== id);
  if (filtered.length === accesses.length) return false;
  
  saveAppAccesses(filtered);
  return true;
};

export const getAppAccessById = (id: string): AppAccess | null => {
  const accesses = getAppAccesses();
  return accesses.find(a => a.id === id) || null;
};

export const getAppAccessByUsername = (username: string, schoolId?: string): AppAccess | null => {
  const accesses = getAppAccesses();
  if (schoolId) {
    return accesses.find(a => a.username.toLowerCase() === username.toLowerCase() && a.schoolId === schoolId) || null;
  }
  return accesses.find(a => a.username.toLowerCase() === username.toLowerCase()) || null;
};

export const getAppAccessesByStaffId = (staffId: string): AppAccess[] => {
  const accesses = getAppAccesses();
  return accesses.filter(a => a.staffId === staffId);
};

export const getAppAccessByStudentId = (studentId: string): AppAccess | null => {
  const accesses = getAppAccesses();
  return accesses.find(a => a.studentId === studentId && a.type === 'parent') || null;
};

export const getAppAccessesBySchoolId = (schoolId: string, type?: 'staff' | 'parent'): AppAccess[] => {
  const accesses = getAppAccesses();
  let filtered = accesses.filter(a => a.schoolId === schoolId);
  if (type) {
    filtered = filtered.filter(a => a.type === type);
  }
  return filtered;
};

/**
 * Find sibling students by matching parent CNICs
 * Returns students with matching father CNIC or mother CNIC
 */
export const findSiblingStudents = (
  fatherCnic: string,
  motherCnic: string | undefined,
  schoolId: string
): Student[] => {
  const students = getStudents();
  return students.filter(s => 
    s.schoolId === schoolId &&
    s.isActive &&
    (
      s.fatherCnic === fatherCnic ||
      (motherCnic && s.motherCnic === motherCnic) ||
      (motherCnic && s.fatherCnic === fatherCnic)
    )
  );
};

/**
 * Get parent access by checking if any student with matching parent CNICs has parent access
 */
export const getParentAccessByParentInfo = (
  fatherCnic: string,
  motherCnic: string | undefined,
  schoolId: string
): AppAccess | null => {
  const students = getStudents();
  const siblingStudents = findSiblingStudents(fatherCnic, motherCnic, schoolId);
  
  // Check each sibling student for parent access
  for (const student of siblingStudents) {
    const access = getAppAccessByStudentId(student.id);
    if (access) {
      return access;
    }
  }
  
  return null;
};
