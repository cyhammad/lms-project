'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createSection(formData: FormData) {
  const data = Object.fromEntries(formData);
  // Ensure classId is present
  if (!data.classId) {
    return { error: 'Class ID is required' };
  }

  try {
    await apiServer('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSection(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  try {
    await apiServer(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSection(id: string) {
  try {
    await apiServer(`/sections/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
