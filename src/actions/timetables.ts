'use server';

import { revalidatePath } from 'next/cache';
import { apiServer } from '@/lib/api-server';

export async function createTimetable(data: any) {
  try {
    const response = await apiServer<{ timetable: any }>('/timetables', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response && (response as any).error) {
      return { error: (response as any).error };
    }

    revalidatePath('/admin/timetables');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating timetable:', error);
    return { error: error.message || 'Failed to create timetable' };
  }
}

export async function updateTimetable(id: string, data: any) {
  try {
    const response = await apiServer(`/timetables/details/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (response && (response as any).error) {
      return { error: (response as any).error };
    }

    revalidatePath('/admin/timetables');
    revalidatePath(`/admin/timetables/${id}`);
    revalidatePath(`/admin/timetables/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating timetable:', error);
    return { error: error.message || 'Failed to update timetable' };
  }
}

export async function deleteTimetable(id: string) {
  try {
    const response = await apiServer(`/timetables/details/${id}`, {
      method: 'DELETE',
    });

    if (response && (response as any).error) {
      return { error: (response as any).error };
    }

    revalidatePath('/admin/timetables');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting timetable:', error);
    return { error: error.message || 'Failed to delete timetable' };
  }
}
