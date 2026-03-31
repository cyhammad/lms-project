// Local storage utilities for campuses data

import type { Campus } from '@/types';

const STORAGE_KEY = 'edflo_campuses';

export const getCampuses = (): Campus[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const campuses = JSON.parse(stored);
    // Convert date strings back to Date objects
    return campuses.map((campus: any) => ({
      ...campus,
      createdAt: new Date(campus.createdAt),
      updatedAt: new Date(campus.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading campuses from localStorage:', error);
    return [];
  }
};

export const saveCampuses = (campuses: Campus[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campuses));
  } catch (error) {
    console.error('Error saving campuses to localStorage:', error);
  }
};

export const addCampus = (campus: Omit<Campus, 'id' | 'createdAt' | 'updatedAt'>): Campus => {
  const campuses = getCampuses();
  const newCampus: Campus = {
    ...campus,
    id: `campus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  campuses.push(newCampus);
  saveCampuses(campuses);
  return newCampus;
};

export const updateCampus = (id: string, updates: Partial<Campus>): Campus | null => {
  const campuses = getCampuses();
  const index = campuses.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  campuses[index] = {
    ...campuses[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveCampuses(campuses);
  return campuses[index];
};

export const deleteCampus = (id: string): boolean => {
  const campuses = getCampuses();
  const filtered = campuses.filter(c => c.id !== id);
  if (filtered.length === campuses.length) return false;
  
  saveCampuses(filtered);
  return true;
};

export const getCampusById = (id: string): Campus | null => {
  const campuses = getCampuses();
  return campuses.find(c => c.id === id) || null;
};

export const getCampusesBySchoolId = (schoolId: string): Campus[] => {
  const campuses = getCampuses();
  return campuses.filter(c => c.schoolId === schoolId);
};
