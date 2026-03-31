'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createSession(formData: FormData) {
  const data = Object.fromEntries(formData);
  try {
    await apiServer('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/sessions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSession(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  try {
    await apiServer(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/sessions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSession(id: string) {
  try {
    await apiServer(`/sessions/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/sessions');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
