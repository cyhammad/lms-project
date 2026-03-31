'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createClass(formData: FormData) {
  const data = Object.fromEntries(formData);
  // Convert number fields
  const payload = {
    ...data,
    grade: data.grade ? Number(data.grade) : undefined,
    standardFee: data.standardFee ? Number(data.standardFee) : undefined,
    maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
  };

  try {
    await apiServer('/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/classes');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateClass(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const payload = {
    ...data,
    grade: data.grade ? Number(data.grade) : undefined,
    standardFee: data.standardFee ? Number(data.standardFee) : undefined,
    maxStudents: data.maxStudents ? Number(data.maxStudents) : undefined,
  };

  try {
    await apiServer(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/classes');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteClass(id: string) {
  try {
    await apiServer(`/classes/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/classes');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
