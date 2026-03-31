'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function deleteUser(id: string) {
  try {
    await apiServer(`/users/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/administration/admins');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { error: error.message || 'Failed to delete user' };
  }
}

export async function createUser(data: Record<string, unknown> | FormData) {
  try {
    const body = data instanceof FormData
      ? Object.fromEntries(data.entries())
      : data;
    await apiServer('/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    revalidatePath('/admin/administration/admins');
    revalidatePath('/super-admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { error: error.message || 'Failed to create user' };
  }
}

export async function updateAdmin(id: string, data: any) {
  try {
    await apiServer(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/administration/admins');
    revalidatePath(`/admin/administration/admins/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating admin:', error);
    return { error: error.message || 'Failed to update admin' };
  }
}

export async function updateUser(id: string, formOrData: FormData | Record<string, unknown>) {
  try {
    const data = formOrData instanceof FormData
      ? Object.fromEntries(formOrData.entries())
      : formOrData;
    await apiServer(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    revalidatePath('/admin/administration/admins');
    revalidatePath(`/admin/administration/admins/${id}/edit`);
    revalidatePath('/super-admin/users');
    revalidatePath(`/super-admin/users/${id}`);
    revalidatePath(`/super-admin/users/${id}/edit`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { error: error.message || 'Failed to update user' };
  }
}
