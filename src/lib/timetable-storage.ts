// Local storage utilities for timetables data

import type { Timetable } from '@/types';
import { getSections } from './section-storage';

const STORAGE_KEY = 'edflo_timetables';
const MIGRATION_KEY = 'edflo_timetables_migrated';

export const getTimetables = (): Timetable[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const timetables = JSON.parse(stored);
    return timetables.map((timetable: any) => ({
      ...timetable,
      createdAt: new Date(timetable.createdAt),
      updatedAt: new Date(timetable.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading timetables from localStorage:', error);
    return [];
  }
};

export const saveTimetables = (timetables: Timetable[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timetables));
  } catch (error) {
    console.error('Error saving timetables to localStorage:', error);
  }
};

export const addTimetable = (timetableData: Omit<Timetable, 'id' | 'createdAt' | 'updatedAt'>): Timetable => {
  const timetables = getTimetables();
  const newTimetable: Timetable = {
    ...timetableData,
    id: `timetable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  timetables.push(newTimetable);
  saveTimetables(timetables);
  return newTimetable;
};

export const updateTimetable = (id: string, updates: Partial<Timetable>): Timetable | null => {
  const timetables = getTimetables();
  const index = timetables.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  timetables[index] = {
    ...timetables[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveTimetables(timetables);
  return timetables[index];
};

export const deleteTimetable = (id: string): boolean => {
  const timetables = getTimetables();
  const filtered = timetables.filter(t => t.id !== id);
  if (filtered.length === timetables.length) return false;
  
  saveTimetables(filtered);
  return true;
};

export const getTimetableById = (id: string): Timetable | null => {
  const timetables = getTimetables();
  return timetables.find(t => t.id === id) || null;
};

export const getTimetablesBySchool = (schoolId: string): Timetable[] => {
  const timetables = getTimetables();
  return timetables.filter(t => t.schoolId === schoolId);
};

export const getTimetableBySection = (sectionId: string): Timetable | null => {
  const timetables = getTimetables();
  return timetables.find(t => t.sectionId === sectionId) || null;
};

export const getTimetablesByClass = (classId: string): Timetable[] => {
  const timetables = getTimetables();
  const sections = getSections();
  const sectionIds = sections.filter(s => s.classId === classId).map(s => s.id);
  return timetables.filter(t => sectionIds.includes(t.sectionId));
};

/**
 * Migrate class-based timetables to section-based timetables
 * This function runs once to convert existing data structure
 */
export const migrateTimetablesToSections = (): void => {
  if (typeof window === 'undefined') return;
  
  // Check if already migrated
  if (localStorage.getItem(MIGRATION_KEY) === 'true') {
    return;
  }

  try {
    const timetables = getTimetables();
    const sections = getSections();
    
    // Check if any timetables still have classId (old format)
    const oldTimetables = timetables.filter((t: any) => t.classId && !t.sectionId);
    
    if (oldTimetables.length === 0) {
      // No migration needed, mark as migrated
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const newTimetables: Timetable[] = [];
    const timetablesToKeep = timetables.filter((t: any) => !t.classId || t.sectionId);

    // Migrate each old timetable
    oldTimetables.forEach((oldTimetable: any) => {
      const classId = oldTimetable.classId;
      const classSections = sections.filter(s => s.classId === classId);

      // Create a timetable for each section in the class
      classSections.forEach(section => {
        const newTimetable: Timetable = {
          id: `timetable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sectionId: section.id,
          schoolId: oldTimetable.schoolId,
          entries: oldTimetable.entries || [],
          createdAt: oldTimetable.createdAt || new Date(),
          updatedAt: new Date(),
        };
        newTimetables.push(newTimetable);
      });
    });

    // Save all timetables (new migrated ones + existing section-based ones)
    saveTimetables([...timetablesToKeep, ...newTimetables]);
    
    // Mark as migrated
    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (error) {
    console.error('❌ Error migrating timetables:', error);
  }
};
