// Local storage utilities for announcements data

import type { Announcement } from '@/types';

const STORAGE_KEY = 'edflo_announcements';

export const getAnnouncements = (schoolId?: string): Announcement[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const announcements = JSON.parse(stored);
    const parsed = announcements.map((announcement: any) => ({
      ...announcement,
      createdAt: new Date(announcement.createdAt),
      updatedAt: new Date(announcement.updatedAt),
    }));
    return schoolId ? parsed.filter((a: Announcement) => a.schoolId === schoolId) : parsed;
  } catch (error) {
    console.error('Error reading announcements from localStorage:', error);
    return [];
  }
};

export const saveAnnouncements = (announcements: Announcement[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
  } catch (error) {
    console.error('Error saving announcements to localStorage:', error);
  }
};

export const addAnnouncement = (announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Announcement => {
  const announcements = getAnnouncements();
  
  const newAnnouncement: Announcement = {
    ...announcementData,
    id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  announcements.push(newAnnouncement);
  saveAnnouncements(announcements);
  return newAnnouncement;
};

export const updateAnnouncement = (id: string, updates: Partial<Announcement>): Announcement | null => {
  const announcements = getAnnouncements();
  const index = announcements.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  announcements[index] = {
    ...announcements[index],
    ...updates,
    updatedAt: new Date(),
  };
  saveAnnouncements(announcements);
  return announcements[index];
};

export const deleteAnnouncement = (id: string): boolean => {
  const announcements = getAnnouncements();
  const filtered = announcements.filter(a => a.id !== id);
  if (filtered.length === announcements.length) return false;
  
  saveAnnouncements(filtered);
  return true;
};

export const getAnnouncementById = (id: string): Announcement | null => {
  const announcements = getAnnouncements();
  return announcements.find(a => a.id === id) || null;
};

export const getAnnouncementsByRecipient = (schoolId: string, userId: string, userRole: string): Announcement[] => {
  const announcements = getAnnouncements(schoolId);
  const now = new Date();
  
  return announcements
    .filter(a => a.isActive && a.createdAt <= now)
    .filter(a => {
      if (a.recipientType === 'all') return true;
      if (a.recipientType === 'teachers' && userRole === 'teacher') return true;
      if (a.recipientType === 'parents' && userRole === 'parent') return true;
      if (a.recipientType === 'students' && userRole === 'student') return true;
      if (a.recipientType === 'specific' && a.recipientIds?.includes(userId)) return true;
      return false;
    });
};
