'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(userId: string, formData: FormData) {
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
  };

  try {
    await apiServer(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/super-admin/settings');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePassword(userId: string, formData: FormData) {
  const data = {
    password: formData.get('newPassword') as string,
  };

  try {
    await apiServer(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
