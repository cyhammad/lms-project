'use server';

import { apiServer } from '@/lib/api-server';
import { revalidatePath } from 'next/cache';

export async function deleteExpense(id: string) {
  try {
    await apiServer(`/expenses/${id}`, {
      method: 'DELETE',
    });
    revalidatePath('/admin/expenses');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete expense';
    return { error: message };
  }
}
