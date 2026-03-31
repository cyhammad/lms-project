'use server';

import { apiServer } from '@/lib/api-server';
import type { Announcement } from '@/types';
import AnnouncementsClient from './client';

async function getAnnouncements() {
  try {
    const data = await apiServer<{ announcements: Announcement[] }>('/announcements');
    return data.announcements || [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();
  return <AnnouncementsClient initialAnnouncements={announcements} />;
}

