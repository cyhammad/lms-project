// Local storage utilities for schools data

import type { School } from '@/types';
import { PREDEFINED_SCHOOLS } from './school-data';

const STORAGE_KEY = 'edflo_schools';
const INITIALIZED_KEY = 'edflo_schools_initialized';

/**
 * Initialize predefined schools in localStorage if storage is empty
 */
const initializePredefinedSchoolsIfNeeded = (): void => {
  if (typeof window === 'undefined') return;

  try {
    // Check if already initialized
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    if (initialized === 'true') return;

    // Check if schools already exist
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Mark as initialized if schools exist
      localStorage.setItem(INITIALIZED_KEY, 'true');
      return;
    }

    // Initialize with predefined schools
    const schools: School[] = PREDEFINED_SCHOOLS.map((schoolData, index) => ({
      ...schoolData,
      id: `school-${index + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    saveSchools(schools);
    localStorage.setItem(INITIALIZED_KEY, 'true');
  } catch (error) {
    console.error('Error initializing predefined schools:', error);
  }
};

export const getSchools = (): School[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    // Initialize predefined schools if needed
    initializePredefinedSchoolsIfNeeded();
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const schools = JSON.parse(stored);
    // Convert date strings back to Date objects
    return schools.map((school: any) => ({
      ...school,
      createdAt: new Date(school.createdAt),
      updatedAt: new Date(school.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading schools from localStorage:', error);
    return [];
  }
};

export const saveSchools = (schools: School[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schools));
  } catch (error) {
    console.error('Error saving schools to localStorage:', error);
  }
};

export const addSchool = (school: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): School => {
  const schools = getSchools();
  const newSchool: School = {
    ...school,
    id: `school-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  schools.push(newSchool);
  saveSchools(schools);
  return newSchool;
};

export const updateSchool = (id: string, updates: Partial<School>): School | null => {
  const schools = getSchools();
  const index = schools.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  schools[index] = {
    ...schools[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveSchools(schools);
  return schools[index];
};

export const deleteSchool = (id: string): boolean => {
  const schools = getSchools();
  const filtered = schools.filter(s => s.id !== id);
  if (filtered.length === schools.length) return false;
  
  saveSchools(filtered);
  return true;
};

export const getSchoolById = (id: string): School | null => {
  const schools = getSchools();
  return schools.find(s => s.id === id) || null;
};

/**
 * Initialize predefined school in storage if it doesn't exist (legacy function for backward compatibility)
 */
export const initializePredefinedSchool = (schoolId: string): void => {
  // This function is now handled by initializePredefinedSchoolsIfNeeded
  // But we keep it for backward compatibility
  if (typeof window === 'undefined') return;
  initializePredefinedSchoolsIfNeeded();
};
