// Local storage utilities for sections data

import type { Section } from '@/types';

const STORAGE_KEY = 'edflo_sections';

export const getSections = (): Section[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const sections = JSON.parse(stored);
    return sections.map((section: any) => ({
      ...section,
      createdAt: new Date(section.createdAt),
      updatedAt: new Date(section.updatedAt),
    }));
  } catch (error) {
    console.error('Error reading sections from localStorage:', error);
    return [];
  }
};

export const saveSections = (sections: Section[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  } catch (error) {
    console.error('Error saving sections to localStorage:', error);
  }
};

export const addSection = (sectionData: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>): Section => {
  const sections = getSections();
  const newSection: Section = {
    ...sectionData,
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sections.push(newSection);
  saveSections(sections);
  return newSection;
};

export const updateSection = (id: string, updates: Partial<Section>): Section | null => {
  const sections = getSections();
  const index = sections.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  sections[index] = {
    ...sections[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveSections(sections);
  return sections[index];
};

export const deleteSection = (id: string): boolean => {
  const sections = getSections();
  const filtered = sections.filter(s => s.id !== id);
  if (filtered.length === sections.length) return false;
  
  saveSections(filtered);
  return true;
};

export const getSectionById = (id: string): Section | null => {
  const sections = getSections();
  return sections.find(s => s.id === id) || null;
};

export const getSectionsBySchool = (schoolId: string): Section[] => {
  const sections = getSections();
  return sections.filter(s => s.schoolId === schoolId);
};

export const getSectionsByClass = (classId: string): Section[] => {
  const sections = getSections();
  return sections.filter(s => s.classId === classId);
};
