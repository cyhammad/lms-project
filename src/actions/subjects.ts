'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function createSubject(formData: FormData) {
  const data = Object.fromEntries(formData);
  const payload = {
    ...data,
    totalMarks: data.totalMarks ? Number(data.totalMarks) : undefined,
    passingPercentage: data.passingPercentage ? Number(data.passingPercentage) : undefined,
  };

  try {
    await apiServer('/subjects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/subjects');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSubject(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const payload = {
    ...data,
    totalMarks: data.totalMarks ? Number(data.totalMarks) : undefined,
    passingPercentage: data.passingPercentage ? Number(data.passingPercentage) : undefined,
  };

  try {
    await apiServer(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    revalidatePath('/admin/subjects');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSubject(id: string) {
  try {
    await apiServer(`/subjects/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/subjects');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
