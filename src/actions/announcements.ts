'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createAnnouncement(formData: FormData) {
  const data = Object.fromEntries(formData) as any;

  if (!data.title || !data.message || !data.recipientType) {
    return { error: 'Title, message, and recipient type are required' };
  }

  const payload: any = {
    title: String(data.title),
    message: String(data.message),
    recipientType: String(data.recipientType),
  };

  if (payload.recipientType === 'specific' && data.recipientIds) {
    const raw = data.recipientIds;
    const ids =
      Array.isArray(raw) ? raw.map(String) : String(raw).split(',').map((v) => v.trim());
    payload.recipientIds = ids.filter(Boolean);
  }

  try {
    await apiServer('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create announcement' };
  }
}

export async function deleteAnnouncement(id: string) {
  if (!id) return { error: 'Announcement ID is required' };

  try {
    await apiServer(`/announcements/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/announcements');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete announcement' };
  }
}

