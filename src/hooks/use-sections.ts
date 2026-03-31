'use client';

import { useState, useEffect } from 'react';
import type { Section } from '@/types';
import { getSections, addSection, updateSection, deleteSection } from '@/lib/section-storage';

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSections = () => {
      setLoading(true);
      const data = getSections();
      setSections(data);
      setLoading(false);
    };

    loadSections();

    const handleStorageChange = (e: StorageEvent) => {  
      if (e.key === 'edflo_sections') {
        loadSections();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const createSection = (sectionData: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSection = addSection(sectionData);
    setSections(prev => [...prev, newSection]);
    return newSection;
  };

  const updateSectionById = (id: string, updates: Partial<Section>) => {
    const updated = updateSection(id, updates);
    if (updated) {
      setSections(prev => prev.map(s => s.id === id ? updated : s));
    }
    return updated;
  };

  const removeSection = (id: string) => {
    const success = deleteSection(id);
    if (success) {
      setSections(prev => prev.filter(s => s.id !== id));
    }
    return success;
  };

  return {
    sections,
    loading,
    createSection,
    updateSection: updateSectionById,
    deleteSection: removeSection,
    refresh: () => {
      setSections(getSections());
    },
  };
}
